// Vercel Serverless Function para criar transação PIX
// Rota: /api/create-pix-transaction
// ESM PURO - package.json tem "type": "module"
//
// ⚠️ IMPORTANTE: Salva transação no banco quando PIX é criado

import { supabase } from './lib/supabase.js';

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

    // Apenas POST
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Apenas requisições POST são permitidas'
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

    // Receber dados do frontend
    const { customer, items, totalPrice, metadata } = req.body;

    // Validar dados obrigatórios
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

    // Gerar externalRef consistente (ID do pedido)
    // Usar metadata.orderId se fornecido, senão gerar um único
    const orderId = metadata?.orderId || `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Normalizar CPF (só números)
    const normalizedCPF = customer.cpf.replace(/\D/g, '');
    
    // Normalizar valor do PIX (CRÍTICO) - Evitar 4.473000000000001
    const normalizedPrice = Number(Number(totalPrice).toFixed(2));
    const amountInCents = Math.round(normalizedPrice * 100);

    // Normalizar telefone (só números, mínimo 10 dígitos)
    const normalizedPhone = customer.phone?.replace(/\D/g, '') || '11999999999';
    const phone = normalizedPhone.length >= 10 ? normalizedPhone : '11999999999';

    // Preparar customer para UmbrellaPag
    const umbrellaCustomer = {
      name: customer.name,
      phone: phone,
      email: customer.email || `cliente${normalizedCPF.substring(0, 6)}@exemplo.com`,
      document: {
        type: 'CPF',
        number: normalizedCPF
      }
    };

    // Preparar items para UmbrellaPag
    const umbrellaItems = items
      .filter(item => item.price > 0)
      .map(item => {
        const itemPrice = Number(Number(item.price).toFixed(2));
        return {
          title: item.name,
          unitPrice: Math.round(itemPrice * 100), // em centavos
          quantity: item.quantity || 1,
          tangible: true
        };
      });

    // Obter IP do cliente
    const clientIP = req.headers['x-forwarded-for'] || 
                    req.headers['x-real-ip'] || 
                    req.connection?.remoteAddress || 
                    '127.0.0.1';

    // Montar payload para UmbrellaPag
    // IMPORTANTE: externalRef NÃO pode ser enviado no payload de criação
    // O vínculo será feito via transactionId retornado pela API
    const postbackUrl = process.env.VITE_POSTBACK_URL || 
                        `https://${req.headers.host}/api/webhook-umbrellapag`;
    
    const payload = {
      amount: amountInCents, // em centavos
      currency: 'BRL',
      paymentMethod: 'PIX',
      customer: umbrellaCustomer,
      items: umbrellaItems,
      pix: {
        expiresInDays: 1
      },
      // Postback URL para webhook
      postbackUrl: postbackUrl,
      // Metadata com orderId (para referência interna)
      metadata: JSON.stringify({
        orderId: orderId,
        ...metadata
      })
    };

    console.log('🚀 Criando PIX:', {
      amount: amountInCents,
      customer: umbrellaCustomer.name,
      itemsCount: umbrellaItems.length,
      document: normalizedCPF.substring(0, 3) + '***',
      orderId: orderId, // orderId interno (não enviado como externalRef)
      postbackUrl: postbackUrl // ⚠️ IMPORTANTE: URL do webhook
    });
    
    console.log('📤 Payload completo enviado para UmbrellaPag:', JSON.stringify(payload, null, 2));

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

    // Se não for sucesso, retornar erro
    if (!response.ok) {
      console.error('❌ Erro na API UmbrellaPag:', {
        status: response.status,
        data
      });
      
      return res.status(response.status).json({
        success: false,
        status: response.status,
        error: data?.message || data?.error || 'Erro ao criar transação PIX',
        data: data
      });
    }

    // Sucesso - padronizar resposta para o frontend
    const transactionData = data?.data || data;
    
    // Extrair QR Code (pode estar em diferentes campos)
    const qrCode = transactionData?.pix?.qrcode || 
                   transactionData?.pix?.qrCode || 
                   transactionData?.qrCode ||
                   transactionData?.pix?.copyPaste ||
                   transactionData?.copyPaste;
    
    console.log('✅ PIX criado com sucesso:', {
      transactionId: transactionData?.transactionId || transactionData?.id,
      status: transactionData?.status,
      hasQrCode: !!qrCode,
      postbackUrl: postbackUrl,
      fullResponse: JSON.stringify(transactionData, null, 2)
    });
    
    // ⚠️ AVISO: Verificar se o webhook está configurado no painel da UmbrellaPag
    if (!postbackUrl || !postbackUrl.includes('/api/webhook-umbrellapag')) {
      console.warn('⚠️ ATENÇÃO: postbackUrl pode estar incorreto:', postbackUrl);
    }

    // Extrair transactionId retornado pela UmbrellaPag
    const transactionId = transactionData?.transactionId || transactionData?.id;
    
    // ⚠️ CRÍTICO: Salvar transação no banco de dados (fonte da verdade)
    // Status inicial = WAITING_PAYMENT
    // Esse registro é o que o polling vai ler
    if (transactionId && supabase) {
      try {
        // Normalizar CPF para buscar cliente
        const normalizedCPFForDB = customer.cpf.replace(/\D/g, '');
        
        // Preparar dados do pedido
        const orderData = {
          order_number: orderId, // ID interno do pedido
          customer_cpf: normalizedCPFForDB,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: typeof item.image === 'string' ? item.image : undefined,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
          })),
          total_price: normalizedPrice, // Usar preço normalizado (não finalPrice que não existe aqui)
          payment_method: 'pix',
          pix_code: qrCode,
          status: 'aguardando_pagamento', // Status interno
          umbrella_transaction_id: transactionId, // ID da transação UmbrellaPag
          umbrella_status: transactionData?.status || 'WAITING_PAYMENT', // Status do gateway
          umbrella_qr_code: qrCode,
          umbrella_external_ref: orderId, // ID do pedido como externalRef
        };

        const { data: savedOrder, error: saveError } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();

        if (saveError) {
          console.error('❌ Erro ao salvar pedido no banco:', saveError);
          // Não falhar a transação, apenas logar o erro
          // O pedido pode ser salvo depois pelo frontend
        } else {
          console.log('✅ Pedido salvo no banco:', {
            orderNumber: savedOrder.order_number,
            transactionId: savedOrder.umbrella_transaction_id,
            status: savedOrder.umbrella_status
          });
        }
      } catch (dbError) {
        console.error('❌ Erro ao salvar pedido no banco:', dbError);
        // Não falhar a transação, apenas logar o erro
      }
    } else {
      if (!transactionId) {
        console.warn('⚠️ TransactionId não disponível, não foi possível salvar no banco');
      }
      if (!supabase) {
        console.warn('⚠️ Supabase não configurado, pedido não foi salvo no banco');
      }
    }

    // Retornar resposta compatível com frontend
    return res.status(200).json({
      success: true,
      status: 200,
      message: 'Transação PIX criada com sucesso',
      // Campos diretos para compatibilidade
      pixCode: qrCode,
      // Estrutura completa para compatibilidade com código existente
      data: {
        id: transactionId,
        transactionId: transactionId, // Usar transactionId como vínculo principal
        orderId: orderId, // ID do pedido interno (guardar no nosso banco)
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
    console.error('❌ PIX error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro desconhecido ao criar transação PIX'
    });
  }
}
