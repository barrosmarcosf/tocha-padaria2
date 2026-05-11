/* global React, Ic */
const {
  useState: useStX
} = React;
function PH({
  title,
  subtitle,
  badge
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sub",
    style: {
      marginBottom: 6
    }
  }, "Intelig\xEAncia"), /*#__PURE__*/React.createElement("h1", null, title, badge && /*#__PURE__*/React.createElement("span", {
    className: "page-badge"
  }, badge)), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, subtitle)));
}

/* ========== INSIGHTS AUTOMÁTICOS ========== */
const INSIGHTS = [{
  title: 'Pico de Visitas',
  tone: 'c1',
  subtitle: 'Distribuição semanal das visitas ao site',
  unit: '%',
  kind: 'col',
  data: [{
    l: 'Seg',
    v: 8
  }, {
    l: 'Ter',
    v: 11
  }, {
    l: 'Qua',
    v: 9
  }, {
    l: 'Qui',
    v: 11
  }, {
    l: 'Sex',
    v: 28
  }, {
    l: 'Sáb',
    v: 33
  }, {
    l: 'Dom',
    v: 0
  }],
  notes: ['Sextas e sábados concentram 61% das visitas', 'Pico diário entre 19h–21h (38% do tráfego)', 'Segunda-feira: −42% vs. fins de semana']
}, {
  title: 'Pico de Compras',
  tone: 'c2',
  subtitle: 'Volume de pedidos por dia da semana',
  unit: '%',
  kind: 'col',
  data: [{
    l: 'Seg',
    v: 6
  }, {
    l: 'Ter',
    v: 9
  }, {
    l: 'Qua',
    v: 8
  }, {
    l: 'Qui',
    v: 12
  }, {
    l: 'Sex',
    v: 23
  }, {
    l: 'Sáb',
    v: 34
  }, {
    l: 'Dom',
    v: 8
  }],
  notes: ['Sábado lidera com 34% do volume total', 'Melhor horário para compras: 20h–22h', 'Compras parceladas mais frequentes às sextas']
}, {
  title: 'Conversão por Pagamento',
  tone: 'c3',
  subtitle: 'Taxa de conclusão por método (%)',
  unit: '%',
  kind: 'bar',
  data: [{
    l: 'PIX',
    v: 78
  }, {
    l: 'Crédito',
    v: 63
  }, {
    l: 'Débito',
    v: 71
  }],
  notes: ['PIX tem taxa de conclusão 23% maior que cartão', 'Cartão de crédito gera tickets 18% maiores', 'Débito tem menor taxa de abandono no checkout']
}, {
  title: 'Padrões de Compra',
  tone: 'c4',
  subtitle: 'Recompra por janela de dias',
  unit: '%',
  kind: 'col',
  data: [{
    l: '0–3d',
    v: 12
  }, {
    l: '4–7d',
    v: 34
  }, {
    l: '8–14d',
    v: 34
  }, {
    l: '15–30d',
    v: 14
  }, {
    l: '30+',
    v: 6
  }],
  notes: ['68% dos clientes recompram em 7–14 dias', 'Clientes de sábado têm LTV 31% maior', 'Combos aparecem em 44% dos carrinhos']
}];
const TONE_COLOR = {
  c1: 'oklch(0.72 0.16 280)',
  c2: 'oklch(0.82 0.13 70)',
  c3: 'oklch(0.78 0.14 160)',
  c4: 'oklch(0.74 0.16 305)'
};
function ColumnChart({
  data,
  color,
  unit
}) {
  const max = Math.max(...data.map(d => d.v), 1);
  const W = 520,
    H = 180,
    P = 28,
    BW = (W - P * 2) / data.length * 0.62;
  const step = (W - P * 2) / data.length;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    width: "100%",
    style: {
      display: 'block'
    }
  }, [0.25, 0.5, 0.75, 1].map(g => /*#__PURE__*/React.createElement("line", {
    key: g,
    x1: P,
    x2: W - P,
    y1: H - 28 - (H - 56) * g,
    y2: H - 28 - (H - 56) * g,
    stroke: "var(--line)",
    strokeDasharray: "2 4"
  })), data.map((d, i) => {
    const h = d.v / max * (H - 56);
    const x = P + step * i + (step - BW) / 2;
    const y = H - 28 - h;
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, /*#__PURE__*/React.createElement("rect", {
      x: x,
      y: y,
      width: BW,
      height: h,
      rx: "4",
      fill: color,
      opacity: "0.85"
    }), /*#__PURE__*/React.createElement("text", {
      x: x + BW / 2,
      y: y - 6,
      textAnchor: "middle",
      fontSize: "11",
      fill: "var(--ink-2)",
      fontFamily: "var(--mono)"
    }, d.v, unit), /*#__PURE__*/React.createElement("text", {
      x: x + BW / 2,
      y: H - 10,
      textAnchor: "middle",
      fontSize: "11",
      fill: "var(--ink-4)"
    }, d.l));
  }));
}
function BarChart({
  data,
  color,
  unit
}) {
  const max = Math.max(...data.map(d => d.v), 1);
  const W = 520,
    H = 180,
    P = 70,
    RH = (H - 24) / data.length * 0.68;
  const step = (H - 24) / data.length;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    width: "100%",
    style: {
      display: 'block'
    }
  }, data.map((d, i) => {
    const w = d.v / max * (W - P - 60);
    const y = 12 + step * i + (step - RH) / 2;
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, /*#__PURE__*/React.createElement("text", {
      x: P - 10,
      y: y + RH / 2 + 4,
      textAnchor: "end",
      fontSize: "12",
      fill: "var(--ink-2)"
    }, d.l), /*#__PURE__*/React.createElement("rect", {
      x: P,
      y: y,
      width: W - P - 60,
      height: RH,
      rx: "4",
      fill: "var(--panel-2)"
    }), /*#__PURE__*/React.createElement("rect", {
      x: P,
      y: y,
      width: w,
      height: RH,
      rx: "4",
      fill: color,
      opacity: "0.85"
    }), /*#__PURE__*/React.createElement("text", {
      x: P + w + 8,
      y: y + RH / 2 + 4,
      fontSize: "12",
      fill: "var(--ink)",
      fontFamily: "var(--mono)"
    }, d.v, unit));
  }));
}
function InsightsPage() {
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PH, {
    title: "Insights Autom\xE1ticos",
    subtitle: "Padr\xF5es identificados nos dados da sua padaria."
  }), /*#__PURE__*/React.createElement("div", {
    className: "grid row-2"
  }, INSIGHTS.map((g, i) => {
    const c = TONE_COLOR[g.tone];
    const Chart = g.kind === 'bar' ? BarChart : ColumnChart;
    return /*#__PURE__*/React.createElement("div", {
      className: "card hoverable insight-card",
      key: i
    }, /*#__PURE__*/React.createElement("div", {
      className: "card-head"
    }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement("span", {
      className: `insight-chip t${g.tone}`
    }), g.title), /*#__PURE__*/React.createElement("span", {
      className: "meta"
    }, g.subtitle)), /*#__PURE__*/React.createElement("div", {
      style: {
        margin: '8px 0 14px'
      }
    }, /*#__PURE__*/React.createElement(Chart, {
      data: g.data,
      color: c,
      unit: g.unit
    })), /*#__PURE__*/React.createElement("ul", {
      className: "insight-list"
    }, g.notes.map((t, j) => /*#__PURE__*/React.createElement("li", {
      key: j
    }, /*#__PURE__*/React.createElement("span", {
      className: `bullet t${g.tone}`
    }), t))));
  })));
}

