// Vercel Serverless Function para criar transação PIX
// Esta função atua como proxy para evitar problemas de CORS
// Rota: /api/create-pix-transaction
// Formato compatível com Vercel Serverless Functions

export default async function handler(req, res) {
  // CORS headers para permitir requisições do frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder a requisições OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      status: 405,
      message: 'Method not allowed',
      error: 'Apenas requisições POST são permitidas'
    });
  }

  try {
    const {
      customerData,
      items,
      totalPrice,
      metadata
    } = req.body;

    // Validar dados
    if (!customerData || !items || !totalPrice) {
      return res.status(400).json({
        status: 400,
        message: 'Dados incompletos',
        error: 'customerData, items e totalPrice são obrigatórios'
      });
    }

    // Obter API Key das variáveis de ambiente
    const API_KEY = process.env.VITE_UMBRELLAPAG_API_KEY || process.env.UMBRELLAPAG_API_KEY;

    if (!API_KEY) {
      console.error('❌ API Key do UmbrellaPag não configurada');
      return res.status(500).json({
        status: 500,
        message: 'Configuração do servidor incompleta',
        error: 'API Key do UmbrellaPag não configurada'
      });
    }

    // Preparar dados para UmbrellaPag
    const normalizedCPF = customerData.cpf?.replace(/\D/g, '') || '';
    const amountInCents = Math.round(totalPrice * 100);

    // Converter itens
    const umbrellaItems = items
      .filter(item => item.price > 0)
      .map(item => ({
        title: item.name,
        unitPrice: Math.round(item.price * 100),
        quantity: item.quantity,
        tangible: true,
        externalRef: item.id,
      }));

    // Preparar customer
    const customer = {
      name: customerData.name || 'Cliente',
      email: customerData.email || `cliente${normalizedCPF.substring(0, 6)}@exemplo.com`,
      document: {
        number: normalizedCPF,
        type: 'CPF',
      },
      phone: customerData.phone?.replace(/\D/g, '') || '',
      address: {
        street: customerData.address.rua,
        streetNumber: customerData.address.numero,
        complement: customerData.address.complemento || '',
        zipCode: customerData.address.cep.replace(/\D/g, ''),
        neighborhood: customerData.address.bairro,
        city: customerData.address.cidade,
        state: customerData.address.estado,
        country: 'BR',
      },
    };

    // Obter IP do cliente (do cabeçalho ou fallback)
    const clientIP = req.headers['x-forwarded-for'] || 
                    req.headers['x-real-ip'] || 
                    req.socket.remoteAddress || 
                    '127.0.0.1';

    const requestData = {
      amount: amountInCents,
      currency: 'BRL',
      paymentMethod: 'PIX',
      installments: 1,
      postbackUrl: process.env.VITE_POSTBACK_URL || `${req.headers.origin}/api/webhook`,
      metadata: metadata ? JSON.stringify(metadata) : '{}',
      traceable: true,
      ip: Array.isArray(clientIP) ? clientIP[0] : clientIP.split(',')[0],
      customer,
      items: umbrellaItems,
      pix: {
        expiresInDays: 1,
      },
    };

    console.log('🚀 Criando transação PIX via backend:', {
      amount: amountInCents,
      customer: customer.name,
      itemsCount: umbrellaItems.length,
    });

    // Fazer requisição para UmbrellaPag
    const response = await fetch('https://api.umbrellapag.com/api/user/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'User-Agent': 'UMBRELLAB2B/1.0',
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();

    console.log('📥 Resposta da API UmbrellaPag:', {
      status: response.status,
      resultStatus: result.status,
      hasData: !!result.data,
    });

    if (!response.ok) {
      console.error('❌ Erro na API UmbrellaPag:', result);
      return res.status(response.status).json({
        status: response.status,
        message: result.message || `Erro HTTP ${response.status}`,
        error: result.error || response.statusText,
        data: null,
      });
    }

    if (result.status !== 200 || !result.data) {
      console.error('❌ Resposta inválida da API:', result);
      return res.status(500).json({
        status: 500,
        message: result.message || 'Resposta inválida da API',
        error: 'Dados da transação não retornados',
        data: null,
      });
    }

    // Retornar dados da transação
    return res.status(200).json({
      status: 200,
      message: 'Transação criada com sucesso',
      data: result.data,
      error: null,
    });

  } catch (error) {
    console.error('❌ Erro ao processar requisição:', error);
    return res.status(500).json({
      status: 500,
      message: 'Erro interno do servidor',
      error: error.message || 'Erro desconhecido',
      data: null,
    });
  }
}

