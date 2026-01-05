// Vercel Serverless Function para receber webhook do UmbrellaPag
// Rota: /api/webhook-umbrellapag
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

    // Receber dados do webhook
    const { transactionId, status, paidAt, endToEndId, amount } = req.body;

    console.log('📥 Webhook recebido do UmbrellaPag:', {
      transactionId,
      status,
      paidAt,
      endToEndId,
      amount
    });

    // Validar dados obrigatórios
    if (!transactionId || !status) {
      return res.status(400).json({
        success: false,
        error: 'transactionId e status são obrigatórios'
      });
    }

    // Se o pagamento foi confirmado (PAID)
    if (status === 'PAID' || status === 'paid' || status === 'CONFIRMED') {
      console.log('✅ Pagamento confirmado! Atualizando pedido e disparando Purchase...');

      // Buscar pedido pelo transactionId
      if (supabase) {
        try {
          const { data: order, error: findError } = await supabase
            .from('orders')
            .select('*')
            .eq('umbrella_transaction_id', transactionId)
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

            // Atualizar pedido no banco
            const updateData = {
              umbrella_status: status,
              umbrella_paid_at: paidAt || new Date().toISOString(),
              umbrella_end_to_end_id: endToEndId,
              status: 'pago',
              updated_at: new Date().toISOString()
            };

            const { data: updatedOrder, error: updateError } = await supabase
              .from('orders')
              .update(updateData)
              .eq('umbrella_transaction_id', transactionId)
              .select()
              .single();

            if (updateError) {
              console.error('❌ Erro ao atualizar pedido:', updateError);
            } else {
              console.log('✅ Pedido atualizado no banco:', updatedOrder.order_number);
            }

            // Disparar evento Purchase para Facebook Pixel via API
            try {
              // Construir URL do endpoint baseado no host da requisição
              const host = req.headers.host || req.headers['x-forwarded-host'];
              const protocol = req.headers['x-forwarded-proto'] || 'https';
              const baseUrl = host ? `${protocol}://${host}` : '';
              const pixelEndpoint = `${baseUrl}/api/facebook-pixel`;
              
              // Preparar dados do cliente para Purchase
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

              console.log('📤 Disparando Purchase para Facebook Pixel:', {
                orderId: purchasePayload.orderId,
                value: purchasePayload.value
              });

              // Chamar endpoint do Facebook Pixel (serverless)
              const pixelResponse = await fetch(pixelEndpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(purchasePayload)
              });

              if (pixelResponse.ok) {
                const pixelResult = await pixelResponse.json();
                console.log('✅ Purchase disparado com sucesso:', pixelResult);
              } else {
                console.error('❌ Erro ao disparar Purchase:', await pixelResponse.text());
              }
            } catch (pixelError) {
              console.error('❌ Erro ao disparar Purchase para Facebook Pixel:', pixelError);
              // Não falhar o webhook por causa do tracking
            }
          } else {
            console.warn('⚠️ Pedido não encontrado para transactionId:', transactionId);
          }
        } catch (dbError) {
          console.error('❌ Erro ao processar webhook:', dbError);
          // Não falhar o webhook, apenas logar
        }
      } else {
        console.warn('⚠️ Supabase não configurado, pulando atualização do banco');
      }
    }

    // Sempre retornar sucesso para o UmbrellaPag
    return res.status(200).json({
      success: true,
      received: true,
      transactionId,
      status
    });

  } catch (err) {
    console.error('❌ Erro no webhook:', err);
    // Sempre retornar 200 para o UmbrellaPag (não queremos que ele tente novamente infinitamente)
    return res.status(200).json({
      success: false,
      error: err.message || 'Erro desconhecido'
    });
  }
}
