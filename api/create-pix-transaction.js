// Vercel Serverless Function para criar transação PIX
// Rota: /api/create-pix-transaction
// Formato: Node.js Runtime

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      status: 405,
      message: 'Method not allowed',
      error: 'Apenas requisições POST são permitidas'
    });
  }

  try {
    const { customer, items, totalPrice, metadata } = req.body;

    console.log('📥 Dados recebidos:', {
      hasCustomer: !!customer,
      customerName: customer?.name,
      customerCPF: customer?.cpf ? customer.cpf.substring(0, 3) + '***' : 'não informado',
      hasItems: !!items,
      itemsCount: items?.length,
      totalPrice,
    });

    // Validar entrada (obrigatório) - seguindo o padrão do tutorial
    if (
      !customer ||
      !customer.cpf ||
      !customer.name ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !totalPrice
    ) {
      console.error('❌ Dados inválidos:', {
        hasCustomer: !!customer,
        hasCPF: !!customer?.cpf,
        hasName: !!customer?.name,
        hasItems: Array.isArray(items),
        itemsLength: items?.length,
        hasTotalPrice: !!totalPrice,
      });
      return res.status(400).json({
        status: 400,
        message: 'Dados inválidos para criar transação PIX',
        error: 'customer (com cpf e name), items e totalPrice são obrigatórios'
      });
    }

    // Obter API Key
    const API_KEY = process.env.UMBRELLAPAG_API_KEY || process.env.VITE_UMBRELLAPAG_API_KEY;

    if (!API_KEY) {
      console.error('❌ API Key não configurada');
      return res.status(500).json({
        status: 500,
        message: 'Configuração do servidor incompleta',
        error: 'API Key do UmbrellaPag não configurada. Verifique as variáveis de ambiente.'
      });
    }

    // Normalizar CPF
    const normalizedCPF = customer.cpf.replace(/\D/g, '');
    const amountInCents = Math.round(totalPrice * 100);

    // Converter itens para formato UmbrellaPag
    const umbrellaItems = items
      .filter(item => item.price > 0)
      .map(item => ({
        title: item.name,
        unitPrice: Math.round(item.price * 100),
        quantity: item.quantity,
        tangible: true,
      }));

    // Preparar customer para UmbrellaPag
    // Se tiver endereço completo, usar. Se não, criar um básico
    let umbrellaCustomer;
    
    if (customer.address && customer.address.rua) {
      // Endereço completo disponível
      umbrellaCustomer = {
        name: customer.name,
        email: customer.email || `cliente${normalizedCPF.substring(0, 6)}@exemplo.com`,
        document: {
          number: normalizedCPF,
          type: 'CPF',
        },
        phone: customer.phone?.replace(/\D/g, '') || '11999999999',
        address: {
          street: customer.address.rua,
          streetNumber: customer.address.numero || '0',
          complement: customer.address.complemento || '',
          zipCode: customer.address.cep?.replace(/\D/g, '') || '00000000',
          neighborhood: customer.address.bairro || '',
          city: customer.address.cidade || '',
          state: customer.address.estado || 'SP',
          country: 'BR',
        },
      };
    } else {
      // Endereço não disponível - criar um básico
      umbrellaCustomer = {
        name: customer.name,
        email: customer.email || `cliente${normalizedCPF.substring(0, 6)}@exemplo.com`,
        document: {
          number: normalizedCPF,
          type: 'CPF',
        },
        phone: customer.phone?.replace(/\D/g, '') || '11999999999',
        address: {
          street: 'Endereço não informado',
          streetNumber: '0',
          complement: '',
          zipCode: '00000000',
          neighborhood: '',
          city: 'São Paulo',
          state: 'SP',
          country: 'BR',
        },
      };
    }

    // Obter IP
    const clientIP = req.headers['x-forwarded-for'] || 
                    req.headers['x-real-ip'] || 
                    req.connection?.remoteAddress || 
                    '127.0.0.1';

    // Montar payload correto para UmbrellaPag (seguindo o tutorial)
    const payload = {
      amount: amountInCents,
      currency: 'BRL',
      paymentMethod: 'PIX',
      installments: 1,
      postbackUrl: process.env.VITE_POSTBACK_URL || 'https://tiktokshop-ija00pxva-cora-pqs-projects.vercel.app/api/webhook-umbrellapag',
      metadata: metadata ? JSON.stringify(metadata) : '{}',
      traceable: true,
      ip: Array.isArray(clientIP) ? clientIP[0] : String(clientIP).split(',')[0],
      customer: umbrellaCustomer,
      items: umbrellaItems,
      pix: {
        expiresInDays: 1,
      },
    };

    console.log('🚀 Chamando API UmbrellaPag:', {
      amount: amountInCents,
      customer: umbrellaCustomer.name,
      itemsCount: umbrellaItems.length,
    });

    // Fazer requisição para UmbrellaPag com tratamento correto de erros
    let response;
    let result;

    try {
      response = await fetch('https://api.umbrellapag.com/api/user/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'User-Agent': 'UMBRELLAB2B/1.0',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na API UmbrellaPag:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        throw new Error(`UmbrellaPag error ${response.status}: ${errorText}`);
      }

      result = await response.json();

      console.log('📥 Resposta UmbrellaPag:', {
        status: response.status,
        resultStatus: result.status,
        hasData: !!result.data,
        hasPixCode: !!(result.data?.pix?.qrCode || result.data?.qrCode),
      });

      if (result.status !== 200 || !result.data) {
        console.error('❌ Resposta inválida:', result);
        return res.status(500).json({
          status: 500,
          message: result.message || 'Resposta inválida da API',
          error: 'Dados da transação não retornados',
          data: null,
        });
      }

      // Sucesso - retornar no formato esperado pelo frontend
      return res.status(200).json({
        status: 200,
        message: 'Transação criada com sucesso',
        data: result.data,
        error: null,
        // Adicionar campos úteis para o frontend
        success: true,
        pixCode: result.data.pix?.qrCode || result.data.qrCode || null,
      });

    } catch (fetchError) {
      console.error('❌ Erro no fetch para UmbrellaPag:', fetchError);
      throw fetchError; // Será capturado no catch global
    }

  } catch (error) {
    console.error('❌ Erro ao processar requisição:', error);
    
    // Tratamento de erro global (seguindo o tutorial)
    return res.status(500).json({
      status: 500,
      message: 'Erro ao criar PIX',
      error: error.message || 'Erro desconhecido',
      data: null,
      success: false,
    });
  }
};
