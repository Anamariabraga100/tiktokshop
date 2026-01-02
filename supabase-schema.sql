-- Schema do banco de dados Supabase para a loja
-- Execute este SQL no SQL Editor do Supabase

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por CPF
CREATE INDEX IF NOT EXISTS idx_customers_cpf ON customers(cpf);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_cpf TEXT NOT NULL REFERENCES customers(cpf) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  pix_code TEXT,
  status TEXT NOT NULL DEFAULT 'em_preparacao',
  -- Campos da transação UmbrellaPag
  umbrella_transaction_id TEXT,
  umbrella_status TEXT,
  umbrella_qr_code TEXT,
  umbrella_external_ref TEXT,
  umbrella_end_to_end_id TEXT,
  umbrella_paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar campos do UmbrellaPag se a tabela já existir sem eles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='umbrella_transaction_id') THEN
    ALTER TABLE orders ADD COLUMN umbrella_transaction_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='umbrella_status') THEN
    ALTER TABLE orders ADD COLUMN umbrella_status TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='umbrella_qr_code') THEN
    ALTER TABLE orders ADD COLUMN umbrella_qr_code TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='umbrella_external_ref') THEN
    ALTER TABLE orders ADD COLUMN umbrella_external_ref TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='umbrella_end_to_end_id') THEN
    ALTER TABLE orders ADD COLUMN umbrella_end_to_end_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='umbrella_paid_at') THEN
    ALTER TABLE orders ADD COLUMN umbrella_paid_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Índices para busca rápida (só cria se as colunas existirem)
CREATE INDEX IF NOT EXISTS idx_orders_customer_cpf ON orders(customer_cpf);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_umbrella_transaction_id ON orders(umbrella_transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_umbrella_status ON orders(umbrella_status);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
-- Remover triggers existentes antes de criar (evita erro se já existirem)
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Políticas de segurança (RLS - Row Level Security)
-- Habilitar RLS nas tabelas
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura e escrita pública (ajuste conforme necessário)
-- ATENÇÃO: Para produção, você deve criar políticas mais restritivas
-- Remover políticas existentes antes de criar (evita erro se já existirem)
DROP POLICY IF EXISTS "Permitir leitura e escrita pública em customers" ON customers;
DROP POLICY IF EXISTS "Permitir leitura e escrita pública em orders" ON orders;

CREATE POLICY "Permitir leitura e escrita pública em customers"
  ON customers
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir leitura e escrita pública em orders"
  ON orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comentários nas tabelas
COMMENT ON TABLE customers IS 'Armazena informações dos clientes da loja';
COMMENT ON TABLE orders IS 'Armazena os pedidos realizados pelos clientes';

