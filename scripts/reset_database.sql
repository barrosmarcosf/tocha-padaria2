-- ============================================================
-- RESET DE DADOS OPERACIONAIS — Tocha Padaria
-- Versão: 1.0 — 2026-05-15
-- ============================================================
-- ATENÇÃO: Este script apaga TODOS os dados operacionais.
--          Schema, funções, policies e dados de config são
--          100% preservados.
--
-- COMO USAR:
--   Cole no SQL Editor do Supabase e execute.
--   Leia o output do RAISE NOTICE para confirmar resultado.
--
-- PRESERVADO (não tocado):
--   categorias, produtos, site_content, usuarios,
--   configuracoes_loja, horarios_funcionamento,
--   grupos_opcionais, opcionais, auth.users
--
-- LIMPO:
--   pedidos, clientes, carrinhos, customer_sessions,
--   payment_events, payment_logs, failed_payments_queue,
--   funnel_events, funnel_aggregates, insights_log, events,
--   fornadas, produto_estoque_fornada
-- ============================================================

-- ─────────────────────────────────────────────────────────
-- PRÉ-RESET: contagens para auditoria
-- ─────────────────────────────────────────────────────────
DO $$
DECLARE
  v_pedidos    INTEGER; v_clientes   INTEGER; v_carrinhos  INTEGER;
  v_sessions   INTEGER; v_funnel     INTEGER; v_pev        INTEGER;
  v_plogs      INTEGER; v_fpq        INTEGER; v_events     INTEGER;
  v_fagg       INTEGER; v_insights   INTEGER; v_fornadas   INTEGER;
  v_estoque    INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_pedidos   FROM pedidos;
  SELECT COUNT(*) INTO v_clientes  FROM clientes;
  SELECT COUNT(*) INTO v_carrinhos FROM carrinhos;
  SELECT COUNT(*) INTO v_sessions  FROM customer_sessions;
  SELECT COUNT(*) INTO v_funnel    FROM funnel_events;
  SELECT COUNT(*) INTO v_pev       FROM payment_events;
  SELECT COUNT(*) INTO v_plogs     FROM payment_logs;
  SELECT COUNT(*) INTO v_fpq       FROM failed_payments_queue;
  SELECT COUNT(*) INTO v_events    FROM events;
  SELECT COUNT(*) INTO v_fagg      FROM funnel_aggregates;
  SELECT COUNT(*) INTO v_insights  FROM insights_log;
  BEGIN SELECT COUNT(*) INTO v_fornadas FROM fornadas;                EXCEPTION WHEN undefined_table THEN v_fornadas := -1; END;
  BEGIN SELECT COUNT(*) INTO v_estoque  FROM produto_estoque_fornada; EXCEPTION WHEN undefined_table THEN v_estoque  := -1; END;

  RAISE NOTICE '══════════════ PRÉ-RESET ══════════════';
  RAISE NOTICE 'pedidos:              %', v_pedidos;
  RAISE NOTICE 'clientes:             %', v_clientes;
  RAISE NOTICE 'carrinhos:            %', v_carrinhos;
  RAISE NOTICE 'customer_sessions:    %', v_sessions;
  RAISE NOTICE 'funnel_events:        %', v_funnel;
  RAISE NOTICE 'payment_events:       %', v_pev;
  RAISE NOTICE 'payment_logs:         %', v_plogs;
  RAISE NOTICE 'failed_payments_queue:%', v_fpq;
  RAISE NOTICE 'events:               %', v_events;
  RAISE NOTICE 'funnel_aggregates:    %', v_fagg;
  RAISE NOTICE 'insights_log:         %', v_insights;
  RAISE NOTICE 'fornadas:             % (-1 = tabela inexistente)', v_fornadas;
  RAISE NOTICE 'produto_estoque:      % (-1 = tabela inexistente)', v_estoque;
  RAISE NOTICE '═══════════════════════════════════════';
END $$;

-- ─────────────────────────────────────────────────────────
-- LIMPEZA — ordem FK-safe (filhos antes dos pais)
-- RESTART IDENTITY reseta sequências SERIAL se existirem;
-- é no-op para UUIDs (não causa erro).
-- CASCADE garante limpeza de referências residuais.
-- ─────────────────────────────────────────────────────────

-- Bloco 1: analytics e filas (sem FK de saída para tabelas operacionais)
TRUNCATE TABLE
  funnel_aggregates,
  insights_log,
  events,
  failed_payments_queue
RESTART IDENTITY CASCADE;

-- Bloco 2: dados de funil e pagamento (FK para pedidos)
TRUNCATE TABLE
  funnel_events,
  payment_logs,
  payment_events
RESTART IDENTITY CASCADE;

-- Bloco 3: sessões e carrinhos (FK para clientes e pedidos)
TRUNCATE TABLE
  customer_sessions,
  carrinhos
RESTART IDENTITY CASCADE;

-- Bloco 4: pedidos (raiz de pagamentos)
TRUNCATE TABLE pedidos RESTART IDENTITY CASCADE;

-- Bloco 5: clientes (raiz de sessions e carrinhos)
TRUNCATE TABLE clientes RESTART IDENTITY CASCADE;

