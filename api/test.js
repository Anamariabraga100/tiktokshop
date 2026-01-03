// Endpoint de teste mínimo - Vercel Serverless Function
// Rota: /api/test
// Objetivo: Verificar se funções serverless funcionam no projeto

module.exports = async (req, res) => {
  try {
    // CORS básico
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    // Retornar JSON simples
    return res.status(200).json({
      ok: true,
      message: 'test function working',
      method: req.method,
      timestamp: new Date().toISOString(),
      path: '/api/test'
    });
  } catch (error) {
    // Se der erro, ainda retornar JSON
    return res.status(500).json({
      ok: false,
      error: error.message || 'Erro desconhecido',
      step: 'test-error'
    });
  }
};

