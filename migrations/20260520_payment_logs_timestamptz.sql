-- M3: Corrige payment_logs.created_at de TIMESTAMP para TIMESTAMPTZ
-- Garante que timestamps são armazenados com fuso horário explícito

ALTER TABLE payment_logs
    ALTER COLUMN created_at TYPE TIMESTAMPTZ
    USING created_at AT TIME ZONE 'America/Sao_Paulo';

-- Garante que o default também usa TIMESTAMPTZ
ALTER TABLE payment_logs
    ALTER COLUMN created_at SET DEFAULT NOW();
