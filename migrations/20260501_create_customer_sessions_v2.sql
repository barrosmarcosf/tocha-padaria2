-- Cria customer_sessions com schema completo.
-- Supera add_customer_sessions.sql (schema antigo sem id UUID e sem customer_id).
-- Mantém customer_email para compatibilidade com cart-abandonment.js linha 66.

CREATE TABLE IF NOT EXISTS customer_sessions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  TEXT        UNIQUE NOT NULL,
    customer_email TEXT,
    customer_id UUID        REFERENCES clientes(id) ON DELETE CASCADE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adiciona colunas ausentes caso a tabela já existia com schema antigo
-- (session_id TEXT PRIMARY KEY, customer_email TEXT NOT NULL, updated_at TIMESTAMPTZ)
ALTER TABLE customer_sessions ADD COLUMN IF NOT EXISTS id           UUID DEFAULT gen_random_uuid();
ALTER TABLE customer_sessions ADD COLUMN IF NOT EXISTS customer_id  UUID;
ALTER TABLE customer_sessions ADD COLUMN IF NOT EXISTS created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Índices
CREATE INDEX IF NOT EXISTS idx_customer_sessions_session_id
    ON customer_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_email
    ON customer_sessions (customer_email);