/* ========== INTELIGÊNCIA — DASHBOARD ========== */
const MESES_LONGO = [{
  l: 'Jun/2025',
  f: 0,
  p: 0,
  lr: 0
}, {
  l: 'Jul/2025',
  f: 0,
  p: 0,
  lr: 0
}, {
  l: 'Ago/2025',
  f: 0,
  p: 0,
  lr: 0
}, {
  l: 'Set/2025',
  f: 0,
  p: 0,
  lr: 0
}, {
  l: 'Out/2025',
  f: 0,
  p: 0,
  lr: 0
}, {
  l: 'Nov/2025',
  f: 0,
  p: 0,
  lr: 0
}, {
  l: 'Dez/2025',
  f: 0,
  p: 0,
  lr: 0
}, {
  l: 'Jan/2026',
  f: 0,
  p: 0,
  lr: 0
}, {
  l: 'Fev/2026',
  f: 0,
  p: 0,
  lr: 0
}, {
  l: 'Mar/2026',
  f: 0,
  p: 0,
  lr: 0
}, {
  l: 'Abr/2026',
  f: 126.7,
  p: 2,
  lr: 76
}, {
  l: 'Mai/2026',
  f: 8,
  p: 4,
  lr: 4.8
}];
function LongTermChart({
  data
}) {
  const W = 1100,
    H = 320,
    PL = 56,
    PR = 56,
    PT = 24,
    PB = 40;
  const iw = W - PL - PR,
    ih = H - PT - PB;
  const maxR = Math.max(...data.map(d => Math.max(d.f, d.lr)), 1);
  const maxP = Math.max(...data.map(d => d.p), 1);
  const step = iw / (data.length - 1);
  const bw = Math.min(step * 0.35, 26);
  const yR = v => PT + ih - v / maxR * ih;
  const yP = v => PT + ih - v / maxP * ih;
  const xAt = i => PL + step * i;
  const [hov, setHov] = useStX(-1);
  const pedPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yP(d.p)}`).join(' ');
  const lrPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yR(d.lr)}`).join(' ');
  const lrArea = `${lrPath} L ${xAt(data.length - 1)} ${PT + ih} L ${xAt(0)} ${PT + ih} Z`;
  const yGridR = [0, 0.25, 0.5, 0.75, 1];
  return /*#__PURE__*/React.createElement("div", {
    className: "lt-chart-wrap"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    width: "100%",
    style: {
      display: 'block'
    }
  }, yGridR.map((g, i) => /*#__PURE__*/React.createElement("g", {
    key: i
  }, /*#__PURE__*/React.createElement("line", {
    x1: PL,
    x2: W - PR,
    y1: PT + ih - ih * g,
    y2: PT + ih - ih * g,
    stroke: "var(--line)",
    strokeDasharray: "2 4"
  }), /*#__PURE__*/React.createElement("text", {
    x: PL - 10,
    y: PT + ih - ih * g + 4,
    textAnchor: "end",
    fontSize: "10",
    fill: "oklch(0.55 0.20 25)",
    fontFamily: "var(--mono)"
  }, "R$ ", maxR * g >= 1000 ? `${(maxR * g / 1000).toFixed(1)}k` : Math.round(maxR * g)), /*#__PURE__*/React.createElement("text", {
    x: W - PR + 10,
    y: PT + ih - ih * g + 4,
    fontSize: "10",
    fill: "oklch(0.55 0.20 25)",
    fontFamily: "var(--mono)"
  }, (maxP * g).toFixed(1), " un"))), data.map((d, i) => {
    const h = d.f / maxR * ih;
    return /*#__PURE__*/React.createElement("rect", {
      key: 'b' + i,
      x: xAt(i) - bw / 2,
      y: yR(d.f),
      width: bw,
      height: h,
      rx: "3",
      fill: "oklch(0.55 0.22 285)",
      opacity: hov === -1 || hov === i ? 1 : 0.4
    });
  }), /*#__PURE__*/React.createElement("path", {
    d: lrArea,
    fill: "oklch(0.78 0.14 160)",
    opacity: "0.15"
  }), /*#__PURE__*/React.createElement("path", {
    d: lrPath,
    fill: "none",
    stroke: "oklch(0.62 0.15 160)",
    strokeWidth: "2"
  }), data.map((d, i) => /*#__PURE__*/React.createElement("circle", {
    key: 'lr' + i,
    cx: xAt(i),
    cy: yR(d.lr),
    r: "4",
    fill: "white",
    stroke: "oklch(0.62 0.15 160)",
    strokeWidth: "2"
  })), /*#__PURE__*/React.createElement("path", {
    d: pedPath,
    fill: "none",
    stroke: "oklch(0.6 0.22 25)",
    strokeWidth: "2"
  }), data.map((d, i) => /*#__PURE__*/React.createElement("circle", {
    key: 'p' + i,
    cx: xAt(i),
    cy: yP(d.p),
    r: "4",
    fill: "white",
    stroke: "oklch(0.6 0.22 25)",
    strokeWidth: "2"
  })), data.map((d, i) => /*#__PURE__*/React.createElement("text", {
    key: 'x' + i,
    x: xAt(i),
    y: H - 14,
    textAnchor: "middle",
    fontSize: "10",
    fill: "var(--ink-4)",
    fontFamily: "var(--mono)"
  }, d.l)), data.map((d, i) => /*#__PURE__*/React.createElement("rect", {
    key: 'h' + i,
    x: xAt(i) - step / 2,
    y: PT,
    width: step,
    height: ih,
    fill: "transparent",
    onMouseEnter: () => setHov(i),
    onMouseLeave: () => setHov(-1)
  })), hov >= 0 && /*#__PURE__*/React.createElement("g", {
    pointerEvents: "none"
  }, /*#__PURE__*/React.createElement("line", {
    x1: xAt(hov),
    x2: xAt(hov),
    y1: PT,
    y2: PT + ih,
    stroke: "var(--line-2)",
    strokeDasharray: "3 3"
  }), /*#__PURE__*/React.createElement("g", {
    transform: `translate(${Math.min(xAt(hov) + 12, W - 170)}, ${PT + 12})`
  }, /*#__PURE__*/React.createElement("rect", {
    width: "160",
    height: "78",
    rx: "6",
    fill: "var(--panel)",
    stroke: "var(--line-2)"
  }), /*#__PURE__*/React.createElement("text", {
    x: "10",
    y: "20",
    fontSize: "11",
    fill: "var(--ink)",
    fontWeight: "600"
  }, data[hov].l), /*#__PURE__*/React.createElement("text", {
    x: "10",
    y: "38",
    fontSize: "11",
    fill: "var(--ink-3)"
  }, /*#__PURE__*/React.createElement("tspan", {
    fill: "oklch(0.55 0.22 285)"
  }, "\u25AA "), " Faturamento: R$ ", data[hov].f.toFixed(0)), /*#__PURE__*/React.createElement("text", {
    x: "10",
    y: "54",
    fontSize: "11",
    fill: "var(--ink-3)"
  }, /*#__PURE__*/React.createElement("tspan", {
    fill: "oklch(0.6 0.22 25)"
  }, "\u25AA "), " Pedidos: ", data[hov].p, " un"), /*#__PURE__*/React.createElement("text", {
    x: "10",
    y: "70",
    fontSize: "11",
    fill: "var(--ink-3)"
  }, /*#__PURE__*/React.createElement("tspan", {
    fill: "oklch(0.62 0.15 160)"
  }, "\u25AA "), " Lucro Real: R$ ", data[hov].lr.toFixed(1))))), /*#__PURE__*/React.createElement("div", {
    className: "lt-legend"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "lg-sw",
    style: {
      background: 'oklch(0.55 0.22 285)'
    }
  }), "Faturamento Bruto"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "lg-sw o",
    style: {
      borderColor: 'oklch(0.6 0.22 25)'
    }
  }), "Pedidos"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "lg-sw o",
    style: {
      borderColor: 'oklch(0.62 0.15 160)'
    }
  }), "Lucro Real")));
}
const CAL_2026_MAI = (() => {
  const sales = {
    3: {
      v: 6,
      p: 2
    },
    6: {
      v: 1,
      p: 1
    },
    11: {
      v: 1,
      p: 1
    }
  };
  const startDow = 5;
  const days = 31;
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push({
    d,
    ...(sales[d] || {
      v: 0
    })
  });
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
})();
const RANKING_ITENS = [{
  p: 'Sourdough Tradicional (São João)',
  cat: 'PADARIA',
  qtd: 5,
  bruto: 128,
  lucro: 76.8
}, {
  p: 'Focaccia de Damasco & Gorgonzola',
  cat: 'PADARIA',
  qtd: 1,
  bruto: 5,
  lucro: 3
}, {
  p: 'Sourdough Tradicional',
  cat: 'PADARIA',
  qtd: 1,
  bruto: 1,
  lucro: 0.6
}];
function InteligenciaPage() {
  const totalMes = CAL_2026_MAI.flat().reduce((a, c) => a + (c?.v || 0), 0);
  const totalSemana = w => w.reduce((a, c) => a + (c?.v || 0), 0);
  const totalDow = i => CAL_2026_MAI.reduce((a, w) => a + (w[i]?.v || 0), 0);
  const dows = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sub",
    style: {
      marginBottom: 6
    }
  }, "Performance"), /*#__PURE__*/React.createElement("h1", null, "Intelig\xEAncia"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Resumo financeiro e operacional da padaria."))), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-card"
  }, /*#__PURE__*/React.createElement("small", null, "VENDAS TOTAIS"), /*#__PURE__*/React.createElement("b", null, "R$ 134,00"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("em", {
    className: "up-text"
  }, "\u25B2 +12.4%"), " vs. m\xEAs anterior")), /*#__PURE__*/React.createElement("div", {
    className: "kpi-card"
  }, /*#__PURE__*/React.createElement("small", null, "TICKET M\xC9DIO"), /*#__PURE__*/React.createElement("b", null, "R$ 22,33"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("em", {
    className: "dn-text"
  }, "\u25BC \u22123.1%"), " vs. m\xEAs anterior")), /*#__PURE__*/React.createElement("div", {
    className: "kpi-card"
  }, /*#__PURE__*/React.createElement("small", null, "PEDIDOS"), /*#__PURE__*/React.createElement("b", null, "6"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("em", {
    className: "up-text"
  }, "\u25B2 +100%"), " vs. m\xEAs anterior"))), /*#__PURE__*/React.createElement("div", {
    className: "card mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head",
    style: {
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0
    }
  }, "Evolu\xE7\xE3o de Longo Prazo"), /*#__PURE__*/React.createElement("small", {
    style: {
      color: 'var(--ink-3)'
    }
  }, "Hist\xF3rico mensal consolidado dos \xFAltimos 12 meses"))), /*#__PURE__*/React.createElement("div", {
    className: "lt-summary"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lt-sum-item"
  }, /*#__PURE__*/React.createElement("small", null, "\xDALTIMO M\xCAS"), /*#__PURE__*/React.createElement("b", {
    className: "lt-mono"
  }, "Mai/2026")), /*#__PURE__*/React.createElement("div", {
    className: "lt-sum-item"
  }, /*#__PURE__*/React.createElement("small", null, "FATURAMENTO"), /*#__PURE__*/React.createElement("div", {
    className: "lt-sum-line"
  }, /*#__PURE__*/React.createElement("b", null, "R$ 8"), /*#__PURE__*/React.createElement("span", {
    className: "delta dn"
  }, "\u221293.7%"))), /*#__PURE__*/React.createElement("div", {
    className: "lt-sum-item"
  }, /*#__PURE__*/React.createElement("small", null, "VENDAS"), /*#__PURE__*/React.createElement("div", {
    className: "lt-sum-line"
  }, /*#__PURE__*/React.createElement("b", null, "4"), /*#__PURE__*/React.createElement("span", {
    className: "delta up"
  }, "+100.0%"))), /*#__PURE__*/React.createElement("div", {
    className: "lt-sum-item"
  }, /*#__PURE__*/React.createElement("small", null, "LUCRO REAL"), /*#__PURE__*/React.createElement("div", {
    className: "lt-sum-line"
  }, /*#__PURE__*/React.createElement("b", null, "R$ 4,8"), /*#__PURE__*/React.createElement("span", {
    className: "delta dn"
  }, "\u221293.7%")))), /*#__PURE__*/React.createElement(LongTermChart, {
    data: MESES_LONGO
  })), /*#__PURE__*/React.createElement("div", {
    className: "card mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0
    }
  }, "Vendas do m\xEAs")), /*#__PURE__*/React.createElement("select", {
    className: "inp",
    style: {
      width: 180
    },
    defaultValue: "2026-05"
  }, /*#__PURE__*/React.createElement("option", {
    value: "2026-05"
  }, "Maio de 2026"), /*#__PURE__*/React.createElement("option", {
    value: "2026-04"
  }, "Abril de 2026"), /*#__PURE__*/React.createElement("option", {
    value: "2026-03"
  }, "Mar\xE7o de 2026"))), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '1fr 1fr',
      gap: 14,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-soft v"
  }, /*#__PURE__*/React.createElement("small", null, "VENDA TOTAL"), /*#__PURE__*/React.createElement("b", null, "R$ ", totalMes.toFixed(2).replace('.', ','))), /*#__PURE__*/React.createElement("div", {
    className: "kpi-soft"
  }, /*#__PURE__*/React.createElement("small", null, "PEDIDOS"), /*#__PURE__*/React.createElement("b", null, "4"))), /*#__PURE__*/React.createElement("div", {
    className: "cal-hint"
  }, "As informa\xE7\xF5es correspondem ao m\xEAs de Maio de 2026"), /*#__PURE__*/React.createElement("div", {
    className: "cal-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cal-head"
  }, dows.map(d => /*#__PURE__*/React.createElement("div", {
    key: d
  }, d)), /*#__PURE__*/React.createElement("div", {
    className: "cal-total"
  }, "TOTAL SEMANA")), CAL_2026_MAI.map((w, wi) => /*#__PURE__*/React.createElement("div", {
    className: "cal-row",
    key: wi
  }, w.map((c, ci) => /*#__PURE__*/React.createElement("div", {
    className: `cal-cell ${c && c.v > 0 ? 'has' : ''} ${!c ? 'empty' : ''}`,
    key: ci
  }, c && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "cal-d"
  }, c.d), /*#__PURE__*/React.createElement("div", {
    className: "cal-val"
  }, /*#__PURE__*/React.createElement("b", null, "R$ ", c.v.toFixed(2).replace('.', ',')), c.p && /*#__PURE__*/React.createElement("small", null, c.p, " pedido", c.p > 1 ? 's' : ''))))), /*#__PURE__*/React.createElement("div", {
    className: "cal-cell wk-total"
  }, /*#__PURE__*/React.createElement("b", null, "R$ ", totalSemana(w).toFixed(2).replace('.', ','))))), /*#__PURE__*/React.createElement("div", {
    className: "cal-row cal-foot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cal-foot-l"
  }, "TOTAL M\xCAS"), Array.from({
    length: 6
  }).map((_, i) => /*#__PURE__*/React.createElement("div", {
    className: "cal-cell wk-total",
    key: i
  }, /*#__PURE__*/React.createElement("b", null, "R$ ", totalDow(i + 1).toFixed(2).replace('.', ',')))), /*#__PURE__*/React.createElement("div", {
    className: "cal-cell wk-total month"
  }, /*#__PURE__*/React.createElement("b", null, "R$ ", totalMes.toFixed(2).replace('.', ',')))))), /*#__PURE__*/React.createElement("div", {
    className: "card mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0
    }
  }, "Ranking de Itens Vendidos (Top 100)")), /*#__PURE__*/React.createElement("div", {
    className: "rk-table"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rk-head"
  }, /*#__PURE__*/React.createElement("div", null, "#"), /*#__PURE__*/React.createElement("div", null, "PRODUTO"), /*#__PURE__*/React.createElement("div", null, "CAT."), /*#__PURE__*/React.createElement("div", {
    className: "rt"
  }, "QTD"), /*#__PURE__*/React.createElement("div", {
    className: "rt"
  }, "BRUTO"), /*#__PURE__*/React.createElement("div", {
    className: "rt"
  }, "LUCRO")), RANKING_ITENS.map((r, i) => /*#__PURE__*/React.createElement("div", {
    className: "rk-row",
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: "rk-pos"
  }, i + 1), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, r.p)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "tag"
  }, r.cat)), /*#__PURE__*/React.createElement("div", {
    className: "rt num"
  }, r.qtd), /*#__PURE__*/React.createElement("div", {
    className: "rt num"
  }, "R$ ", r.bruto.toFixed(2).replace('.', ',')), /*#__PURE__*/React.createElement("div", {
    className: "rt num up-text"
  }, "R$ ", r.lucro.toFixed(2).replace('.', ',')))))));
}

