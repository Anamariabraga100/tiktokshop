// Vercel Serverless Function para diagnosticar uma transação específica
// Rota: /api/diagnose-transaction
// ESM PURO - package.json tem "type": "module"

import { supabase } from './lib/supabase.js';

const BASE_URL = 'https://api-gateway.umbrellapag.com/api';

export default async function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    // Apenas GET ou POST
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Apenas requisições GET ou POST são permitidas'
      });
    }

    // Verificar API Key
    const API_KEY = process.env.UMBRELLAPAG_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'UMBRELLAPAG_API_KEY não configurada'
      });
    }

    // Receber transactionId da query string ou body
    const transactionId = req.query.transactionId || req.body.transactionId;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'transactionId é obrigatório'
      });
    }

    console.log('🔍 Diagnosticando transação:', transactionId);

    // 1. Buscar status no UmbrellaPag
    let umbrellaStatus = null;
    let umbrellaData = null;
    try {
      const endpoint = `${BASE_URL}/user/transactions/${transactionId}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'x-api-key': API_KEY,
          'User-Agent': 'UMBRELLAB2B/1.0',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 200 && result.data) {
          umbrellaData = result.data;
          umbrellaStatus = result.data.status;
          console.log('✅ Status no UmbrellaPag:', umbrellaStatus);
        } else {
          console.warn('⚠️ Resposta inesperada do UmbrellaPag:', result);
        }
      } else {
        console.error('❌ Erro ao buscar no UmbrellaPag:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Erro ao consultar UmbrellaPag:', error);
    }

    // 2. Buscar pedido no banco
    let orderInDB = null;
    if (supabase && typeof supabase.from === 'function') {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('umbrella_transaction_id', transactionId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('❌ Erro ao buscar pedido no banco:', error);
        } else if (data) {
          orderInDB = data;
          console.log('✅ Pedido encontrado no banco:', orderInDB.order_number);
        } else {
          console.log('⚠️ Pedido não encontrado no banco');
        }
      } catch (error) {
        console.error('❌ Erro ao consultar banco:', error);
      }
    }

    // 3. Verificar se está pago
    const isPaidInUmbrella = umbrellaStatus === 'PAID' || umbrellaStatus === 'paid' || umbrellaStatus === 'CONFIRMED';
    const isPaidInDB = orderInDB?.umbrella_status === 'PAID' || 
                       orderInDB?.umbrella_status === 'paid' || 
                       orderInDB?.umbrella_status === 'CONFIRMED' ||
                       orderInDB?.status === 'pago';

    // 4. Se estiver pago no UmbrellaPag mas não no banco, atualizar
    let updateResult = null;
    if (isPaidInUmbrella && !isPaidInDB && orderInDB && supabase && typeof supabase.from === 'function') {
      console.log('🔄 Atualizando pedido no banco para PAID...');
      try {
        const { data: updatedOrder, error: updateError } = await supabase
          .from('orders')
          .update({
            umbrella_status: umbrellaStatus,
            status: 'pago',
            umbrella_paid_at: umbrellaData?.paidAt || new Date().toISOString(),
            umbrella_end_to_end_id: umbrellaData?.endToEndId || null,
          })
          .eq('umbrella_transaction_id', transactionId)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Erro ao atualizar pedido:', updateError);
        } else {
          updateResult = updatedOrder;
          console.log('✅ Pedido atualizado no banco');
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar pedido:', error);
      }
    }

    // 5. Se estiver pago, disparar webhook manualmente (simular)
    let webhookTriggered = false;
    if (isPaidInUmbrella) {
      console.log('📤 Disparando webhook manualmente...');
      try {
        const host = req.headers.host || req.headers['x-forwarded-host'];
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const baseUrl = host ? `${protocol}://${host}` : '';
        const webhookUrl = `${baseUrl}/api/webhook-umbrellapag`;

        const webhookPayload = {
          transactionId: transactionId,
          status: umbrellaStatus,
          paidAt: umbrellaData?.paidAt || new Date().toISOString(),
          endToEndId: umbrellaData?.endToEndId || null,
          amount: umbrellaData?.amount || null,
        };

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        });

        if (webhookResponse.ok) {
          webhookTriggered = true;
          console.log('✅ Webhook disparado com sucesso');
        } else {
          console.error('❌ Erro ao disparar webhook:', webhookResponse.status);
        }
      } catch (error) {
        console.error('❌ Erro ao disparar webhook:', error);
      }
    }

    // Retornar diagnóstico completo
    return res.status(200).json({
      success: true,
      transactionId: transactionId,
      diagnosis: {
        umbrellaPag: {
          found: !!umbrellaData,
          status: umbrellaStatus,
          isPaid: isPaidInUmbrella,
          data: umbrellaData ? {
            id: umbrellaData.id || umbrellaData.transactionId,
            status: umbrellaData.status,
            amount: umbrellaData.amount,
            paidAt: umbrellaData.paidAt,
            endToEndId: umbrellaData.endToEndId,
            createdAt: umbrellaData.createdAt,
            updatedAt: umbrellaData.updatedAt,
          } : null,
        },
        database: {
          found: !!orderInDB,
          orderNumber: orderInDB?.order_number || null,
          status: orderInDB?.status || null,
          umbrellaStatus: orderInDB?.umbrella_status || null,
          isPaid: isPaidInDB,
          data: orderInDB ? {
            order_number: orderInDB.order_number,
            customer_cpf: orderInDB.customer_cpf ? orderInDB.customer_cpf.substring(0, 3) + '***' : null,
            total_price: orderInDB.total_price,
            status: orderInDB.status,
            umbrella_status: orderInDB.umbrella_status,
            umbrella_paid_at: orderInDB.umbrella_paid_at,
          } : null,
        },
        actions: {
          updated: !!updateResult,
          webhookTriggered: webhookTriggered,
        },
        summary: {
          isPaid: isPaidInUmbrella || isPaidInDB,
          needsUpdate: isPaidInUmbrella && !isPaidInDB,
          webhookNeeded: isPaidInUmbrella && !webhookTriggered,
        },
      },
    });

  } catch (err) {
    console.error('❌ Erro ao diagnosticar transação:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro desconhecido ao diagnosticar transação'
    });
  }
}

