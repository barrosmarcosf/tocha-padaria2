/* global React, Ic, KPI, AreaChart, Donut, brl, brlShort, Delta */
const {
  useState: useStD,
  useEffect: useEfD
} = React;

// ---------- helpers ----------
function prevFromPct(curr, pct) {
  if (!pct || pct === -100) return curr;
  return curr / (1 + pct / 100);
}
function formatRecency(isoDate) {
  if (!isoDate) return '?';
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
  if (days === 0) return 'hoje';
  if (days === 1) return '1 dia';
  return `${days} dias`;
}
function formatBakeDate(dateStr) {
  if (!dateStr) return '—';
  const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const d = new Date(dateStr + 'T12:00:00');
  return `${DAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}
const PERIOD_MAP = {
  hoje: 'today',
  ontem: 'yesterday',
  '7d': '7d',
  mes: 'month',
  custom: 'custom'
};
const PERIOD_LABEL = {
  hoje: 'Hoje',
  ontem: 'Ontem',
  '7d': 'Últimos 7 dias',
  mes: 'Este mês',
  custom: 'Personalizado'
};
const EMPTY_SPARK = Array(30).fill(0);

// ---------- client card modal ----------
function ClientCardModal({
  client,
  onClose
}) {
  const initial = client.name.split(' ').map(s => s[0]).slice(0, 1).join('');
  const recurrent = client.orders >= 2;
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal client-card-modal",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    className: "modal-x",
    onClick: onClose
  }, "\xD7"), /*#__PURE__*/React.createElement("div", {
    className: "cc-avatar"
  }, /*#__PURE__*/React.createElement("span", null, initial)), /*#__PURE__*/React.createElement("h2", {
    className: "cc-name"
  }, client.name), /*#__PURE__*/React.createElement("div", {
    className: "cc-phone"
  }, client.whatsapp || '—'), /*#__PURE__*/React.createElement("span", {
    className: `cc-tag ${recurrent ? 'rec' : 'oc'}`
  }, recurrent ? 'RECORRENTE' : 'OCASIONAL'), /*#__PURE__*/React.createElement("div", {
    className: "cc-stats"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, "TOTAL GASTO"), /*#__PURE__*/React.createElement("b", null, brl(client.spent))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, "PEDIDOS"), /*#__PURE__*/React.createElement("b", null, client.orders))), /*#__PURE__*/React.createElement("div", {
    className: "cc-score"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, "REC\xCANCIA"), /*#__PURE__*/React.createElement("b", null, client.recency, " atr\xE1s")), /*#__PURE__*/React.createElement("div", {
    className: "rt"
  }, /*#__PURE__*/React.createElement("small", null, "SCORE DE RECORR\xCANCIA"), /*#__PURE__*/React.createElement("b", {
    className: "cc-score-v"
  }, client.score, "/10"))), /*#__PURE__*/React.createElement("button", {
    className: "cc-back",
    onClick: onClose
  }, "Voltar ao Dashboard")));
}

// ---------- cumulative chart (local, sem dep. de dados externos) ----------
function CumulativeChart({
  current,
  previous
}) {
  if (!current || current.length < 2) return null;
  const w = 320,
    h = 140,
    padL = 8,
    padR = 8,
    padT = 12,
    padB = 18;
  const iw = w - padL - padR,
    ih = h - padT - padB;
  const cumA = [];
  let a = 0;
  current.forEach(d => {
    a += d.value || 0;
    cumA.push(a);
  });
  const cumB = [];
  let b = 0;
  (previous || []).forEach(d => {
    b += d.value || 0;
    cumB.push(b);
  });
  while (cumB.length < cumA.length) cumB.push(cumB[cumB.length - 1] || 0);
  const max = Math.max(cumA.at(-1) || 0, cumB.at(-1) || 0, 1) * 1.05;
  const n = cumA.length;
  const xp = i => padL + i / Math.max(n - 1, 1) * iw;
  const yp = v => padT + ih - (v || 0) / max * ih;
  const smooth = arr => arr.map((v, i) => {
    if (i === 0) return `M ${xp(i).toFixed(1)} ${yp(v).toFixed(1)}`;
    const cpx = ((xp(i - 1) + xp(i)) / 2).toFixed(1);
    return `C ${cpx} ${yp(arr[i - 1]).toFixed(1)} ${cpx} ${yp(v).toFixed(1)} ${xp(i).toFixed(1)} ${yp(v).toFixed(1)}`;
  }).join(' ');
  const pathA = smooth(cumA);
  const pathB = smooth(cumB);
  const area = `${pathA} L ${xp(n - 1).toFixed(1)} ${padT + ih} L ${padL} ${padT + ih} Z`;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${w} ${h}`,
    style: {
      width: '100%',
      height: 140,
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "cumAreaGrad",
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "var(--gold)",
    stopOpacity: "0.20"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "var(--gold)",
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("path", {
    d: area,
    fill: "url(#cumAreaGrad)"
  }), /*#__PURE__*/React.createElement("path", {
    d: pathB,
    fill: "none",
    stroke: "var(--ink-4)",
    strokeWidth: "1.2",
    strokeDasharray: "3 4",
    opacity: "0.55"
  }), /*#__PURE__*/React.createElement("path", {
    d: pathA,
    fill: "none",
    stroke: "var(--gold)",
    strokeWidth: "4",
    strokeLinecap: "round",
    opacity: "0.10"
  }), /*#__PURE__*/React.createElement("path", {
    d: pathA,
    fill: "none",
    stroke: "var(--gold)",
    strokeWidth: "1.8",
    strokeLinecap: "round"
  }));
}

