-- Migration: 20260519_alerted_at_pedidos
-- Adiciona colunas de controle para o stock-monitor worker.
--
-- stock_deduction_failed: flag marcada pelo worker quando processar_venda_completa
--   retorna insufficient_stock, product_not_in_batch ou outro erro não-RPC.
-- alerted_at: controle de throttle do monitor — evita spam de alertas.
--   Re-alerta apenas se NULL ou > 1h atrás.

ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS stock_deduction_failed BOOLEAN DEFAULT false NULL;

ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS alerted_at TIMESTAMP NULL;
