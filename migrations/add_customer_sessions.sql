-- Vincula session_id ao email do cliente para auto-preenchimento e recuperação de abandono
CREATE TABLE IF NOT EXISTS customer_sessions (
    session_id TEXT PRIMARY KEY,
    customer_email TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_sessions_email ON customer_sessions (customer_email);
