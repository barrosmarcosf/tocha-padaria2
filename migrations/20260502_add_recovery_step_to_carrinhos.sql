-- ETAPA 1: Suporte a multi-step recovery no carrinho
-- SAFE: apenas ADD COLUMN IF NOT EXISTS
-- NÃO remove recovery_sent nem recovery_token (backward compat)

ALTER TABLE carrinhos
  ADD COLUMN IF NOT EXISTS recovery_step        INTEGER                  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_recovery_at     TIMESTAMP WITH TIME ZONE;
