-- AL-05: Índice em pedidos(stripe_session_id)
-- Sem este índice, lookups por stripe_session_id fazem full table scan.
-- Usado em: webhook do Stripe, payment-recovery, reconciliação MP.

CREATE INDEX IF NOT EXISTS idx_pedidos_stripe_session_id
    ON pedidos (stripe_session_id)
    WHERE stripe_session_id IS NOT NULL;

-- Índice adicional em mp_payment_id (mesmo padrão de acesso)
CREATE INDEX IF NOT EXISTS idx_pedidos_mp_payment_id
    ON pedidos (mp_payment_id)
    WHERE mp_payment_id IS NOT NULL;
