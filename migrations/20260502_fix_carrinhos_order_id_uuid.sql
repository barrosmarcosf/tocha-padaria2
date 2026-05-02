-- Corrige carrinhos.order_id: BIGINT → UUID
-- Motivo: pedidos.id é UUID; public.js linha 69 quebrava ao tentar salvar UUID em BIGINT.
-- Mesmo padrão aplicado em 20260501_fix_carrinhos_customer_id_uuid.sql.

DO $$
BEGIN
    -- Caso 1: coluna existe como BIGINT → converter para UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'carrinhos'
          AND column_name  = 'order_id'
          AND data_type    = 'bigint'
    ) THEN
        ALTER TABLE carrinhos DROP CONSTRAINT IF EXISTS carrinhos_order_id_fkey;
        -- Valores BIGINT nunca foram UUIDs válidos; anular antes da conversão de tipo
        UPDATE carrinhos SET order_id = NULL;
        ALTER TABLE carrinhos
            ALTER COLUMN order_id TYPE UUID
            USING NULL::uuid;
        ALTER TABLE carrinhos
            ADD CONSTRAINT carrinhos_order_id_fkey
            FOREIGN KEY (order_id) REFERENCES pedidos(id) ON DELETE SET NULL;
        RAISE NOTICE 'carrinhos.order_id convertido de BIGINT para UUID.';

    -- Caso 2: coluna não existe → criar já como UUID
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'carrinhos'
          AND column_name  = 'order_id'
    ) THEN
        ALTER TABLE carrinhos
            ADD COLUMN order_id UUID REFERENCES pedidos(id) ON DELETE SET NULL;
        RAISE NOTICE 'carrinhos.order_id criado como UUID.';

    -- Caso 3: coluna já é UUID → nada a fazer
    ELSE
        RAISE NOTICE 'carrinhos.order_id já é UUID. Nenhuma alteração necessária.';
    END IF;
END $$;

-- Verificação final
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'carrinhos'
  AND column_name = 'order_id';
