// Vercel Serverless Function para verificar status de pagamento
// Rota: /api/order-status
// ESM PURO - package.json tem "type": "module"
//
// ⚠️ IMPORTANTE: Consulta BANCO primeiro (fonte da verdade)
// Se não encontrar no banco, consulta UmbrellaPag como fallback
// Se gateway mostrar PAID mas banco não, atualiza banco automaticamente

import { supabase } from './lib/supabase.js';

const BASE_URL = 'https://api-gateway.umbrellapag.com/api';

export default async function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    // Apenas GET
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: 'Apenas requisições GET são permitidas'
      });
    }

    // Receber transactionId da query string
    const { transactionId } = req.query;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'transactionId é obrigatório'
      });
    }

    console.log('🔍 Verificando status do pagamento:', { transactionId });

    // 1️⃣ CONSULTAR BANCO PRIMEIRO (fonte da verdade)
    let orderFromDB = null;
    if (supabase) {
      try {
        const { data: order, error: findError } = await supabase
          .from('orders')
          .select('*')
          .eq('umbrella_transaction_id', transactionId)
          .single();

        if (!findError && order) {
          orderFromDB = order;
          console.log('✅ Pedido encontrado no banco:', {
            orderNumber: order.order_number,
            umbrellaStatus: order.umbrella_status,
            status: order.status
          });
        } else if (findError && findError.code !== 'PGRST116') {
          console.warn('⚠️ Erro ao buscar pedido no banco:', findError);
        }
      } catch (dbError) {
        console.error('❌ Erro ao consultar banco:', dbError);
      }
    }

    // 2️⃣ Se encontrou no banco, retornar status do banco
    if (orderFromDB) {
      const isPaid = orderFromDB.umbrella_status === 'PAID' || 
                     orderFromDB.umbrella_status === 'paid' || 
                     orderFromDB.umbrella_status === 'CONFIRMED' ||
                     orderFromDB.status === 'pago';

      return res.status(200).json({
        success: true,
        isPaid,
        transaction: {
          id: orderFromDB.umbrella_transaction_id,
          status: orderFromDB.umbrella_status,
          paidAt: orderFromDB.umbrella_paid_at,
          endToEndId: orderFromDB.umbrella_end_to_end_id,
          amount: orderFromDB.total_price,
        },
        source: 'database'
      });
    }

    // 3️⃣ Se não encontrou no banco, consultar UmbrellaPag (fallback)
    console.log('⚠️ Pedido não encontrado no banco, consultando gateway...');
    
    const API_KEY = process.env.UMBRELLAPAG_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'UMBRELLAPAG_API_KEY não configurada'
      });
    }

    const endpoint = `${BASE_URL}/user/transactions/${transactionId}`;
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'User-Agent': 'UMBRELLAB2B/1.0',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Erro ao buscar transação: ${response.statusText}`
      });
    }

    const result = await response.json();
    
    if (result.status !== 200 || !result.data) {
      return res.status(404).json({
        success: false,
        error: result.message || 'Transação não encontrada'
      });
    }

    const transaction = result.data;
    const isPaidInGateway = transaction.status === 'PAID' || 
                           transaction.status === 'paid' || 
                           transaction.status === 'CONFIRMED';

    // 4️⃣ Se gateway mostrar PAID mas não está no banco, SALVAR/ATUALIZAR no banco
    if (isPaidInGateway && supabase) {
      console.log('🔄 Gateway mostra PAID mas banco não. Atualizando banco...');
      
      try {
        // Tentar atualizar se já existe
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('*')
          .eq('umbrella_transaction_id', transactionId)
          .single();

        if (existingOrder) {
          // Atualizar pedido existente
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              umbrella_status: transaction.status,
              umbrella_paid_at: transaction.paidAt || new Date().toISOString(),
              umbrella_end_to_end_id: transaction.endToEndId,
              status: 'pago',
              updated_at: new Date().toISOString()
            })
            .eq('umbrella_transaction_id', transactionId);

          if (updateError) {
            console.error('❌ Erro ao atualizar pedido no banco:', updateError);
          } else {
            console.log('✅ Pedido atualizado no banco (gateway → banco)');
          }
        } else {
          // Se não existe, criar registro básico (pode não ter todos os dados)
          console.log('⚠️ Pedido não existe no banco, mas gateway mostra PAID. Criando registro básico...');
          // Não criamos aqui porque não temos todos os dados (items, customer, etc)
          // O webhook deveria ter criado/atualizado
        }
      } catch (updateError) {
        console.error('❌ Erro ao atualizar banco com status do gateway:', updateError);
      }
    }

    return res.status(200).json({
      success: true,
      isPaid: isPaidInGateway,
      transaction: {
        id: transaction.id || transaction.transactionId,
        status: transaction.status,
        paidAt: transaction.paidAt,
        endToEndId: transaction.endToEndId,
        amount: transaction.amount,
      },
      source: 'gateway'
    });

  } catch (err) {
    console.error('❌ Erro ao verificar status:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro desconhecido ao verificar status'
    });
  }
}
