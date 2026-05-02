-- ETAPA 1: Suporte a recuperação de pagamento pendente
-- SAFE: apenas ADD COLUMN IF NOT EXISTS

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS payment_recovery_step        INTEGER                  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_last_recovery_at     TIMESTAMP WITH TIME ZONE;
