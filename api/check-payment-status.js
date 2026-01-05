// Vercel Serverless Function para verificar status de pagamento
// Rota: /api/check-payment-status
// ESM PURO - package.json tem "type": "module"

const BASE_URL = 'https://api-gateway.umbrellapag.com/api';

export default async function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    // Apenas GET
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: 'Apenas requisições GET são permitidas'
      });
    }

    // Verificar API Key
    const API_KEY = process.env.UMBRELLAPAG_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'UMBRELLAPAG_API_KEY não configurada'
      });
    }

    // Receber transactionId da query string
    const { transactionId } = req.query;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'transactionId é obrigatório'
      });
    }

    // Buscar status da transação no UmbrellaPag
    const endpoint = `${BASE_URL}/user/transactions/${transactionId}`;
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'User-Agent': 'UMBRELLAB2B/1.0',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Erro ao buscar transação: ${response.statusText}`
      });
    }

    const result = await response.json();
    
    if (result.status !== 200 || !result.data) {
      return res.status(404).json({
        success: false,
        error: result.message || 'Transação não encontrada'
      });
    }

    const transaction = result.data;
    const isPaid = transaction.status === 'PAID' || transaction.status === 'paid' || transaction.status === 'CONFIRMED';

    return res.status(200).json({
      success: true,
      transaction: {
        id: transaction.id || transaction.transactionId,
        status: transaction.status,
        paidAt: transaction.paidAt,
        endToEndId: transaction.endToEndId,
        amount: transaction.amount,
      },
      isPaid,
    });

  } catch (err) {
    console.error('❌ Erro ao verificar status:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro desconhecido ao verificar status'
    });
  }
}