/* ========== ALERTAS ========== */
const ALERTS = [{
  k: 'crit',
  title: 'Taxa de rejeição',
  desc: '18% — acima do threshold de 10%'
}, {
  k: 'warn',
  title: 'Ticket médio',
  desc: 'Queda de 12% na última semana'
}, {
  k: 'warn',
  title: 'Carrinhos abandonados',
  desc: '32% de aumento nos últimos 3 dias'
}, {
  k: 'warn',
  title: 'Queda de visitas',
  desc: '8% abaixo da média semanal esperada'
}, {
  k: 'ok',
  title: 'Taxa de aprovação',
  desc: 'Acima de 80% — dentro do esperado'
}, {
  k: 'ok',
  title: 'Taxa de conversão',
  desc: 'Estável em 10,8% — dentro da meta'
}, {
  k: 'ok',
  title: 'Perfil do comprador',
  desc: 'Comportamento dentro do padrão histórico'
}];
function AlertasPage() {
  const crit = ALERTS.filter(a => a.k === 'crit').length;
  const warn = ALERTS.filter(a => a.k === 'warn').length;
  const ok = ALERTS.filter(a => a.k === 'ok').length;
  const labels = {
    crit: 'CRÍTICO',
    warn: 'ATENÇÃO',
    ok: 'OK'
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PH, {
    title: "Alertas",
    subtitle: "Indicadores que precisam da sua aten\xE7\xE3o."
  }), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "alert-summary k-crit"
  }, /*#__PURE__*/React.createElement("b", null, crit), /*#__PURE__*/React.createElement("small", null, "CR\xCDTICOS")), /*#__PURE__*/React.createElement("div", {
    className: "alert-summary k-warn"
  }, /*#__PURE__*/React.createElement("b", null, warn), /*#__PURE__*/React.createElement("small", null, "ATEN\xC7\xC3O")), /*#__PURE__*/React.createElement("div", {
    className: "alert-summary k-ok"
  }, /*#__PURE__*/React.createElement("b", null, ok), /*#__PURE__*/React.createElement("small", null, "OK"))), /*#__PURE__*/React.createElement("div", {
    className: "card mt",
    style: {
      padding: 8
    }
  }, ALERTS.map((a, i) => /*#__PURE__*/React.createElement("div", {
    className: `alert-row k-${a.k}`,
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "alert-chip"
  }), /*#__PURE__*/React.createElement("div", {
    className: "alert-text"
  }, /*#__PURE__*/React.createElement("b", null, a.title), /*#__PURE__*/React.createElement("small", null, a.desc)), /*#__PURE__*/React.createElement("span", {
    className: `alert-pill p-${a.k}`
  }, labels[a.k])))));
}

