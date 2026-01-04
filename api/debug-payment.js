// Endpoint de debug para verificar status de pagamento
// Rota: /api/debug-payment
// Permite verificar o que está acontecendo com um pagamento

import { getOrderByTransactionId } from './lib/supabase.js';

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

    const { transactionId } = req.query;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'transactionId é obrigatório'
      });
    }

    const debugInfo = {
      transactionId,
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // 1. Verificar no banco de dados
    try {
      const order = await getOrderByTransactionId(transactionId);
      debugInfo.checks.database = {
        found: !!order,
        order: order ? {
          order_number: order.order_number,
          umbrella_status: order.umbrella_status,
          status: order.status,
          umbrella_paid_at: order.umbrella_paid_at,
          created_at: order.created_at,
          updated_at: order.updated_at
        } : null
      };
    } catch (error) {
      debugInfo.checks.database = {
        found: false,
        error: error.message
      };
    }

    // 2. Verificar na UmbrellaPag
    try {
      const API_KEY = process.env.UMBRELLAPAG_API_KEY;
      if (API_KEY) {
        const gatewayUrl = `${BASE_URL}/user/transactions/${transactionId}`;
        console.log('🔍 Consultando gateway:', gatewayUrl);
        
        const response = await fetch(gatewayUrl, {
          method: 'GET',
          headers: {
            'x-api-key': API_KEY,
            'User-Agent': 'UMBRELLAB2B/1.0',
            'Content-Type': 'application/json'
          }
        });

        console.log('📥 Resposta do gateway:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        const responseText = await response.text();
        console.log('📋 Resposta raw:', responseText.substring(0, 1000));

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          debugInfo.checks.gateway = {
            found: false,
            error: 'Resposta não é JSON válido',
            rawResponse: responseText.substring(0, 500),
            httpStatus: response.status
          };
          throw parseError;
        }

        const transactionData = data?.data || 
                               data?.transaction || 
                               data;

        console.log('📊 Dados da transação:', JSON.stringify(transactionData, null, 2));

        debugInfo.checks.gateway = {
          found: response.ok,
          httpStatus: response.status,
          httpStatusText: response.statusText,
          status: transactionData?.status || data?.status,
          amount: transactionData?.amount || data?.amount,
          paidAt: transactionData?.paidAt || transactionData?.paid_at || data?.paidAt,
          endToEndId: transactionData?.endToEndId || transactionData?.end_to_end_id || data?.endToEndId,
          transactionId: transactionData?.id || transactionData?.transactionId || data?.id,
          paymentMethod: transactionData?.paymentMethod || data?.paymentMethod,
          pix: {
            hasQrCode: !!(transactionData?.pix?.qrCode || transactionData?.pix?.qrcode || data?.pix?.qrCode),
            expirationDate: transactionData?.pix?.expirationDate || transactionData?.pix?.expiresAt || data?.pix?.expirationDate
          },
          raw: transactionData,
          fullResponse: data
        };
      } else {
        debugInfo.checks.gateway = {
          found: false,
          error: 'API_KEY não configurada'
        };
      }
    } catch (error) {
      console.error('❌ Erro ao consultar gateway:', error);
      debugInfo.checks.gateway = {
        found: false,
        error: error.message,
        stack: error.stack
      };
    }

    // 3. Verificar configuração do webhook
    const webhookUrl = process.env.VITE_POSTBACK_URL || process.env.POSTBACK_URL;
    debugInfo.checks.webhook = {
      configured: !!webhookUrl,
      url: webhookUrl || 'não configurado',
      expectedUrl: `${req.headers.origin || 'https://' + req.headers.host}/api/webhook-umbrellapag`
    };

    // 4. Análise
    const dbStatus = debugInfo.checks.database?.order?.umbrella_status;
    const gatewayStatus = debugInfo.checks.gateway?.status;
    
    debugInfo.analysis = {
      statusMatch: dbStatus === gatewayStatus,
      databaseStatus: dbStatus,
      gatewayStatus: gatewayStatus,
      isPaid: dbStatus === 'PAID' || gatewayStatus === 'PAID',
      needsUpdate: dbStatus !== gatewayStatus && gatewayStatus === 'PAID',
      recommendations: []
    };

    // Recomendações
    if (!debugInfo.checks.database.found) {
      debugInfo.analysis.recommendations.push('Pedido não encontrado no banco de dados. Verifique se foi salvo corretamente.');
    }

    if (debugInfo.analysis.needsUpdate) {
      debugInfo.analysis.recommendations.push('Status no gateway é PAID mas no banco não. O webhook pode não ter sido chamado. Atualize manualmente ou verifique o webhook.');
    }

    if (!debugInfo.checks.webhook.configured) {
      debugInfo.analysis.recommendations.push('Webhook não configurado. Configure POSTBACK_URL na UmbrellaPag.');
    }

    if (gatewayStatus === 'PAID' && !dbStatus) {
      debugInfo.analysis.recommendations.push('Pagamento confirmado no gateway mas não no banco. Execute uma atualização manual.');
    }

    return res.status(200).json({
      success: true,
      ...debugInfo
    });

  } catch (error) {
    console.error('❌ Erro no debug:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro desconhecido'
    });
  }
}


