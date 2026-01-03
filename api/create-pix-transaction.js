// Vercel Serverless Function para criar transação PIX
// Rota: /api/create-pix-transaction
// ESM PURO - package.json tem "type": "module"

// ==========================================
// 🧪 CAMADA 2: Dry-run do UmbrellaPag (testar comunicação)
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

    // DRY-RUN: Testar comunicação com UmbrellaPag
    // Node 18/20 já tem fetch global, não precisa importar
    const API_KEY = process.env.UMBRELLAPAG_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({
        ok: false,
        step: 'umbrella-dry-run',
        error: 'UMBRELLAPAG_API_KEY não configurada'
      });
    }

    // Tentar endpoint de transações com GET (ou endpoint de health se existir)
    // Se não funcionar, vamos tentar POST mínimo depois
    const response = await fetch('https://api.umbrellapag.com/api/user/transactions', {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'User-Agent': 'UMBRELLAB2B/1.0',
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.substring(0, 500) };
    }

    return res.status(200).json({
      ok: true,
      step: 'umbrella-dry-run',
      status: response.status,
      statusText: response.statusText,
      data,
      headers: {
        contentType: response.headers.get('content-type')
      }
    });
  } catch (err) {
    console.error('❌ Umbrella dry-run error:', err);
    return res.status(500).json({
      ok: false,
      step: 'umbrella-dry-run',
      error: err.message,
      stack: err.stack
    });
  }
}
