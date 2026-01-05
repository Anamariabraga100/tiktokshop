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

const BASE_URL = 'https://api-gateway.umbrellapag.com/api';

// Helper: Configurar CORS
function setCORS(res, methods = 'GET, POST, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Helper: Verificar API Key
function getAPIKey() {
  const API_KEY = process.env.UMBRELLAPAG_API_KEY;
  if (!API_KEY) {
    throw new Error('UMBRELLAPAG_API_KEY não configurada');
  }
  return API_KEY;
}

// CRIAR TRANSAÇÃO PIX
async function createTransaction(req, res) {
  try {
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

    const API_KEY = getAPIKey();
    const orderId = metadata?.orderId || `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const normalizedCPF = customer.cpf.replace(/\D/g, '');
    const normalizedPrice = Number(Number(totalPrice).toFixed(2));
    const amountInCents = Math.round(normalizedPrice * 100);
    const normalizedPhone = customer.phone?.replace(/\D/g, '') || '11999999999';
    const phone = normalizedPhone.length >= 10 ? normalizedPhone : '11999999999';

    const umbrellaCustomer = {
      name: customer.name,
      phone: phone,
      email: customer.email || `cliente${normalizedCPF.substring(0, 6)}@exemplo.com`,
      document: {
        type: 'CPF',
        number: normalizedCPF
      }
    };

    const umbrellaItems = items
      .filter(item => item.price > 0)
      .map(item => {
        const itemPrice = Number(Number(item.price).toFixed(2));
        return {
          title: item.name,
          unitPrice: Math.round(itemPrice * 100),
          quantity: item.quantity || 1,
          tangible: true
        };
      });

    const postbackUrl = process.env.VITE_POSTBACK_URL || 
                        (req.headers.host ? `https://${req.headers.host}/api/webhook` : '');
    
    const payload = {
      amount: amountInCents,
      currency: 'BRL',
      paymentMethod: 'PIX',
      customer: umbrellaCustomer,
      items: umbrellaItems,
      pix: {
        expiresInDays: 1
      },
      postbackUrl: postbackUrl,
      metadata: JSON.stringify({
        orderId: orderId,
        ...metadata
      })
    };

    console.log('🚀 Criando PIX:', {
      amount: amountInCents,
      customer: umbrellaCustomer.name,
      itemsCount: umbrellaItems.length,
      orderId: orderId
    });

    const response = await fetch(`${BASE_URL}/user/transactions`, {
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
      console.error('❌ Erro na API UmbrellaPag:', { status: response.status, data });
      return res.status(response.status).json({
        success: false,
        status: response.status,
        error: data?.message || data?.error || 'Erro ao criar transação PIX',
        data: data
      });
    }

    const transactionData = data?.data || data;
    const qrCode = transactionData?.pix?.qrcode || 
                   transactionData?.pix?.qrCode || 
                   transactionData?.qrCode ||
                   transactionData?.pix?.copyPaste ||
                   transactionData?.copyPaste;
    
    const transactionId = transactionData?.transactionId || transactionData?.id;
    
    // Salvar no banco
    if (transactionId && supabase) {
      try {
        // Calcular expiração (1 dia = 24 horas = 86400000ms)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        
        const orderData = {
          order_number: orderId,
          customer_cpf: normalizedCPF,
          items: items.map(item => ({
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
          umbrella_status: transactionData?.status || 'WAITING_PAYMENT',
          umbrella_qr_code: qrCode,
          umbrella_external_ref: orderId,
          // Campo de expiração para lógica clara
          expires_at: expiresAt,
          // ✅ Salvar fbc/fbp para usar no webhook (atribuição de campanha)
          facebook_fbc: fbc || null,
          facebook_fbp: fbp || null,
        };

        const { data: savedOrder, error: saveError } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();

        if (saveError) {
          console.error('❌ Erro ao salvar pedido no banco:', saveError);
        } else {
          console.log('✅ Pedido salvo no banco:', savedOrder.order_number);
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
      data: {
        id: transactionId,
        transactionId: transactionId,
        orderId: orderId,
        status: transactionData?.status,
        amount: transactionData?.amount,
        qrCode: qrCode,
        pix: {
          qrCode: qrCode,
          qrcode: qrCode,
          copyPaste: transactionData?.pix?.copyPaste || transactionData?.copyPaste,
          expirationDate: transactionData?.pix?.expirationDate || transactionData?.pix?.expiresAt
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
          // ✅ Adicionar fbc/fbp do banco (salvos na criação do pedido)
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

