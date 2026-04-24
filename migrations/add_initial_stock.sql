-- =============================================================
-- MIGRAÇÃO: Adicionar coluna initial_stock à tabela produtos
-- =============================================================
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/vrdepnjtodhdwhonviui/sql/new
-- =============================================================

ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS initial_stock INTEGER DEFAULT 0;

-- Preenche initial_stock com o valor atual de stock_quantity
-- para todos os produtos que ainda não têm um valor base definido
UPDATE produtos
SET initial_stock = stock_quantity
WHERE initial_stock = 0 OR initial_stock IS NULL;

-- Confirma que as colunas existem
SELECT id, name, initial_stock, stock_quantity
FROM produtos
ORDER BY display_order
LIMIT 20;
