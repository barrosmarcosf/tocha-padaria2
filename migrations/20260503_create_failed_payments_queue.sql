-- Dead Letter Queue para pagamentos que falharam no processamento
-- Permite reprocessamento automático com até 3 tentativas

CREATE TABLE IF NOT EXISTS failed_payments_queue (
    id              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id        TEXT         NOT NULL,
    mp_payment_id   TEXT,
    error_type      TEXT         NOT NULL,
    payload         JSONB,
    retries         INTEGER      NOT NULL DEFAULT 0,
    last_error      TEXT,
    created_at      TIMESTAMPTZ  DEFAULT NOW(),
    last_retry_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fpq_order_id   ON failed_payments_queue(order_id);
CREATE INDEX IF NOT EXISTS idx_fpq_retries    ON failed_payments_queue(retries);
CREATE INDEX IF NOT EXISTS idx_fpq_created_at ON failed_payments_queue(created_at);
