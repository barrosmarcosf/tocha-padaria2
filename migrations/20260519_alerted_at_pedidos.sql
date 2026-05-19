-- Migration: 20260519_alerted_at_pedidos
-- Adiciona coluna de controle de throttle para o stock-monitor worker.
-- Permite re-alertar apenas após 1h, sem perder falhas antigas.

ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS alerted_at TIMESTAMP NULL;
