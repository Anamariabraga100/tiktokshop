-- Script para atualizar a tabela orders existente com novos campos do UmbrellaPag
-- Execute este SQL se você já criou a tabela orders anteriormente
-- Este script é seguro para executar múltiplas vezes (idempotente)

-- Adicionar novos campos (se não existirem)
DO $$ 
BEGIN
  -- Adicionar campos do UmbrellaPag se não existirem
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

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_orders_umbrella_transaction_id ON orders(umbrella_transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_umbrella_status ON orders(umbrella_status);
