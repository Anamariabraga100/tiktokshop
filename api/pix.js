// Vercel Serverless Function para operações PIX
// Rotas:
//   POST /api/pix - Criar transação PIX
//   GET /api/pix?orderId=xxx - Verificar status do pagamento (SOMENTE banco)
// ESM PURO - package.json tem "type": "module"
//
// 🎯 REGRA DE OURO: Polling NÃO consulta gateway
// Polling é só pra saber se o BANCO já sabe que pagou
// Webhook / conciliação é quem conversa com o mundo externo

import { supabase } from './lib/supabase.js';

const UMBRELLAPAG_BASE_URL = 'https://api-gateway.umbrellapag.com/api';

// Helper: Configurar CORS
function setCORS(res, methods = 'GET, POST, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Helper: Verificar API Key UmbrellaPay (retorna null se não configurada)
// ⚠️ NÃO fazer throw aqui - validar apenas dentro do bloco de fallback
function getUmbrellaPayAPIKey() {
  return process.env.UMBRELLAPAG_API_KEY || null;
}

// Helper: Verificar Public Key do LxPay
function getLxPayPublicKey() {
  const PUBLIC_KEY = process.env.NEW_GATEWAY_PUBLIC_KEY || process.env.LXPAY_PUBLIC_KEY || 'comprarbms_1767919324079';
  if (!PUBLIC_KEY) {
    throw new Error('NEW_GATEWAY_PUBLIC_KEY não configurada');
  }
  return PUBLIC_KEY;
}

// Helper: Verificar Secret Key do LxPay
function getLxPaySecretKey() {
  const SECRET_KEY = process.env.NEW_GATEWAY_PRIVATE_KEY || process.env.NEW_GATEWAY_SECRET_KEY || process.env.LXPAY_PRIVATE_KEY || '174bbcd3-2157-42cd-925f-9447a8a642d3';
  if (!SECRET_KEY) {
    throw new Error('NEW_GATEWAY_PRIVATE_KEY não configurada');
  }
  return SECRET_KEY;
}

// Helper: Obter base URL do LxPay
function getLxPayBaseURL() {
  const BASE_URL = process.env.NEW_GATEWAY_BASE_URL || process.env.LXPAY_BASE_URL || 'https://api.lxpay.com.br';
  return BASE_URL.replace(/\/$/, ''); // Remove trailing slash
}

// CRIAR TRANSAÇÃO PIX - LXPAY (PRINCIPAL)
async function createTransactionWithNewGateway(req, orderId, customer, items, totalPrice, normalizedCPF, phone, customerEmail, postbackUrl, metadata, fbc, fbp) {
  try {
    const lxPayBaseURL = getLxPayBaseURL();
    const lxPayPublicKey = getLxPayPublicKey();
    const lxPaySecretKey = getLxPaySecretKey();
    
    // Formatar dados para o LxPay
    const normalizedPrice = Number(Number(totalPrice).toFixed(2));
    
    // Construir payload conforme documentação do LxPay
    const payload = {
      identifier: orderId,
      amount: normalizedPrice, // Decimal, não centavos
      client: {
        name: customer.name.trim(),
        email: customerEmail,
        phone: phone,
        document: normalizedCPF
      },
      products: items
        .filter(item => item.price > 0 && item.name && item.name.trim() !== '')
        .map(item => ({
          id: item.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: item.name.trim(),
          quantity: Math.max(1, Math.floor(item.quantity || 1)),
          price: Number(Number(item.price).toFixed(2))
        })),
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      callbackUrl: postbackUrl || undefined,
      metadata: {
        ...metadata,
        orderId: orderId,
        ...(fbc ? { fbc } : {}),
        ...(fbp ? { fbp } : {})
      }
    };

    console.log('🚀 Criando PIX no LxPay:', {
      gatewayUrl: `${lxPayBaseURL}/api/v1/gateway/pix/receive`,
      orderId,
      amount: payload.amount,
      clientName: payload.client.name,
      productsCount: payload.products.length,
      hasCallbackUrl: !!payload.callbackUrl,
      publicKey: lxPayPublicKey.substring(0, 10) + '...' // Log parcial por segurança
    });

    // 🔐 Autenticação LxPay: x-public-key + x-secret-key (OBRIGATÓRIO)
    // A LxPay usa autenticação via headers: x-public-key e x-secret-key
    // ⚠️ NÃO usar Authorization Bearer
    // ⚠️ NÃO usar API Key única
    // Todas as requisições DEVEM conter ambos os headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Timeout de 8 segundos
    
    try {
      const response = await fetch(`${lxPayBaseURL}/api/v1/gateway/pix/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-public-key': lxPayPublicKey,     // Public Key (identificação)
          'x-secret-key': lxPaySecretKey       // Secret Key (autenticação)
          // ⚠️ NÃO usar Authorization header aqui
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text.substring(0, 500) };
      }

      if (!response.ok) {
        console.error('❌ Erro na API do LxPay:', {
          status: response.status,
          data,
          errorCode: data?.errorCode,
          message: data?.message,
          details: data?.details
        });
        
        // Se erro de autenticação, verificar headers
        if (response.status === 401 || response.status === 403) {
          console.error('⚠️ ERRO DE AUTENTICAÇÃO: Verifique se os headers x-public-key e x-secret-key estão corretos');
        }
        
        throw new Error(data?.message || `Erro HTTP ${response.status}: ${text.substring(0, 200)}`);
      }

      // Verificar formato de resposta do LxPay
      const transactionId = data?.transactionId || data?.order?.id;
      const qrCode = data?.pix?.code || data?.pix?.qrCode || '';
      const status = data?.status || 'OK';

      if (!qrCode || qrCode.trim() === '') {
        throw new Error('QR Code não foi retornado pelo LxPay');
      }

      console.log('✅✅✅ PIX criado com sucesso no LxPay:', {
        transactionId,
        orderId,
        hasQrCode: !!qrCode,
        status
      });

      return {
        success: true,
        transactionId,
        qrCode,
        status,
        gateway: 'lxpay',
        rawResponse: data
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout ao criar transação no LxPay (8 segundos)');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('❌ Erro ao criar transação no LxPay:', error);
    throw error;
  }
}

// CRIAR TRANSAÇÃO PIX - UMBRELLAPAY (FALLBACK)
async function createTransactionWithUmbrellaPay(req, orderId, customer, items, totalPrice, normalizedCPF, phone, customerEmail, postbackUrl, metadata, fbc, fbp) {
  try {
    // ✅ API Key já validada antes de chamar esta função (no bloco de fallback)
    // Esta validação é uma segurança extra
    const API_KEY = getUmbrellaPayAPIKey();
    if (!API_KEY) {
      throw new Error('UMBRELLAPAG_API_KEY não configurada');
    }
    
    const normalizedPrice = Number(Number(totalPrice).toFixed(2));
    const amountInCents = Math.round(normalizedPrice * 100);

    const umbrellaCustomer = {
      name: customer.name.trim(),
      phone: phone,
      email: customerEmail,
      document: {
        type: 'CPF',
        number: normalizedCPF
      }
    };

    const umbrellaItems = items
      .filter(item => item.price > 0 && item.name && item.name.trim() !== '')
      .map(item => {
        const itemPrice = Number(Number(item.price).toFixed(2));
        const quantity = Math.max(1, Math.floor(item.quantity || 1));
        
        if (itemPrice <= 0) {
          throw new Error(`Preço inválido para item: ${item.name}`);
        }
        
        if (!item.name || item.name.trim() === '') {
          throw new Error('Nome do item não pode estar vazio');
        }
        
        return {
          title: item.name.trim(),
          unitPrice: Math.round(itemPrice * 100), // Converter para centavos
          quantity: quantity,
          tangible: true
        };
      });

    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] ||
                     req.connection?.remoteAddress ||
                     req.socket?.remoteAddress ||
                     '127.0.0.1';

    const payload = {
      amount: amountInCents,
      currency: 'BRL',
      paymentMethod: 'PIX',
      installments: 1,
      traceable: true,
      ip: clientIP,
      customer: umbrellaCustomer,
      items: umbrellaItems,
      pix: {
        expiresInDays: 1
      },
      ...(postbackUrl ? { postbackUrl: postbackUrl } : {}),
      metadata: JSON.stringify({
        orderId: orderId,
        ...metadata
      })
    };

    console.log('🚀 Criando PIX no UmbrellaPay (fallback):', {
      gatewayUrl: `${UMBRELLAPAG_BASE_URL}/user/transactions`,
      orderId,
      amountInCents,
      itemsCount: umbrellaItems.length
    });

    const response = await fetch(`${UMBRELLAPAG_BASE_URL}/user/transactions`, {
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

    if (!response.ok) {
      const refusedReason = data?.error?.refusedReason || data?.data?.refusedReason || 'Erro de validação nos dados fornecidos';
      const provider = data?.error?.provider || data?.data?.provider || 'Desconhecido';
      
      throw new Error(`Transação recusada pelo UmbrellaPay: ${refusedReason} (Provider: ${provider})`);
    }

    const transactionData = data?.data || data;
    const qrCode = transactionData?.pix?.qrcode || 
                   transactionData?.pix?.qrCode || 
                   transactionData?.qrCode ||
                   transactionData?.pix?.copyPaste ||
                   transactionData?.copyPaste;
    
    const transactionId = transactionData?.transactionId || transactionData?.id;

    if (!qrCode || qrCode.trim() === '') {
      throw new Error('QR Code não foi retornado pelo UmbrellaPay');
    }

    console.log('✅✅✅ PIX criado com sucesso no UmbrellaPay (fallback):', {
      transactionId,
      orderId,
      hasQrCode: !!qrCode
    });

    return {
      success: true,
      transactionId,
      qrCode,
      status: transactionData?.status || 'WAITING_PAYMENT',
      gateway: 'umbrellapag',
      rawResponse: transactionData
    };
  } catch (error) {
    console.error('❌ Erro ao criar transação no UmbrellaPay:', error);
    throw error;
  }
}

// CRIAR TRANSAÇÃO PIX (MAIN FUNCTION)
async function createTransaction(req, res) {
  try {
    // ✅ LOG CRÍTICO: Confirmar que POST /api/pix foi chamado
    console.log('🚨🚨🚨 POST /api/pix RECEBIDO - CRIANDO PIX AGORA!', {
      timestamp: new Date().toISOString(),
      method: req.method,
      hasBody: !!req.body,
      customerName: req.body?.customer?.name,
      itemsCount: req.body?.items?.length,
      totalPrice: req.body?.totalPrice,
    });

    const { customer, items, totalPrice, metadata, fbc, fbp } = req.body; // ✅ Receber fbc/fbp do frontend

    if (!customer || !customer.name || !customer.cpf) {
      return res.status(400).json({
        success: false,
        error: 'Dados do cliente incompletos. Nome e CPF são obrigatórios.'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Carrinho vazio. Adicione itens ao carrinho.'
      });
    }

    if (!totalPrice || totalPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valor inválido'
      });
    }

    const orderId = metadata?.orderId || `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const normalizedCPF = customer.cpf.replace(/\D/g, '');
    const normalizedPrice = Number(Number(totalPrice).toFixed(2));
    const normalizedPhone = customer.phone?.replace(/\D/g, '') || '11999999999';
    const phone = normalizedPhone.length >= 10 ? normalizedPhone : '11999999999';

    // ✅ Rate limiting: Verificar se já existe pedido recente para este CPF (últimos 5 minutos)
    if (supabase) {
      try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        const { data: recentOrders, error: checkError } = await supabase
          .from('orders')
          .select('order_number, created_at')
          .eq('customer_cpf', normalizedCPF)
          .gte('created_at', fiveMinutesAgo)
          .order('created_at', { ascending: false })
          .limit(1);

        if (checkError) {
          console.warn('⚠️ Erro ao verificar pedidos recentes:', checkError);
          // Continuar mesmo com erro (não bloquear por causa de erro de consulta)
        } else if (recentOrders && recentOrders.length > 0) {
          const lastOrder = recentOrders[0];
          const lastOrderTime = new Date(lastOrder.created_at);
          const timeDiff = Date.now() - lastOrderTime.getTime();
          const minutesRemaining = Math.ceil((5 * 60 * 1000 - timeDiff) / (60 * 1000));
          
          console.warn('⏱️ Rate limit: Pedido recente encontrado para este CPF:', {
            lastOrder: lastOrder.order_number,
            lastOrderTime: lastOrder.created_at,
            minutesRemaining: minutesRemaining
          });

          return res.status(429).json({
            success: false,
            error: `Você já criou um pedido recentemente. Aguarde ${minutesRemaining} minuto(s) antes de criar um novo pedido.`,
            rateLimit: {
              lastOrder: lastOrder.order_number,
              waitMinutes: minutesRemaining,
              retryAfter: Math.ceil((5 * 60 * 1000 - timeDiff) / 1000) // segundos
            }
          });
        }
      } catch (rateLimitError) {
        console.warn('⚠️ Erro ao verificar rate limit:', rateLimitError);
        // Continuar mesmo com erro (não bloquear por causa de erro de consulta)
      }
    }

    // ✅ Validar CPF antes de criar customer
    if (normalizedCPF.length !== 11) {
      return res.status(400).json({
        success: false,
        error: 'CPF inválido. Deve conter 11 dígitos.'
      });
    }

    // ✅ Validar email (se fornecido)
    const customerEmail = customer.email || `cliente${normalizedCPF.substring(0, 6)}@exemplo.com`;
    if (customerEmail && !customerEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido.'
      });
    }

    // ✅ Validar telefone (deve ter pelo menos 10 dígitos)
    if (phone.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Telefone inválido. Deve conter pelo menos 10 dígitos.'
      });
    }

    // ✅ Validar nome (não pode estar vazio)
    if (!customer.name || customer.name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Nome inválido. Deve conter pelo menos 3 caracteres.'
      });
    }

    // ✅ Validar e formatar itens
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lista de itens vazia.'
      });
    }

    const validItems = items.filter(item => item.price > 0 && item.name && item.name.trim() !== '');
    if (validItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum item válido encontrado. Verifique os preços e nomes dos produtos.'
      });
    }

    // ✅ Construir URL do webhook corretamente (Vercel)
    // Prioridade: variável de ambiente > headers > fallback
    let postbackUrl = process.env.VITE_POSTBACK_URL || 
                      process.env.POSTBACK_URL ||
                      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/webhook` : null;
    
    // Se não tiver variável de ambiente, tentar construir dos headers
    if (!postbackUrl) {
      const host = req.headers.host || 
                   req.headers['x-forwarded-host'] ||
                   req.headers['x-vercel-deployment-url'];
      const protocol = req.headers['x-forwarded-proto'] || 
                      (req.headers['x-forwarded-ssl'] === 'on' ? 'https' : 'https');
      
      if (host) {
        postbackUrl = `${protocol}://${host}/api/webhook`;
      }
    }
    
    // Log para debug
    console.log('🔗 postbackUrl configurado:', {
      postbackUrl,
      hasEnvVar: !!(process.env.VITE_POSTBACK_URL || process.env.POSTBACK_URL),
      host: req.headers.host,
      forwardedHost: req.headers['x-forwarded-host'],
      vercelUrl: process.env.VERCEL_URL
    });
    
    // Se ainda não tiver URL, avisar mas não falhar
    if (!postbackUrl) {
      console.warn('⚠️ ⚠️ ⚠️ ATENÇÃO: postbackUrl não configurado! Webhook não será chamado!');
      console.warn('⚠️ Configure VITE_POSTBACK_URL ou POSTBACK_URL nas variáveis de ambiente da Vercel');
    }

    // 🎯 TENTAR LXPAY PRIMEIRO (PRINCIPAL)
    let transactionResult = null;
    let usedGateway = null;
    
    try {
      console.log('🚀 Tentando criar PIX no LxPay (principal)...');
      transactionResult = await createTransactionWithNewGateway(
        req, orderId, customer, validItems, totalPrice, 
        normalizedCPF, phone, customerEmail, postbackUrl, metadata, fbc, fbp
      );
      usedGateway = 'lxpay';
      console.log('✅✅✅ Sucesso no LxPay!');
    } catch (lxPayError) {
      console.warn('⚠️ Falha no LxPay, tentando UmbrellaPay (fallback):', lxPayError.message);
      
      // 🔄 FALLBACK PARA UMBRELLAPAY
      // ✅ A validação da API Key do UmbrellaPay só acontece AQUI dentro do fallback
      try {
        // Verificar se a API Key está configurada antes de tentar usar
        const umbrellaPayKey = getUmbrellaPayAPIKey();
        if (!umbrellaPayKey) {
          console.error('❌ UmbrellaPay não disponível - UMBRELLAPAG_API_KEY não configurada');
          throw new Error('Falha no gateway principal (LxPay) e fallback (UmbrellaPay) indisponível - Configure UMBRELLAPAG_API_KEY para usar o fallback');
        }
        
        console.log('🔄 Tentando criar PIX no UmbrellaPay (fallback)...');
        transactionResult = await createTransactionWithUmbrellaPay(
          req, orderId, customer, validItems, totalPrice, 
          normalizedCPF, phone, customerEmail, postbackUrl, metadata, fbc, fbp
        );
        usedGateway = 'umbrellapag';
        console.log('✅✅✅ Sucesso no UmbrellaPay (fallback)!');
      } catch (umbrellaPayError) {
        console.error('❌❌❌ Erro em ambos os gateways:', {
          lxPay: lxPayError.message,
          umbrellaPay: umbrellaPayError.message
        });
        return res.status(500).json({
          success: false,
          error: umbrellaPayError.message.includes('indisponível') 
            ? umbrellaPayError.message 
            : 'Não foi possível criar a transação PIX. Tente novamente.',
          details: {
            lxPayError: lxPayError.message,
            umbrellaPayError: umbrellaPayError.message
          }
        });
      }
    }

    if (!transactionResult || !transactionResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Falha ao criar transação PIX'
      });
    }

    const { transactionId, qrCode, status: transactionStatus } = transactionResult;
    
    // Calcular expiração (1 dia = 24 horas = 86400000ms)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    // Salvar no banco
    if (transactionId && supabase) {
      try {
        const orderData = {
          order_number: orderId,
          customer_cpf: normalizedCPF,
          items: validItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: typeof item.image === 'string' ? item.image : undefined,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
          })),
          total_price: normalizedPrice,
          payment_method: 'pix',
          pix_code: qrCode,
          status: 'aguardando_pagamento',
          umbrella_transaction_id: transactionId,
          umbrella_status: transactionStatus || 'WAITING_PAYMENT',
          umbrella_qr_code: qrCode,
          umbrella_external_ref: orderId,
          // Campo de expiração para lógica clara
          expires_at: expiresAt,
          // ✅ Salvar qual gateway foi usado
          gateway_used: usedGateway || 'unknown',
        };

        // ✅ Tentar salvar com fbc/fbp primeiro (se disponível)
        // Se as colunas não existirem, tentar novamente sem elas
        let savedOrder = null;
        let saveError = null;
        
        // Adicionar fbc/fbp se disponível
        if (fbc || fbp) {
          if (fbc) orderData.facebook_fbc = fbc;
          if (fbp) orderData.facebook_fbp = fbp;
        }

        // Tentar salvar
        const { data, error } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();
        
        savedOrder = data;
        saveError = error;

        // Se falhar e tiver tentado com fbc/fbp, tentar sem
        if (saveError && (fbc || fbp)) {
          const errorMessage = saveError.message || '';
          if (errorMessage.includes('facebook_fbc') || errorMessage.includes('facebook_fbp')) {
            console.warn('⚠️ Colunas facebook_fbc/fbp não existem no banco. Tentando salvar sem elas...');
            const orderDataWithoutFb = { ...orderData };
            delete orderDataWithoutFb.facebook_fbc;
            delete orderDataWithoutFb.facebook_fbp;
            
            const { data: dataRetry, error: errorRetry } = await supabase
              .from('orders')
              .insert(orderDataWithoutFb)
              .select()
              .single();
            
            savedOrder = dataRetry;
            saveError = errorRetry;
          }
        }

        if (saveError) {
          console.error('❌ Erro ao salvar pedido no banco:', saveError);
          // Não falhar a criação do PIX por causa do banco
        } else {
          console.log('✅ Pedido salvo no banco:', savedOrder?.order_number, `(Gateway: ${usedGateway})`);
        }
      } catch (dbError) {
        console.error('❌ Erro ao salvar pedido no banco:', dbError);
      }
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: 'Transação PIX criada com sucesso',
      pixCode: qrCode,
      gateway: usedGateway, // ✅ Informar qual gateway foi usado
      data: {
        id: transactionId,
        transactionId: transactionId,
        orderId: orderId,
        status: transactionStatus,
        amount: normalizedPrice,
        qrCode: qrCode,
        pix: {
          qrCode: qrCode,
          qrcode: qrCode,
          code: qrCode,
          copyPaste: transactionResult.rawResponse?.pix?.copyPaste || qrCode,
          expirationDate: transactionResult.rawResponse?.pix?.expirationDate || expiresAt
        }
      }
    });

  } catch (err) {
    console.error('❌ Erro ao criar transação PIX:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro desconhecido ao criar transação PIX'
    });
  }
}

