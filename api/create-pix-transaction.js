// Vercel Serverless Function para criar transação PIX
// Rota: /api/create-pix-transaction
// Formato: Node.js Runtime

// ==========================================
// 🧪 CAMADA 1 - TESTE: Endpoint está vivo?
// Versão ULTRA SIMPLIFICADA para diagnóstico
// ==========================================

module.exports = async (req, res) => {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    // Retornar JSON simples - TESTE CAMADA 1
    return res.status(200).json({
      ok: true,
      step: 'backend-alive',
      message: 'Endpoint está funcionando!',
      method: req.method,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Se der erro, ainda retornar JSON
    return res.status(500).json({
      ok: false,
      error: error.message || 'Erro desconhecido',
      step: 'backend-alive-error'
    });
  }
};
