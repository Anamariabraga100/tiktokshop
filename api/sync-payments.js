// Endpoint para sincronizar pagamentos pagos no gateway que não estão no banco
// Rota: /api/sync-payments
// Lista todas as transações PAID do gateway e atualiza o banco
//
// ⚠️ IMPORTANTE: Use este endpoint para recuperar pagamentos que foram feitos
// mas não foram contabilizados antes da correção do polling

import { getOrderByTransactionId, updateOrderByTransactionId } from './lib/supabase.js';
import { supabase } from './lib/supabase.js';

const BASE_URL = 'https://api-gateway.umbrellapag.com/api';

export default async function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    // Apenas GET ou POST
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Apenas requisições GET ou POST são permitidas'
      });
    }

    const API_KEY = process.env.UMBRELLAPAG_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'UMBRELLAPAG_API_KEY não configurada'
      });
    }

    // Parâmetros opcionais
    const { 
      days = 30,  // Últimos N dias (padrão: 30)
      status = 'PAID',  // Status para buscar (padrão: PAID)
      dryRun = false,  // Se true, apenas lista sem atualizar
      limit = 100  // Limite de transações (padrão: 100)
    } = req.method === 'POST' ? req.body : req.query;

    console.log('🔄 Iniciando sincronização de pagamentos:', {
      days,
      status,
      dryRun,
      limit
    });

    // 1. Listar transações do gateway
    // Nota: A API pode não ter endpoint para listar todas, então vamos tentar
    // diferentes abordagens dependendo do que a API suporta
    
    let allTransactions = [];
    let hasMore = true;
    let page = 1;
    const maxPages = 10; // Limite de segurança

    // Tentar buscar transações pagas
    // A API pode ter diferentes endpoints, vamos tentar o mais comum
    try {
      // Endpoint comum: /user/transactions?status=PAID&limit=100
      const listUrl = `${BASE_URL}/user/transactions?status=${status}&limit=${limit}`;
      
      console.log('🔍 Consultando gateway:', listUrl);
      
      const listResponse = await fetch(listUrl, {
        method: 'GET',
        headers: {
          'x-api-key': API_KEY,
          'User-Agent': 'UMBRELLAB2B/1.0',
          'Content-Type': 'application/json'
        }
      });

      if (listResponse.ok) {
        const listData = await listResponse.json();
        const transactions = listData?.data || listData?.transactions || listData || [];
        
        if (Array.isArray(transactions)) {
          allTransactions = transactions;
          console.log(`✅ Encontradas ${transactions.length} transações no gateway`);
        } else {
          console.warn('⚠️ Resposta do gateway não é um array:', listData);
        }
      } else {
        const errorText = await listResponse.text();
        console.warn('⚠️ Não foi possível listar transações:', {
          status: listResponse.status,
          error: errorText.substring(0, 500)
        });
        
        // Se não conseguir listar, retornar instruções
        return res.status(200).json({
          success: true,
          message: 'API não suporta listagem de transações. Use o endpoint /api/manual-update-payment com transactionId específico.',
          alternative: 'Acesse o painel do UmbrellaPag para ver todas as transações pagas e use /api/manual-update-payment para cada uma',
          endpoint: '/api/manual-update-payment',
          usage: {
            method: 'POST',
            body: {
              transactionId: 'id-da-transacao-aqui'
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ Erro ao listar transações:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao consultar gateway',
        details: error.message
      });
    }

    // 2. Para cada transação PAID, verificar se está no banco e atualizar se necessário
    const results = {
      total: allTransactions.length,
      checked: 0,
      updated: 0,
      alreadyUpdated: 0,
      notInDatabase: 0,
      errors: 0,
      details: []
    };

    for (const transaction of allTransactions) {
      const transactionId = transaction.id || transaction.transactionId;
      const transactionStatus = transaction.status;
      
      if (!transactionId) {
        console.warn('⚠️ Transação sem ID:', transaction);
        continue;
      }

      // Só processar se for PAID
      if (transactionStatus !== 'PAID' && transactionStatus !== 'paid' && transactionStatus !== 'PAGO' && transactionStatus !== 'pago') {
        continue;
      }

      results.checked++;

      try {
        // Verificar se está no banco
        const order = await getOrderByTransactionId(transactionId);
        
        if (!order) {
          results.notInDatabase++;
          results.details.push({
            transactionId,
            status: 'not_in_database',
            message: 'Transação paga no gateway mas não encontrada no banco de dados',
            amount: transaction.amount,
            paidAt: transaction.paidAt || transaction.paid_at
          });
          console.warn(`⚠️ Transação ${transactionId} paga mas não está no banco`);
          continue;
        }

        // Verificar se precisa atualizar
        const currentStatus = order.umbrella_status || order.status;
        const isPaid = currentStatus === 'PAID' || currentStatus === 'paid' || currentStatus === 'pago' || currentStatus === 'PAGO';

        if (isPaid) {
          results.alreadyUpdated++;
          results.details.push({
            transactionId,
            orderNumber: order.order_number,
            status: 'already_updated',
            message: 'Já está atualizado no banco'
          });
          continue;
        }

        // Atualizar se não for dry run
        if (!dryRun) {
          const updateData = {
            umbrella_status: 'PAID',
            status: 'pago',
            umbrella_paid_at: transaction.paidAt || transaction.paid_at || new Date().toISOString(),
            umbrella_end_to_end_id: transaction.endToEndId || transaction.end_to_end_id || null,
            updated_at: new Date().toISOString()
          };

          const updatedOrder = await updateOrderByTransactionId(transactionId, updateData);

          if (updatedOrder) {
            results.updated++;
            results.details.push({
              transactionId,
              orderNumber: updatedOrder.order_number,
              status: 'updated',
              message: 'Atualizado com sucesso',
              oldStatus: currentStatus,
              newStatus: 'PAID'
            });
            console.log(`✅ Atualizado: ${transactionId} -> ${updatedOrder.order_number}`);
          } else {
            results.errors++;
            results.details.push({
              transactionId,
              status: 'update_error',
              message: 'Erro ao atualizar no banco'
            });
            console.error(`❌ Erro ao atualizar: ${transactionId}`);
          }
        } else {
          // Dry run - apenas reportar
          results.details.push({
            transactionId,
            orderNumber: order.order_number,
            status: 'would_update',
            message: 'Seria atualizado (dry run)',
            oldStatus: currentStatus
          });
        }
      } catch (error) {
        results.errors++;
        results.details.push({
          transactionId,
          status: 'error',
          message: error.message
        });
        console.error(`❌ Erro ao processar ${transactionId}:`, error);
      }
    }

    // 3. Retornar resultado
    return res.status(200).json({
      success: true,
      message: dryRun 
        ? 'Sincronização simulada (dry run). Use dryRun=false para atualizar de verdade.'
        : 'Sincronização concluída',
      summary: {
        totalTransactions: results.total,
        checked: results.checked,
        updated: results.updated,
        alreadyUpdated: results.alreadyUpdated,
        notInDatabase: results.notInDatabase,
        errors: results.errors
      },
      details: results.details,
      dryRun,
      recommendation: results.notInDatabase > 0
        ? `Encontradas ${results.notInDatabase} transações pagas no gateway que não estão no banco. Verifique se foram criadas antes do sistema estar configurado.`
        : null
    });

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro desconhecido na sincronização'
    });
  }
}

