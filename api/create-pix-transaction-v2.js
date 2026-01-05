// Vercel Serverless Function - VERSÃO ULTRA SIMPLIFICADA PARA TESTE
// Esta é uma versão mínima para testar se a estrutura básica funciona

module.exports = async (req, res) => {
  // CAMADA 1 - TESTE: Endpoint está vivo?
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    // Retornar JSON simples
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





