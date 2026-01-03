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
    if (!supabase || !transactionId) {
      return null;
    }

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
      console.error('❌ Erro ao atualizar pedido por transactionId:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Erro ao atualizar pedido por transactionId:', error);
    return null;
  }
};

