-- Função atômica para incrementar retry_count sem race condition
-- Usada pelo stock-monitor para evitar drift em múltiplas instâncias/execuções concorrentes
CREATE OR REPLACE FUNCTION increment_retry_count(p_order_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_count INTEGER;
BEGIN
    UPDATE pedidos
    SET retry_count = COALESCE(retry_count, 0) + 1
    WHERE id = p_order_id
    RETURNING retry_count INTO v_new_count;

    RETURN v_new_count;
END;
$$;
