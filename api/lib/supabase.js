// Funções auxiliares do Supabase para uso nos endpoints serverless
// ESM PURO - package.json tem "type": "module"

import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas nos endpoints serverless.');
}

// Criar cliente do Supabase
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Busca um pedido pelo transactionId do UmbrellaPag
 */
export const getOrderByTransactionId = async (transactionId) => {
  try {
    if (!supabase || !transactionId) {
      return null;
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('umbrella_transaction_id', transactionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Pedido não encontrado
        return null;
      }
      console.error('❌ Erro ao buscar pedido por transactionId:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar pedido por transactionId:', error);
    return null;
  }
};

/**
 * Atualiza um pedido pelo transactionId do UmbrellaPag
 */
export const updateOrderByTransactionId = async (transactionId, updates) => {
  try {
    if (!supabase) {
      console.error('❌ Supabase não configurado');
      return null;
    }
    
    if (!transactionId) {
      console.error('❌ transactionId não fornecido');
      return null;
    }

    console.log('🔄 Atualizando pedido no banco:', {
      transactionId: transactionId.substring(0, 8) + '...',
      updates: {
        ...updates,
        // Não logar dados sensíveis
        umbrella_paid_at: updates.umbrella_paid_at ? 'definido' : 'não definido',
        umbrella_end_to_end_id: updates.umbrella_end_to_end_id ? 'definido' : 'não definido'
      }
    });

    const { data, error } = await supabase
      .from('orders')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('umbrella_transaction_id', transactionId)
      .select()
      .single();

    if (error) {
      console.error('❌❌❌ ERRO AO ATUALIZAR PEDIDO NO BANCO ❌❌❌');
      console.error('📋 Detalhes do erro:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        transactionId: transactionId.substring(0, 8) + '...'
      });
      return null;
    }

    if (!data) {
      console.warn('⚠️ Atualização retornou null - pedido pode não existir');
      return null;
    }

    console.log('✅ Pedido atualizado com sucesso:', {
      orderNumber: data.order_number,
      umbrellaStatus: data.umbrella_status,
      status: data.status,
      paidAt: data.umbrella_paid_at
    });

    return data;
  } catch (error) {
    console.error('❌❌❌ EXCEÇÃO AO ATUALIZAR PEDIDO ❌❌❌');
    console.error('📋 Detalhes da exceção:', {
      message: error.message,
      stack: error.stack,
      transactionId: transactionId?.substring(0, 8) + '...'
    });
    return null;
  }
};