-- Bloco 6: estoque/fornadas (operacional, condicional — tabelas podem não existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'produto_estoque_fornada') THEN
    TRUNCATE TABLE produto_estoque_fornada RESTART IDENTITY CASCADE;
    RAISE NOTICE '[OK] produto_estoque_fornada: limpo';
  ELSE
    RAISE NOTICE '[SKIP] produto_estoque_fornada: tabela não encontrada';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fornadas') THEN
    TRUNCATE TABLE fornadas RESTART IDENTITY CASCADE;
    RAISE NOTICE '[OK] fornadas: limpo';
  ELSE
    RAISE NOTICE '[SKIP] fornadas: tabela não encontrada';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────
-- PÓS-RESET: validação com asserções
-- Em caso de falha, lança EXCEPTION com detalhes.
-- ─────────────────────────────────────────────────────────
DO $$
DECLARE
  v_pedidos    INTEGER; v_clientes   INTEGER; v_carrinhos  INTEGER;
  v_sessions   INTEGER; v_funnel     INTEGER; v_pev        INTEGER;
  v_plogs      INTEGER; v_fpq        INTEGER; v_events     INTEGER;
  v_fagg       INTEGER; v_insights   INTEGER;
  v_categorias INTEGER; v_produtos   INTEGER; v_config     INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_pedidos   FROM pedidos;
  SELECT COUNT(*) INTO v_clientes  FROM clientes;
  SELECT COUNT(*) INTO v_carrinhos FROM carrinhos;
  SELECT COUNT(*) INTO v_sessions  FROM customer_sessions;
  SELECT COUNT(*) INTO v_funnel    FROM funnel_events;
  SELECT COUNT(*) INTO v_pev       FROM payment_events;
  SELECT COUNT(*) INTO v_plogs     FROM payment_logs;
  SELECT COUNT(*) INTO v_fpq       FROM failed_payments_queue;
  SELECT COUNT(*) INTO v_events    FROM events;
  SELECT COUNT(*) INTO v_fagg      FROM funnel_aggregates;
  SELECT COUNT(*) INTO v_insights  FROM insights_log;
  SELECT COUNT(*) INTO v_categorias FROM categorias;
  SELECT COUNT(*) INTO v_produtos   FROM produtos;
  SELECT COUNT(*) INTO v_config     FROM configuracoes_loja;

  RAISE NOTICE '══════════════ PÓS-RESET ══════════════';
  RAISE NOTICE 'pedidos:              % (esperado: 0)', v_pedidos;
  RAISE NOTICE 'clientes:             % (esperado: 0)', v_clientes;
  RAISE NOTICE 'carrinhos:            % (esperado: 0)', v_carrinhos;
  RAISE NOTICE 'customer_sessions:    % (esperado: 0)', v_sessions;
  RAISE NOTICE 'funnel_events:        % (esperado: 0)', v_funnel;
  RAISE NOTICE 'payment_events:       % (esperado: 0)', v_pev;
  RAISE NOTICE 'payment_logs:         % (esperado: 0)', v_plogs;
  RAISE NOTICE 'failed_payments_queue:% (esperado: 0)', v_fpq;
  RAISE NOTICE 'events:               % (esperado: 0)', v_events;
  RAISE NOTICE 'funnel_aggregates:    % (esperado: 0)', v_fagg;
  RAISE NOTICE 'insights_log:         % (esperado: 0)', v_insights;
  RAISE NOTICE '─── Config preservada (nao deve ser 0) ─';
  RAISE NOTICE 'categorias:           % (preservado)', v_categorias;
  RAISE NOTICE 'produtos:             % (preservado)', v_produtos;
  RAISE NOTICE 'configuracoes_loja:   % (preservado)', v_config;
  RAISE NOTICE '═══════════════════════════════════════';

  IF v_pedidos    > 0 THEN RAISE EXCEPTION 'FALHA: pedidos nao zerado (%)',              v_pedidos;    END IF;
  IF v_clientes   > 0 THEN RAISE EXCEPTION 'FALHA: clientes nao zerado (%)',             v_clientes;   END IF;
  IF v_carrinhos  > 0 THEN RAISE EXCEPTION 'FALHA: carrinhos nao zerado (%)',            v_carrinhos;  END IF;
  IF v_sessions   > 0 THEN RAISE EXCEPTION 'FALHA: customer_sessions nao zerado (%)',    v_sessions;   END IF;
  IF v_funnel     > 0 THEN RAISE EXCEPTION 'FALHA: funnel_events nao zerado (%)',        v_funnel;     END IF;
  IF v_pev        > 0 THEN RAISE EXCEPTION 'FALHA: payment_events nao zerado (%)',       v_pev;        END IF;
  IF v_plogs      > 0 THEN RAISE EXCEPTION 'FALHA: payment_logs nao zerado (%)',         v_plogs;      END IF;
  IF v_fpq        > 0 THEN RAISE EXCEPTION 'FALHA: failed_payments_queue nao zerado (%)', v_fpq;      END IF;
  IF v_events     > 0 THEN RAISE EXCEPTION 'FALHA: events nao zerado (%)',               v_events;     END IF;
  IF v_fagg       > 0 THEN RAISE EXCEPTION 'FALHA: funnel_aggregates nao zerado (%)',    v_fagg;       END IF;
  IF v_insights   > 0 THEN RAISE EXCEPTION 'FALHA: insights_log nao zerado (%)',         v_insights;   END IF;

  IF v_categorias = 0 THEN RAISE WARNING 'AVISO: categorias vazia — config pode ter sido apagada!'; END IF;
  IF v_produtos   = 0 THEN RAISE WARNING 'AVISO: produtos vazio — config pode ter sido apagada!';   END IF;

  RAISE NOTICE '>>> RESET CONCLUIDO: banco zerado, config preservada. <<<';
END $$;
