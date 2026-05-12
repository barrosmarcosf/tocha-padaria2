-- Rastreamento de estornos, rejeições e histórico de tentativas de pagamento
-- Substitui contagem de "locks presos" por métricas reais de operadoras

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS refund_status       TEXT,           -- 'refunded', 'partially_refunded', 'chargeback'
  ADD COLUMN IF NOT EXISTS refund_amount        DECIMAL,        -- valor estornado
  ADD COLUMN IF NOT EXISTS refund_reason        TEXT,           -- motivo do estorno
  ADD COLUMN IF NOT EXISTS refund_at            TIMESTAMPTZ,    -- quando o estorno ocorreu
  ADD COLUMN IF NOT EXISTS rejection_reason     TEXT,           -- categoria normalizada (saldo_insuficiente, etc)
  ADD COLUMN IF NOT EXISTS rejection_raw_code   TEXT,           -- código bruto da operadora
  ADD COLUMN IF NOT EXISTS payment_attempts     JSONB DEFAULT '[]'::jsonb;
  -- payment_attempts: array de { status, provider, method, reason, raw_code, created_at }

-- Índices para queries de analytics eficientes
CREATE INDEX IF NOT EXISTS idx_pedidos_refund_status
    ON pedidos (refund_status)
    WHERE refund_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pedidos_rejection_reason
    ON pedidos (rejection_reason)
    WHERE rejection_reason IS NOT NULL;

-- Notifica o PostgREST para recarregar o schema cache
SELECT notify_pgrst_reload();
