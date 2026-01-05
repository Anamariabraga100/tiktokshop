// Vercel Serverless Function para receber webhook do UmbrellaPag
// Rota: /api/webhook
// ESM PURO - package.json tem "type": "module"

import { supabase } from './lib/supabase.js';

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

    console.log('📥 Webhook recebido do UmbrellaPag:', JSON.stringify(body, null, 2));

    const data = body?.data;

    // Webhook sem payload útil
    if (!data || !data.id) {
      console.warn('⚠️ Webhook recebido sem data válida');
      return res.status(200).json({ success: true });
    }

    const transactionId = data.id;
    const status = data.status;
    const paidAt = data.paidAt;
    const endToEndId = data.endToEndId;
    const amount = data.amount;

    // metadata vem como string JSON
    let metadata = {};
    try {
      metadata = JSON.parse(data.metadata || '{}');
    } catch (err) {
      console.warn('⚠️ Falha ao parsear metadata:', data.metadata);
    }

    const orderId = metadata.orderId;

    console.log('📦 Dados normalizados do webhook:', {
      transactionId,
      status,
      paidAt,
      endToEndId,
      amount,
      orderId
    });

    // Se não tiver orderId, não tem como vincular
    if (!orderId) {
      console.warn('⚠️ Webhook sem orderId no metadata');
      return res.status(200).json({ success: true });
    }

    // Se o pagamento foi confirmado (PAID)
    if (status === 'PAID' || status === 'paid' || status === 'CONFIRMED') {
      console.log('✅ Pagamento confirmado! Atualizando pedido e disparando Purchase...');

      // Buscar pedido pelo orderId (chave primária lógica)
      if (supabase) {
        try {
          const { data: order, error: findError } = await supabase
            .from('orders')
            .select('*')
            .eq('order_number', orderId)
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
              console.log('⏭️ [SERVER-SIDE] Purchase já foi disparado anteriormente para orderId:', orderId);
            }

            // Atualizar pedido no banco
            const updateData = {
              umbrella_status: status,
              umbrella_paid_at: paidAt || new Date().toISOString(),
              umbrella_end_to_end_id: endToEndId,
              status: status === 'paid' || status === 'PAID' ? 'pago' : 'aguardando_pagamento',
              updated_at: new Date().toISOString()
            };

            const { data: updatedOrder, error: updateError } = await supabase
              .from('orders')
              .update(updateData)
              .eq('order_number', orderId)
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
                  eventId: purchasePayload.orderId // ✅ Usa orderId como event_id
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
              console.log('⏭️ [SERVER-SIDE] Purchase ignorado - já foi disparado anteriormente para orderId:', orderId);
            }
          } else {
            console.warn('⚠️ Pedido não encontrado para orderId:', orderId);
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
          await supabase
            .from('orders')
            .update({
              umbrella_status: status,
              umbrella_paid_at: status === 'paid' || status === 'PAID' ? (paidAt || new Date().toISOString()) : null,
              umbrella_end_to_end_id: endToEndId,
              status: status === 'paid' || status === 'PAID' ? 'pago' : 'aguardando_pagamento',
              updated_at: new Date().toISOString()
            })
            .eq('order_number', orderId);

          console.log(`💰 Pedido ${orderId} atualizado via webhook (status: ${status})`);
        } catch (dbError) {
          console.error('❌ Erro ao atualizar pedido:', dbError);
        }
      }
    }

    // Sempre retornar sucesso para o UmbrellaPag
    return res.status(200).json({
      success: true,
      received: true,
      transactionId,
      orderId,
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

