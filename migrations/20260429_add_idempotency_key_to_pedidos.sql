-- =============================================================
-- MIGRAÇÃO: Adicionar idempotency_key à tabela pedidos
-- =============================================================
-- Objetivo: Garantir que pedidos duplicados não sejam criados
-- por falhas de rede ou cliques duplos.
-- =============================================================

-- 1. Adicionar a coluna (permitindo NULL para registros antigos)
ALTER TABLE pedidos 
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);

-- 2. Criar o índice de unicidade
-- Nota: Índices UNIQUE no PostgreSQL permitem múltiplos valores NULL,
-- o que é perfeito para registros antigos que não possuem a chave.
CREATE UNIQUE INDEX IF NOT EXISTS pedidos_idempotency_key_unique 
  ON pedidos (idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- 3. Verificação
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'pedidos' AND column_name = 'idempotency_key';
