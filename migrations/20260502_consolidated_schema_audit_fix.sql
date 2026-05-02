-- ============================================================
-- MIGRATION CONSOLIDADA DE AUDITORIA E CORREÇÃO DE SCHEMA
-- Data: 2026-05-02
-- Propósito: Aplica todas as correções críticas de schema de forma
-- idempotente. Seguro para executar múltiplas vezes.
-- ============================================================
-- COMO USAR: Cole este arquivo inteiro no SQL Editor do Supabase.
-- ============================================================

-- ─────────────────────────────────────────────────────────
-- BLOCO 1: carrinhos.customer_id — garantir UUID
-- ─────────────────────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'carrinhos'
          AND column_name  = 'customer_id'
          AND data_type    = 'bigint'
    ) THEN
        ALTER TABLE carrinhos DROP CONSTRAINT IF EXISTS carrinhos_customer_id_fkey;
        UPDATE carrinhos SET customer_id = NULL;
        ALTER TABLE carrinhos
            ALTER COLUMN customer_id TYPE UUID
            USING NULL::uuid;
        RAISE NOTICE '[FIX] carrinhos.customer_id: BIGINT → UUID';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'carrinhos'
          AND column_name  = 'customer_id'
    ) THEN
        ALTER TABLE carrinhos ADD COLUMN customer_id UUID;
        RAISE NOTICE '[FIX] carrinhos.customer_id: criado como UUID';
    ELSE
        RAISE NOTICE '[OK]  carrinhos.customer_id já é UUID';
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────
-- BLOCO 2: carrinhos.order_id — garantir UUID
-- ─────────────────────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'carrinhos'
          AND column_name  = 'order_id'
          AND data_type    = 'bigint'
    ) THEN
        ALTER TABLE carrinhos DROP CONSTRAINT IF EXISTS carrinhos_order_id_fkey;
        UPDATE carrinhos SET order_id = NULL;
        ALTER TABLE carrinhos
            ALTER COLUMN order_id TYPE UUID
            USING NULL::uuid;
        ALTER TABLE carrinhos
            ADD CONSTRAINT carrinhos_order_id_fkey
            FOREIGN KEY (order_id) REFERENCES pedidos(id) ON DELETE SET NULL;
        RAISE NOTICE '[FIX] carrinhos.order_id: BIGINT → UUID';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'carrinhos'
          AND column_name  = 'order_id'
    ) THEN
        ALTER TABLE carrinhos
            ADD COLUMN order_id UUID REFERENCES pedidos(id) ON DELETE SET NULL;
        RAISE NOTICE '[FIX] carrinhos.order_id: criado como UUID';
    ELSE
        RAISE NOTICE '[OK]  carrinhos.order_id já é UUID';
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────
-- BLOCO 3: carrinhos — colunas de multi-step recovery
-- ─────────────────────────────────────────────────────────
ALTER TABLE carrinhos
    ADD COLUMN IF NOT EXISTS recovery_step    INTEGER                  DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_recovery_at TIMESTAMP WITH TIME ZONE;

DO $$ BEGIN RAISE NOTICE '[OK]  carrinhos.recovery_step / last_recovery_at garantidos'; END $$;

-- ─────────────────────────────────────────────────────────
-- BLOCO 4: customer_sessions — garantir schema v2
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_sessions (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id     TEXT        UNIQUE NOT NULL,
    customer_email TEXT,
    customer_id    UUID        REFERENCES clientes(id) ON DELETE CASCADE,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adiciona colunas ausentes caso a tabela exista com schema antigo
ALTER TABLE customer_sessions ADD COLUMN IF NOT EXISTS id           UUID DEFAULT gen_random_uuid();
ALTER TABLE customer_sessions ADD COLUMN IF NOT EXISTS customer_id  UUID;
ALTER TABLE customer_sessions ADD COLUMN IF NOT EXISTS created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE customer_sessions ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_customer_sessions_session_id ON customer_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_email      ON customer_sessions (customer_email);

DO $$ BEGIN RAISE NOTICE '[OK]  customer_sessions schema v2 garantido'; END $$;

-- ─────────────────────────────────────────────────────────
-- BLOCO 5: pedidos — colunas de payment recovery
-- ─────────────────────────────────────────────────────────
ALTER TABLE pedidos
    ADD COLUMN IF NOT EXISTS payment_recovery_step       INTEGER                  DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_last_recovery_at    TIMESTAMP WITH TIME ZONE;

DO $$ BEGIN RAISE NOTICE '[OK]  pedidos.payment_recovery_step / payment_last_recovery_at garantidos'; END $$;

-- ─────────────────────────────────────────────────────────
-- RELATÓRIO FINAL — estado atual das colunas críticas
-- ─────────────────────────────────────────────────────────
SELECT
    table_name,
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   IN ('carrinhos', 'pedidos', 'clientes', 'customer_sessions')
  AND column_name  IN (
      'id', 'customer_id', 'order_id',
      'recovery_step', 'last_recovery_at',
      'payment_recovery_step', 'payment_last_recovery_at',
      'session_id', 'customer_email', 'updated_at'
  )
ORDER BY table_name, column_name;
