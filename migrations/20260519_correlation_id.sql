-- Migration: 20260519_correlation_id
-- Adiciona correlation_id para rastreamento ponta-a-ponta de pedidos.
-- Permite correlacionar checkout → Stripe/MP → webhook → estoque nos logs.

ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS correlation_id TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_pedidos_correlation_id
ON pedidos(correlation_id);
