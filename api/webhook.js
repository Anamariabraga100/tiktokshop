// Vercel Serverless Function para receber webhook dos gateways de pagamento
// Suporta: Novo Gateway (principal) e UmbrellaPay (fallback)
// Rota: /api/webhook
// ESM PURO - package.json tem "type": "module"

import { supabase } from './lib/supabase.js';

// Helper: Detectar qual gateway está enviando o webhook
function detectGateway(body) {
  // LxPay: geralmente tem transactionId no topo e estrutura diferente
  if (body?.transactionId || body?.status === 'OK' || body?.order?.id) {
    return 'lxpay';
  }
  
  // UmbrellaPay: geralmente tem estrutura { data: { id, status, ... } }
  if (body?.data?.id) {
    return 'umbrellapag';
  }
  
  return 'unknown';
}

// Helper: Extrair dados do novo gateway
function parseNewGatewayWebhook(body) {
  const transactionId = body?.transactionId || body?.order?.id;
  const status = body?.status; // 'OK', 'PAID', etc.
  const orderId = body?.identifier || body?.metadata?.orderId || body?.orderId;
  const amount = body?.amount; // Já em decimal
  const paidAt = body?.paidAt || body?.paid_at || (status === 'PAID' || status === 'OK' ? new Date().toISOString() : null);
  const endToEndId = body?.endToEndId || body?.end_to_end_id;
  
  // Metadata pode vir como objeto ou string
  let metadata = body?.metadata || {};
  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch (e) {
      metadata = {};
    }
  }
  
  // Se orderId não está no metadata, tentar no topo
  if (!orderId && metadata.orderId) {
    metadata = { ...metadata, orderId: metadata.orderId };
  }
  
  return {
    transactionId,
    status,
    orderId: orderId || metadata.orderId,
    amount,
    paidAt,
    endToEndId,
    metadata,
    raw: body
  };
}

