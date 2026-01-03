// Vercel Serverless Function para criar transação PIX
// Rota: /api/create-pix-transaction
// ESM PURO - package.json tem "type": "module"

// ==========================================
// 🧪 CAMADA 2: Dry-run do UmbrellaPag (testar comunicação)
// URL CORRETA: https://api-gateway.umbrellapag.com/api/user/transactions
// ==========================================

const BASE_URL = 'https://api-gateway.umbrellapag.com/api';
const ENDPOINT = `${BASE_URL}/user/transactions`;

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
    const API_KEY = process.env.UMBRELLAPAG_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({
        ok: false,
        step: 'umbrella-dry-run',
        error: 'UMBRELLAPAG_API_KEY não configurada'
      });
    }

    // Testar conexão com POST e body mínimo
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'User-Agent': 'UMBRELLAB2B/1.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // body mínimo só para testar conexão
    });

    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.substring(0, 500) };
    }

    return res.status(response.status).json({
      ok: true,
      step: 'umbrella-dry-run',
      status: response.status,
      statusText: response.statusText,
      data,
      endpoint: ENDPOINT
    });
  } catch (err) {
    console.error('❌ Umbrella dry-run error:', err);
    return res.status(500).json({
      ok: false,
      step: 'umbrella-dry-run',
      error: err.message,
      endpoint: ENDPOINT
    });
  }
}