/* ========== FUNIL DE VENDAS ========== */
const FUNIL = [{
  label: 'VISITANTES',
  v: 33,
  pct: 100,
  tone: 'c1'
}, {
  label: 'CARRINHOS CRIADOS',
  v: 10,
  pct: 30.3,
  tone: 'c1',
  step: -0.06
}, {
  label: 'CHECKOUTS INICIADOS',
  v: 1,
  pct: 3.0,
  tone: 'c1',
  step: -0.13
}, {
  label: 'PAGAMENTOS CONCLUÍDOS',
  v: 0,
  pct: 0.0,
  tone: 'c2',
  step: -0.2
}];
function FunilPage() {
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PH, {
    title: "Funil de Vendas",
    subtitle: "Onde os clientes entram \u2014 e onde saem."
  }), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "funnel"
  }, FUNIL.map((s, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: `funnel-step t${s.tone}`,
    style: {
      marginLeft: `${i * 6}%`,
      marginRight: `${i * 2}%`
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "funnel-chip"
  }), /*#__PURE__*/React.createElement("div", {
    className: "funnel-meta"
  }, /*#__PURE__*/React.createElement("small", null, s.label), /*#__PURE__*/React.createElement("b", null, s.v)), /*#__PURE__*/React.createElement("div", {
    className: "funnel-pct"
  }, /*#__PURE__*/React.createElement("b", null, s.pct.toFixed(1), "%"), /*#__PURE__*/React.createElement("small", null, "de convers\xE3o"))), i < FUNIL.length - 1 && /*#__PURE__*/React.createElement("div", {
    className: "funnel-arrow"
  }, "\u2193"))))), /*#__PURE__*/React.createElement("div", {
    className: "grid row-2 mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "ABANDONO"), /*#__PURE__*/React.createElement("div", {
    className: "abandon-row down"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Carrinhos abandonados"), /*#__PURE__*/React.createElement("small", null, "90,0% dos carrinhos")), /*#__PURE__*/React.createElement("b", {
    className: "abandon-v"
  }, "9")), /*#__PURE__*/React.createElement("div", {
    className: "abandon-row down"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Checkouts abandonados"), /*#__PURE__*/React.createElement("small", null, "100,0% dos checkouts")), /*#__PURE__*/React.createElement("b", {
    className: "abandon-v"
  }, "1"))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "RECUPERA\xC7\xC3O"), /*#__PURE__*/React.createElement("div", {
    className: "abandon-row up"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Carrinhos recuperados"), /*#__PURE__*/React.createElement("small", null, "233,3% dos abandonados")), /*#__PURE__*/React.createElement("b", {
    className: "abandon-v"
  }, "21")), /*#__PURE__*/React.createElement("div", {
    className: "abandon-row up"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Checkouts recuperados"), /*#__PURE__*/React.createElement("small", null, "1400,0% dos abandonados")), /*#__PURE__*/React.createElement("b", {
    className: "abandon-v"
  }, "14")))), /*#__PURE__*/React.createElement("div", {
    className: "grid row-2 mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "ORIGEM DO PAGAMENTO"), [{
    l: 'PIX',
    v: 134,
    pct: 68
  }, {
    l: 'Cartão de Crédito',
    v: 48,
    pct: 24
  }, {
    l: 'Cartão de Débito',
    v: 16,
    pct: 8
  }].map((r, i) => /*#__PURE__*/React.createElement("div", {
    className: "origin-row",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "origin-lbl"
  }, r.l), /*#__PURE__*/React.createElement("div", {
    className: "origin-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "origin-fill",
    style: {
      width: `${r.pct}%`
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "origin-v"
  }, /*#__PURE__*/React.createElement("b", null, r.v), " pedidos ", /*#__PURE__*/React.createElement("span", null, r.pct, "%"))))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "insight-chip tc1",
    style: {
      width: 28,
      height: 28,
      marginBottom: 12
    }
  }), /*#__PURE__*/React.createElement("small", {
    className: "section-title",
    style: {
      margin: 0
    }
  }, "TEMPO M\xC9DIO DE CONVERS\xC3O"), /*#__PURE__*/React.createElement("b", {
    style: {
      fontFamily: 'var(--display)',
      fontSize: 40,
      fontWeight: 400,
      color: 'var(--ink)',
      margin: '8px 0'
    }
  }, "8m 32s"), /*#__PURE__*/React.createElement("small", {
    style: {
      color: 'var(--ink-4)'
    }
  }, "do carrinho ao pagamento"))));
}

