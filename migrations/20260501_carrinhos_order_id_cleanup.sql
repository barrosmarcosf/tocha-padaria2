-- Adiciona coluna order_id em carrinhos para vincular ao pedido após checkout
ALTER TABLE carrinhos
    ADD COLUMN IF NOT EXISTS order_id BIGINT REFERENCES pedidos(id) ON DELETE SET NULL;

-- Remove carrinhos antigos com session_id gerado pelo frontend (prefixo 'sess_')
-- Esses registros são do sistema legado e nunca farão match com o cookie do servidor
DELETE FROM carrinhos WHERE session_id LIKE 'sess_%';