// Helper: Extrair dados do UmbrellaPay
function parseUmbrellaPayWebhook(body) {
  const data = body?.data;
  
  if (!data || !data.id) {
    return null;
  }
  
  const transactionId = data.id;
  const status = data.status;
  const paidAt = data.paidAt;
  const endToEndId = data.endToEndId;
  const amount = data.amount; // Em centavos
  
  // metadata vem como string JSON
  let metadata = {};
  try {
    metadata = JSON.parse(data.metadata || '{}');
  } catch (err) {
    console.warn('⚠️ Falha ao parsear metadata:', data.metadata);
  }
  
  const orderId = metadata.orderId;
  
  return {
    transactionId,
    status,
    orderId,
    amount: amount ? amount / 100 : null, // Converter centavos para decimal
    paidAt,
    endToEndId,
    metadata,
    raw: data
  };
}

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

    const body = req.body;
    
    // Detectar qual gateway está enviando
    const gateway = detectGateway(body);
    console.log(`📥 Webhook recebido (Gateway: ${gateway}):`, JSON.stringify(body, null, 2));

    let webhookData = null;
    
    // Parsear dados conforme o gateway
    if (gateway === 'lxpay' || gateway === 'new_gateway') {
      webhookData = parseNewGatewayWebhook(body);
    } else if (gateway === 'umbrellapag') {
      webhookData = parseUmbrellaPayWebhook(body);
    } else {
      console.warn('⚠️ Formato de webhook desconhecido:', body);
      return res.status(200).json({ success: true, message: 'Webhook recebido mas formato não reconhecido' });
    }

    if (!webhookData || !webhookData.transactionId) {
      console.warn('⚠️ Webhook recebido sem transactionId válido');
      return res.status(200).json({ success: true });
    }

    const { transactionId, status, orderId, amount, paidAt, endToEndId, metadata } = webhookData;

    console.log('📦 Dados normalizados do webhook:', {
      gateway,
      transactionId,
      status,
      paidAt,
      endToEndId,
      amount,
      orderId
    });

    // Se não tiver orderId, não tem como vincular
    if (!orderId) {
      console.warn(`⚠️ Webhook do ${gateway} sem orderId. Tentando buscar por transactionId: ${transactionId}`);
      
      // Tentar buscar pedido por transactionId no banco
      if (supabase && transactionId) {
        try {
          const { data: orderByTx, error: findError } = await supabase
            .from('orders')
            .select('order_number')
            .or(`umbrella_transaction_id.eq.${transactionId},lxpay_transaction_id.eq.${transactionId}`)
            .single();
          
          if (!findError && orderByTx) {
            webhookData.orderId = orderByTx.order_number;
            console.log(`✅ OrderId encontrado por transactionId: ${orderByTx.order_number}`);
          }
        } catch (e) {
          console.warn('⚠️ Erro ao buscar pedido por transactionId:', e);
        }
      }
      
      if (!webhookData.orderId) {
        console.warn('⚠️ Não foi possível identificar orderId do webhook');
        return res.status(200).json({ success: true, message: 'Webhook recebido mas sem orderId' });
      }
    }
    
    const finalOrderId = webhookData.orderId || orderId;

    // Normalizar status para comparação
    const normalizedStatus = status?.toUpperCase() || '';
    const isPaid = normalizedStatus === 'PAID' || 
                   normalizedStatus === 'OK' || 
                   normalizedStatus === 'CONFIRMED' || 
                   normalizedStatus === 'PAID_OUT' ||
                   normalizedStatus === 'PAGO';
    
    // Se o pagamento foi confirmado (PAID)
    if (isPaid) {
      console.log(`✅ Pagamento confirmado pelo ${gateway}! Atualizando pedido e disparando Purchase...`);

      // Buscar pedido pelo orderId (chave primária lógica)
      if (supabase) {
        try {
          const { data: order, error: findError } = await supabase
            .from('orders')
            .select('*')
            .eq('order_number', finalOrderId)
            .single();

          if (findError && findError.code !== 'PGRST116') {
            console.error('❌ Erro ao buscar pedido:', findError);
          }

          if (order) {
            // Buscar dados do cliente na tabela customers
            let customerData = null;
            if (order.customer_cpf) {
              try {
                const { data: customer, error: customerError } = await supabase
                  .from('customers')
                  .select('*')
                  .eq('cpf', order.customer_cpf.replace(/\D/g, ''))
                  .single();

                if (!customerError && customer) {
                  customerData = customer;
                }
              } catch (e) {
                console.warn('⚠️ Erro ao buscar dados do cliente:', e);
              }
            }

            // ✅ Verificar se Purchase já foi disparado (proteção contra duplicação)
            // Verificar se o campo existe no banco (pode não existir em schemas antigos)
            const purchaseAlreadyDispatched = order.purchase_dispatched === true || 
                                             order.purchase_dispatched_at !== null;
            
            if (purchaseAlreadyDispatched) {
              console.log('⏭️ [SERVER-SIDE] Purchase já foi disparado anteriormente para orderId:', finalOrderId);
            }

            // Atualizar pedido no banco
            const updateData = {
              umbrella_status: status,
              umbrella_paid_at: paidAt || new Date().toISOString(),
              umbrella_end_to_end_id: endToEndId,
              status: 'pago',
              updated_at: new Date().toISOString()
            };
            
            // Adicionar campos específicos do LxPay se necessário
            if (gateway === 'lxpay' || gateway === 'new_gateway') {
              updateData.lxpay_transaction_id = transactionId;
              updateData.lxpay_status = status;
              updateData.lxpay_paid_at = paidAt || new Date().toISOString();
            }

            const { data: updatedOrder, error: updateError } = await supabase
              .from('orders')
              .update(updateData)
              .eq('order_number', finalOrderId)
              .select()
              .single();

            if (updateError) {
              console.error('❌ Erro ao atualizar pedido:', updateError);
            } else {
              console.log('✅ Pedido atualizado no banco:', updatedOrder.order_number);
            }

            // ✅ Disparar Purchase server-side APENAS se ainda não foi disparado
            if (!purchaseAlreadyDispatched) {
              try {
              const host = req.headers.host || req.headers['x-forwarded-host'];
              const protocol = req.headers['x-forwarded-proto'] || 'https';
              const baseUrl = host ? `${protocol}://${host}` : '';
              const pixelEndpoint = `${baseUrl}/api/facebook-pixel`;
              
              const customerName = customerData?.name || '';
              const nameParts = customerName.split(' ');
              
              const purchasePayload = {
                eventType: 'Purchase',
                eventName: 'Purchase',
                orderId: order.order_number,
                value: order.total_price || (amount ? amount / 100 : 0),
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

                console.log('📤 [SERVER-SIDE] Disparando Purchase para Facebook CAPI:', {
                  orderId: purchasePayload.orderId,
                  value: purchasePayload.value,
                  eventId: purchasePayload.orderId, // ✅ Usa orderId como event_id
                  hasFbc: !!purchasePayload.fbc,
                  hasFbp: !!purchasePayload.fbp,
                  contentsCount: purchasePayload.contents?.length || 0
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
                  
                  console.log('✅✅✅ [SERVER-SIDE] Purchase disparado com sucesso para Facebook CAPI:', {
                    orderId: purchasePayload.orderId,
                    eventId: pixelResult.eventId,
                    source: 'webhook'
                  });
                } else {
                  const errorText = await pixelResponse.text();
                  console.error('❌ [SERVER-SIDE] Erro ao disparar Purchase:', errorText);
                }
              } catch (pixelError) {
                console.error('❌ [SERVER-SIDE] Erro ao disparar Purchase para Facebook Pixel:', pixelError);
              }
            } else {
              console.log('⏭️ [SERVER-SIDE] Purchase ignorado - já foi disparado anteriormente para orderId:', finalOrderId);
            }
          } else {
            console.warn('⚠️ Pedido não encontrado para orderId:', finalOrderId);
          }
        } catch (dbError) {
          console.error('❌ Erro ao processar webhook:', dbError);
        }
      } else {
        console.warn('⚠️ Supabase não configurado, pulando atualização do banco');
      }
    } else {
      // Atualizar pedido mesmo se não for PAID (pode ser mudança de status)
      if (supabase) {
        try {
          const updateData = {
            umbrella_status: status,
            umbrella_paid_at: isPaid ? (paidAt || new Date().toISOString()) : null,
            umbrella_end_to_end_id: endToEndId,
            status: isPaid ? 'pago' : 'aguardando_pagamento',
            updated_at: new Date().toISOString()
          };
          
          // Adicionar campos específicos do LxPay se necessário
          if (gateway === 'lxpay' || gateway === 'new_gateway') {
            updateData.lxpay_transaction_id = transactionId;
            updateData.lxpay_status = status;
          }
          
          const updateResult = await supabase
            .from('orders')
            .update(updateData)
            .eq('order_number', finalOrderId)
            .select()
            .single();

          if (updateResult.error) {
            console.error('❌ Erro ao atualizar pedido:', updateResult.error);
          } else {
            console.log(`💰 Pedido ${finalOrderId} atualizado via webhook do ${gateway} (status: ${status} → ${updateResult.data?.status || 'N/A'})`);
          }
        } catch (dbError) {
          console.error('❌ Erro ao atualizar pedido:', dbError);
        }
      }
    }

    // Sempre retornar sucesso para o gateway
    return res.status(200).json({
      success: true,
      received: true,
      gateway,
      transactionId,
      orderId: finalOrderId,
      status
    });

  } catch (err) {
    console.error('❌ Erro no webhook:', err);
    // Sempre retornar 200 para o UmbrellaPag
    return res.status(200).json({
      success: false,
      error: err.message || 'Erro desconhecido'
    });
  }
}

