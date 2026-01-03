// Vercel Serverless Function para criar transação PIX
// Rota: /api/create-pix-transaction
// ESM PURO - package.json tem "type": "module"

// ==========================================
// 🧪 TESTE: Endpoint está carregando?
// ==========================================
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

    // TESTE: Retornar JSON simples para confirmar que carregou
    return res.status(200).json({
      ok: true,
      step: 'create-pix-loaded',
      message: 'Endpoint carregou com sucesso!',
      method: req.method,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Erro no handler:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro desconhecido'
    });
  }
}
