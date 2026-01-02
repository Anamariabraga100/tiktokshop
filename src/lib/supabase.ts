import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas. Algumas funcionalidades podem não funcionar.');
}

// Criar cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para as tabelas do Supabase
export interface CustomerRow {
  id?: string;
  cpf: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    cep: string;
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface OrderRow {
  id?: string;
  order_number: string;
  customer_cpf: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    selectedSize?: string;
    selectedColor?: string;
  }>;
  total_price: number;
  payment_method: string;
  pix_code?: string;
  status: string;
  // Campos da transação UmbrellaPag
  umbrella_transaction_id?: string;
  umbrella_status?: string;
  umbrella_qr_code?: string;
  umbrella_external_ref?: string;
  umbrella_end_to_end_id?: string;
  umbrella_paid_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Funções auxiliares para trabalhar com o Supabase

/**
 * Salva ou atualiza dados do cliente no Supabase
 */
export const saveCustomerToSupabase = async (customerData: CustomerRow): Promise<CustomerRow | null> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase não configurado. Dados serão salvos apenas no localStorage.');
      return null;
    }

    const { data, error } = await supabase
      .from('customers')
      .upsert({
        cpf: customerData.cpf.replace(/\D/g, ''), // Remove formatação
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'cpf',
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar cliente no Supabase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao salvar cliente no Supabase:', error);
    return null;
  }
};

/**
 * Busca dados do cliente pelo CPF
 */
export const getCustomerFromSupabase = async (cpf: string): Promise<CustomerRow | null> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    const normalizedCPF = cpf.replace(/\D/g, '');
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('cpf', normalizedCPF)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Cliente não encontrado
        return null;
      }
      console.error('Erro ao buscar cliente no Supabase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar cliente no Supabase:', error);
    return null;
  }
};

/**
 * Salva um pedido no Supabase
 */
export const saveOrderToSupabase = async (orderData: OrderRow): Promise<OrderRow | null> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase não configurado. Pedido será salvo apenas no localStorage.');
      return null;
    }

    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderData.order_number,
        customer_cpf: orderData.customer_cpf.replace(/\D/g, ''), // Remove formatação
        items: orderData.items,
        total_price: orderData.total_price,
        payment_method: orderData.payment_method,
        pix_code: orderData.pix_code,
        status: orderData.status,
        umbrella_transaction_id: orderData.umbrella_transaction_id,
        umbrella_status: orderData.umbrella_status,
        umbrella_qr_code: orderData.umbrella_qr_code,
        umbrella_external_ref: orderData.umbrella_external_ref,
        umbrella_end_to_end_id: orderData.umbrella_end_to_end_id,
        umbrella_paid_at: orderData.umbrella_paid_at,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar pedido no Supabase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao salvar pedido no Supabase:', error);
    return null;
  }
};

/**
 * Atualiza um pedido existente no Supabase
 */
export const updateOrderInSupabase = async (
  orderNumber: string,
  updates: Partial<OrderRow>
): Promise<OrderRow | null> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('order_number', orderNumber)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar pedido no Supabase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar pedido no Supabase:', error);
    return null;
  }
};

/**
 * Busca pedidos de um cliente pelo CPF
 */
export const getOrdersFromSupabase = async (cpf: string): Promise<OrderRow[]> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return [];
    }

    const normalizedCPF = cpf.replace(/\D/g, '');
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_cpf', normalizedCPF)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pedidos no Supabase:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pedidos no Supabase:', error);
    return [];
  }
};

