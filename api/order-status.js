// Endpoint para consultar status de um pedido
// Rota: /api/order-status
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

    // Obter transactionId ou externalRef da query
    const { transactionId, externalRef } = req.query;

    if (!transactionId && !externalRef) {
      return res.status(400).json({
        success: false,
        error: 'transactionId ou externalRef é obrigatório'
      });
    }

    // Consultar status na UmbrellaPag
    // Se tiver transactionId, usar endpoint de transação específica
    // Se tiver externalRef, pode precisar listar e filtrar
    let endpoint;
    if (transactionId) {
      endpoint = `${BASE_URL}/user/transactions/${transactionId}`;
    } else {
      // Listar transações e filtrar por externalRef
      endpoint = `${BASE_URL}/user/transactions?externalRef=${externalRef}`;
    }

    const response = await fetch(endpoint, {
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

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        status: response.status,
        error: data?.message || data?.error || 'Erro ao consultar status',
        data
      });
    }

    // Extrair dados da transação
    const transactionData = data?.data || data;
    
    // Verificar se expirou
    const expirationDate = transactionData?.pix?.expirationDate || transactionData?.pix?.expiresAt;
    const isExpired = expirationDate && new Date(expirationDate) < new Date();
    
    // Status final (considerando expiração)
    let finalStatus = transactionData?.status;
    if (finalStatus === 'WAITING_PAYMENT' && isExpired) {
      finalStatus = 'EXPIRED';
    }

    return res.status(200).json({
      success: true,
      status: 200,
      transactionId: transactionData?.transactionId || transactionData?.id,
      externalRef: transactionData?.externalRef,
      status: finalStatus,
      amount: transactionData?.amount,
      paidAt: transactionData?.paidAt,
      isExpired: isExpired,
      expirationDate: expirationDate,
      pix: {
        qrCode: transactionData?.pix?.qrcode || transactionData?.pix?.qrCode || transactionData?.qrCode,
        expirationDate: expirationDate
      }
    });

  } catch (err) {
    console.error('❌ Erro ao consultar status:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro desconhecido ao consultar status'
    });
  }
}