/* ========== PAINEL DE PAGAMENTOS ========== */
function PagtoPainelPage() {
  const motivos = [{
    l: 'Saldo insuficiente',
    n: 14,
    p: 45
  }, {
    l: 'Cartão expirado',
    n: 7,
    p: 23
  }, {
    l: 'Dados inválidos',
    n: 5,
    p: 16
  }, {
    l: 'Limite excedido',
    n: 3,
    p: 10
  }, {
    l: 'Outros',
    n: 2,
    p: 6
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PH, {
    title: "Painel de Pagamentos",
    subtitle: "Vis\xE3o geral de aprova\xE7\xF5es, rejei\xE7\xF5es e estornos."
  }), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pay-stat k-up"
  }, /*#__PURE__*/React.createElement("small", null, "APROVADOS"), /*#__PURE__*/React.createElement("b", null, "6"), /*#__PURE__*/React.createElement("span", null, "4,5% do total \u2014 R$ 18.450,00")), /*#__PURE__*/React.createElement("div", {
    className: "pay-stat k-warn"
  }, /*#__PURE__*/React.createElement("small", null, "PENDENTES"), /*#__PURE__*/React.createElement("b", null, "115"), /*#__PURE__*/React.createElement("span", null, "R$ 960,00")), /*#__PURE__*/React.createElement("div", {
    className: "pay-stat k-down"
  }, /*#__PURE__*/React.createElement("small", null, "REJEITADOS"), /*#__PURE__*/React.createElement("b", null, "10"), /*#__PURE__*/React.createElement("span", null, "7,5% do total"))), /*#__PURE__*/React.createElement("div", {
    className: "grid row-2 mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("small", {
    className: "kv-l"
  }, "TOTAL DE TRANSA\xC7\xD5ES"), /*#__PURE__*/React.createElement("b", {
    style: {
      fontFamily: 'var(--display)',
      fontWeight: 400,
      fontSize: 38,
      color: 'var(--ink)'
    }
  }, "134")), /*#__PURE__*/React.createElement("div", {
    className: "card pay-stat k-c1",
    style: {
      background: 'transparent',
      border: '1px solid var(--line-2)'
    }
  }, /*#__PURE__*/React.createElement("small", {
    className: "kv-l"
  }, "ESTORNADOS"), /*#__PURE__*/React.createElement("b", {
    style: {
      fontFamily: 'var(--display)',
      fontWeight: 400,
      fontSize: 38,
      color: 'var(--ink)'
    }
  }, "6"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-3)'
    }
  }, "R$ 420,00"))), /*#__PURE__*/React.createElement("div", {
    className: "card mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "MOTIVOS DE REJEI\xC7\xC3O"), motivos.map((m, i) => /*#__PURE__*/React.createElement("div", {
    className: "origin-row",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "origin-lbl",
    style: {
      color: 'var(--down)'
    }
  }, m.l), /*#__PURE__*/React.createElement("div", {
    className: "origin-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "origin-fill",
    style: {
      width: `${m.p}%`,
      background: 'var(--down)'
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "origin-v"
  }, /*#__PURE__*/React.createElement("b", null, m.n), " ocorr\xEAncias ", /*#__PURE__*/React.createElement("em", {
    style: {
      color: 'var(--down)'
    }
  }, m.p, "%"))))));
}

