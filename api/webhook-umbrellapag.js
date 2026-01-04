// Webhook para receber notificações de pagamento da UmbrellaPag
// Rota: /api/webhook-umbrellapag
// ESM PURO - package.json tem "type": "module"
//
// ⚠️ IMPORTANTE: Este webhook atualiza o banco de dados (fonte da verdade)

import { getOrderByTransactionId, updateOrderByTransactionId } from './lib/supabase.js';

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

    const webhookData = req.body;

    console.log('📥📥📥 WEBHOOK RECEBIDO 📥📥📥');
    console.log('📋 Dados completos do webhook:', JSON.stringify(webhookData, null, 2));
    console.log('📥 Webhook recebido:', {
      transactionId: webhookData?.transactionId || webhookData?.id,
      externalRef: webhookData?.externalRef,
      status: webhookData?.status,
      event: webhookData?.event,
      paidAt: webhookData?.paidAt,
      endToEndId: webhookData?.endToEndId || webhookData?.end_to_end_id
    });

    // Validação mínima do webhook
    if (!webhookData) {
      console.error('❌ Webhook vazio');
      return res.status(400).json({
        success: false,
        error: 'Payload vazio'
      });
    }

    const transactionId = webhookData.transactionId || webhookData.id;
    const status = webhookData.status || webhookData.event;
    // externalRef pode vir no metadata ou não existir
    const externalRef = webhookData.externalRef || webhookData.metadata?.orderId;

    if (!transactionId) {
      console.error('❌ Webhook sem transactionId');
      return res.status(400).json({
        success: false,
        error: 'transactionId é obrigatório'
      });
    }

    // externalRef não é obrigatório (pode estar no metadata)
    // Mas é útil para conciliação se disponível

    if (!status) {
      console.error('❌ Webhook sem status');
      return res.status(400).json({
        success: false,
        error: 'status é obrigatório'
      });
    }

    // Status esperados
    const validStatuses = ['PAID', 'EXPIRED', 'REFUNDED', 'CANCELLED', 'WAITING_PAYMENT'];
    if (!validStatuses.includes(status)) {
      console.warn('⚠️ Status não reconhecido:', status);
      // Não falhar, apenas avisar
    }

    // IDEMPOTÊNCIA: Verificar se já processamos este status
    // Usar transactionId como chave principal (não externalRef)
    console.log('🔄 Processando webhook:', {
      transactionId,
      externalRef: externalRef || 'não informado',
      status,
      timestamp: new Date().toISOString()
    });

    // ⚠️ CRÍTICO: Buscar pedido no banco de dados
    const order = await getOrderByTransactionId(transactionId);

    if (!order) {
      console.warn(`⚠️ Pedido não encontrado no banco para transactionId: ${transactionId}`);
      // Não falhar o webhook, apenas avisar
      // O pedido pode não ter sido salvo ainda ou o banco não está configurado
      return res.status(200).json({
        success: true,
        received: true,
        transactionId,
        status,
        warning: 'Pedido não encontrado no banco de dados'
      });
    }

    // IDEMPOTÊNCIA: Verificar se já está no status atual
    const currentStatus = order.umbrella_status || order.status;
    if (currentStatus === status && status === 'PAID') {
      console.log('✅ Webhook ignorado - pedido já está PAID (idempotência)');
      return res.status(200).json({
        success: true,
        received: true,
        transactionId,
        status,
        ignored: true,
        reason: 'already_processed'
      });
    }

    // ⚠️ CRÍTICO: Atualizar status no banco de dados (fonte da verdade)
    const updateData = {
      umbrella_status: status,
      status: status === 'PAID' ? 'pago' : 
              status === 'EXPIRED' ? 'expirado' : 
              status === 'WAITING_PAYMENT' ? 'aguardando_pagamento' : 
              order.status, // Manter status atual se não for um dos conhecidos
    };

    // Se foi pago, atualizar data de pagamento e end-to-end ID
    if (status === 'PAID') {
      updateData.umbrella_paid_at = webhookData?.paidAt || webhookData?.paid_at || new Date().toISOString();
      updateData.status = 'pago'; // Status interno também
      updateData.umbrella_end_to_end_id = webhookData?.endToEndId || webhookData?.end_to_end_id || null;
      console.log('💰💰💰 PAGAMENTO CONFIRMADO NO WEBHOOK 💰💰💰');
      console.log('📋 Dados do pagamento:', {
        paidAt: updateData.umbrella_paid_at,
        endToEndId: updateData.umbrella_end_to_end_id
      });
    }

    console.log('🔄 Atualizando banco de dados:', {
      transactionId: transactionId.substring(0, 8) + '...',
      oldStatus: currentStatus,
      newStatus: status,
      updateData
    });

    const updatedOrder = await updateOrderByTransactionId(transactionId, updateData);

    if (updatedOrder) {
      console.log('✅✅✅ PEDIDO ATUALIZADO NO BANCO COM SUCESSO ✅✅✅');
      console.log('📋 Detalhes da atualização:', {
        orderNumber: updatedOrder.order_number,
        oldStatus: currentStatus,
        newStatus: updatedOrder.umbrella_status,
        paidAt: updatedOrder.umbrella_paid_at,
        endToEndId: updatedOrder.umbrella_end_to_end_id
      });
    } else {
      console.error('❌❌❌ ERRO AO ATUALIZAR PEDIDO NO BANCO - updatedOrder é null ❌❌❌');
    }

    // Log estratégico (sem dados sensíveis)
    console.log('✅ Webhook processado:', {
      transactionId: transactionId.substring(0, 8) + '...',
      externalRef,
      status,
      processedAt: new Date().toISOString()
    });

    // Resposta de sucesso para a UmbrellaPag
    return res.status(200).json({
      success: true,
      received: true,
      transactionId,
      status
    });

  } catch (err) {
    console.error('❌ Erro ao processar webhook:', err);
    // Sempre retornar 200 para a UmbrellaPag (evitar retentativas desnecessárias)
    // Mas logar o erro para investigação
    return res.status(200).json({
      success: false,
      error: 'Erro interno processado',
      logged: true
    });
  }
}

