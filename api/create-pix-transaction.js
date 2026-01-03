// Vercel Serverless Function para criar transação PIX
// Rota: /api/create-pix-transaction
// ESM PURO - package.json tem "type": "module"

// ==========================================
// 🧪 CAMADA 1: Testar se ENV está carregando
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

    // TESTE: Verificar se ENV está chegando
    return res.status(200).json({
      ok: true,
      envLoaded: !!process.env.UMBRELLAPAG_API_KEY,
      keyPreview: process.env.UMBRELLAPAG_API_KEY
        ? process.env.UMBRELLAPAG_API_KEY.slice(0, 6) + '...'
        : null,
      alsoChecking: !!process.env.VITE_UMBRELLAPAG_API_KEY,
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
