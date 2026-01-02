-- Script para verificar se os campos do UmbrellaPag foram criados
-- Execute este SQL no Supabase para confirmar

-- Verificar campos da tabela orders
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name LIKE 'umbrella%'
ORDER BY column_name;

-- Verificar índices relacionados
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'orders'
  AND indexname LIKE '%umbrella%';

