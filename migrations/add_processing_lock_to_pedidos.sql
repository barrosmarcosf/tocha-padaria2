-- Adiciona coluna de lock otimista para prevenir pagamentos duplicados simultâneos
ALTER TABLE pedidos
    ADD COLUMN IF NOT EXISTS processing BOOLEAN NOT NULL DEFAULT false;
