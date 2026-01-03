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

        // ⚠️ MELHORIA: Se status no banco é WAITING_PAYMENT, verificar gateway também
        // Isso garante que mesmo se o webhook falhar, o polling detecta o pagamento
        const dbStatus = order.umbrella_status || order.status;
        const isWaitingPayment = dbStatus === 'WAITING_PAYMENT' || 
                                 dbStatus === 'waiting_payment' || 
                                 dbStatus === 'aguardando_pagamento';

        // Se está aguardando pagamento, verificar gateway em paralelo
        if (isWaitingPayment) {
          try {
            const API_KEY = process.env.UMBRELLAPAG_API_KEY;
            if (API_KEY) {
              const gatewayResponse = await fetch(`${BASE_URL}/user/transactions/${transactionId}`, {
                method: 'GET',
                headers: {
                  'x-api-key': API_KEY,
                  'User-Agent': 'UMBRELLAB2B/1.0',
                  'Content-Type': 'application/json'
                }
              });

              if (gatewayResponse.ok) {
                const gatewayData = await gatewayResponse.json();
                const gatewayTransaction = gatewayData?.data || gatewayData;
                const gatewayStatus = gatewayTransaction?.status;

                // Se gateway mostra PAID mas banco não, atualizar banco automaticamente
                if (gatewayStatus === 'PAID' && dbStatus !== 'PAID') {
                  console.log('🔄 Gateway mostra PAID mas banco não. Atualizando banco automaticamente...');
                  
                  const { updateOrderByTransactionId } = await import('./lib/supabase.js');
                  await updateOrderByTransactionId(transactionId, {
                    umbrella_status: 'PAID',
                    status: 'pago',
                    umbrella_paid_at: gatewayTransaction?.paidAt || new Date().toISOString(),
                    umbrella_end_to_end_id: gatewayTransaction?.endToEndId || null,
                    updated_at: new Date().toISOString()
                  });

                  console.log('✅ Banco atualizado automaticamente pelo polling');
                  
                  // Retornar status atualizado
                  return res.status(200).json({
                    success: true,
                    status: 200,
                    transactionId: order.umbrella_transaction_id,
                    externalRef: order.umbrella_external_ref,
                    orderNumber: order.order_number,
                    status: 'PAID',
                    amount: order.total_price,
                    paidAt: gatewayTransaction?.paidAt || new Date().toISOString(),
                    source: 'database_updated_by_polling', // Indica que foi atualizado pelo polling
                    pix: {
                      qrCode: order.umbrella_qr_code || order.pix_code,
                    }
                  });
                }
              }
            }
          } catch (error) {
            console.warn('⚠️ Erro ao verificar gateway durante polling:', error);
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