// VERIFICAR STATUS DO PAGAMENTO
// ✂️ CORTE 1: Polling só no banco - SEM gateway
// Polling NÃO é pra descobrir se pagou no gateway
// Polling é só pra saber se o BANCO já sabe que pagou
async function checkStatus(req, res) {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'orderId é obrigatório'
      });
    }

    console.log('🔍 Verificando status do pagamento (SOMENTE banco):', { orderId });

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase não configurado'
      });
    }

    // Consultar banco por orderId (chave primária lógica)
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderId)
      .single();

    if (findError || !order) {
      if (findError?.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Pedido não encontrado',
          status: 'NOT_FOUND'
        });
      }
      console.error('❌ Erro ao buscar pedido no banco:', findError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao consultar banco de dados'
      });
    }

    // Verificar se expirou
    const now = new Date();
    const expiresAt = order.expires_at ? new Date(order.expires_at) : null;
    const isExpired = expiresAt && expiresAt < now;

    // Determinar status final
    const isPaid = order.umbrella_status === 'PAID' || 
                   order.umbrella_status === 'paid' || 
                   order.umbrella_status === 'CONFIRMED' ||
                   order.status === 'pago';

    let finalStatus = 'PENDING';
    if (isPaid) {
      finalStatus = 'PAID';
    } else if (isExpired) {
      finalStatus = 'EXPIRED';
    }

    // ✅ Se está pago mas Purchase ainda não foi disparado, disparar server-side
    // Verificar se o campo existe (pode não existir em schemas antigos)
    const purchaseAlreadyDispatched = order.purchase_dispatched === true || 
                                     order.purchase_dispatched_at !== null;
    
    if (isPaid && !purchaseAlreadyDispatched) {
      console.log('📤 [SERVER-SIDE] Pagamento confirmado via polling - disparando Purchase...');
      
      try {
        // Buscar dados do cliente
        let customerData = null;
        if (order.customer_cpf) {
          try {
            const { data: customer } = await supabase
              .from('customers')
              .select('*')
              .eq('cpf', order.customer_cpf.replace(/\D/g, ''))
              .single();
            if (customer) customerData = customer;
          } catch (e) {
            console.warn('⚠️ Erro ao buscar dados do cliente:', e);
          }
        }

        // Construir URL do endpoint
        const host = req.headers.host || req.headers['x-forwarded-host'];
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const baseUrl = host ? `${protocol}://${host}` : '';
        const pixelEndpoint = `${baseUrl}/api/facebook-pixel`;
        
        const customerName = customerData?.name || '';
        const nameParts = customerName.split(' ');
        
        const purchasePayload = {
          eventType: 'Purchase',
          eventName: 'Purchase',
          orderId: order.order_number, // ✅ Usa orderId como event_id
          value: order.total_price || 0,
          currency: 'BRL',
          numItems: order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0,
          contents: order.items?.map(item => ({
            id: item.id,
            quantity: item.quantity || 1,
            item_price: item.price
          })) || [],
          // ✅ Adicionar fbc/fbp do banco (salvos na criação do pedido, se disponível)
          fbc: order.facebook_fbc || null,
          fbp: order.facebook_fbp || null,
          userData: {
            email: customerData?.email,
            phone: customerData?.phone,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            externalId: order.customer_cpf?.replace(/\D/g, ''),
            address: customerData?.address ? {
              cidade: customerData.address.cidade,
              estado: customerData.address.estado,
              cep: customerData.address.cep,
              country: 'br'
            } : undefined
          }
        };

        console.log('📤 [SERVER-SIDE] Disparando Purchase via polling:', {
          orderId: purchasePayload.orderId,
          value: purchasePayload.value,
          eventId: purchasePayload.orderId
        });

        const pixelResponse = await fetch(pixelEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(purchasePayload)
        });

        if (pixelResponse.ok) {
          const pixelResult = await pixelResponse.json();
          
          // ✅ Marcar como disparado no banco (proteção contra duplicação)
          // Tentar atualizar campos (pode não existir em schemas antigos)
          try {
            await supabase
              .from('orders')
              .update({ 
                purchase_dispatched: true,
                purchase_dispatched_at: new Date().toISOString()
              })
              .eq('order_number', orderId);
          } catch (updateError) {
            // Se os campos não existirem, apenas logar (não quebrar)
            console.warn('⚠️ Campos purchase_dispatched não existem no banco (ignorado):', updateError);
          }
          
          console.log('✅✅✅ [SERVER-SIDE] Purchase disparado via polling:', {
            orderId: purchasePayload.orderId,
            eventId: pixelResult.eventId,
            source: 'polling'
          });
        } else {
          const errorText = await pixelResponse.text();
          console.error('❌ [SERVER-SIDE] Erro ao disparar Purchase via polling:', errorText);
        }
      } catch (purchaseError) {
        console.error('❌ [SERVER-SIDE] Erro ao disparar Purchase via polling:', purchaseError);
        // Não falhar a verificação de status por causa do Purchase
      }
    } else if (isPaid && purchaseAlreadyDispatched) {
      console.log('⏭️ [SERVER-SIDE] Purchase já foi disparado anteriormente para orderId:', orderId);
    }

    console.log('✅ Status do pedido:', {
      orderNumber: order.order_number,
      status: finalStatus,
      isPaid,
      isExpired,
      purchaseDispatched: purchaseAlreadyDispatched
    });

    return res.status(200).json({
      success: true,
      isPaid,
      isExpired,
      status: finalStatus,
      order: {
        order_number: order.order_number,
        status: order.status,
        umbrella_status: order.umbrella_status,
        paidAt: order.umbrella_paid_at,
        endToEndId: order.umbrella_end_to_end_id,
        amount: order.total_price,
        expiresAt: order.expires_at,
        purchaseDispatched: purchaseAlreadyDispatched
      },
      source: 'database'
    });

  } catch (err) {
    console.error('❌ Erro ao verificar status:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro desconhecido ao verificar status'
    });
  }
}

// Handler principal
export default async function handler(req, res) {
  try {
    setCORS(res);

    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    // POST = criar transação
    if (req.method === 'POST') {
      return await createTransaction(req, res);
    }
    
    // GET = verificar status
    if (req.method === 'GET') {
      return await checkStatus(req, res);
    }

    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });

  } catch (err) {
    console.error('❌ Erro no handler PIX:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro desconhecido'
    });
  }
}

