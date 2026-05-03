-- ============================================================
-- Adiciona processing_at (necessário para stale-lock cleanup)
-- e índice único em payment_attempt_id (idempotência por clique)
-- Seguro para executar múltiplas vezes (IF NOT EXISTS / IF NOT EXISTS)
-- ============================================================

-- 1. Coluna que registra quando o lock foi adquirido
ALTER TABLE pedidos
    ADD COLUMN IF NOT EXISTS processing_at TIMESTAMP WITH TIME ZONE;

-- 2. Índice único em payment_attempt_id: garante que o banco rejeite
--    dois pagamentos com o mesmo attempt_id mesmo em race condition.
--    NULL é permitido (attempt_id é opcional) — índices UNIQUE ignoram NULLs no PG.
CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_payment_attempt_id
    ON pedidos (payment_attempt_id)
    WHERE payment_attempt_id IS NOT NULL;

-- Verificação
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'pedidos'
  AND column_name  IN ('processing', 'processing_at', 'payment_attempt_id')
ORDER BY column_name;
