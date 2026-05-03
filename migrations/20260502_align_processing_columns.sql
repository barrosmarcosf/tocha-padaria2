-- ============================================================
-- MIGRATION: Alinha colunas de processamento de pagamento
-- Data: 2026-05-02
-- Propósito: Adiciona as colunas em inglês esperadas pelo backend
--            (mercadopago.js) sem tocar em nenhuma coluna existente.
--
-- SEGURO PARA EXECUTAR MÚLTIPLAS VEZES (idempotente).
-- Cole este arquivo inteiro no Supabase SQL Editor e clique em Run.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- BLOCO 1: Colunas de lock otimista e idempotência
-- ─────────────────────────────────────────────────────────────

-- Lock booleano — impede que dois cliques simultâneos processem
-- o mesmo pedido ao mesmo tempo.
ALTER TABLE pedidos
    ADD COLUMN IF NOT EXISTS processing BOOLEAN NOT NULL DEFAULT false;

-- Timestamp do momento em que o lock foi adquirido — permite
-- detectar locks presos (> 2 min) e limpá-los automaticamente.
ALTER TABLE pedidos
    ADD COLUMN IF NOT EXISTS processing_at TIMESTAMP WITH TIME ZONE;

-- UUID único por tentativa de clique — garante idempotência mesmo
-- em caso de retry antes de o pagamento terminar.
ALTER TABLE pedidos
    ADD COLUMN IF NOT EXISTS payment_attempt_id UUID;

-- NULL-safety: linhas criadas antes desta migration teriam processing=NULL
-- e quebrariam o lock (.eq('processing', false)). NOT NULL DEFAULT false
-- faz o backfill automaticamente, mas este UPDATE garante explicitamente.
UPDATE pedidos SET processing = false WHERE processing IS NULL;

-- ─────────────────────────────────────────────────────────────
-- BLOCO 2: Índice único em payment_attempt_id
-- O banco rejeita dois pagamentos com o mesmo attempt_id mesmo
-- sob race condition. NULL é permitido (campo opcional).
-- ─────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_payment_attempt_id
    ON pedidos (payment_attempt_id)
    WHERE payment_attempt_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- BLOCO 3: Função auxiliar para forçar reload do schema cache
-- do PostgREST — resolve o erro "column not found in schema cache"
-- imediatamente, sem precisar reiniciar o serviço Supabase.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_pgrst_reload()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NOTIFY pgrst, 'reload schema';
END;
$$;

-- Dispara o reload imediatamente ao aplicar esta migration
SELECT notify_pgrst_reload();

-- ─────────────────────────────────────────────────────────────
-- VERIFICAÇÃO FINAL — confirme que as 3 colunas aparecem abaixo
-- ─────────────────────────────────────────────────────────────
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'pedidos'
  AND column_name  IN ('processing', 'processing_at', 'payment_attempt_id')
ORDER BY column_name;
