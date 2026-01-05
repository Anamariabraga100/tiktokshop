// Endpoint para atualizar manualmente o status de um pagamento
// Rota: /api/manual-update-payment
// Útil quando o webhook não foi chamado ou falhou

import { getOrderByTransactionId, updateOrderByTransactionId } from './lib/supabase.js';

const BASE_URL = 'https://api-gateway.umbrellapag.com/api';

export default async function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    // Apenas POST
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Apenas requisições POST são permitidas'
      });
    }

    const { transactionId, force = false } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'transactionId é obrigatório'
      });
    }

    console.log('🔄 Atualização manual solicitada:', { transactionId, force });

    // 1. Verificar status no gateway
    const API_KEY = process.env.UMBRELLAPAG_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'UMBRELLAPAG_API_KEY não configurada'
      });
    }

    const response = await fetch(`${BASE_URL}/user/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'User-Agent': 'UMBRELLAB2B/1.0',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: 'Erro ao consultar gateway',
        details: await response.text()
      });
    }

    const data = await response.json();
    const transactionData = data?.data || data;
    const gatewayStatus = transactionData?.status;

    console.log('📊 Status no gateway:', gatewayStatus);

    // 2. Verificar pedido no banco
    const order = await getOrderByTransactionId(transactionId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Pedido não encontrado no banco de dados',
        gatewayStatus
      });
    }

    const currentStatus = order.umbrella_status || order.status;

    // 3. Verificar se precisa atualizar
    if (!force && currentStatus === gatewayStatus && gatewayStatus === 'PAID') {
      return res.status(200).json({
        success: true,
        message: 'Status já está atualizado',
        currentStatus,
        gatewayStatus,
        updated: false
      });
    }

    // 4. Se gateway mostra PAID mas banco não, atualizar
    if (gatewayStatus === 'PAID' && currentStatus !== 'PAID') {
      const updateData = {
        umbrella_status: 'PAID',
        status: 'pago',
        umbrella_paid_at: transactionData?.paidAt || new Date().toISOString(),
        umbrella_end_to_end_id: transactionData?.endToEndId || null,
        updated_at: new Date().toISOString()
      };

      const updatedOrder = await updateOrderByTransactionId(transactionId, updateData);

      if (updatedOrder) {
        console.log('✅ Status atualizado manualmente:', {
          transactionId,
          oldStatus: currentStatus,
          newStatus: 'PAID'
        });

        return res.status(200).json({
          success: true,
          message: 'Status atualizado com sucesso',
          oldStatus: currentStatus,
          newStatus: 'PAID',
          updated: true,
          order: {
            order_number: updatedOrder.order_number,
            umbrella_status: updatedOrder.umbrella_status,
            status: updatedOrder.status,
            umbrella_paid_at: updatedOrder.umbrella_paid_at
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Erro ao atualizar pedido no banco de dados'
        });
      }
    }

    // 5. Se gateway ainda mostra WAITING_PAYMENT
    if (gatewayStatus === 'WAITING_PAYMENT') {
      return res.status(200).json({
        success: true,
        message: 'Pagamento ainda não foi confirmado no gateway',
        currentStatus,
        gatewayStatus,
        updated: false,
        recommendation: 'Aguarde alguns minutos ou verifique se o pagamento foi realizado corretamente'
      });
    }

    // 6. Outros status
    return res.status(200).json({
      success: true,
      message: 'Status verificado',
      currentStatus,
      gatewayStatus,
      updated: false
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar manualmente:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro desconhecido'
    });
  }
}




