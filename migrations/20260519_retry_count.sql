-- Migration: 20260519_retry_count
-- Adiciona controle de tentativas de re-dedução de estoque.
-- retry_count: incrementado a cada falha do worker retryStockDeduction.
-- Worker para após 3 tentativas e dispara systemAlert STOCK_RETRY_EXHAUSTED.

ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
