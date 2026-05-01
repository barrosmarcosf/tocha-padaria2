CREATE TABLE IF NOT EXISTS payment_logs (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id    TEXT,
    request_id  TEXT,
    status      TEXT,
    duration_ms INT,
    created_at  TIMESTAMP   DEFAULT NOW()
);
