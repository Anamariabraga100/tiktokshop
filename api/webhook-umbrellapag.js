// Webhook para receber notificações de pagamento da UmbrellaPag
// Rota: /api/webhook-umbrellapag
// ESM PURO - package.json tem "type": "module"

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

    console.log('📥 Webhook recebido:', {
      transactionId: webhookData?.transactionId || webhookData?.id,
      externalRef: webhookData?.externalRef,
      status: webhookData?.status,
      event: webhookData?.event
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

    // TODO: Implementar verificação no banco de dados
    // Buscar pedido por transactionId (chave principal)
    // Exemplo:
    // const order = await getOrderByTransactionId(transactionId);
    // if (order && order.status === 'PAID' && status === 'PAID') {
    //   console.log('✅ Webhook ignorado - pedido já pago (idempotência)');
    //   return res.status(200).json({ ignored: true, reason: 'already_processed' });
    // }

    // TODO: Atualizar status do pedido no banco
    // Exemplo:
    // await updateOrderStatusByTransactionId(transactionId, status, {
    //   paidAt: status === 'PAID' ? new Date() : null,
    //   updatedAt: new Date()
    // });

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

