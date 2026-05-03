-- ============================================================
-- MIGRATION CRÍTICA: Adiciona mp_payment_id à tabela pedidos
-- Data: 2026-05-03
--
-- PROBLEMA: Sem esta coluna, o sistema não consegue:
--   1. Salvar o ID do pagamento MP após aprovação
--   2. Marcar o pedido como 'paid' (processPaidMPOrder falha)
--   3. Detectar idempotência (checkIdempotentAttempt sempre null)
--   4. Rejeitar pagamentos duplicados via UNIQUE constraint
--
-- APLIQUE NO SUPABASE SQL EDITOR:
-- https://supabase.com/dashboard/project/vrdepnjtodhdwhonviui/sql/new
--
-- SEGURO PARA EXECUTAR MÚLTIPLAS VEZES (idempotente).
-- ============================================================

-- Coluna que guarda o payment.id do Mercado Pago
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;

-- Coluna que guarda o payment_intent do Stripe (complementar)
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;

-- Índice UNIQUE parcial: NULLs permitidos, valores preenchidos únicos.
-- Impede registro duplicado do mesmo pagamento MP — race condition resolvida pelo DB.
CREATE UNIQUE INDEX IF NOT EXISTS pedidos_mp_payment_id_unique
  ON pedidos (mp_payment_id)
  WHERE mp_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS pedidos_stripe_payment_intent_unique
  ON pedidos (stripe_payment_intent)
  WHERE stripe_payment_intent IS NOT NULL;

-- Recarrega schema cache do PostgREST imediatamente
SELECT notify_pgrst_reload();

-- Verificação: confirme que as colunas aparecem abaixo
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'pedidos'
  AND column_name  IN ('mp_payment_id', 'stripe_payment_intent')
ORDER BY column_name;
