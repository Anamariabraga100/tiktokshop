// Vercel Serverless Function para criar transação PIX
// Rota: /api/create-pix-transaction
// ESM PURO - package.json tem "type": "module"

// ==========================================
// 🎯 CAMADA 3: Criar PIX real com payload mínimo válido
// URL: https://api-gateway.umbrellapag.com/api/user/transactions
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

    // Verificar API Key
    const API_KEY = process.env.UMBRELLAPAG_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({
        ok: false,
        success: false,
        error: 'UMBRELLAPAG_API_KEY não configurada'
      });
    }

    // Payload mínimo válido para teste
    const payload = {
      amount: Number(Number(49.90).toFixed(2)),
      paymentMethod: 'PIX',
      description: 'Pedido teste PIX',
      customer: {
        name: 'Cliente Teste',
        document: '12345678909', // CPF só números
        email: 'cliente@teste.com'
      }
    };

    console.log('🚀 Criando PIX real:', {
      amount: payload.amount,
      customer: payload.customer.name,
      document: payload.customer.document.substring(0, 3) + '***'
    });

    // Chamar API UmbrellaPag
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'User-Agent': 'UMBRELLAB2B/1.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.substring(0, 500) };
    }

    console.log('📥 Resposta UmbrellaPag:', {
      status: response.status,
      hasData: !!data,
      hasPixCode: !!(data?.pix?.qrCode || data?.qrCode || data?.copyPaste)
    });

    return res.status(response.status).json({
      ok: response.ok,
      success: response.ok,
      status: response.status,
      data
    });

  } catch (err) {
    console.error('❌ PIX error:', err);
    return res.status(500).json({
      ok: false,
      success: false,
      error: err.message
    });
  }
}
