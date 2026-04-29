-- =============================================================
-- MIGRAÇÃO: Idempotência de pagamentos (Stripe + Mercado Pago)
-- =============================================================
-- Execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/vrdepnjtodhdwhonviui/sql/new
-- =============================================================

-- Guarda o payment.id do Mercado Pago — impede duplicação no nível do banco
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS mp_payment_id text;

-- Guarda o payment_intent do Stripe — impede duplicação no nível do banco
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS stripe_payment_intent text;

-- Índices UNIQUE parciais: múltiplos NULLs permitidos (pedidos sem MP ou sem Stripe)
-- mas valores preenchidos são garantidamente únicos
CREATE UNIQUE INDEX IF NOT EXISTS pedidos_mp_payment_id_unique
  ON pedidos (mp_payment_id)
  WHERE mp_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS pedidos_stripe_payment_intent_unique
  ON pedidos (stripe_payment_intent)
  WHERE stripe_payment_intent IS NOT NULL;

-- Confirma resultado
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pedidos'
  AND column_name IN ('mp_payment_id', 'stripe_payment_intent')
ORDER BY column_name;