/* ========== CARDÁPIO ========== */
const CATEGORIAS = [{
  id: 'sourdough',
  name: 'Sourdough',
  desc: 'O clássico da TOCHA: casca crocante, miolo leve e macio.'
}, {
  id: 'focaccia',
  name: 'Focaccias',
  desc: 'Clássicas italianas com azeite de ponta.'
}, {
  id: 'brioches',
  name: 'Brioches',
  desc: 'Manteiga, maciez e recheios indescritíveis.'
}, {
  id: 'mini',
  name: 'Mini Brioches',
  desc: 'Perfeitos para entradas refinadas.'
}, {
  id: 'lanches',
  name: 'Lanches',
  desc: 'Pães brioches para Hambúrguer, Hot Dog e Joelhos.'
}, {
  id: 'folhados',
  name: 'Folhados & Tortas',
  desc: 'Massa folhada incrivelmente crocante.'
}, {
  id: 'doces',
  name: 'Confeitaria & Doces',
  desc: 'A finalização perfeita.'
}, {
  id: 'queijo',
  name: 'Pães de Queijo',
  desc: 'Nossa versão especial em vários recheios.'
}];
const PRODUTOS = [{
  name: 'Sourdough Tradicional (São João)',
  desc: 'O clássico da TOCHA. Crosta caramelizada, miolo alveolado.',
  price: 1.00,
  status: 'ATIVO',
  stock: '2 un.'
}, {
  name: 'Sourdough Integral',
  desc: 'Farinha integral, sabor profundo e nutritivo.',
  price: 55.00,
  status: 'ATIVO',
  stock: '5 un.'
}, {
  name: 'Sourdough Gorgonzola',
  desc: 'Intenso, ousado, inesquecível.',
  price: 68.00,
  status: 'ATIVO',
  stock: 'Esgotado'
}, {
  name: 'Sourdough Parmesão',
  desc: 'Crosta dourada com parmesão caramelizado.',
  price: 68.00,
  status: 'ATIVO',
  stock: 'Esgotado'
}, {
  name: 'Sourdough Provolone',
  desc: 'Levemente defumado, harmonioso.',
  price: 68.00,
  status: 'ATIVO',
  stock: 'Esgotado'
}, {
  name: 'Sourdough Multi Grãos',
  desc: 'Cheio de textura e personalidade.',
  price: 60.00,
  status: 'ATIVO',
  stock: 'Esgotado'
}, {
  name: 'Sourdough Ervas com Queijos',
  desc: 'Ervas frescas e queijos selecionados.',
  price: 65.00,
  status: 'ATIVO',
  stock: 'Esgotado'
}, {
  name: 'Sourdough Azeitonas Pretas',
  desc: 'Mediterrâneo em cada fatia.',
  price: 65.00,
  status: 'ATIVO',
  stock: 'Esgotado'
}, {
  name: 'Sourdough Cheddar, Bacon & Jalapeño',
  desc: 'Para os que gostam de emoção.',
  price: 72.00,
  status: 'ATIVO',
  stock: 'Esgotado'
}, {
  name: 'Sourdough Cacau com Frutas Caramelizadas',
  desc: 'Chocolate, doce, complexo e único.',
  price: 75.00,
  status: 'ATIVO',
  stock: 'Esgotado'
}];
function CategoriaModal({
  cat,
  onClose,
  onSave
}) {
  const [name, setName] = useStX(cat?.name || '');
  const [slug, setSlug] = useStX(cat?.id || '');
  const [desc, setDesc] = useStX(cat?.desc || '');
  const [visible, setVisible] = useStX(cat?.visible !== false);
  const isNew = !cat;
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    className: "modal-x",
    onClick: onClose,
    "aria-label": "Fechar"
  }, "\xD7"), /*#__PURE__*/React.createElement("h2", {
    className: "modal-title"
  }, isNew ? 'Nova Categoria' : 'Editar Categoria'), /*#__PURE__*/React.createElement("p", {
    className: "modal-sub"
  }, "Defina como a categoria aparecer\xE1 para seus clientes."), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "field"
  }, /*#__PURE__*/React.createElement("span", null, "T\xEDtulo da Categoria"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    value: name,
    onChange: e => setName(e.target.value)
  })), /*#__PURE__*/React.createElement("label", {
    className: "field"
  }, /*#__PURE__*/React.createElement("span", null, "Identificador (Slug)"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    value: slug,
    onChange: e => setSlug(e.target.value)
  }))), /*#__PURE__*/React.createElement("label", {
    className: "field",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("span", null, "Breve Descri\xE7\xE3o"), /*#__PURE__*/React.createElement("textarea", {
    className: "inp",
    rows: 2,
    value: desc,
    onChange: e => setDesc(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '1fr 1fr',
      gap: 14,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "field"
  }, /*#__PURE__*/React.createElement("span", null, "Foto de vitrine"), /*#__PURE__*/React.createElement("div", {
    className: "img-slot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "img-empty"
  }, "Escolher Foto"))), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      visibility: 'hidden'
    }
  }, "."), /*#__PURE__*/React.createElement("div", {
    className: "toggle-card"
  }, /*#__PURE__*/React.createElement("label", {
    className: "switch"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: visible,
    onChange: e => setVisible(e.target.checked)
  }), /*#__PURE__*/React.createElement("span", {
    className: "sw-track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sw-thumb"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Categoria Vis\xEDvel"), /*#__PURE__*/React.createElement("small", null, "Status 'Inativa' oculta a categoria e todos seus produtos do site."))))), /*#__PURE__*/React.createElement("div", {
    className: "modal-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    onClick: onClose
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: () => onSave({
      id: slug,
      name,
      desc,
      visible
    })
  }, "Salvar Categoria"))));
}
function ProdutoModal({
  prod,
  onClose,
  onSave
}) {
  const [name, setName] = useStX(prod?.name || '');
  const [price, setPrice] = useStX(prod?.price || 0);
  const [desc, setDesc] = useStX(prod?.desc || '');
  const [estoque, setEstoque] = useStX(prod?.estoque ?? 2);
  const [vendidos] = useStX(prod?.vendidos ?? 0);
  const [active, setActive] = useStX(prod?.status !== 'INATIVO');
  const disp = Math.max(0, estoque - vendidos);
  const fillPct = estoque ? Math.min(100, disp / estoque * 100) : 0;
  const isNew = !prod;
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    className: "modal-x",
    onClick: onClose,
    "aria-label": "Fechar"
  }, "\xD7"), /*#__PURE__*/React.createElement("h2", {
    className: "modal-title"
  }, isNew ? 'Novo Produto' : 'Editar Produto'), /*#__PURE__*/React.createElement("p", {
    className: "modal-sub"
  }, "Cadastre os detalhes do produto para venda."), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '2fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "field"
  }, /*#__PURE__*/React.createElement("span", null, "Nome do Produto"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    value: name,
    onChange: e => setName(e.target.value)
  })), /*#__PURE__*/React.createElement("label", {
    className: "field"
  }, /*#__PURE__*/React.createElement("span", null, "Pre\xE7o (R$)"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    type: "number",
    step: "0.01",
    value: price,
    onChange: e => setPrice(parseFloat(e.target.value) || 0)
  }))), /*#__PURE__*/React.createElement("label", {
    className: "field",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("span", null, "Descri\xE7\xE3o Complementar"), /*#__PURE__*/React.createElement("textarea", {
    className: "inp",
    rows: 3,
    value: desc,
    onChange: e => setDesc(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '1fr 1fr',
      gap: 14,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "field"
  }, /*#__PURE__*/React.createElement("span", null, "Foto do Produto"), /*#__PURE__*/React.createElement("div", {
    className: "img-slot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "img-empty"
  }, "Escolher Foto"))), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD25 Estoque Base (Fornada)"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    type: "number",
    value: estoque,
    onChange: e => setEstoque(parseInt(e.target.value) || 0)
  }), /*#__PURE__*/React.createElement("small", {
    className: "hint"
  }, "Total produzido para venda nesta fornada."), /*#__PURE__*/React.createElement("div", {
    className: "stock-card",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "stock-head"
  }, /*#__PURE__*/React.createElement("small", null, "DISPON\xCDVEL AGORA"), /*#__PURE__*/React.createElement("span", {
    className: "tag warn"
  }, "\u2193 ", vendidos, " VENDIDOS")), /*#__PURE__*/React.createElement("b", {
    className: "stock-num"
  }, disp), /*#__PURE__*/React.createElement("div", {
    className: "stock-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stock-fill",
    style: {
      width: `${fillPct}%`
    }
  })), /*#__PURE__*/React.createElement("small", {
    className: "hint"
  }, "Saldo dispon\xEDvel para novas compras.")), /*#__PURE__*/React.createElement("div", {
    className: "toggle-card",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "switch"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: active,
    onChange: e => setActive(e.target.checked)
  }), /*#__PURE__*/React.createElement("span", {
    className: "sw-track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sw-thumb"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Produto Ativo"))))), /*#__PURE__*/React.createElement("div", {
    className: "modal-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    onClick: onClose
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: () => onSave({
      name,
      price,
      desc,
      estoque,
      status: active ? 'ATIVO' : 'INATIVO'
    })
  }, "Salvar Produto"))));
}
function CardapioPage() {
  const [sel, setSel] = useStX('sourdough');
  const [cats, setCats] = useStX(CATEGORIAS.map(c => ({
    ...c,
    visible: true
  })));
  const [prods, setProds] = useStX(PRODUTOS.map(p => ({
    ...p,
    estoque: p.stock === 'Esgotado' ? 0 : parseInt(p.stock) || 2,
    vendidos: p.stock === 'Esgotado' ? parseInt(p.stock) || 2 : 0
  })));
  const [catModal, setCatModal] = useStX(null);
  const [prodModal, setProdModal] = useStX(null);
  const stop = e => e.stopPropagation();
  const editCat = (cat, e) => {
    stop(e);
    setCatModal({
      cat
    });
  };
  const delCat = (cat, e) => {
    stop(e);
    if (confirm(`Excluir categoria "${cat.name}"?`)) setCats(cats.filter(c => c.id !== cat.id));
  };
  const newCat = () => setCatModal({
    cat: null
  });
  const saveCat = data => {
    if (catModal.cat) setCats(cats.map(c => c.id === catModal.cat.id ? {
      ...c,
      ...data
    } : c));else setCats([...cats, {
      ...data
    }]);
    setCatModal(null);
  };
  const editProd = (p, e) => {
    stop(e);
    setProdModal({
      prod: p
    });
  };
  const delProd = (p, e) => {
    stop(e);
    if (confirm(`Excluir produto "${p.name}"?`)) setProds(prods.filter(x => x !== p));
  };
  const newProd = () => setProdModal({
    prod: null
  });
  const saveProd = data => {
    if (prodModal.prod) setProds(prods.map(p => p === prodModal.prod ? {
      ...p,
      ...data
    } : p));else setProds([...prods, {
      ...data
    }]);
    setProdModal(null);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sub",
    style: {
      marginBottom: 6
    }
  }, "Loja \xB7 Card\xE1pio"), /*#__PURE__*/React.createElement("h1", null, "Gest\xE3o do Card\xE1pio"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Categorias e produtos exibidos no site."))), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title",
    style: {
      margin: 0
    }
  }, "CATEGORIAS"), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary sm",
    onClick: newCat
  }, "+ Nova Categoria")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, cats.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    onClick: () => setSel(c.id),
    className: `cat-row ${sel === c.id ? 'on' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "cat-thumb"
  }), /*#__PURE__*/React.createElement("div", {
    className: "cat-text"
  }, /*#__PURE__*/React.createElement("b", null, c.name), /*#__PURE__*/React.createElement("small", null, c.desc), /*#__PURE__*/React.createElement("span", {
    className: `tag ${c.visible ? 'up' : 'down'}`,
    style: {
      marginTop: 4
    }
  }, c.visible ? 'ATIVA' : 'INATIVA')), /*#__PURE__*/React.createElement("div", {
    className: "row-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "Editar",
    onClick: e => editCat(c, e)
  }, "\u270F"), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn danger",
    title: "Excluir",
    onClick: e => delCat(c, e)
  }, "\uD83D\uDDD1")))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", {
    className: "kv-l"
  }, "PRODUTOS DE"), /*#__PURE__*/React.createElement("b", {
    style: {
      fontFamily: 'var(--display)',
      fontWeight: 400,
      fontSize: 28,
      color: 'var(--ink)',
      display: 'block'
    }
  }, cats.find(c => c.id === sel)?.name || '—')), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: newProd
  }, "Novo Produto")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      maxHeight: 560,
      overflowY: 'auto',
      paddingRight: 4
    }
  }, prods.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "prod-row-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "prod-thumb"
  }), /*#__PURE__*/React.createElement("div", {
    className: "prod-text"
  }, /*#__PURE__*/React.createElement("b", null, p.name), /*#__PURE__*/React.createElement("small", null, p.desc)), /*#__PURE__*/React.createElement("div", {
    className: "prod-meta"
  }, /*#__PURE__*/React.createElement("b", {
    className: "num",
    style: {
      color: 'var(--ink)'
    }
  }, "R$ ", p.price.toFixed(2).replace('.', ',')), /*#__PURE__*/React.createElement("span", {
    className: `tag ${p.status === 'ATIVO' ? 'up' : 'down'}`
  }, p.status), /*#__PURE__*/React.createElement("small", {
    style: {
      color: p.estoque - (p.vendidos || 0) <= 0 ? 'var(--down)' : 'var(--ink-3)'
    }
  }, p.estoque - (p.vendidos || 0) <= 0 ? 'Esgotado' : `${p.estoque - (p.vendidos || 0)} un.`)), /*#__PURE__*/React.createElement("div", {
    className: "row-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "Editar",
    onClick: e => editProd(p, e)
  }, "\u270F"), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn danger",
    title: "Excluir",
    onClick: e => delProd(p, e)
  }, "\uD83D\uDDD1"))))))), catModal && /*#__PURE__*/React.createElement(CategoriaModal, {
    cat: catModal.cat,
    onClose: () => setCatModal(null),
    onSave: saveCat
  }), prodModal && /*#__PURE__*/React.createElement(ProdutoModal, {
    prod: prodModal.prod,
    onClose: () => setProdModal(null),
    onSave: saveProd
  }));
}

/* ========== CENTRAL DE MENSAGENS ========== */
const CONTATOS = [{
  name: 'Gabriel Machado',
  phone: '(21) 98072-5247'
}, {
  name: 'Janete José',
  phone: '(21) 98016-2578'
}, {
  name: 'Julia Correa',
  phone: '(21) 96946-0158'
}, {
  name: 'Marcos',
  phone: '(21) 98705-8131'
}, {
  name: 'Marcos Felipe da Silva Ba…',
  phone: '(21) 96627-8965'
}, {
  name: 'StabTest',
  phone: '(21) 90000-0001'
}, {
  name: 'Tamiris Barros',
  phone: '(21) 98600-1350'
}, {
  name: 'Teste Automatizado',
  phone: '(21) 99999-9999'
}, {
  name: 'Teste CID',
  phone: '(21) 99999-0001'
}, {
  name: 'Teste Deploy',
  phone: '(21) 99999-9999'
}, {
  name: 'Teste DevOps',
  phone: '(21) 99999-9999'
}, {
  name: 'Teste Resiliencia',
  phone: '(21) 99999-0001'
}, {
  name: 'Validacao Teste',
  phone: '(21) 99999-0000'
}];
function CentralMsgPage() {
  const [sel, setSel] = useStX(new Set());
  const [msg, setMsg] = useStX('');
  const toggle = n => {
    const s = new Set(sel);
    s.has(n) ? s.delete(n) : s.add(n);
    setSel(s);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sub",
    style: {
      marginBottom: 6
    }
  }, "Relacionamento & CRM"), /*#__PURE__*/React.createElement("h1", null, "Central de Mensagens"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Comunique-se de forma inteligente e gerencie sua base de clientes com automa\xE7\xE3o."))), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '300px 1fr 280px',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("small", {
    className: "kv-l"
  }, "DESTINAT\xC1RIOS"), /*#__PURE__*/React.createElement("span", {
    className: "tag gold"
  }, sel.size, " selecionados")), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    placeholder: "Filtrar por nome ou celular\u2026",
    style: {
      marginBottom: 10
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      fontSize: 12,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("a", {
    className: "link-id",
    onClick: () => setSel(new Set(CONTATOS.map(c => c.name))),
    style: {
      cursor: 'pointer'
    }
  }, "Selecionar Todos"), /*#__PURE__*/React.createElement("a", {
    className: "link-muted",
    onClick: () => setSel(new Set()),
    style: {
      cursor: 'pointer'
    }
  }, "Limpar Sele\xE7\xE3o")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      maxHeight: 500,
      overflowY: 'auto'
    }
  }, CONTATOS.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: `contact-row ${sel.has(c.name) ? 'on' : ''}`,
    onClick: () => toggle(c.name)
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, c.name), /*#__PURE__*/React.createElement("small", null, c.phone)))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0
    }
  }, "Mensagem da Campanha"), /*#__PURE__*/React.createElement("span", {
    className: "tag"
  }, "Use ", '{nome}', " para personalizar")), /*#__PURE__*/React.createElement("textarea", {
    className: "inp",
    rows: 22,
    value: msg,
    onChange: e => setMsg(e.target.value),
    placeholder: "Escreva sua mensagem aqui. Use {nome} para personalizar automaticamente com o nome do cliente\u2026"
  }), /*#__PURE__*/React.createElement("div", {
    className: "campaign-status"
  }, sel.size === 0 ? 'Nenhum cliente selecionado para o disparo' : `${sel.size} cliente(s) selecionado(s)`), /*#__PURE__*/React.createElement("button", {
    className: `campaign-btn ${sel.size > 0 && msg ? 'on' : ''}`
  }, "ENVIAR CAMPANHA AGORA"), /*#__PURE__*/React.createElement("small", {
    style: {
      display: 'block',
      textAlign: 'center',
      color: 'var(--ink-4)',
      marginTop: 6,
      fontSize: 11
    }
  }, "O envio ser\xE1 processado em fila para garantir a entrega.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "insight-chip tc1"
  }), /*#__PURE__*/React.createElement("small", {
    className: "kv-l",
    style: {
      margin: 0
    }
  }, "NOVO CONTATO")), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    placeholder: "Nome do Cliente",
    style: {
      marginBottom: 8
    }
  }), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    placeholder: "WhatsApp (DDD+N\xFAmero)",
    style: {
      marginBottom: 10
    }
  }), /*#__PURE__*/React.createElement("small", {
    style: {
      color: 'var(--ink-4)',
      fontSize: 11,
      display: 'block',
      marginBottom: 10
    }
  }, "Cadastre contatos para mensagens futuras"), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      width: '100%'
    }
  }, "Cadastrar Contato")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "insight-chip tc2"
  }), /*#__PURE__*/React.createElement("small", {
    className: "kv-l",
    style: {
      margin: 0
    }
  }, "MODELOS (0/10)")), /*#__PURE__*/React.createElement("div", {
    className: "model-empty"
  }, /*#__PURE__*/React.createElement("b", null, "Crie agilidade"), /*#__PURE__*/React.createElement("small", null, "Salve frases prontas para realizar disparos r\xE1pidos em segundos."))))));
}

/* ========== CONFIGURAÇÕES DE MENSAGEM ========== */
const TEMPLATES = [{
  title: 'Email confirmação compra',
  desc: 'Mensagem enviada automaticamente para o cliente no e-mail cadastrado assim que o pagamento é confirmado.',
  vars: ['{nome}', '{itens}', '{total}', '{pagamento}'],
  body: '✅ Pedido confirmado — {nome}\n\n📍 Retirada\nAv. Presidente Kennedy, 627 — Vila Jurandir\n(Em frente à Tetraforma)\n\n📅 Quando\nSábado, a partir das 15h'
}, {
  title: 'WhatsApp confirmação compra',
  desc: 'Notificação instantânea enviada via WhatsApp para o cliente confirmando a compra e informando os próximos passos.',
  vars: ['{nome}', '{itens}', '{total}', '{pagamento}'],
  body: '✅ *Pedido confirmado — {nome}*\n\n📍 *Retirada*\nAv. Presidente Kennedy, 627 — Vila Jurandir\n(Em frente à Tetraforma)\n\n📅 *Quando*\nSábado, a partir das 15h'
}, {
  title: 'WhatsApp carrinho abandonado',
  desc: 'Mensagem de recuperação enviada para carrinhos iniciados que não foram finalizados após 1 hora.',
  vars: ['{nome}', '{itens}', '{link}'],
  body: '{nome}, tudo bem? 🥖\n\nVimos que você selecionou alguns produtos, bom gosto!\n\nGaranta essas delícias — finalize seu carrinho antes que esgotem!\n\n🛒\n{itens}'
}];
function CfgMsgPage() {
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sub",
    style: {
      marginBottom: 6
    }
  }, "Configura\xE7\xF5es \xB7 Mensagens"), /*#__PURE__*/React.createElement("h1", null, "Configura\xE7\xF5es de Mensagem"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Templates autom\xE1ticos enviados aos clientes em cada etapa."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, TEMPLATES.map((t, i) => /*#__PURE__*/React.createElement("div", {
    className: "card",
    key: i
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 6px'
    }
  }, t.title), /*#__PURE__*/React.createElement("small", {
    style: {
      display: 'block',
      color: 'var(--ink-3)',
      marginBottom: 14,
      maxWidth: 540
    }
  }, t.desc), /*#__PURE__*/React.createElement("small", {
    className: "kv-l",
    style: {
      display: 'block',
      marginBottom: 8
    }
  }, "VARI\xC1VEIS DISPON\xCDVEIS:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      marginBottom: 12
    }
  }, t.vars.map((v, j) => /*#__PURE__*/React.createElement("span", {
    key: j,
    className: "var-chip"
  }, v))), /*#__PURE__*/React.createElement("textarea", {
    className: "inp tmpl",
    rows: 7,
    defaultValue: t.body
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-primary"
  }, "Salvar Altera\xE7\xF5es"))))));
}

/* ========== EDITAR PERFIL ========== */
function EditarPerfilPage() {
  const [nome, setNome] = useStX('TOCHA PADARIA');
  const [tel, setTel] = useStX('(21) 96627-8965');
  const [email, setEmail] = useStX('admin@tochapadaria');
  const [senha, setSenha] = useStX('••••••••');
  const [dirty, setDirty] = useStX(false);
  const upd = (fn, v) => {
    fn(v);
    setDirty(true);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head",
    style: {
      borderBottom: 'none',
      paddingBottom: 0
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0
    }
  }, "Perfil"))), /*#__PURE__*/React.createElement("div", {
    className: "perfil-tabs"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tab on"
  }, "Editar Perfil")), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "DADOS PESSOAIS"), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '320px 1fr',
      gap: 28,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "avatar-uploader"
  }, /*#__PURE__*/React.createElement("div", {
    className: "avatar-circle"
  }, /*#__PURE__*/React.createElement("div", {
    className: "avatar-mark"
  }, "T")), /*#__PURE__*/React.createElement("b", {
    className: "av-title"
  }, "Foto de Perfil"), /*#__PURE__*/React.createElement("small", null, "Formato: PNG ou JPG"), /*#__PURE__*/React.createElement("small", null, "Resolu\xE7\xE3o m\xEDnima: 350px x 195px"), /*#__PURE__*/React.createElement("div", {
    className: "av-drop"
  }, "Arraste sua imagem aqui ou escolha uma direto do seu dispositivo"), /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    style: {
      width: '100%'
    }
  }, "Escolher foto")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      maxWidth: 720
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "field"
  }, /*#__PURE__*/React.createElement("span", null, "Nome ", /*#__PURE__*/React.createElement("em", {
    className: "req"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    value: nome,
    onChange: e => upd(setNome, e.target.value)
  })), /*#__PURE__*/React.createElement("label", {
    className: "field"
  }, /*#__PURE__*/React.createElement("span", null, "Telefone ", /*#__PURE__*/React.createElement("em", {
    className: "req"
  }, "*")), /*#__PURE__*/React.createElement("div", {
    className: "inp-phone"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flag"
  }, "\uD83C\uDDE7\uD83C\uDDF7"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    value: tel,
    onChange: e => upd(setTel, e.target.value)
  })))), /*#__PURE__*/React.createElement("label", {
    className: "field"
  }, /*#__PURE__*/React.createElement("span", null, "E-mail ", /*#__PURE__*/React.createElement("em", {
    className: "req"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    value: email,
    onChange: e => upd(setEmail, e.target.value)
  })), /*#__PURE__*/React.createElement("label", {
    className: "field"
  }, /*#__PURE__*/React.createElement("span", null, "Senha"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    type: "password",
    value: senha,
    onChange: e => upd(setSenha, e.target.value)
  }), /*#__PURE__*/React.createElement("a", {
    className: "link-id",
    style: {
      cursor: 'pointer',
      marginTop: 4
    }
  }, "Alterar Senha"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: `btn-primary save-wide ${dirty ? '' : 'disabled'}`,
    disabled: !dirty
  }, "Salvar")));
}
Object.assign(window, {
  InsightsPage,
  InteligenciaPage,
  AlertasPage,
  FunilPage,
  PagtoPainelPage,
  CardapioPage,
  CentralMsgPage,
  CfgMsgPage,
  EditarPerfilPage
});