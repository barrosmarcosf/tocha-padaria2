-- Migration: 20260520_rpc_idempotency
-- C6 fix: torna processar_venda_completa idempotente via coluna stock_deducted_at.
--
-- Problema: se a chamada RPC completa no banco mas a resposta não chega ao Node
-- (timeout de rede), o Node lança erro, marca stock_deduction_failed=true e tenta
-- novamente. Sem este fix, o estoque seria deduzido duas vezes.
--
-- Solução: coluna stock_deducted_at marca que a dedução já ocorreu para este pedido.
-- A função verifica este flag DENTRO da mesma transação (FOR UPDATE no pedido) e
-- retorna imediatamente sem deduzir se já foi processado.
--
-- EXECUTAR no SQL Editor do Supabase:

-- ─────────────────────────────────────────────────────────────
-- 1. Nova coluna na tabela pedidos
-- ─────────────────────────────────────────────────────────────
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS stock_deducted_at TIMESTAMPTZ;

-- Índice parcial — apenas pedidos já deduzidos (minoria); não afeta queries normais
CREATE INDEX IF NOT EXISTS idx_pedidos_stock_deducted_at
    ON pedidos (stock_deducted_at)
    WHERE stock_deducted_at IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. Função atualizada com idempotência
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION processar_venda_completa(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_items_raw        TEXT;
    v_items            JSONB;
    v_batch_date       TEXT;
    v_fornada_id       UUID;
    v_item             JSONB;
    v_product_id       TEXT;
    v_qty              INTEGER;
    v_available        INTEGER;
    v_deducted         JSONB := '[]'::JSONB;
    v_already_deducted TIMESTAMPTZ;
BEGIN
    -- Bloqueia o pedido para serializar chamadas concorrentes ao mesmo order_id.
    -- FOR UPDATE garante que dois processos nunca entrem simultaneamente aqui.
    SELECT items::TEXT, stock_deducted_at
    INTO   v_items_raw, v_already_deducted
    FROM   pedidos
    WHERE  id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN '{"status":"error","error":"order_not_found"}'::JSONB;
    END IF;

    -- ── IDEMPOTÊNCIA (C6) ─────────────────────────────────────────────────────
    -- Se stock_deducted_at já está preenchido, esta chamada é um retry após
    -- timeout de rede — o banco já deduziu o estoque. Retornar sem reprocessar.
    IF v_already_deducted IS NOT NULL THEN
        RETURN '{"status":"ok","deducted":[],"note":"already_deducted"}'::JSONB;
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
    FROM   fornadas
    WHERE  bake_date = v_batch_date::DATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'error',
            'error',  'fornada_not_found',
            'batch_date', v_batch_date
        );
    END IF;

    -- ── FASE 1: Validar estoque de TODOS os itens e bloquear as linhas ──────
    -- ORDER BY id garante ordem determinística — elimina deadlock entre transações
    FOR v_item IN
        SELECT value FROM jsonb_array_elements(v_items -> 'actual_items')
        ORDER BY value->>'id'
    LOOP
        v_product_id := v_item ->> 'id';
        v_qty        := (v_item ->> 'qty')::INTEGER;

        SELECT estoque_disponivel INTO v_available
        FROM   produto_estoque_fornada
        WHERE  produto_id = v_product_id
          AND  fornada_id = v_fornada_id
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

    -- ── FASE 2: Deduzir tudo ─────────────────────────────────────────────────
    -- Todas as linhas já bloqueadas na fase 1 — sem race condition possível
    FOR v_item IN
        SELECT value FROM jsonb_array_elements(v_items -> 'actual_items')
        ORDER BY value->>'id'
    LOOP
        v_product_id := v_item ->> 'id';
        v_qty        := (v_item ->> 'qty')::INTEGER;

        UPDATE produto_estoque_fornada
        SET    estoque_disponivel = estoque_disponivel - v_qty,
               vendas_confirmadas = COALESCE(vendas_confirmadas, 0) + v_qty
        WHERE  produto_id = v_product_id
          AND  fornada_id = v_fornada_id;

        v_deducted := v_deducted || jsonb_build_array(
            jsonb_build_object('id', v_product_id, 'qty', v_qty)
        );
    END LOOP;

    -- ── FASE 3: Marcar pedido como deduzido (dentro da mesma transação) ──────
    -- Se este UPDATE falhar, toda a transação faz ROLLBACK e o estoque NÃO é
    -- deduzido. Na próxima chamada, stock_deducted_at será NULL e a dedução
    -- ocorrerá normalmente.
    UPDATE pedidos
    SET    stock_deducted_at = NOW()
    WHERE  id = p_order_id;

    RETURN jsonb_build_object('status', 'ok', 'deducted', v_deducted);
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. Verificação pós-migration
-- ─────────────────────────────────────────────────────────────
-- Execute para confirmar que a coluna existe:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'pedidos' AND column_name = 'stock_deducted_at';

-- Execute para confirmar que a função foi atualizada:
-- SELECT prosrc FROM pg_proc WHERE proname = 'processar_venda_completa';
