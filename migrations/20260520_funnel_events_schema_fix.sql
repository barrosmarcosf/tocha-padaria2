-- Migration: corrige schema de funnel_events
-- 1. Adiciona coluna flag_inconsistency (estava no código mas faltava na tabela)
-- 2. Adiciona índice único (session_id, event_type) para o ON CONFLICT do upsert funcionar
-- 3. Silencia pedido orphan com stock_deduction_failed=true de 29/04 (sem estoque real perdido)

-- 1. flag_inconsistency
ALTER TABLE funnel_events
    ADD COLUMN IF NOT EXISTS flag_inconsistency BOOLEAN DEFAULT false;

-- 2. Índice único parcial: só quando session_id não é NULL
--    (permite múltiplas linhas anônimas com session_id=NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_funnel_events_session_type
    ON funnel_events (session_id, event_type)
    WHERE session_id IS NOT NULL;

-- 3. Silencia o pedido orphan 00d27bc2-8d33-466c-b653-ecb646ab3784
--    Criado em 29/04, stock_deduction_failed=true, retry esgotado, 3 semanas de alert storm.
--    Não há perda de estoque real — o ciclo de vendas de Abril já encerrou.
UPDATE pedidos
SET stock_deduction_failed = false,
    alerted_at = now()
WHERE id = '00d27bc2-8d33-466c-b653-ecb646ab3784'
  AND stock_deduction_failed = true;
