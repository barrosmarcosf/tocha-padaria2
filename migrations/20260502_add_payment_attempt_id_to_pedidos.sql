-- Adiciona campo de idempotência por tentativa de pagamento.
-- Permite detectar retry do mesmo clique sem bloquear novas tentativas legítimas.
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS payment_attempt_id UUID;
