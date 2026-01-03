// Endpoint de simulação de pagamento (APENAS PARA DESENVOLVIMENTO/TESTES)
// Rota: /api/dev/simulate-payment
// ESM PURO - package.json tem "type": "module"
// 
// ⚠️ ATENÇÃO: Este endpoint deve ser protegido em produção ou removido

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

    // ⚠️ PROTEÇÃO: Em produção, adicionar autenticação
    // Exemplo: verificar token ou IP
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      // Em produção, pode exigir token ou desabilitar completamente
      const authToken = req.headers['x-dev-token'];
      if (authToken !== process.env.DEV_SIMULATE_TOKEN) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado. Endpoint apenas para desenvolvimento.'
        });
      }
    }

    const { transactionId, status = 'PAID' } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'transactionId é obrigatório'
      });
    }

    console.log('🧪 Simulando pagamento:', {
      transactionId,
      status,
      timestamp: new Date().toISOString()
    });

    // Simular chamada do webhook
    // Em produção, você chamaria a lógica do webhook aqui
    // Por enquanto, apenas logamos
    console.log('✅ Simulação de pagamento processada:', {
      transactionId,
      status,
      action: 'markOrderAsPaid'
    });

    // TODO: Implementar lógica real
    // Exemplo:
    // const order = await getOrderByTransactionId(transactionId);
    // if (order) {
    //   await updateOrderStatus(order.id, status, {
    //     paidAt: status === 'PAID' ? new Date() : null
    //   });
    // }

    return res.status(200).json({
      success: true,
      simulated: true,
      transactionId,
      status,
      message: 'Pagamento simulado com sucesso',
      note: 'Em produção, implementar lógica de atualização do pedido'
    });

  } catch (err) {
    console.error('❌ Erro ao simular pagamento:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro desconhecido'
    });
  }
}

