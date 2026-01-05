import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente do Supabase (usar process.env para serverless)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// Criar cliente do Supabase (retorna null se não configurado)
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn('⚠️ Supabase não configurado. Pedidos não serão salvos no banco de dados.');
}
