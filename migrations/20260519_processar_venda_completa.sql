-- Migration: 20260519_processar_venda_completa
-- Substitui múltiplas chamadas a processar_venda_estoque por uma única
-- operação transacional. Valida e deduz estoque de todos os itens do pedido
-- em uma única transação com FOR UPDATE (serialização por linha).
--
-- Resultado:
--   { "status": "ok",    "deducted": [{"id":"...", "qty": N}, ...] }
--   { "status": "ok",    "deducted": [], "note": "no_items_or_batch" }
--   { "status": "error", "error": "order_not_found" }
--   { "status": "error", "error": "fornada_not_found",     "batch_date": "..." }
--   { "status": "error", "error": "product_not_in_batch",  "product_id": "..." }
--   { "status": "error", "error": "insufficient_stock",    "product_id": "...", "available": N, "requested": N }

CREATE OR REPLACE FUNCTION processar_venda_completa(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_items_raw  TEXT;
    v_items      JSONB;
    v_batch_date TEXT;
    v_fornada_id UUID;
    v_item       JSONB;
    v_product_id TEXT;
    v_qty        INTEGER;
    v_available  INTEGER;
    v_deducted   JSONB := '[]'::JSONB;
BEGIN
    -- Bloqueia o pedido para serializar chamadas concorrentes ao mesmo order_id
    SELECT items::TEXT INTO v_items_raw
    FROM pedidos
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN '{"status":"error","error":"order_not_found"}'::JSONB;
    END IF;

    -- Normaliza: coluna items pode ser TEXT com JSON interno ou JSONB direto
    BEGIN
        v_items := v_items_raw::JSONB;
    EXCEPTION WHEN OTHERS THEN
        RETURN '{"status":"error","error":"items_parse_failed"}'::JSONB;
    END;

    v_batch_date := v_items ->> 'batch_date';

    -- Sem fornada ou sem itens: skip silencioso (pedido Stripe antigo ou sem estoque gerenciado)
    IF v_batch_date IS NULL OR
       COALESCE(jsonb_array_length(v_items -> 'actual_items'), 0) = 0
    THEN
        RETURN '{"status":"ok","deducted":[],"note":"no_items_or_batch"}'::JSONB;
    END IF;

    -- Resolve ID da fornada
    SELECT id INTO v_fornada_id
    FROM fornadas
    WHERE bake_date = v_batch_date::DATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'error',
            'error',  'fornada_not_found',
            'batch_date', v_batch_date
        );
    END IF;

    -- FASE 1: Validar estoque de TODOS os itens e bloquear as linhas (FOR UPDATE)
    -- ORDER BY id garante ordem determinística — elimina deadlock entre transações concorrentes
    FOR v_item IN
        SELECT value FROM jsonb_array_elements(v_items -> 'actual_items')
        ORDER BY value->>'id'
    LOOP
        v_product_id := v_item ->> 'id';
        v_qty        := (v_item ->> 'qty')::INTEGER;

        SELECT estoque_disponivel INTO v_available
        FROM produto_estoque_fornada
        WHERE produto_id = v_product_id
          AND fornada_id = v_fornada_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'status',     'error',
                'error',      'product_not_in_batch',
                'product_id', v_product_id,
                'batch_date', v_batch_date
            );
        END IF;

        IF v_available < v_qty THEN
            RETURN jsonb_build_object(
                'status',     'error',
                'error',      'insufficient_stock',
                'product_id', v_product_id,
                'available',  v_available,
                'requested',  v_qty
            );
        END IF;
    END LOOP;

    -- FASE 2: Deduzir tudo — todas as linhas já bloqueadas, sem race condition possível
    FOR v_item IN
        SELECT value FROM jsonb_array_elements(v_items -> 'actual_items')
        ORDER BY value->>'id'
    LOOP
        v_product_id := v_item ->> 'id';
        v_qty        := (v_item ->> 'qty')::INTEGER;

        UPDATE produto_estoque_fornada
        SET estoque_disponivel = estoque_disponivel - v_qty,
            vendas_confirmadas = COALESCE(vendas_confirmadas, 0) + v_qty
        WHERE produto_id = v_product_id
          AND fornada_id = v_fornada_id;

        v_deducted := v_deducted || jsonb_build_array(
            jsonb_build_object('id', v_product_id, 'qty', v_qty)
        );
    END LOOP;

    RETURN jsonb_build_object('status', 'ok', 'deducted', v_deducted);
END;
$$;
