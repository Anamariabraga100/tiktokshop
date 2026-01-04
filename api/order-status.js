// Endpoint para consultar status de um pedido
// Rota: /api/order-status
// ESM PURO - package.json tem "type": "module"
// 
// ⚠️ IMPORTANTE: Banco de dados é a fonte da verdade
// Consulta banco primeiro, só usa UmbrellaPag como fallback

import { getOrderByTransactionId } from './lib/supabase.js';

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

    // Obter transactionId ou externalRef da query
    const { transactionId, externalRef } = req.query;

    if (!transactionId && !externalRef) {
      return res.status(400).json({
        success: false,
        error: 'transactionId ou externalRef é obrigatório'
      });
    }

    // ⚠️ PRIORIDADE 1: Consultar banco de dados (fonte da verdade)
    if (transactionId) {
      console.log('🔍 Consultando banco de dados para transactionId:', transactionId);
      const order = await getOrderByTransactionId(transactionId);

      if (order) {
        console.log('✅ Pedido encontrado no banco:', {
          orderNumber: order.order_number,
          umbrellaStatus: order.umbrella_status,
          status: order.status
        });

        // ⚠️ CRÍTICO: Sempre verificar gateway quando status no banco é WAITING_PAYMENT
        // Isso garante que mesmo se o webhook falhar, o polling detecta o pagamento
        const dbStatus = order.umbrella_status || order.status;
        const isWaitingPayment = dbStatus === 'WAITING_PAYMENT' || 
                                 dbStatus === 'waiting_payment' || 
                                 dbStatus === 'aguardando_pagamento' ||
                                 dbStatus === 'WAITING' ||
                                 !dbStatus;

        // ⚠️ SEMPRE verificar gateway se está aguardando pagamento
        // Isso é crítico porque o webhook pode não ser chamado
        if (isWaitingPayment) {
          try {
            const API_KEY = process.env.UMBRELLAPAG_API_KEY;
            if (API_KEY) {
              console.log('🔍 Verificando gateway para transactionId:', transactionId);
              
              console.log('🔍 Consultando gateway UmbrellaPag:', {
                url: `${BASE_URL}/user/transactions/${transactionId}`,
                transactionId: transactionId.substring(0, 8) + '...',
                hasApiKey: !!API_KEY
              });

              const gatewayResponse = await fetch(`${BASE_URL}/user/transactions/${transactionId}`, {
                method: 'GET',
                headers: {
                  'x-api-key': API_KEY,
                  'User-Agent': 'UMBRELLAB2B/1.0',
                  'Content-Type': 'application/json'
                }
              });

              console.log('📥 Resposta do gateway:', {
                status: gatewayResponse.status,
                statusText: gatewayResponse.statusText,
                ok: gatewayResponse.ok,
                headers: Object.fromEntries(gatewayResponse.headers.entries())
              });

              if (gatewayResponse.ok) {
                const responseText = await gatewayResponse.text();
                console.log('📋 Resposta raw do gateway:', responseText.substring(0, 500));
                
                let gatewayData;
                try {
                  gatewayData = JSON.parse(responseText);
                } catch (parseError) {
                  console.error('❌ Erro ao parsear resposta do gateway:', parseError);
                  console.error('📋 Resposta completa:', responseText);
                  throw new Error('Resposta do gateway não é JSON válido');
                }

                console.log('📊 Dados parseados do gateway:', JSON.stringify(gatewayData, null, 2));

                // A resposta pode vir em diferentes formatos:
                // 1. { data: { ... } }
                // 2. { transaction: { ... } }
                // 3. { ... } (dados diretos)
                const gatewayTransaction = gatewayData?.data || 
                                          gatewayData?.transaction || 
                                          gatewayData;
                
                const gatewayStatus = gatewayTransaction?.status || 
                                     gatewayTransaction?.transactionStatus ||
                                     gatewayData?.status;

                console.log('📊 Status do gateway:', {
                  transactionId: transactionId.substring(0, 8) + '...',
                  gatewayStatus,
                  dbStatus,
                  paidAt: gatewayTransaction?.paidAt || gatewayTransaction?.paid_at,
                  endToEndId: gatewayTransaction?.endToEndId || gatewayTransaction?.end_to_end_id,
                  transactionData: {
                    id: gatewayTransaction?.id || gatewayTransaction?.transactionId,
                    amount: gatewayTransaction?.amount,
                    paymentMethod: gatewayTransaction?.paymentMethod
                  }
                });

                // ⚠️ CRÍTICO: Se gateway mostra PAID mas banco não, atualizar banco automaticamente
                // Verificar diferentes variações de status PAID
                const isGatewayPaid = gatewayStatus === 'PAID' || 
                                     gatewayStatus === 'paid' || 
                                     gatewayStatus === 'PAGO' ||
                                     gatewayStatus === 'pago' ||
                                     gatewayStatus === 'CONFIRMED' ||
                                     gatewayStatus === 'confirmed';
                
                const isDbPaid = dbStatus === 'PAID' || 
                                dbStatus === 'paid' || 
                                dbStatus === 'pago' ||
                                dbStatus === 'PAGO';

                if (isGatewayPaid && !isDbPaid) {
                  console.log('🔄 ⚠️⚠️⚠️ GATEWAY MOSTRA PAID MAS BANCO NÃO - ATUALIZANDO BANCO ⚠️⚠️⚠️');
                  console.log('📝 Dados do gateway:', {
                    gatewayStatus,
                    dbStatus,
                    paidAt: gatewayTransaction?.paidAt || gatewayTransaction?.paid_at,
                    endToEndId: gatewayTransaction?.endToEndId || gatewayTransaction?.end_to_end_id,
                    transactionId: gatewayTransaction?.id || gatewayTransaction?.transactionId
                  });
                  
                  const { updateOrderByTransactionId } = await import('./lib/supabase.js');
                  const paidAtValue = gatewayTransaction?.paidAt || 
                                     gatewayTransaction?.paid_at || 
                                     gatewayTransaction?.paidAtDate ||
                                     new Date().toISOString();
                  
                  const updateResult = await updateOrderByTransactionId(transactionId, {
                    umbrella_status: 'PAID',
                    status: 'pago',
                    umbrella_paid_at: paidAtValue,
                    umbrella_end_to_end_id: gatewayTransaction?.endToEndId || 
                                         gatewayTransaction?.end_to_end_id || 
                                         gatewayTransaction?.endToEnd ||
                                         null,
                    updated_at: new Date().toISOString()
                  });

                  if (updateResult) {
                    console.log('✅✅✅ BANCO ATUALIZADO COM SUCESSO PELO POLLING ✅✅✅');
                    console.log('📋 Pedido atualizado:', {
                      orderNumber: updateResult.order_number,
                      newStatus: updateResult.umbrella_status,
                      paidAt: updateResult.umbrella_paid_at,
                      endToEndId: updateResult.umbrella_end_to_end_id
                    });
                  } else {
                    console.error('❌❌❌ ERRO AO ATUALIZAR BANCO - updateResult é null ❌❌❌');
                    // Mesmo assim, retornar PAID para o frontend detectar
                  }
                  
                  // Retornar status atualizado
                  return res.status(200).json({
                    success: true,
                    status: 200,
                    transactionId: order.umbrella_transaction_id,
                    externalRef: order.umbrella_external_ref,
                    orderNumber: order.order_number,
                    status: 'PAID',
                    amount: order.total_price,
                    paidAt: paidAtValue,
                    source: 'database_updated_by_polling', // Indica que foi atualizado pelo polling
                    pix: {
                      qrCode: order.umbrella_qr_code || order.pix_code,
                    }
                  });
                } else if (isGatewayPaid && isDbPaid) {
                  // Gateway mostra PAID e banco também - retornar PAID
                  console.log('✅ Gateway e banco ambos mostram PAID');
                  return res.status(200).json({
                    success: true,
                    status: 200,
                    transactionId: order.umbrella_transaction_id,
                    externalRef: order.umbrella_external_ref,
                    orderNumber: order.order_number,
                    status: 'PAID',
                    amount: order.total_price,
                    paidAt: order.umbrella_paid_at || gatewayTransaction?.paidAt || gatewayTransaction?.paid_at || new Date().toISOString(),
                    source: 'database',
                    pix: {
                      qrCode: order.umbrella_qr_code || order.pix_code,
                    }
                  });
                } else {
                  // Gateway ainda mostra WAITING_PAYMENT
                  console.log('⏳ Gateway ainda mostra:', gatewayStatus);
                }
              } else {
                // Tentar ler a resposta mesmo em caso de erro
                const errorText = await gatewayResponse.text().catch(() => 'Não foi possível ler resposta');
                console.error('❌❌❌ ERRO AO CONSULTAR GATEWAY ❌❌❌');
                console.error('📋 Detalhes do erro:', {
                  status: gatewayResponse.status,
                  statusText: gatewayResponse.statusText,
                  responseText: errorText.substring(0, 500),
                  transactionId: transactionId.substring(0, 8) + '...'
                });
              }
            } else {
              console.warn('⚠️ UMBRELLAPAG_API_KEY não configurada, não é possível verificar gateway');
            }
          } catch (error) {
            console.error('❌ Erro ao verificar gateway durante polling:', error);
            // Continuar com status do banco se houver erro
          }
        }

        // Usar status do banco (atualizado pelo webhook ou polling)
        // Mapear status do banco para formato esperado pelo frontend
        let finalStatus = order.umbrella_status || order.status;
        
        // Normalizar status
        if (finalStatus === 'PAID' || finalStatus === 'paid' || finalStatus === 'pago') {
          finalStatus = 'PAID';
        } else if (finalStatus === 'WAITING_PAYMENT' || finalStatus === 'waiting_payment' || finalStatus === 'aguardando_pagamento') {
          finalStatus = 'WAITING_PAYMENT';
        } else if (finalStatus === 'EXPIRED' || finalStatus === 'expired' || finalStatus === 'expirado') {
          finalStatus = 'EXPIRED';
        }

        return res.status(200).json({
          success: true,
          status: 200,
          transactionId: order.umbrella_transaction_id,
          externalRef: order.umbrella_external_ref,
          orderNumber: order.order_number,
          status: finalStatus, // Status do banco (fonte da verdade)
          amount: order.total_price,
          paidAt: order.umbrella_paid_at,
          source: 'database', // Indica que veio do banco
          pix: {
            qrCode: order.umbrella_qr_code || order.pix_code,
          }
        });
      }

      console.log('⚠️ Pedido não encontrado no banco, consultando UmbrellaPag como fallback');
    }

    // ⚠️ FALLBACK: Se não encontrou no banco, consultar UmbrellaPag
    // Isso pode acontecer se o pedido ainda não foi salvo ou se o banco não está configurado
    const API_KEY = process.env.UMBRELLAPAG_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'UMBRELLAPAG_API_KEY não configurada e pedido não encontrado no banco'
      });
    }

    let endpoint;
    if (transactionId) {
      endpoint = `${BASE_URL}/user/transactions/${transactionId}`;
    } else {
      endpoint = `${BASE_URL}/user/transactions?externalRef=${externalRef}`;
    }

    console.log('🔍 Consultando gateway (fallback):', {
      endpoint,
      transactionId: transactionId?.substring(0, 8) + '...' || 'não fornecido',
      externalRef: externalRef || 'não fornecido'
    });

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'User-Agent': 'UMBRELLAB2B/1.0',
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Resposta do gateway (fallback):', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    const text = await response.text();
    console.log('📋 Resposta raw (fallback):', text.substring(0, 500));
    
    let data;
    try {
      data = JSON.parse(text);
      console.log('📊 Dados parseados (fallback):', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('❌ Erro ao parsear resposta (fallback):', parseError);
      data = { raw: text.substring(0, 500) };
    }

    if (!response.ok) {
      console.error('❌ Gateway retornou erro:', {
        status: response.status,
        data
      });
      return res.status(response.status).json({
        success: false,
        status: response.status,
        error: data?.message || data?.error || 'Erro ao consultar status',
        data
      });
    }

    // Extrair dados da transação (pode vir em diferentes formatos)
    const transactionData = data?.data || 
                           data?.transaction || 
                           data;
    
    console.log('📊 Dados da transação extraídos:', {
      id: transactionData?.id || transactionData?.transactionId,
      status: transactionData?.status,
      amount: transactionData?.amount,
      paidAt: transactionData?.paidAt || transactionData?.paid_at
    });
    
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
      source: 'gateway', // Indica que veio do gateway (fallback)
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

