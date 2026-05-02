-- Corrige carrinhos.customer_id: BIGINT → UUID
-- Motivo: clientes.id é UUID; public.js linha 75 quebrava ao tentar salvar UUID em BIGINT.
-- Valores BIGINT existentes são inválidos (nunca foram UUIDs reais), então são nulificados.

DO $$
BEGIN
    -- Caso 1: coluna existe como BIGINT → converter para UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'carrinhos'
          AND column_name  = 'customer_id'
          AND data_type    = 'bigint'
    ) THEN
        ALTER TABLE carrinhos DROP CONSTRAINT IF EXISTS carrinhos_customer_id_fkey;
        -- Valores BIGINT nunca foram UUIDs válidos; anular antes da conversão de tipo
        UPDATE carrinhos SET customer_id = NULL;
        ALTER TABLE carrinhos
            ALTER COLUMN customer_id TYPE UUID
            USING customer_id::text::uuid;
        RAISE NOTICE 'carrinhos.customer_id convertido de BIGINT para UUID.';
    END IF;

    -- Caso 2: coluna não existe → criar já como UUID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'carrinhos'
          AND column_name  = 'customer_id'
    ) THEN
        ALTER TABLE carrinhos ADD COLUMN customer_id UUID;
        RAISE NOTICE 'carrinhos.customer_id criado como UUID.';
    END IF;
END $$;