// ---------- main dashboard ----------
function Dashboard() {
  const [period, setPeriod] = useStD('mes');
  const [openClient, setOpenClient] = useStD(null);
  const [stats, setStats] = useStD(null);
  const [analytics, setAnalytics] = useStD(null);
  const [customers, setCustomers] = useStD(null);
  const [config, setConfig] = useStD(null);
  const [health, setHealth] = useStD(null);
  const [loading, setLoading] = useStD(true);
  const today = new Date();
  const dateLabel = today.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Fetch period-dependent data
  useEfD(() => {
    const p = PERIOD_MAP[period] || 'month';
    setLoading(true);
    Promise.all([window.apiGet(`/api/admin/stats?period=${p}`), window.apiGet(`/api/admin/detailed-analytics?period=${p}`)]).then(([s, a]) => {
      setStats(s);
      setAnalytics(a);
      setLoading(false);
    }).catch(e => {
      console.error('[Dashboard] stats/analytics error:', e.message);
      setLoading(false);
    });
  }, [period]);

  // Fetch once: customers, config, payments health
  useEfD(() => {
    window.apiGet('/api/admin/customers').then(setCustomers).catch(e => console.warn('[Dashboard] customers:', e.message));
    window.apiGet('/api/admin/config').then(setConfig).catch(e => console.warn('[Dashboard] config:', e.message));
    window.apiGet('/api/admin/payments-health').then(setHealth).catch(e => console.warn('[Dashboard] health:', e.message));
  }, []);

  // ---------- derived: KPIs ----------
  const K = stats ? {
    faturamento: {
      value: stats.faturamento,
      prev: prevFromPct(stats.faturamento, stats.variacao?.faturamento),
      spark: (stats.serieTemporal || []).map(s => s.faturamento)
    },
    pedidos: {
      value: stats.pedidos,
      prev: prevFromPct(stats.pedidos, stats.variacao?.pedidos),
      spark: (stats.serieTemporal || []).map(s => s.pedidos)
    },
    ticket: {
      value: stats.ticketMedio,
      prev: prevFromPct(stats.ticketMedio, stats.variacao?.ticketMedio),
      spark: (stats.serieTemporal || []).map(s => s.ticketMedio)
    },
    lucro: {
      value: stats.lucro,
      prev: prevFromPct(stats.lucro, stats.variacao?.lucro),
      spark: (stats.serieTemporal || []).map(s => s.lucro)
    }
  } : {
    faturamento: {
      value: 0,
      prev: 0,
      spark: EMPTY_SPARK
    },
    pedidos: {
      value: 0,
      prev: 0,
      spark: EMPTY_SPARK
    },
    ticket: {
      value: 0,
      prev: 0,
      spark: EMPTY_SPARK
    },
    lucro: {
      value: 0,
      prev: 0,
      spark: EMPTY_SPARK
    }
  };

  // ---------- derived: revenue series ----------
  const serie = stats ? {
    current: (stats.serieTemporal || []).map(s => ({
      date: s.data,
      label: s.data,
      value: s.faturamento
    })),
    previous: (stats.serieAnterior || []).map(s => ({
      date: s.data,
      label: s.data,
      value: s.faturamento
    }))
  } : {
    current: EMPTY_SPARK.map((_, i) => ({
      label: String(i + 1),
      value: 0
    })),
    previous: EMPTY_SPARK.map((_, i) => ({
      label: String(i + 1),
      value: 0
    }))
  };

  // ---------- derived: payments donut ----------
  const rawPmt = analytics?.paymentBreakdown;
  const payments = rawPmt ? [{
    label: 'Pix',
    value: rawPmt.pix?.revenue || 0,
    count: rawPmt.pix?.count || 0,
    color: 'var(--c1)'
  }, {
    label: 'Cartão de crédito',
    value: rawPmt.credito?.revenue || 0,
    count: rawPmt.credito?.count || 0,
    color: 'var(--c2)'
  }, {
    label: 'Cartão de débito',
    value: rawPmt.debito?.revenue || 0,
    count: rawPmt.debito?.count || 0,
    color: 'var(--c3)'
  }, {
    label: 'Outros',
    value: rawPmt.outros?.revenue || 0,
    count: rawPmt.outros?.count || 0,
    color: 'var(--c4)'
  }].filter(p => p.value > 0) : null;
  const donutData = payments && payments.length > 0 ? payments : [{
    label: 'Sem dados',
    value: 1,
    count: 0,
    color: 'var(--line-2)'
  }];

  // ---------- derived: top products ----------
  const topProducts = analytics?.itemPerformance?.products?.slice(0, 5).map((p, i) => ({
    rank: i + 1,
    name: p.name,
    cat: p.category || 'Padaria',
    qty: p.qty || 0,
    gross: p.revenue || 0
  })) || [];

  // ---------- derived: recurrence ranking ----------
  const recList = customers ? customers.filter(c => (c.crm_count || 0) >= 2).sort((a, b) => (b.crm_count || 0) - (a.crm_count || 0)).slice(0, 5).map(c => ({
    id: c.id,
    name: c.name,
    whatsapp: c.whatsapp,
    status: 'Recorrente',
    orders: c.crm_count || 0,
    spent: c.crm_total || 0,
    score: Math.min(10, Math.round((c.crm_count || 0) * 1.5)),
    recency: formatRecency(c.crm_last)
  })) : [];

  // ---------- derived: clientes em pausa ----------
  const pausaData = (() => {
    if (!customers) return {
      healthy: true,
      activeRecurrent: 0,
      avgTicket: 0,
      repurchaseInterval: 7,
      repurchaseStatus: '—',
      paused: 0
    };
    const recurrent = customers.filter(c => (c.crm_count || 0) >= 2);
    const now = Date.now();
    const active = recurrent.filter(c => c.crm_last && (now - new Date(c.crm_last).getTime()) / 86400000 <= 15);
    const paused = recurrent.filter(c => !c.crm_last || (now - new Date(c.crm_last).getTime()) / 86400000 > 15);
    const avgTicket = recurrent.length > 0 ? recurrent.reduce((sum, c) => sum + (c.crm_count > 0 ? c.crm_total / c.crm_count : 0), 0) / recurrent.length : 0;
    return {
      healthy: paused.length === 0,
      paused: paused.length,
      activeRecurrent: active.length,
      avgTicket,
      repurchaseInterval: 7,
      repurchaseStatus: active.length >= 3 ? 'ótimo' : active.length >= 1 ? 'bom' : 'aguardando'
    };
  })();

  // ---------- derived: fornada ----------
  const openingHours = config?.siteContent?.opening_hours || {};
  const currentBatch = openingHours.currentBatch || {};
  const bakeDateStr = currentBatch.bakeDate || '';
  const fornadaWhen = formatBakeDate(bakeDateStr);
  const fornadaItens = analytics?.itemPerformance?.products?.reduce((s, p) => s + (p.qtyAtual || 0), 0) || 0;
  const fornadaPedidos = stats?.pedidos || 0;
  const fornadaFaturamento = stats?.faturamento || 0;
  const fornadaCapacidade = fornadaItens > 0 ? Math.min(1, fornadaItens / 200) : 0;

  // ---------- derived: alerts ----------
  const dynamicAlerts = [];
  if (health) {
    if (health.pending > 0) dynamicAlerts.push({
      kind: 'info',
      title: `${health.pending} pedido${health.pending > 1 ? 's' : ''} aguardando`,
      body: 'Confirme com clientes para liberar a fila.',
      meta: 'agora'
    });
    if (health.failed > 0) dynamicAlerts.push({
      kind: 'warn',
      title: `${health.failed} pagamento${health.failed > 1 ? 's' : ''} falharam`,
      body: 'Verifique a fila de reprocessamento.',
      meta: 'agora'
    });
    if (health.stale_locks > 0) dynamicAlerts.push({
      kind: 'warn',
      title: `${health.stale_locks} lock${health.stale_locks > 1 ? 's' : ''} travado${health.stale_locks > 1 ? 's' : ''}`,
      body: 'Transações de processamento expiraram.',
      meta: 'agora'
    });
    if (health.fila_reprocessamento > 0) dynamicAlerts.push({
      kind: 'info',
      title: `${health.fila_reprocessamento} item${health.fila_reprocessamento > 1 ? 's' : ''} na fila de reprocessamento`,
      body: 'Aguardando retry automático.',
      meta: 'agora'
    });
  }
  const alerts = dynamicAlerts.length > 0 ? dynamicAlerts : [{
    kind: 'ok',
    title: 'Sistema operando normalmente',
    body: 'Nenhum alerta crítico no momento.',
    meta: 'agora'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sub",
    style: {
      marginBottom: 6
    }
  }, dateLabel, " \xB7 ", PERIOD_LABEL[period]), /*#__PURE__*/React.createElement("h1", null, "Boas vindas, TOCHA PADARIA"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, bakeDateStr ? /*#__PURE__*/React.createElement(React.Fragment, null, "Pr\xF3xima fornada: ", /*#__PURE__*/React.createElement("b", null, fornadaWhen), " \xB7 ", /*#__PURE__*/React.createElement("b", null, fornadaPedidos, " pedidos"), " confirmados") : loading ? 'Carregando dados...' : 'Configure os ciclos de venda em Horário.')), /*#__PURE__*/React.createElement("div", {
    className: "range"
  }, [['hoje', 'Hoje'], ['ontem', 'Ontem'], ['7d', '7 dias'], ['mes', 'Este mês'], ['custom', 'Personalizar']].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: period === k ? 'on' : '',
    onClick: () => setPeriod(k)
  }, l)))), /*#__PURE__*/React.createElement("div", {
    className: "grid kpi-row"
  }, /*#__PURE__*/React.createElement(KPI, {
    label: "Faturamento",
    icon: Ic.chart,
    value: K.faturamento.value,
    prev: K.faturamento.prev,
    unit: "R$",
    decimals: 2,
    spark: K.faturamento.spark,
    color: "var(--c1)"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "Pedidos",
    icon: Ic.cart,
    value: K.pedidos.value,
    prev: K.pedidos.prev,
    spark: K.pedidos.spark,
    color: "var(--c3)"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "Ticket m\xE9dio",
    icon: Ic.card,
    value: K.ticket.value,
    prev: K.ticket.prev,
    unit: "R$",
    decimals: 2,
    spark: K.ticket.spark,
    color: "var(--c4)"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "Lucro",
    icon: Ic.bulb,
    value: K.lucro.value,
    prev: K.lucro.prev,
    unit: "R$",
    decimals: 2,
    spark: K.lucro.spark,
    color: "var(--c2)"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid row-2 mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card hoverable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.chart, null), "Faturamento ao longo do tempo"), /*#__PURE__*/React.createElement("div", {
    className: "legend"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    style: {
      background: 'var(--gold)'
    }
  }), "Este per\xEDodo"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-4)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      background: 'none',
      width: 16,
      height: 0,
      borderTop: '2px dashed var(--line-3)',
      borderRadius: 0,
      display: 'inline-block',
      verticalAlign: 'middle'
    }
  }), "Per\xEDodo anterior"))), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 240
    }
  }, /*#__PURE__*/React.createElement(Ic.chart, null), /*#__PURE__*/React.createElement("div", null, "Carregando...")) : /*#__PURE__*/React.createElement(AreaChart, {
    current: serie.current,
    previous: serie.previous
  })), /*#__PURE__*/React.createElement("div", {
    className: "card hoverable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.card, null), "Formas de pagamento"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, PERIOD_LABEL[period])), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 148
    }
  }, /*#__PURE__*/React.createElement(Ic.card, null), /*#__PURE__*/React.createElement("div", null, "Carregando...")) : /*#__PURE__*/React.createElement(Donut, {
    data: donutData
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid row-half mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card hoverable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.bread, null), "Top produtos vendidos"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, PERIOD_LABEL[period], " \xB7 ", topProducts.length, " itens")), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.bread, null), /*#__PURE__*/React.createElement("div", null, "Carregando...")) : topProducts.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.bread, null), /*#__PURE__*/React.createElement("div", null, "Nenhum produto vendido neste per\xEDodo.")) : (() => {
    const max = Math.max(...topProducts.map(p => p.gross), 1);
    return topProducts.map((p, i) => /*#__PURE__*/React.createElement("div", {
      className: "bar-row",
      key: p.rank
    }, /*#__PURE__*/React.createElement("span", {
      className: "rk"
    }, "#", p.rank), /*#__PURE__*/React.createElement("div", {
      className: "meta-row"
    }, /*#__PURE__*/React.createElement("span", {
      className: "nm"
    }, p.name), /*#__PURE__*/React.createElement("span", {
      className: "ct"
    }, p.cat, " \xB7 ", p.qty, " un."), /*#__PURE__*/React.createElement("div", {
      className: "bar-track"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bar-fill",
      style: {
        width: `${p.gross / max * 100}%`,
        animationDelay: `${i * 60}ms`
      }
    }))), /*#__PURE__*/React.createElement("span", {
      className: "val"
    }, brlShort(p.gross))));
  })()), /*#__PURE__*/React.createElement("div", {
    className: "card hoverable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.users, null), "Ranking de recorr\xEAncia"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "Clientes mais leais")), recList.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.users, null), /*#__PURE__*/React.createElement("div", null, customers ? 'Nenhum cliente recorrente encontrado.' : 'Carregando...')) : /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Cliente"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Pedidos"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Gasto"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Score"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Rec\xEAncia"))), /*#__PURE__*/React.createElement("tbody", null, recList.map((c, i) => /*#__PURE__*/React.createElement("tr", {
    key: c.id || i,
    className: "row-clickable",
    onClick: () => setOpenClient(c)
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sb-avatar",
    style: {
      width: 28,
      height: 28,
      fontSize: 10,
      background: i === 0 ? 'linear-gradient(135deg, var(--gold), var(--gold-2))' : undefined,
      color: i === 0 ? '#1a1408' : undefined
    }
  }, c.name.split(' ').map(s => s[0]).slice(0, 2).join('')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--ink)',
      fontWeight: 500
    },
    className: "client-link"
  }, c.name), /*#__PURE__*/React.createElement("span", {
    className: "tag gold"
  }, c.status)))), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, c.orders), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, brlShort(c.spent)), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: c.score >= 8 ? 'var(--gold)' : c.score >= 6 ? 'var(--ink)' : 'var(--ink-3)'
    }
  }, c.score, "/10")), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, c.recency))))))), /*#__PURE__*/React.createElement("div", {
    className: "grid row-half mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card pause-card hoverable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.users, null), "Clientes em pausa"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "Recorrentes sem comprar h\xE1 +15 dias")), pausaData.healthy ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "health"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pulse"
  }), /*#__PURE__*/React.createElement("b", null, "Base de clientes saud\xE1vel"), /*#__PURE__*/React.createElement("small", null, "Nenhum cliente recorrente em pausa")), /*#__PURE__*/React.createElement("div", {
    className: "pair"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mini"
  }, /*#__PURE__*/React.createElement("small", null, "Clientes recorrentes ativos"), /*#__PURE__*/React.createElement("b", null, pausaData.activeRecurrent)), /*#__PURE__*/React.createElement("div", {
    className: "mini"
  }, /*#__PURE__*/React.createElement("small", null, "Ticket m\xE9dio (fiel)"), /*#__PURE__*/React.createElement("b", null, brl(pausaData.avgTicket)))), /*#__PURE__*/React.createElement("div", {
    className: "highlight"
  }, /*#__PURE__*/React.createElement("small", null, "Intervalo de recompra"), /*#__PURE__*/React.createElement("b", null, "M\xE9dia de ", pausaData.repurchaseInterval, " dias (", pausaData.repurchaseStatus, ")"))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "health"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pulse",
    style: {
      background: 'var(--down)'
    }
  }), /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--down)'
    }
  }, pausaData.paused, " cliente", pausaData.paused > 1 ? 's' : '', " em pausa"), /*#__PURE__*/React.createElement("small", null, "Recorrentes sem comprar h\xE1 +15 dias")), /*#__PURE__*/React.createElement("div", {
    className: "pair"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mini"
  }, /*#__PURE__*/React.createElement("small", null, "Clientes recorrentes ativos"), /*#__PURE__*/React.createElement("b", null, pausaData.activeRecurrent)), /*#__PURE__*/React.createElement("div", {
    className: "mini"
  }, /*#__PURE__*/React.createElement("small", null, "Ticket m\xE9dio (fiel)"), /*#__PURE__*/React.createElement("b", null, brl(pausaData.avgTicket)))))), /*#__PURE__*/React.createElement("div", {
    className: "card hoverable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.chart, null), "Faturamento acumulado"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, PERIOD_LABEL[period])), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 140
    }
  }, /*#__PURE__*/React.createElement(Ic.chart, null), /*#__PURE__*/React.createElement("div", null, "Carregando...")) : /*#__PURE__*/React.createElement(CumulativeChart, {
    current: serie.current,
    previous: serie.previous
  }), /*#__PURE__*/React.createElement("div", {
    className: "legend",
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    style: {
      background: 'var(--gold)'
    }
  }), "Este per\xEDodo", ' ', /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--ink)',
      marginLeft: 4
    }
  }, brlShort(serie.current.reduce((s, d) => s + (d.value || 0), 0)))), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    style: {
      background: 'var(--ink-4)'
    }
  }), "Per\xEDodo anterior", ' ', /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--ink-2)',
      marginLeft: 4
    }
  }, brlShort(serie.previous.reduce((s, d) => s + (d.value || 0), 0))))))), /*#__PURE__*/React.createElement("div", {
    className: "grid row-half mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card fornada hoverable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fornada-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "when"
  }, /*#__PURE__*/React.createElement(Ic.flame, {
    style: {
      display: 'inline',
      verticalAlign: 'middle',
      marginRight: 4
    }
  }), "Pr\xF3xima fornada"), /*#__PURE__*/React.createElement("h2", null, fornadaWhen), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)',
      marginTop: 2
    }
  }, "Janela de retirada: 9h \u2013 14h")), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "Ver detalhes"
  }, /*#__PURE__*/React.createElement(Ic.chev, null))), /*#__PURE__*/React.createElement("div", {
    className: "fornada-stats"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fornada-stat"
  }, /*#__PURE__*/React.createElement("small", null, "Pedidos"), /*#__PURE__*/React.createElement("b", null, fornadaPedidos)), /*#__PURE__*/React.createElement("div", {
    className: "fornada-stat"
  }, /*#__PURE__*/React.createElement("small", null, "Itens"), /*#__PURE__*/React.createElement("b", null, fornadaItens || fornadaPedidos)), /*#__PURE__*/React.createElement("div", {
    className: "fornada-stat"
  }, /*#__PURE__*/React.createElement("small", null, "Receita"), /*#__PURE__*/React.createElement("b", null, brlShort(fornadaFaturamento)))), /*#__PURE__*/React.createElement("div", {
    className: "fornada-progress"
  }, /*#__PURE__*/React.createElement("small", null, /*#__PURE__*/React.createElement("span", null, "Capacidade preenchida"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--gold)',
      fontWeight: 500
    }
  }, Math.round(fornadaCapacidade * 100), "%")), /*#__PURE__*/React.createElement("div", {
    className: "progress-track"
  }, /*#__PURE__*/React.createElement("div", {
    className: "progress-fill",
    style: {
      width: `${Math.min(100, fornadaCapacidade * 100)}%`
    }
  })))), /*#__PURE__*/React.createElement("div", {
    className: "card hoverable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.bell, null), "Alertas"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, alerts.filter(a => a.kind !== 'ok').length || 'Nenhum', " ativo", alerts.filter(a => a.kind !== 'ok').length !== 1 ? 's' : '')), /*#__PURE__*/React.createElement("div", {
    className: "alert-list"
  }, alerts.map((a, i) => /*#__PURE__*/React.createElement("div", {
    className: `alert ${a.kind}`,
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "a-ic"
  }, a.kind === 'info' ? /*#__PURE__*/React.createElement(Ic.info, null) : a.kind === 'ok' ? /*#__PURE__*/React.createElement(Ic.shield, null) : /*#__PURE__*/React.createElement(Ic.warn, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("b", null, a.title), /*#__PURE__*/React.createElement("small", null, a.body)), /*#__PURE__*/React.createElement("small", {
    style: {
      flexShrink: 0,
      color: 'var(--ink-4)',
      fontSize: 10
    }
  }, a.meta)))))), openClient && /*#__PURE__*/React.createElement(ClientCardModal, {
    client: openClient,
    onClose: () => setOpenClient(null)
  }));
}
window.Dashboard = Dashboard;
