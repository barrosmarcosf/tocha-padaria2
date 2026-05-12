/* global React, Ic, brl, SafeIcon */
const {
  useState: useStX,
  useEffect: useEffX,
  useCallback: useCbX,
  useRef: useRefX
} = React;
async function _uploadImage(file) {
  const fd = new FormData();
  fd.append('image', file);
  const token = localStorage.getItem('tocha_admin_token');
  const r = await fetch('/api/admin/upload', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    body: fd
  });
  if (!r.ok) throw new Error('Upload falhou');
  return (await r.json()).url;
}
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

/* ---------- shared helpers ---------- */
function fmtDateX(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
function fmtPhoneX(w) {
  if (!w) return '—';
  const d = String(w).replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return w;
}

/* ========== INSIGHTS AUTOMÁTICOS (estático — análise comportamental) ========== */
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

/* ========== INTELIGÊNCIA — LongTermChart ========== */
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
  const step = iw / Math.max(data.length - 1, 1);
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
function buildCalendar(year, month, dailyBreakdown) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDow = new Date(year, month - 1, 1).getDay();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${month}-${d}`;
    const info = dailyBreakdown[key] || {
      revenue: 0,
      orders: 0
    };
    cells.push({
      d,
      v: info.revenue || 0,
      p: info.orders || 0
    });
  }
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
function generate12Months() {
  const now = new Date();
  const months = [];
  const names = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${names[d.getMonth()]} de ${d.getFullYear()}`,
      year: d.getFullYear(),
      month: d.getMonth() + 1
    });
  }
  return months;
}
const MONTHS_12 = generate12Months();
function InteligenciaPage() {
  const MONTHS = MONTHS_12;
  const currentMonth = MONTHS[MONTHS.length - 1];
  const [historical, setHistorical] = useStX([]);
  const [selMonth, setSelMonth] = useStX(currentMonth.value);
  const [dailyBreakdown, setDailyBreakdown] = useStX({});
  const [ranking, setRanking] = useStX([]);
  const [loadingChart, setLoadingChart] = useStX(true);
  const [loadingCal, setLoadingCal] = useStX(true);
  useEffX(() => {
    let mounted = true;
    window.apiGet('/api/admin/historical-monthly-metrics').then(d => {
      if (mounted) setHistorical(d || []);
    }).catch(() => {}).finally(() => {
      if (mounted) setLoadingChart(false);
    });
    return () => {
      mounted = false;
    };
  }, []);
  const fetchMonthDetail = useCbX(value => {
    const mo = MONTHS.find(m => m.value === value) || currentMonth;
    const mm = String(mo.month).padStart(2, '0');
    const lastDay = new Date(mo.year, mo.month, 0).getDate();
    const from = `${mo.year}-${mm}-01`;
    const to = `${mo.year}-${mm}-${String(lastDay).padStart(2, '0')}`;
    setLoadingCal(true);
    let mounted = true;
    window.apiGet(`/api/admin/detailed-analytics?period=custom&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&tzOffset=180`).then(d => {
      if (!mounted) return;
      setDailyBreakdown(d?.dailyBreakdown || {});
      setRanking(d?.itemPerformance?.products || []);
    }).catch(() => {}).finally(() => {
      if (mounted) setLoadingCal(false);
    });
    return () => {
      mounted = false;
    };
  }, []);
  useEffX(() => {
    fetchMonthDetail(selMonth);
  }, [selMonth]);
  const chartData = historical.map(m => ({
    l: m.label || m.key,
    f: m.revenue || 0,
    p: m.orders || 0,
    lr: m.profit || 0
  }));
  const lastMonth = historical.length > 0 ? historical[historical.length - 1] : null;
  const prevMonth = historical.length > 1 ? historical[historical.length - 2] : null;
  const revVar = lastMonth && prevMonth && prevMonth.revenue > 0 ? ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1) : '0.0';
  const ordVar = lastMonth && prevMonth && prevMonth.orders > 0 ? ((lastMonth.orders - prevMonth.orders) / prevMonth.orders * 100).toFixed(1) : '0.0';
  const tikVar = lastMonth && prevMonth ? (() => {
    const curr = lastMonth.orders > 0 ? lastMonth.revenue / lastMonth.orders : 0;
    const prev = prevMonth.orders > 0 ? prevMonth.revenue / prevMonth.orders : 0;
    return prev > 0 ? ((curr - prev) / prev * 100).toFixed(1) : '0.0';
  })() : '0.0';
  const curRev = lastMonth?.revenue || 0;
  const curOrd = lastMonth?.orders || 0;
  const curTik = curOrd > 0 ? curRev / curOrd : 0;
  const mo = MONTHS.find(m => m.value === selMonth) || currentMonth;
  const cal = buildCalendar(mo.year, mo.month, dailyBreakdown);
  const dows = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const totalMes = Object.values(dailyBreakdown).reduce((s, d) => s + (d.revenue || 0), 0);
  const totalOrdMes = Object.values(dailyBreakdown).reduce((s, d) => s + (d.orders || 0), 0);
  const totalSemana = w => w.reduce((a, c) => a + (c?.v || 0), 0);
  const totalDow = i => cal.reduce((a, w) => a + (w[i]?.v || 0), 0);
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
  }, /*#__PURE__*/React.createElement("small", null, "VENDAS TOTAIS"), /*#__PURE__*/React.createElement("b", null, "R$ ", curRev.toFixed(2).replace('.', ',')), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("em", {
    className: Number(revVar) >= 0 ? 'up-text' : 'dn-text'
  }, Number(revVar) >= 0 ? '▲' : '▼', " ", revVar, "%"), " vs. m\xEAs anterior")), /*#__PURE__*/React.createElement("div", {
    className: "kpi-card"
  }, /*#__PURE__*/React.createElement("small", null, "TICKET M\xC9DIO"), /*#__PURE__*/React.createElement("b", null, "R$ ", curTik.toFixed(2).replace('.', ',')), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("em", {
    className: Number(tikVar) >= 0 ? 'up-text' : 'dn-text'
  }, Number(tikVar) >= 0 ? '▲' : '▼', " ", tikVar, "%"), " vs. m\xEAs anterior")), /*#__PURE__*/React.createElement("div", {
    className: "kpi-card"
  }, /*#__PURE__*/React.createElement("small", null, "PEDIDOS"), /*#__PURE__*/React.createElement("b", null, curOrd), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("em", {
    className: Number(ordVar) >= 0 ? 'up-text' : 'dn-text'
  }, Number(ordVar) >= 0 ? '▲' : '▼', " ", ordVar, "%"), " vs. m\xEAs anterior"))), /*#__PURE__*/React.createElement("div", {
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
  }, "Hist\xF3rico mensal consolidado dos \xFAltimos 12 meses"))), lastMonth && /*#__PURE__*/React.createElement("div", {
    className: "lt-summary"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lt-sum-item"
  }, /*#__PURE__*/React.createElement("small", null, "\xDALTIMO M\xCAS"), /*#__PURE__*/React.createElement("b", {
    className: "lt-mono"
  }, lastMonth.label || lastMonth.key)), /*#__PURE__*/React.createElement("div", {
    className: "lt-sum-item"
  }, /*#__PURE__*/React.createElement("small", null, "FATURAMENTO"), /*#__PURE__*/React.createElement("div", {
    className: "lt-sum-line"
  }, /*#__PURE__*/React.createElement("b", null, "R$ ", curRev.toFixed(0)), /*#__PURE__*/React.createElement("span", {
    className: `delta ${Number(revVar) >= 0 ? 'up' : 'dn'}`
  }, Number(revVar) >= 0 ? '+' : '', revVar, "%"))), /*#__PURE__*/React.createElement("div", {
    className: "lt-sum-item"
  }, /*#__PURE__*/React.createElement("small", null, "VENDAS"), /*#__PURE__*/React.createElement("div", {
    className: "lt-sum-line"
  }, /*#__PURE__*/React.createElement("b", null, curOrd), /*#__PURE__*/React.createElement("span", {
    className: `delta ${Number(ordVar) >= 0 ? 'up' : 'dn'}`
  }, Number(ordVar) >= 0 ? '+' : '', ordVar, "%"))), /*#__PURE__*/React.createElement("div", {
    className: "lt-sum-item"
  }, /*#__PURE__*/React.createElement("small", null, "LUCRO REAL"), /*#__PURE__*/React.createElement("div", {
    className: "lt-sum-line"
  }, /*#__PURE__*/React.createElement("b", null, "R$ ", (lastMonth.profit || 0).toFixed(1)), /*#__PURE__*/React.createElement("span", {
    className: "delta dn"
  }, "\u2014")))), loadingChart ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 160
    }
  }, /*#__PURE__*/React.createElement(Ic.clock, null), /*#__PURE__*/React.createElement("div", null, "Carregando hist\xF3rico\u2026")) : chartData.length > 0 ? /*#__PURE__*/React.createElement(LongTermChart, {
    data: chartData
  }) : /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 160
    }
  }, /*#__PURE__*/React.createElement(Ic.chart, null), /*#__PURE__*/React.createElement("div", null, "Sem dados hist\xF3ricos dispon\xEDveis."))), /*#__PURE__*/React.createElement("div", {
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
      width: 220
    },
    value: selMonth,
    onChange: e => setSelMonth(e.target.value)
  }, MONTHS.map(m => /*#__PURE__*/React.createElement("option", {
    key: m.value,
    value: m.value
  }, m.label)))), /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("small", null, "PEDIDOS"), /*#__PURE__*/React.createElement("b", null, totalOrdMes))), /*#__PURE__*/React.createElement("div", {
    className: "cal-hint"
  }, "As informa\xE7\xF5es correspondem ao m\xEAs de ", MONTHS.find(m => m.value === selMonth)?.label || '—'), loadingCal ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 120
    }
  }, /*#__PURE__*/React.createElement(Ic.clock, null), /*#__PURE__*/React.createElement("div", null, "Carregando calend\xE1rio\u2026")) : /*#__PURE__*/React.createElement("div", {
    className: "cal-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cal-head"
  }, dows.map(d => /*#__PURE__*/React.createElement("div", {
    key: d
  }, d)), /*#__PURE__*/React.createElement("div", {
    className: "cal-total"
  }, "TOTAL SEMANA")), cal.map((w, wi) => /*#__PURE__*/React.createElement("div", {
    className: "cal-row",
    key: wi
  }, w.map((c, ci) => /*#__PURE__*/React.createElement("div", {
    className: `cal-cell ${c && c.v > 0 ? 'has' : ''} ${!c ? 'empty' : ''}`,
    key: ci
  }, c && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "cal-d"
  }, c.d), /*#__PURE__*/React.createElement("div", {
    className: "cal-val"
  }, /*#__PURE__*/React.createElement("b", null, "R$ ", c.v.toFixed(2).replace('.', ',')), c.p > 0 && /*#__PURE__*/React.createElement("small", null, c.p, " pedido", c.p > 1 ? 's' : ''))))), /*#__PURE__*/React.createElement("div", {
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
  }, "LUCRO")), ranking.slice(0, 100).map((r, i) => /*#__PURE__*/React.createElement("div", {
    className: "rk-row",
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: "rk-pos"
  }, i + 1), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, r.name)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "tag"
  }, (r.category || 'PADARIA').toUpperCase())), /*#__PURE__*/React.createElement("div", {
    className: "rt num"
  }, r.qty || 0), /*#__PURE__*/React.createElement("div", {
    className: "rt num"
  }, "R$ ", (r.revenue || 0).toFixed(2).replace('.', ',')), /*#__PURE__*/React.createElement("div", {
    className: "rt num up-text"
  }, "R$ ", (r.profit || 0).toFixed(2).replace('.', ',')))), ranking.length === 0 && !loadingCal && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      color: 'var(--ink-4)',
      padding: 20,
      fontSize: 13
    }
  }, "Nenhum item vendido neste per\xEDodo."))));
}

/* ========== ALERTAS ========== */
function AlertasPage() {
  const [health, setHealth] = useStX(null);
  const [metrics, setMetrics] = useStX(null);
  const [loading, setLoading] = useStX(true);
  useEffX(() => {
    let mounted = true;
    Promise.all([window.apiGet('/api/admin/payments-health'), window.apiGet('/api/admin/metrics')]).then(([h, m]) => {
      if (!mounted) return;
      setHealth(h);
      setMetrics(m);
    }).catch(() => {}).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);
  const alerts = [];
  if (!loading && health && metrics) {
    if ((health.stale_locks || 0) > 0) {
      alerts.push({
        k: 'crit',
        title: 'Locks de pagamento presos',
        desc: `${health.stale_locks} pagamentos em processamento há mais de 2 minutos`
      });
    }
    if ((health.failed || 0) > 0) {
      alerts.push({
        k: 'crit',
        title: 'Pagamentos com falha',
        desc: `${health.failed} pedidos com status payment_failed ou error`
      });
    }
    if ((health.pending || 0) > 10) {
      alerts.push({
        k: 'warn',
        title: 'Volume de pendentes alto',
        desc: `${health.pending} pedidos aguardando confirmação de pagamento`
      });
    }
    if ((health.fila_reprocessamento || 0) > 0) {
      alerts.push({
        k: 'warn',
        title: 'Fila de reprocessamento',
        desc: `${health.fila_reprocessamento} pagamentos aguardando nova tentativa`
      });
    }
    const ar = metrics?.payments?.approval_rate ?? 100;
    if (ar < 70) {
      alerts.push({
        k: 'crit',
        title: 'Taxa de aprovação crítica',
        desc: `${ar}% — abaixo do limite mínimo de 70%`
      });
    } else if (ar < 80) {
      alerts.push({
        k: 'warn',
        title: 'Taxa de aprovação',
        desc: `${ar}% — abaixo do threshold de 80%`
      });
    } else {
      alerts.push({
        k: 'ok',
        title: 'Taxa de aprovação',
        desc: `${ar}% — dentro do esperado`
      });
    }
    if ((health.paid || 0) > 0) {
      alerts.push({
        k: 'ok',
        title: 'Pagamentos confirmados',
        desc: `${health.paid} pedidos com status paid`
      });
    }
    if ((health.pending || 0) <= 10) {
      alerts.push({
        k: 'ok',
        title: 'Fila de pendentes',
        desc: `${health.pending || 0} pedidos pendentes — dentro do normal`
      });
    }
  }
  const crit = alerts.filter(a => a.k === 'crit').length;
  const warn = alerts.filter(a => a.k === 'warn').length;
  const ok = alerts.filter(a => a.k === 'ok').length;
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
  }, /*#__PURE__*/React.createElement("b", null, loading ? '—' : crit), /*#__PURE__*/React.createElement("small", null, "CR\xCDTICOS")), /*#__PURE__*/React.createElement("div", {
    className: "alert-summary k-warn"
  }, /*#__PURE__*/React.createElement("b", null, loading ? '—' : warn), /*#__PURE__*/React.createElement("small", null, "ATEN\xC7\xC3O")), /*#__PURE__*/React.createElement("div", {
    className: "alert-summary k-ok"
  }, /*#__PURE__*/React.createElement("b", null, loading ? '—' : ok), /*#__PURE__*/React.createElement("small", null, "OK"))), /*#__PURE__*/React.createElement("div", {
    className: "card mt",
    style: {
      padding: 8
    }
  }, loading && /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 120
    }
  }, /*#__PURE__*/React.createElement(Ic.clock, null), /*#__PURE__*/React.createElement("div", null, "Carregando alertas\u2026")), !loading && alerts.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 120
    }
  }, /*#__PURE__*/React.createElement(Ic.shield, null), /*#__PURE__*/React.createElement("div", null, "Nenhum alerta ativo.")), alerts.map((a, i) => /*#__PURE__*/React.createElement("div", {
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
function FunilDonut({
  segments,
  size,
  stroke,
  label,
  sub
}) {
  const s = size || 100,
    w = stroke || 12;
  const r = (s - w) / 2,
    cx = s / 2,
    cy = s / 2;
  const circ = 2 * Math.PI * r;
  let prevPct = 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: s,
      height: s,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: s,
    height: s,
    viewBox: `0 0 ${s} ${s}`,
    style: {
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: r,
    fill: "none",
    stroke: "var(--panel-3)",
    strokeWidth: w
  }), segments && segments.map((g, i) => {
    const sl = Math.min(Math.max(g.pct || 0, 0), 100) / 100 * circ;
    const rot = -90 + prevPct / 100 * 360;
    prevPct += Math.min(Math.max(g.pct || 0, 0), 100);
    return sl > 0 ? /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: cx,
      cy: cy,
      r: r,
      fill: "none",
      stroke: g.color,
      strokeWidth: w,
      strokeDasharray: `${sl} ${circ}`,
      strokeLinecap: "butt",
      style: {
        transform: `rotate(${rot}deg)`,
        transformOrigin: `${cx}px ${cy}px`
      }
    }) : null;
  })), label !== undefined && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      fontFamily: 'var(--display)',
      fontSize: Math.round(s * 0.19),
      color: 'var(--ink)',
      fontWeight: 400,
      lineHeight: 1
    }
  }, label), sub && /*#__PURE__*/React.createElement("small", {
    style: {
      fontSize: Math.round(s * 0.1),
      color: 'var(--ink-4)'
    }
  }, sub)));
}
const _FV_MOCK = {
  steps: [{
    key: 'site_enter',
    label: 'Visitantes',
    icon: 'site_enter',
    count: 1248,
    pct_total: 100
  }, {
    key: 'view_product',
    label: 'Visualização de Produto',
    icon: 'view_product',
    count: 475,
    pct_total: 38.1
  }, {
    key: 'cart_created',
    label: 'Carrinho Criado',
    icon: 'cart_created',
    count: 149,
    pct_total: 11.9
  }, {
    key: 'checkout_started',
    label: 'Checkout Iniciado',
    icon: 'checkout_started',
    count: 80,
    pct_total: 6.4
  }, {
    key: 'payment_attempted',
    label: 'Pagamento Tentado',
    icon: 'payment_attempted',
    count: 48,
    pct_total: 3.8
  }, {
    key: 'payment_success',
    label: 'Pagamento Aprovado',
    icon: 'payment_success',
    count: 33,
    pct_total: 2.6
  }],
  advance_rates: [{
    label: 'Taxa de avanço',
    pct: 38.1
  }, {
    label: 'Taxa de avanço',
    pct: 31.4
  }, {
    label: 'Taxa de avanço',
    pct: 53.7
  }, {
    label: 'Taxa de avanço',
    pct: 60.0
  }, {
    label: 'Taxa de conversão',
    pct: 68.8
  }],
  kpis: {
    conv_rate: 2.6,
    conv_orders: 33,
    conv_visits: 1248,
    avg_ticket: 78.60,
    avg_ticket_delta: 12.5,
    total_revenue: 2593.80,
    total_revenue_delta: 15.3,
    avg_funnel_time: '18m 42s',
    avg_funnel_time_delta: -8.1,
    approval_rate: 68.8,
    approval_rate_delta: 5.2
  },
  traffic_sources: [{
    label: 'Instagram',
    color: '#7c4dff',
    count: 632,
    pct: 50.6,
    conv_rate: 2.5,
    abandon_rate: 97.5
  }, {
    label: 'Google',
    color: '#4a9eff',
    count: 387,
    pct: 31.0,
    conv_rate: 3.1,
    abandon_rate: 96.9
  }, {
    label: 'WhatsApp',
    color: '#00c853',
    count: 229,
    pct: 18.4,
    conv_rate: 1.7,
    abandon_rate: 98.3
  }, {
    label: 'Total',
    isTotal: true,
    count: 1248,
    pct: 100,
    conv_rate: 2.6,
    abandon_rate: 97.4
  }],
  devices: [{
    label: 'Mobile',
    color: '#7c4dff',
    count: 820,
    pct: 65.7,
    conv_rate: 1.8,
    abandon_rate: 96.2,
    approved: 15
  }, {
    label: 'Desktop',
    color: '#4a9eff',
    count: 320,
    pct: 25.6,
    conv_rate: 4.5,
    abandon_rate: 95.5,
    approved: 14
  }, {
    label: 'Tablet',
    color: '#00c853',
    count: 108,
    pct: 8.7,
    conv_rate: 2.9,
    abandon_rate: 97.1,
    approved: 4
  }, {
    label: 'Total',
    isTotal: true,
    count: 1248,
    pct: 100,
    conv_rate: 2.6,
    abandon_rate: 97.4,
    approved: 33
  }],
  payment_methods: [{
    label: 'Pix',
    color: '#00c853',
    attempts: 1156,
    pct: 61.3,
    approved: 892,
    approval_rate: 77.2
  }, {
    label: 'Cartão de Crédito',
    color: '#4a9eff',
    attempts: 589,
    pct: 31.3,
    approved: 353,
    approval_rate: 59.9
  }, {
    label: 'Cartão de Débito',
    color: '#ffaa00',
    attempts: 141,
    pct: 7.5,
    approved: 99,
    approval_rate: 63.1
  }, {
    label: 'Total',
    isTotal: true,
    attempts: 1886,
    pct: 100,
    approved: 1334,
    approval_rate: 68.8
  }],
  abandonment: {
    rate: 60.1,
    cart_count: 101,
    cart_rate: 60.1,
    checkout_count: 32,
    checkout_rate: 40.0,
    total: 133,
    lost_value: 2486.70,
    reasons: [{
      label: 'Prazo de produção longo',
      pct: 29.7,
      count: 38
    }, {
      label: 'Indecisão / Comparando',
      pct: 21.9,
      count: 28
    }, {
      label: 'Preço considerado alto',
      pct: 17.2,
      count: 22
    }, {
      label: 'Falta de urgência',
      pct: 12.5,
      count: 16
    }, {
      label: 'Outros',
      pct: 13.3,
      count: 17
    }]
  },
  recovery: {
    cart_recovered: 29,
    cart_recovery_rate: 28.7,
    checkout_recovered: 12,
    checkout_recovery_rate: 37.5,
    count: 41,
    rate: 30.8,
    recovered_value: 871.40,
    channel: 'WhatsApp',
    avg_response_time: '8m 32s',
    post_contact_conv_rate: 41.4
  },
  products: {
    most_added: [{
      name: 'Cookie Nutella',
      adds: 78,
      conv: 12.8,
      abandon: 87.2
    }, {
      name: 'Cookie Clássico',
      adds: 64,
      conv: 18.8,
      abandon: 81.2
    }, {
      name: 'Brownie Chocolate',
      adds: 51,
      conv: 15.7,
      abandon: 84.3
    }, {
      name: 'Cookie Red Velvet',
      adds: 44,
      conv: 11.4,
      abandon: 88.6
    }, {
      name: 'Cinnamon Roll',
      adds: 38,
      conv: 21.1,
      abandon: 78.9
    }],
    worst_conversion: [{
      name: 'Cookie Nutella',
      adds: 78,
      purchases: 10,
      conv: 12.8
    }, {
      name: 'Cookie Red Velvet',
      adds: 44,
      purchases: 5,
      conv: 11.4
    }, {
      name: 'Brownie c/ Sorvete',
      adds: 27,
      purchases: 4,
      conv: 14.8
    }, {
      name: 'Torta de Brownie',
      adds: 26,
      purchases: 4,
      conv: 15.4
    }, {
      name: 'Donut Gourmet',
      adds: 31,
      purchases: 6,
      conv: 19.4
    }],
    most_viewed: [{
      name: 'Cookie Nutella',
      views: 312,
      ctr: 25.0
    }, {
      name: 'Cookie Clássico',
      views: 289,
      ctr: 22.1
    }, {
      name: 'Brownie Chocolate',
      views: 241,
      ctr: 21.2
    }, {
      name: 'Cinnamon Roll',
      views: 198,
      ctr: 19.2
    }, {
      name: 'Cookie Pistache',
      views: 165,
      ctr: 18.2
    }]
  },
  insights: [{
    type: 'bottleneck',
    label: 'MAIOR GARGALO',
    heading: 'Checkout → Pagamento',
    body: '60% dos clientes iniciam o checkout, mas não tentam o pagamento. Revise o fluxo e reduza fricções.'
  }, {
    type: 'product',
    label: 'PRODUTOS COM ALTO INTERESSE E BAIXA CONVERSÃO',
    heading: 'Cookie Nutella',
    body: 'Muitas adições ao carrinho, mas baixa conversão. Revise o preço, descrição ou fotos.'
  }, {
    type: 'opportunity',
    label: 'OPORTUNIDADE',
    heading: 'WhatsApp como origem',
    body: 'Tráfego com maior intenção, mas menor volume. Considere otimizar campanhas de indicação.'
  }]
};
const FV_STEP_COLORS = ['#4a9eff', '#00d4ff', '#ff8c00', '#ffd700', '#cc4400', '#00c853'];
const FV_PILL_BG = ['rgba(74,158,255,0.15)', 'rgba(74,158,255,0.15)', 'rgba(255,140,0,0.15)', 'rgba(255,68,68,0.2)', 'rgba(0,200,83,0.15)'];
const FV_ADV_COLORS = ['#4a9eff', '#4a9eff', '#ff8c00', '#ff4444', '#00c853'];
function _fvStepIcon(key, color) {
  const p = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };
  if (key === 'site_enter') return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
    d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "7",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M23 21v-2a4 4 0 0 0-3-3.87"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 3.13a4 4 0 0 1 0 7.75"
  }));
  if (key === 'view_product') return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
    d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }));
  if (key === 'cart_created') return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "21",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "20",
    cy: "21",
    r: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
  }));
  if (key === 'checkout_started') return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("rect", {
    x: "1",
    y: "4",
    width: "22",
    height: "16",
    rx: "2",
    ry: "2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "1",
    y1: "10",
    x2: "23",
    y2: "10"
  }));
  if (key === 'payment_attempted') return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "12 6 12 12 16 14"
  }));
  if (key === 'payment_success') return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
    d: "M22 11.08V12a10 10 0 1 1-5.93-9.14"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "22 4 12 14.01 9 11.01"
  }));
  return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }));
}
function FunilPage() {
  const [data, setData] = useStX(null);
  const [loading, setLoading] = useStX(true);
  const [days, setDays] = useStX(30);
  useEffX(() => {
    let mounted = true;
    setLoading(true);
    window.apiGet('/api/admin/funnel-analytics?days=' + days).then(d => {
      if (mounted) {
        setData(d);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [days]);
  const d = data || _FV_MOCK;
  const isMock = !data;
  const steps = d.steps?.length === 6 ? d.steps : _FV_MOCK.steps;
  const advRates = d.advance_rates?.length === 5 ? d.advance_rates : _FV_MOCK.advance_rates;
  const kpis = d.kpis || _FV_MOCK.kpis;
  const src = d.traffic_sources?.length ? d.traffic_sources : _FV_MOCK.traffic_sources;
  const devs = d.devices?.length ? d.devices : _FV_MOCK.devices;
  const pms = d.payment_methods?.length ? d.payment_methods : _FV_MOCK.payment_methods;
  const abd = d.abandonment || _FV_MOCK.abandonment;
  const rec = d.recovery || _FV_MOCK.recovery;
  const prods = d.products || _FV_MOCK.products;
  const insights = d.insights?.length ? d.insights : _FV_MOCK.insights;
  const fBrl = v => brl(+(v || 0));
  const advPct = r => typeof r === 'object' ? r.pct || 0 : r || 0;
  const mkSegs = rows => rows.filter(r => !r.isTotal).map(r => ({
    pct: r.pct,
    color: r.color
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 16,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(PH, {
    title: "Funil de Vendas",
    subtitle: "Acompanhe todo o caminho do cliente at\xE9 a convers\xE3o."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      paddingTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-period-row"
  }, [7, 14, 30, 90].map(d2 => /*#__PURE__*/React.createElement("button", {
    key: d2,
    className: 'fv-period-btn' + (days === d2 ? ' on' : ''),
    onClick: () => setDays(d2)
  }, d2, "d"))), /*#__PURE__*/React.createElement("span", {
    className: "fv-realtime"
  }, "Tempo real"))), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 200
    }
  }, /*#__PURE__*/React.createElement(Ic.clock, null), /*#__PURE__*/React.createElement("div", null, "Carregando m\xE9tricas\u2026")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      marginBottom: 14,
      padding: '20px 16px 16px',
      position: 'relative'
    }
  }, isMock && /*#__PURE__*/React.createElement("div", {
    className: "fv-mock-badge"
  }, "DADOS DEMONSTRATIVOS"), /*#__PURE__*/React.createElement("div", {
    className: "fv-funnel-row"
  }, steps.map((step, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: step.key
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-step-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-step-card",
    style: {
      borderColor: FV_STEP_COLORS[i],
      background: i === 5 ? '#161f16' : 'rgba(255,255,255,.03)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-step-icon-wrap"
  }, _fvStepIcon(step.key, FV_STEP_COLORS[i]), /*#__PURE__*/React.createElement("div", {
    className: "fv-step-lbl",
    style: {
      color: FV_STEP_COLORS[i]
    }
  }, step.label)), /*#__PURE__*/React.createElement("div", {
    className: "fv-step-num"
  }, (step.count || 0).toLocaleString('pt-BR')), /*#__PURE__*/React.createElement("div", {
    className: "fv-step-pct-lbl"
  }, i === 0 ? '100% do total' : `${(+(step.pct_total || 0)).toFixed(1).replace('.', ',')}% dos visitantes`))), i < steps.length - 1 && /*#__PURE__*/React.createElement("div", {
    className: "fv-arrow-wrap"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#aaaaaa",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "9 18 15 12 9 6"
  })), /*#__PURE__*/React.createElement("div", {
    className: "fv-adv-pill",
    style: {
      background: FV_PILL_BG[i],
      color: FV_ADV_COLORS[i],
      border: '1px solid ' + FV_ADV_COLORS[i]
    }
  }, typeof advRates[i] === 'object' ? advRates[i].label : 'Taxa de avanço', " ", (+advPct(advRates[i])).toFixed(1).replace('.', ','), "%")))))), /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-lbl"
  }, "TAXA DE CONVERS\xC3O GERAL"), /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-val"
  }, (+(kpis.conv_rate || 0)).toFixed(1).replace('.', ','), "%"), /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-meta"
  }, kpis.conv_orders || 0, " pedidos / ", (kpis.conv_visits || 0).toLocaleString('pt-BR'), " visitas"), kpis.avg_ticket_delta != null && /*#__PURE__*/React.createElement("span", {
    className: 'fv-delta-chip ' + (kpis.avg_ticket_delta >= 0 ? 'up' : 'dn')
  }, kpis.avg_ticket_delta >= 0 ? '↑' : '↓', " ", Math.abs(kpis.avg_ticket_delta).toFixed(1).replace('.', ','), "% vs per\xEDodo anterior")), /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-lbl"
  }, "TICKET M\xC9DIO"), /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-val"
  }, fBrl(kpis.avg_ticket)), /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-meta"
  }, "por pedido"), kpis.avg_ticket_delta != null && /*#__PURE__*/React.createElement("span", {
    className: 'fv-delta-chip ' + (kpis.avg_ticket_delta >= 0 ? 'up' : 'dn')
  }, kpis.avg_ticket_delta >= 0 ? '↑' : '↓', " ", Math.abs(kpis.avg_ticket_delta), "% vs per\xEDodo anterior")), /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-lbl"
  }, "FATURAMENTO"), /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-val"
  }, fBrl(kpis.total_revenue)), /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-meta"
  }, "no per\xEDodo"), kpis.total_revenue_delta != null && /*#__PURE__*/React.createElement("span", {
    className: 'fv-delta-chip ' + (kpis.total_revenue_delta >= 0 ? 'up' : 'dn')
  }, kpis.total_revenue_delta >= 0 ? '↑' : '↓', " ", Math.abs(kpis.total_revenue_delta), "% vs per\xEDodo anterior")), /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-lbl"
  }, "TEMPO M\xC9DIO DO FUNIL"), /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-val"
  }, kpis.avg_funnel_time || '—'), /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-meta"
  }, "do acesso ao pagamento"), kpis.avg_funnel_time_delta != null && /*#__PURE__*/React.createElement("span", {
    className: 'fv-delta-chip ' + (kpis.avg_funnel_time_delta <= 0 ? 'up' : 'dn')
  }, kpis.avg_funnel_time_delta <= 0 ? '↓' : '↑', " ", Math.abs(kpis.avg_funnel_time_delta), "% vs per\xEDodo anterior")), /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-lbl"
  }, "TAXA DE APROVA\xC7\xC3O (PAGAMENTO)"), /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-val"
  }, (+(kpis.approval_rate || 0)).toFixed(1).replace('.', ','), "%"), /*#__PURE__*/React.createElement("div", {
    className: "fv-kpi-meta"
  }, "tentativas aprovadas"), kpis.approval_rate_delta != null && /*#__PURE__*/React.createElement("span", {
    className: 'fv-delta-chip ' + (kpis.approval_rate_delta >= 0 ? 'up' : 'dn')
  }, kpis.approval_rate_delta >= 0 ? '↑' : '↓', " ", Math.abs(kpis.approval_rate_delta).toFixed(1).replace('.', ','), "% vs per\xEDodo anterior"))), /*#__PURE__*/React.createElement("div", {
    className: "fv-analysis-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-analysis-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-analysis-hdr"
  }, "ORIGEM DO TR\xC1FEGO"), /*#__PURE__*/React.createElement("div", {
    className: "fv-donut-legend-row",
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(FunilDonut, {
    segments: mkSegs(src),
    size: 140,
    stroke: 25
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, src.filter(r => !r.isTotal).map((row, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '3px 0',
      borderBottom: '1px solid rgba(255,255,255,.04)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: row.color,
      flexShrink: 0,
      display: 'inline-block'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 12,
      color: 'var(--ink-3)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, row.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink)',
      fontFamily: 'var(--mono)',
      flexShrink: 0
    }
  }, row.count), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--ink-4)',
      fontFamily: 'var(--mono)',
      flexShrink: 0
    }
  }, "(", row.pct, "%)"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--ink-4)',
      marginTop: 6
    }
  }, "Total de visitas: ", src.find(r => r.isTotal)?.count || 0))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'rgba(255,255,255,.07)',
      margin: '0 0 8px'
    }
  }), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 11
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ['ORIGEM', 'VISITAS', 'CONVERSÃO', 'ABANDONO'].map((h, i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    style: {
      fontSize: 8,
      letterSpacing: '.1em',
      color: 'var(--ink-4)',
      textAlign: i === 0 ? 'left' : 'right',
      padding: '2px 0 5px',
      fontWeight: 400,
      textTransform: 'uppercase',
      fontFamily: 'var(--mono)'
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, src.filter(r => !r.isTotal).map((row, ri) => /*#__PURE__*/React.createElement("tr", {
    key: ri
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '4px 0',
      color: 'var(--ink-3)',
      borderTop: '1px solid rgba(255,255,255,.04)',
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 1,
      background: row.color,
      flexShrink: 0,
      display: 'inline-block'
    }
  }), row.label), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '4px 0',
      color: 'var(--ink-3)',
      borderTop: '1px solid rgba(255,255,255,.04)',
      textAlign: 'right',
      fontFamily: 'var(--mono)'
    }
  }, row.count), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '4px 0',
      borderTop: '1px solid rgba(255,255,255,.04)',
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 3,
      width: Math.round((row.conv_rate || 0) / 100 * 32),
      background: '#22c55e',
      borderRadius: 999,
      display: 'inline-block'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#22c55e',
      fontFamily: 'var(--mono)'
    }
  }, row.conv_rate != null ? row.conv_rate + '%' : '—'))), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '4px 0',
      borderTop: '1px solid rgba(255,255,255,.04)',
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 3,
      width: Math.round((row.abandon_rate || 0) / 100 * 32),
      background: '#ef4444',
      borderRadius: 999,
      display: 'inline-block'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#ef4444',
      fontFamily: 'var(--mono)'
    }
  }, row.abandon_rate != null ? row.abandon_rate + '%' : '—'))))), src.find(r => r.isTotal) && (() => {
    const t = src.find(r => r.isTotal);
    return /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '5px 0 2px',
        fontWeight: 600,
        color: 'var(--ink)',
        borderTop: '1px solid rgba(255,255,255,.12)',
        display: 'flex',
        alignItems: 'center',
        gap: 4
      }
    }, "Total"), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '5px 0 2px',
        fontWeight: 600,
        color: 'var(--ink)',
        borderTop: '1px solid rgba(255,255,255,.12)',
        textAlign: 'right',
        fontFamily: 'var(--mono)'
      }
    }, t.count), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '5px 0 2px',
        fontWeight: 600,
        color: '#22c55e',
        borderTop: '1px solid rgba(255,255,255,.12)',
        textAlign: 'right',
        fontFamily: 'var(--mono)'
      }
    }, t.conv_rate != null ? t.conv_rate + '%' : '—'), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '5px 0 2px',
        fontWeight: 600,
        color: '#ef4444',
        borderTop: '1px solid rgba(255,255,255,.12)',
        textAlign: 'right',
        fontFamily: 'var(--mono)'
      }
    }, t.abandon_rate != null ? t.abandon_rate + '%' : '—'));
  })()))), /*#__PURE__*/React.createElement("div", {
    className: "fv-analysis-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-analysis-hdr"
  }, "DESEMPENHO POR DISPOSITIVO"), /*#__PURE__*/React.createElement("div", {
    className: "fv-donut-legend-row",
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(FunilDonut, {
    segments: mkSegs(devs),
    size: 140,
    stroke: 25
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, devs.filter(r => !r.isTotal).map((row, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '3px 0',
      borderBottom: '1px solid rgba(255,255,255,.04)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: row.color,
      flexShrink: 0,
      display: 'inline-block'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 12,
      color: 'var(--ink-3)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, row.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink)',
      fontFamily: 'var(--mono)',
      flexShrink: 0
    }
  }, row.count), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--ink-4)',
      fontFamily: 'var(--mono)',
      flexShrink: 0
    }
  }, "(", row.pct, "%)"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--ink-4)',
      marginTop: 6
    }
  }, "Total de visitas: ", devs.find(r => r.isTotal)?.count || 0))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'rgba(255,255,255,.07)',
      margin: '0 0 8px'
    }
  }), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 11
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ['DISPOSITIVO', 'VISITAS', 'CONVERSÃO', 'ABANDONO', 'APROVADOS'].map((h, i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    style: {
      fontSize: 8,
      letterSpacing: '.1em',
      color: 'var(--ink-4)',
      textAlign: i === 0 ? 'left' : 'right',
      padding: '2px 0 5px',
      fontWeight: 400,
      textTransform: 'uppercase',
      fontFamily: 'var(--mono)'
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, devs.filter(r => !r.isTotal).map((row, ri) => /*#__PURE__*/React.createElement("tr", {
    key: ri
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '4px 0',
      color: 'var(--ink-3)',
      borderTop: '1px solid rgba(255,255,255,.04)',
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 1,
      background: row.color,
      flexShrink: 0,
      display: 'inline-block'
    }
  }), row.label), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '4px 0',
      color: 'var(--ink-3)',
      borderTop: '1px solid rgba(255,255,255,.04)',
      textAlign: 'right',
      fontFamily: 'var(--mono)'
    }
  }, row.count), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '4px 0',
      borderTop: '1px solid rgba(255,255,255,.04)',
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 3,
      width: Math.round((row.conv_rate || 0) / 100 * 32),
      background: '#22c55e',
      borderRadius: 999,
      display: 'inline-block'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#22c55e',
      fontFamily: 'var(--mono)'
    }
  }, row.conv_rate != null ? row.conv_rate + '%' : '—'))), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '4px 0',
      borderTop: '1px solid rgba(255,255,255,.04)',
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 3,
      width: Math.round((row.abandon_rate || 0) / 100 * 32),
      background: '#ef4444',
      borderRadius: 999,
      display: 'inline-block'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#ef4444',
      fontFamily: 'var(--mono)'
    }
  }, row.abandon_rate != null ? row.abandon_rate + '%' : '—'))), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '4px 0',
      color: 'var(--ink-3)',
      borderTop: '1px solid rgba(255,255,255,.04)',
      textAlign: 'right',
      fontFamily: 'var(--mono)'
    }
  }, row.approved ?? 0))), devs.find(r => r.isTotal) && (() => {
    const t = devs.find(r => r.isTotal);
    return /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '5px 0 2px',
        fontWeight: 600,
        color: 'var(--ink)',
        borderTop: '1px solid rgba(255,255,255,.12)',
        display: 'flex',
        alignItems: 'center',
        gap: 4
      }
    }, "Total"), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '5px 0 2px',
        fontWeight: 600,
        color: 'var(--ink)',
        borderTop: '1px solid rgba(255,255,255,.12)',
        textAlign: 'right',
        fontFamily: 'var(--mono)'
      }
    }, t.count), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '5px 0 2px',
        fontWeight: 600,
        color: '#22c55e',
        borderTop: '1px solid rgba(255,255,255,.12)',
        textAlign: 'right',
        fontFamily: 'var(--mono)'
      }
    }, t.conv_rate != null ? t.conv_rate + '%' : '—'), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '5px 0 2px',
        fontWeight: 600,
        color: '#ef4444',
        borderTop: '1px solid rgba(255,255,255,.12)',
        textAlign: 'right',
        fontFamily: 'var(--mono)'
      }
    }, t.abandon_rate != null ? t.abandon_rate + '%' : '—'), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '5px 0 2px',
        fontWeight: 600,
        color: 'var(--ink)',
        borderTop: '1px solid rgba(255,255,255,.12)',
        textAlign: 'right',
        fontFamily: 'var(--mono)'
      }
    }, t.approved ?? 0));
  })()))), /*#__PURE__*/React.createElement("div", {
    className: "fv-analysis-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-analysis-hdr"
  }, "FORMAS DE PAGAMENTO"), /*#__PURE__*/React.createElement("div", {
    className: "fv-donut-legend-row",
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(FunilDonut, {
    segments: mkSegs(pms),
    size: 140,
    stroke: 25
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, pms.filter(r => !r.isTotal).map((row, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '3px 0',
      borderBottom: '1px solid rgba(255,255,255,.04)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: row.color,
      flexShrink: 0,
      display: 'inline-block'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 12,
      color: 'var(--ink-3)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, row.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink)',
      fontFamily: 'var(--mono)',
      flexShrink: 0
    }
  }, row.attempts ?? 0), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--ink-4)',
      fontFamily: 'var(--mono)',
      flexShrink: 0
    }
  }, "(", row.pct, "%)"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--ink-4)',
      marginTop: 6
    }
  }, "Total de pagamentos: ", pms.find(r => r.isTotal)?.attempts || 0, "*"))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'rgba(255,255,255,.07)',
      margin: '0 0 8px'
    }
  }), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 11
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ['MÉTODO', 'TENTATIVAS', 'APROVAÇÃO', 'APROVADO'].map((h, i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    style: {
      fontSize: 8,
      letterSpacing: '.1em',
      color: 'var(--ink-4)',
      textAlign: i === 0 ? 'left' : 'right',
      padding: '2px 0 5px',
      fontWeight: 400,
      textTransform: 'uppercase',
      fontFamily: 'var(--mono)'
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, pms.filter(r => !r.isTotal).map((row, ri) => /*#__PURE__*/React.createElement("tr", {
    key: ri
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '4px 0',
      color: 'var(--ink-3)',
      borderTop: '1px solid rgba(255,255,255,.04)',
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 1,
      background: row.color,
      flexShrink: 0,
      display: 'inline-block'
    }
  }), row.label), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '4px 0',
      color: 'var(--ink-3)',
      borderTop: '1px solid rgba(255,255,255,.04)',
      textAlign: 'right',
      fontFamily: 'var(--mono)'
    }
  }, row.attempts ?? 0), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '4px 0',
      color: '#22c55e',
      borderTop: '1px solid rgba(255,255,255,.04)',
      textAlign: 'right',
      fontFamily: 'var(--mono)'
    }
  }, row.approval_rate != null ? row.approval_rate + '%' : '—'), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '4px 0',
      color: 'var(--ink-3)',
      borderTop: '1px solid rgba(255,255,255,.04)',
      textAlign: 'right',
      fontFamily: 'var(--mono)'
    }
  }, row.approved ?? 0))), pms.find(r => r.isTotal) && (() => {
    const t = pms.find(r => r.isTotal);
    return /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '5px 0 2px',
        fontWeight: 600,
        color: 'var(--ink)',
        borderTop: '1px solid rgba(255,255,255,.12)',
        display: 'flex',
        alignItems: 'center',
        gap: 4
      }
    }, "Total"), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '5px 0 2px',
        fontWeight: 600,
        color: 'var(--ink)',
        borderTop: '1px solid rgba(255,255,255,.12)',
        textAlign: 'right',
        fontFamily: 'var(--mono)'
      }
    }, t.attempts ?? 0), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '5px 0 2px',
        fontWeight: 600,
        color: '#22c55e',
        borderTop: '1px solid rgba(255,255,255,.12)',
        textAlign: 'right',
        fontFamily: 'var(--mono)'
      }
    }, t.approval_rate != null ? t.approval_rate + '%' : '—'), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '5px 0 2px',
        fontWeight: 600,
        color: 'var(--ink)',
        borderTop: '1px solid rgba(255,255,255,.12)',
        textAlign: 'right',
        fontFamily: 'var(--mono)'
      }
    }, t.approved ?? 0));
  })())), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--ink-4)',
      marginTop: 4
    }
  }, "*Inclui tentativas."))), /*#__PURE__*/React.createElement("div", {
    className: "fv-abd-rec-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-abd-card",
    style: {
      borderLeft: '3px solid #ff4444'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-abd-hdr"
  }, "ABANDONO"), /*#__PURE__*/React.createElement("div", {
    className: "fv-abd-row"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#aaaaaa',
      marginBottom: 4
    }
  }, "Carrinhos abandonados"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      color: '#ffffff',
      fontWeight: 700,
      lineHeight: 1.1
    }
  }, abd.cart_count || 0)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      color: '#ff4444',
      fontWeight: 700,
      lineHeight: 1.1
    }
  }, (+(abd.cart_rate || 0)).toFixed(1).replace('.', ','), "%"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#aaaaaa',
      marginTop: 3
    }
  }, "dos carrinhos"))), /*#__PURE__*/React.createElement("div", {
    className: "fv-abd-row"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#aaaaaa',
      marginBottom: 4
    }
  }, "Checkouts abandonados"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      color: '#ffffff',
      fontWeight: 700,
      lineHeight: 1.1
    }
  }, abd.checkout_count || 0)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      color: '#ff4444',
      fontWeight: 700,
      lineHeight: 1.1
    }
  }, (+(abd.checkout_rate || 0)).toFixed(1).replace('.', ','), "%"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#aaaaaa',
      marginTop: 3
    }
  }, "dos checkouts iniciados"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 0 8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      letterSpacing: '.1em',
      color: '#ff4444',
      textTransform: 'uppercase',
      fontWeight: 700,
      marginBottom: 4
    }
  }, "VALOR POTENCIAL PERDIDO"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      color: '#ffffff',
      fontWeight: 700
    }
  }, fBrl(abd.lost_value)), /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    height: "50",
    viewBox: "0 0 200 50",
    preserveAspectRatio: "none",
    style: {
      display: 'block',
      margin: '8px 0 0'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "fv-abd-g",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#ff4444",
    stopOpacity: ".28"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#ff4444",
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("path", {
    d: "M0 38 C18 32 36 42 54 30 C72 18 90 36 108 26 C126 17 144 30 162 20 C174 14 186 24 200 16 L200 50 L0 50 Z",
    fill: "url(#fv-abd-g)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M0 38 C18 32 36 42 54 30 C72 18 90 36 108 26 C126 17 144 30 162 20 C174 14 186 24 200 16",
    fill: "none",
    stroke: "#ff4444",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), abd.reasons?.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'rgba(255,255,255,.07)',
      marginBottom: 10
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "fv-motivos-hdr"
  }, "PRINCIPAIS MOTIVOS DE ABANDONO"), abd.reasons.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "fv-motivo-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-motivo-lbl"
  }, r.label), /*#__PURE__*/React.createElement("div", {
    className: "fv-motivo-bar-bg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-motivo-bar-fill",
    style: {
      width: r.pct + '%'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fv-motivo-pct"
  }, r.count ? `${r.count} (${r.pct}%)` : `${r.pct}%`))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--ink-4)',
      marginTop: 8,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0
    }
  }, "\u2139"), " Os motivos acima s\xE3o identificados com base no comportamento do cliente."))), /*#__PURE__*/React.createElement("div", {
    className: "fv-abd-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-rec-hdr"
  }, "RECUPERA\xC7\xC3O (VIA WHATSAPP)"), /*#__PURE__*/React.createElement("div", {
    className: "fv-abd-row"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#aaaaaa',
      marginBottom: 4
    }
  }, "Carrinhos recuperados"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      color: '#ffffff',
      fontWeight: 700,
      lineHeight: 1.1
    }
  }, rec.cart_recovered || 0)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      color: '#00c853',
      fontWeight: 700,
      lineHeight: 1.1
    }
  }, (+(rec.cart_recovery_rate || 0)).toFixed(1).replace('.', ','), "%"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#aaaaaa',
      marginTop: 3
    }
  }, "taxa de recupera\xE7\xE3o"))), /*#__PURE__*/React.createElement("div", {
    className: "fv-abd-row"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#aaaaaa',
      marginBottom: 4
    }
  }, "Checkouts recuperados"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      color: '#ffffff',
      fontWeight: 700,
      lineHeight: 1.1
    }
  }, rec.checkout_recovered || 0)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      color: '#00c853',
      fontWeight: 700,
      lineHeight: 1.1
    }
  }, (+(rec.checkout_recovery_rate || 0)).toFixed(1).replace('.', ','), "%"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#aaaaaa',
      marginTop: 3
    }
  }, "taxa de recupera\xE7\xE3o"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 0 8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      letterSpacing: '.1em',
      color: '#00c853',
      textTransform: 'uppercase',
      fontWeight: 700,
      marginBottom: 4
    }
  }, "VALOR RECUPERADO"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      color: '#ffffff',
      fontWeight: 700
    }
  }, fBrl(rec.recovered_value)), /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    height: "50",
    viewBox: "0 0 200 50",
    preserveAspectRatio: "none",
    style: {
      display: 'block',
      margin: '8px 0 0'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "fv-rec-g",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#00c853",
    stopOpacity: ".28"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#00c853",
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("path", {
    d: "M0 42 C18 40 36 34 54 36 C72 38 90 26 108 22 C126 18 144 24 162 15 C174 8 186 18 200 10 L200 50 L0 50 Z",
    fill: "url(#fv-rec-g)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M0 42 C18 40 36 34 54 36 C72 38 90 26 108 22 C126 18 144 24 162 15 C174 8 186 18 200 10",
    fill: "none",
    stroke: "#00c853",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'rgba(255,255,255,.07)',
      marginBottom: 12
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "fv-mini-stats"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-mini-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-mini-lbl"
  }, "CANAL PRINCIPAL"), /*#__PURE__*/React.createElement("div", {
    className: "fv-mini-val",
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      color: '#00c853'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "#00c853",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
  })), rec.channel || '—')), /*#__PURE__*/React.createElement("div", {
    className: "fv-mini-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-mini-lbl"
  }, "TEMPO M\xC9DIO DE RESPOSTA"), /*#__PURE__*/React.createElement("div", {
    className: "fv-mini-val"
  }, rec.avg_response_time || '—')), /*#__PURE__*/React.createElement("div", {
    className: "fv-mini-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-mini-lbl"
  }, "TAXA DE CONVERS\xC3O P\xD3S CONTATO"), /*#__PURE__*/React.createElement("div", {
    className: "fv-mini-val"
  }, rec.post_contact_conv_rate != null ? rec.post_contact_conv_rate + '%' : '—'))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--ink-4)',
      marginTop: 8,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0
    }
  }, "\u2139"), " A recupera\xE7\xE3o \xE9 feita automaticamente via WhatsApp."))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      letterSpacing: '.08em',
      color: '#ffffff',
      textTransform: 'uppercase',
      fontWeight: 700
    }
  }, "PERFORMANCE DE PRODUTOS")), /*#__PURE__*/React.createElement("div", {
    className: "fv-prod-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-prod-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-prod-col-hdr amber"
  }, "MAIS ADICIONADOS AO CARRINHO"), /*#__PURE__*/React.createElement("table", {
    className: "fv-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "PRODUTO"), /*#__PURE__*/React.createElement("th", null, "ADDS"), /*#__PURE__*/React.createElement("th", null, "CONVERS\xC3O"), /*#__PURE__*/React.createElement("th", null, "ABANDONO"))), /*#__PURE__*/React.createElement("tbody", null, (prods.most_added || []).map((p, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", null, p.name), /*#__PURE__*/React.createElement("td", {
    className: "fv-num-val"
  }, p.adds), /*#__PURE__*/React.createElement("td", {
    className: "fv-conv-val"
  }, p.conv, "%"), /*#__PURE__*/React.createElement("td", {
    className: "fv-bad-val"
  }, p.abandon, "%"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#00c853',
      marginTop: 10,
      cursor: 'pointer'
    }
  }, "Ver todos os produtos \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "fv-prod-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-prod-col-hdr red"
  }, "PRODUTOS COM PIOR CONVERS\xC3O"), /*#__PURE__*/React.createElement("table", {
    className: "fv-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "PRODUTO"), /*#__PURE__*/React.createElement("th", null, "ADDS"), /*#__PURE__*/React.createElement("th", null, "COMPRAS"), /*#__PURE__*/React.createElement("th", null, "CONVERS\xC3O"))), /*#__PURE__*/React.createElement("tbody", null, (prods.worst_conversion || []).map((p, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", null, p.name), /*#__PURE__*/React.createElement("td", {
    className: "fv-num-val"
  }, p.adds), /*#__PURE__*/React.createElement("td", {
    className: "fv-num-val"
  }, p.purchases), /*#__PURE__*/React.createElement("td", {
    className: "fv-bad-val"
  }, p.conv, "%"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#ff8c00',
      marginTop: 10,
      cursor: 'pointer'
    }
  }, "Ver todos os produtos \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "fv-prod-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fv-prod-col-hdr teal"
  }, "MAIS VISUALIZADOS"), /*#__PURE__*/React.createElement("table", {
    className: "fv-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "PRODUTO"), /*#__PURE__*/React.createElement("th", null, "VISUALIZA\xC7\xD5ES"), /*#__PURE__*/React.createElement("th", null, "CTR (VIEW \u2192 ADD)"))), /*#__PURE__*/React.createElement("tbody", null, (prods.most_viewed || []).map((p, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", null, p.name), /*#__PURE__*/React.createElement("td", {
    className: "fv-num-val"
  }, p.views), /*#__PURE__*/React.createElement("td", {
    className: "fv-conv-val"
  }, p.ctr, "%"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#4a9eff',
      marginTop: 10,
      cursor: 'pointer'
    }
  }, "Ver todos os produtos \u2192"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      letterSpacing: '.08em',
      color: '#ffffff',
      textTransform: 'uppercase',
      fontWeight: 700
    }
  }, "INSIGHTS DO PER\xCDODO")), /*#__PURE__*/React.createElement("div", {
    className: "fv-insights-grid"
  }, insights.map((ins, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: 'fv-ins-card ' + (ins.type || 'bottleneck')
  }, ins.type === 'bottleneck' && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: 'rgba(255,140,0,0.2)',
      border: '1px solid rgba(255,140,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#ff8c00",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "9",
    x2: "12",
    y2: "13"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "17",
    x2: "12.01",
    y2: "17"
  }))), /*#__PURE__*/React.createElement("div", {
    className: 'fv-ins-type-tag ' + (ins.type || 'bottleneck')
  }, ins.label || ins.type), /*#__PURE__*/React.createElement("div", {
    className: "fv-ins-heading"
  }, ins.heading || ins.title), /*#__PURE__*/React.createElement("div", {
    className: "fv-ins-body",
    style: {
      paddingRight: ins.type === 'opportunity' ? 70 : ins.type === 'product' ? 70 : 0
    }
  }, ins.body), ins.type === 'bottleneck' && /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#ff4444",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      position: 'absolute',
      bottom: 14,
      right: 14,
      opacity: .8
    }
  }, /*#__PURE__*/React.createElement("line", {
    x1: "5",
    y1: "12",
    x2: "19",
    y2: "12"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "12 5 19 12 12 19"
  })), ins.type === 'product' && ins.image && /*#__PURE__*/React.createElement("img", {
    src: ins.image,
    alt: "",
    style: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 88,
      height: 88,
      objectFit: 'cover',
      borderRadius: '0 0 10px 0',
      opacity: .88
    }
  }), ins.type === 'opportunity' && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 14,
      right: 14,
      width: 56,
      height: 56,
      borderRadius: '50%',
      background: '#25D366',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 14px rgba(37,211,102,.4)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "28",
    height: "28",
    viewBox: "0 0 24 24",
    fill: "white"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#555555',
      textAlign: 'center',
      padding: '16px 0'
    }
  }, "Os dados s\xE3o atualizados em tempo real.")));
}

/* ========== PAINEL DE PAGAMENTOS ========== */
const _REJECT_CODES = {
  'Saldo insuficiente': 'código 51',
  'Limite excedido': 'código 61',
  'Cartão expirado': 'código 54',
  'Dados inválidos': 'código 14',
  'Cartão bloqueado': 'código 62',
  'Suspeita de fraude': 'código 59',
  'Transação não permitida': 'código 57',
  'Emissor indisponível': 'código 91',
  'PIN incorreto': 'código 55',
  'Limite diário excedido': 'código 65',
  'Banco indisponível': 'código 06',
  'Chave PIX inválida': 'código AB09',
  'Conta do recebedor inativa': 'código AB11',
  'Tempo expirado (timeout)': 'timeout',
  'Limite PIX excedido': 'código AB06',
  'Banco fora do ar': 'código BE17',
  'QR Code expirado': 'código BE15',
  'Erro na API do provedor': 'código BE99',
  'Outros': '—'
};
const _MOCK_REJ = {
  card_credit: [{
    label: 'Saldo insuficiente',
    count: 6,
    pct: 40
  }, {
    label: 'Cartão expirado',
    count: 3,
    pct: 20
  }, {
    label: 'Dados inválidos',
    count: 2,
    pct: 13
  }, {
    label: 'Limite excedido',
    count: 2,
    pct: 13
  }, {
    label: 'Cartão bloqueado',
    count: 0,
    pct: 0
  }, {
    label: 'Suspeita de fraude',
    count: 0,
    pct: 0
  }, {
    label: 'Transação não permitida',
    count: 0,
    pct: 0
  }, {
    label: 'Emissor indisponível',
    count: 0,
    pct: 0
  }, {
    label: 'Outros',
    count: 2,
    pct: 13
  }],
  card_debit: [{
    label: 'Saldo insuficiente',
    count: 4,
    pct: 44
  }, {
    label: 'Dados inválidos',
    count: 2,
    pct: 22
  }, {
    label: 'Cartão bloqueado',
    count: 2,
    pct: 22
  }, {
    label: 'Transação não permitida',
    count: 0,
    pct: 0
  }, {
    label: 'Limite diário excedido',
    count: 0,
    pct: 0
  }, {
    label: 'PIN incorreto',
    count: 0,
    pct: 0
  }, {
    label: 'Banco indisponível',
    count: 0,
    pct: 0
  }, {
    label: 'Outros',
    count: 1,
    pct: 11
  }],
  pix: [{
    label: 'Saldo insuficiente',
    count: 3,
    pct: 50
  }, {
    label: 'Chave PIX inválida',
    count: 2,
    pct: 33
  }, {
    label: 'Conta do recebedor inativa',
    count: 1,
    pct: 17
  }, {
    label: 'Tempo expirado (timeout)',
    count: 0,
    pct: 0
  }, {
    label: 'Limite PIX excedido',
    count: 0,
    pct: 0
  }, {
    label: 'Banco fora do ar',
    count: 0,
    pct: 0
  }, {
    label: 'QR Code expirado',
    count: 0,
    pct: 0
  }, {
    label: 'Erro na API do provedor',
    count: 0,
    pct: 0
  }, {
    label: 'Outros',
    count: 0,
    pct: 0
  }]
};
const _METHOD_CFG = {
  card_credit: {
    color: {
      primary: 'oklch(0.68 0.19 25)',
      border: 'oklch(0.68 0.19 25 / 0.22)'
    },
    title: 'CARTÃO DE CRÉDITO',
    Icon: () => /*#__PURE__*/React.createElement(Ic.card, null)
  },
  card_debit: {
    color: {
      primary: 'oklch(0.74 0.14 55)',
      border: 'oklch(0.74 0.14 55 / 0.22)'
    },
    title: 'CARTÃO DE DÉBITO',
    Icon: () => /*#__PURE__*/React.createElement(Ic.card, null)
  },
  pix: {
    color: {
      primary: 'oklch(0.76 0.13 155)',
      border: 'oklch(0.76 0.13 155 / 0.22)'
    },
    title: 'PIX',
    Icon: () => /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 16 16",
      width: "14",
      height: "14",
      fill: "currentColor"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M8 0L9.3 6.7L16 8L9.3 9.3L8 16L6.7 9.3L0 8L6.7 6.7Z"
    }))
  }
};
function RejCard({
  data,
  color,
  title,
  Icon,
  isMock
}) {
  const total = data.reduce((s, m) => s + m.count, 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--panel)',
      border: `1px solid ${color.border}`,
      borderRadius: 'var(--r)',
      padding: '18px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: color.primary,
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, null)), /*#__PURE__*/React.createElement("small", {
    style: {
      fontSize: 10,
      letterSpacing: '0.18em',
      color: color.primary,
      fontWeight: 500
    }
  }, title), isMock && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: 'var(--ink-4)',
      marginLeft: 'auto',
      letterSpacing: '0.05em'
    }
  }, "exemplo")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 9
    }
  }, data.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 180,
      fontSize: 12,
      color: 'var(--ink-2)',
      flexShrink: 0
    }
  }, m.label), /*#__PURE__*/React.createElement("div", {
    title: `${m.label} — ${_REJECT_CODES[m.label] || '—'}`,
    style: {
      flex: 1,
      background: 'var(--panel-2)',
      borderRadius: 2,
      height: 6,
      overflow: 'hidden',
      cursor: 'default'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: m.pct + '%',
      background: color.primary,
      height: '100%',
      borderRadius: 2,
      transition: 'width 0.4s ease'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 92,
      textAlign: 'right',
      fontSize: 11,
      color: 'var(--ink-3)',
      flexShrink: 0
    }
  }, m.count, " ", m.count === 1 ? 'ocorrência' : 'ocorrências'), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 34,
      textAlign: 'right',
      fontSize: 11,
      color: color.primary,
      fontWeight: 600,
      flexShrink: 0
    }
  }, m.pct, "%")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      paddingTop: 10,
      borderTop: '1px solid var(--line-2)',
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-4)'
    }
  }, "Total"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-3)'
    }
  }, total, " ", total === 1 ? 'ocorrência' : 'ocorrências')));
}
function PagtoPainelPage() {
  const [analytics, setAnalytics] = useStX(null);
  const [loading, setLoading] = useStX(true);
  const [tab, setTab] = useStX('all');
  useEffX(() => {
    let mounted = true;
    const tok = localStorage.getItem('tocha_admin_token');
    fetch('/api/admin/payment-analytics?days=30&ts=' + Date.now(), {
      cache: 'no-store',
      headers: tok ? {
        'Authorization': 'Bearer ' + tok
      } : {}
    }).then(r => r.ok ? r.json() : Promise.reject()).then(a => {
      if (!mounted) return;
      setAnalytics(a);
    }).catch(() => {}).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);
  const approved = analytics?.approved ?? {
    count: 0,
    rate: 0,
    revenue: 0
  };
  const pending = analytics?.pending ?? {
    count: 0,
    revenue: 0
  };
  const rejected = analytics?.rejected ?? {
    count: 0,
    rate: 0
  };
  const refunds = analytics?.refunds ?? {
    count: 0,
    amount_total: 0
  };
  const total = analytics?.total ?? 0;
  const mrej = analytics?.method_rejections ?? {};
  const TABS = [{
    key: 'all',
    label: 'Todos'
  }, {
    key: 'card_credit',
    label: 'Cartão de Crédito'
  }, {
    key: 'card_debit',
    label: 'Débito'
  }, {
    key: 'pix',
    label: 'Pix'
  }];
  const getMethodData = method => {
    const bucket = mrej[method];
    // Novo formato: { total, reasons: [{ code, label, count, pct }] }
    if (bucket && typeof bucket.total === 'number') {
      return bucket.total > 0 ? {
        data: bucket.reasons,
        isMock: false
      } : {
        data: _MOCK_REJ[method] || [],
        isMock: true
      };
    }
    // Formato legado (array) — compatibilidade retroativa
    const arr = Array.isArray(bucket) ? bucket : [];
    return arr.length > 0 ? {
      data: arr,
      isMock: false
    } : {
      data: _MOCK_REJ[method] || [],
      isMock: true
    };
  };
  const renderCard = method => {
    const cfg = _METHOD_CFG[method];
    const {
      data,
      isMock
    } = getMethodData(method);
    return /*#__PURE__*/React.createElement(RejCard, {
      key: method,
      data: data,
      color: cfg.color,
      title: cfg.title,
      Icon: cfg.Icon,
      isMock: isMock
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PH, {
    title: "Painel de Pagamentos",
    subtitle: "Vis\xE3o geral de aprova\xE7\xF5es, rejei\xE7\xF5es e estornos."
  }), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 200
    }
  }, /*#__PURE__*/React.createElement(Ic.clock, null), /*#__PURE__*/React.createElement("div", null, "Carregando dados\u2026")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pay-stat k-up"
  }, /*#__PURE__*/React.createElement("small", null, "APROVADOS"), /*#__PURE__*/React.createElement("b", null, approved.count), /*#__PURE__*/React.createElement("span", null, approved.rate, "% do total", approved.revenue > 0 ? ` — ${brl(approved.revenue)}` : '')), /*#__PURE__*/React.createElement("div", {
    className: "pay-stat k-warn"
  }, /*#__PURE__*/React.createElement("small", null, "PENDENTES"), /*#__PURE__*/React.createElement("b", null, pending.count), /*#__PURE__*/React.createElement("span", null, pending.revenue > 0 ? brl(pending.revenue) : 'Aguardando confirmação')), /*#__PURE__*/React.createElement("div", {
    className: "pay-stat k-down"
  }, /*#__PURE__*/React.createElement("small", null, "REJEITADOS"), /*#__PURE__*/React.createElement("b", null, rejected.count), /*#__PURE__*/React.createElement("span", null, rejected.rate, "% do total"))), /*#__PURE__*/React.createElement("div", {
    className: "grid row-2 mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '18px 20px'
    }
  }, /*#__PURE__*/React.createElement("small", {
    className: "kv-l"
  }, "TOTAL DE TRANSA\xC7\xD5ES"), /*#__PURE__*/React.createElement("b", {
    style: {
      fontFamily: 'var(--display)',
      fontWeight: 400,
      fontSize: 72,
      lineHeight: 1.05,
      color: 'var(--ink)',
      display: 'block',
      marginTop: 8
    }
  }, total)), /*#__PURE__*/React.createElement("div", {
    className: "pay-stat",
    style: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("small", null, "ESTORNADOS"), /*#__PURE__*/React.createElement("b", null, refunds.count), /*#__PURE__*/React.createElement("span", null, refunds.amount_total > 0 ? brl(refunds.amount_total) : '—'))), /*#__PURE__*/React.createElement("div", {
    className: "card mt",
    style: {
      padding: '20px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      flexWrap: 'wrap',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("small", {
    className: "kv-l"
  }, "MOTIVOS DE REJEI\xC7\xC3O"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, TABS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.key,
    onClick: () => setTab(t.key),
    style: {
      padding: '4px 12px',
      fontSize: 11,
      borderRadius: 20,
      cursor: 'pointer',
      border: '1px solid var(--line-2)',
      background: tab === t.key ? 'var(--ink)' : 'transparent',
      color: tab === t.key ? 'var(--bg)' : 'var(--ink-3)',
      fontFamily: 'inherit'
    }
  }, t.label)))), tab === 'all' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14,
      marginBottom: 14
    }
  }, renderCard('card_credit'), renderCard('card_debit')), renderCard('pix')) : renderCard(tab))));
}

/* ========== CARDÁPIO ========== */
function CategoriaModal({
  cat,
  onClose,
  onSave
}) {
  const [name, setName] = useStX(cat?.name || '');
  const [slug, setSlug] = useStX(cat?.slug || '');
  const [desc, setDesc] = useStX(cat?.description || '');
  const [visible, setVisible] = useStX(cat?.is_active !== false);
  const [imageUrl, setImageUrl] = useStX(cat?.image_url || '');
  const [uploading, setUploading] = useStX(false);
  const [saving, setSaving] = useStX(false);
  const imgRef = useRefX(null);
  const isNew = !cat?.id;
  const handleImg = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      setImageUrl(await _uploadImage(file));
    } catch (err) {
      alert('Erro no upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };
  const handleSave = () => {
    setSaving(true);
    const payload = {
      slug,
      name,
      description: desc,
      is_active: visible,
      image_url: imageUrl
    };
    if (cat?.id) payload.id = cat.id;
    window.apiPost('/api/admin/save-category', payload).then(() => onSave({
      ...payload
    })).catch(e => alert('Erro: ' + e.message)).finally(() => setSaving(false));
  };
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
    onChange: e => setSlug(e.target.value),
    disabled: !isNew
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
  }, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("span", null, "Foto de vitrine"), /*#__PURE__*/React.createElement("div", {
    className: "img-slot",
    style: {
      cursor: 'pointer'
    },
    onClick: () => imgRef.current?.click(),
    title: "Clique para escolher imagem"
  }, uploading ? /*#__PURE__*/React.createElement("div", {
    className: "img-empty"
  }, "Enviando\u2026") : imageUrl ? /*#__PURE__*/React.createElement("img", {
    src: `/${imageUrl}`,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: 4
    }
  }) : /*#__PURE__*/React.createElement("div", {
    className: "img-empty"
  }, "Escolher Foto")), /*#__PURE__*/React.createElement("input", {
    ref: imgRef,
    type: "file",
    accept: "image/*",
    style: {
      display: 'none'
    },
    onChange: handleImg
  })), /*#__PURE__*/React.createElement("div", {
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
    onClick: handleSave,
    disabled: saving || uploading
  }, saving ? 'Salvando…' : 'Salvar Categoria'))));
}
function ProdutoModal({
  prod,
  onClose,
  onSave
}) {
  const [name, setName] = useStX(prod?.name || '');
  const [price, setPrice] = useStX(prod?.price || 0);
  const [desc, setDesc] = useStX(prod?.description || '');
  const [estoque, setEstoque] = useStX(prod?.initial_stock ?? prod?.stock_quantity ?? 0);
  const [active, setActive] = useStX(prod?.is_active !== false);
  const [imageUrl, setImageUrl] = useStX(prod?.image_url || '');
  const [uploading, setUploading] = useStX(false);
  const [saving, setSaving] = useStX(false);
  const imgRef = useRefX(null);
  const vendidos = prod?.vendidos || 0;
  const disp = Math.max(0, estoque - vendidos);
  const fillPct = estoque ? Math.min(100, disp / estoque * 100) : 0;
  const isNew = !prod?.id;
  const handleImg = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      setImageUrl(await _uploadImage(file));
    } catch (err) {
      alert('Erro no upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };
  const handleSave = () => {
    setSaving(true);
    const payload = {
      name,
      price: parseFloat(price) || 0,
      description: desc,
      is_active: active,
      initial_stock: parseInt(estoque) || 0,
      category_slug: prod?.category_slug || '',
      image_url: imageUrl
    };
    if (prod?.id) payload.id = prod.id;
    window.apiPost('/api/admin/save-product', payload).then(() => onSave({
      ...payload
    })).catch(e => alert('Erro: ' + e.message)).finally(() => setSaving(false));
  };
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
    onChange: e => setPrice(e.target.value)
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
  }, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("span", null, "Foto do Produto"), /*#__PURE__*/React.createElement("div", {
    className: "img-slot",
    style: {
      cursor: 'pointer'
    },
    onClick: () => imgRef.current?.click(),
    title: "Clique para trocar imagem"
  }, uploading ? /*#__PURE__*/React.createElement("div", {
    className: "img-empty"
  }, "Enviando\u2026") : imageUrl ? /*#__PURE__*/React.createElement("img", {
    src: `/${imageUrl}`,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: 4
    }
  }) : /*#__PURE__*/React.createElement("div", {
    className: "img-empty"
  }, "Escolher Foto")), /*#__PURE__*/React.createElement("input", {
    ref: imgRef,
    type: "file",
    accept: "image/*",
    style: {
      display: 'none'
    },
    onChange: handleImg
  })), /*#__PURE__*/React.createElement("div", {
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
    onClick: handleSave,
    disabled: saving || uploading
  }, saving ? 'Salvando…' : 'Salvar Produto'))));
}
function CardapioPage() {
  const [cats, setCats] = useStX([]);
  const [prods, setProds] = useStX([]);
  const [sel, setSel] = useStX('');
  const [loading, setLoading] = useStX(true);
  const [catModal, setCatModal] = useStX(null);
  const [prodModal, setProdModal] = useStX(null);
  const loadConfig = useCbX(() => {
    setLoading(true);
    window.apiGet('/api/admin/config').then(d => {
      const cs = d?.categorias || [];
      const ps = d?.produtos || [];
      setCats(cs);
      setProds(ps);
      if (cs.length > 0 && !sel) setSel(cs[0].slug);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffX(() => {
    loadConfig();
  }, [loadConfig]);
  const stop = e => e.stopPropagation();
  const editCat = (cat, e) => {
    stop(e);
    setCatModal({
      cat
    });
  };
  const delCat = (cat, e) => {
    stop(e);
    if (!confirm(`Excluir categoria "${cat.name}"?`)) return;
    window.apiPost('/api/admin/delete-item', {
      table: 'categorias',
      id: cat.id
    }).then(() => setCats(prev => prev.filter(c => c.id !== cat.id))).catch(err => alert('Erro: ' + err.message));
  };
  const newCat = () => setCatModal({
    cat: null
  });
  const saveCat = () => {
    setCatModal(null);
    loadConfig();
  };
  const editProd = (p, e) => {
    stop(e);
    setProdModal({
      prod: p
    });
  };
  const delProd = (p, e) => {
    stop(e);
    if (!confirm(`Excluir produto "${p.name}"?`)) return;
    window.apiPost('/api/admin/delete-item', {
      table: 'produtos',
      id: p.id
    }).then(() => setProds(prev => prev.filter(x => x.id !== p.id))).catch(err => alert('Erro: ' + err.message));
  };
  const newProd = () => setProdModal({
    prod: {
      category_slug: sel
    }
  });
  const saveProd = () => {
    setProdModal(null);
    loadConfig();
  };
  const filteredProds = prods.filter(p => p.category_slug === sel);
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
  }, "Categorias e produtos exibidos no site."))), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 200
    }
  }, /*#__PURE__*/React.createElement(Ic.list, null), /*#__PURE__*/React.createElement("div", null, "Carregando card\xE1pio\u2026")) : /*#__PURE__*/React.createElement("div", {
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
    key: c.slug,
    onClick: () => setSel(c.slug),
    className: `cat-row ${sel === c.slug ? 'on' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "cat-thumb"
  }, c.image_url && /*#__PURE__*/React.createElement("img", {
    src: `/${c.image_url}`,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: 4
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "cat-text"
  }, /*#__PURE__*/React.createElement("b", null, c.name), /*#__PURE__*/React.createElement("small", null, c.description), /*#__PURE__*/React.createElement("span", {
    className: `tag ${c.is_active !== false ? 'up' : 'down'}`,
    style: {
      marginTop: 4
    }
  }, c.is_active !== false ? 'ATIVA' : 'INATIVA')), /*#__PURE__*/React.createElement("div", {
    className: "row-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "Editar",
    onClick: e => editCat(c, e)
  }, "\u270F"), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn danger",
    title: "Excluir",
    onClick: e => delCat(c, e)
  }, "\uD83D\uDDD1")))), cats.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--ink-4)',
      fontSize: 13,
      padding: 12
    }
  }, "Nenhuma categoria cadastrada."))), /*#__PURE__*/React.createElement("div", {
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
  }, cats.find(c => c.slug === sel)?.name || '—')), /*#__PURE__*/React.createElement("button", {
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
  }, filteredProds.map(p => {
    const stock = p.stock_quantity ?? p.initial_stock ?? 0;
    const esgotado = stock <= 0;
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      className: "prod-row-full"
    }, /*#__PURE__*/React.createElement("div", {
      className: "prod-thumb"
    }, p.image_url && /*#__PURE__*/React.createElement("img", {
      src: `/${p.image_url}`,
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: 4
      }
    })), /*#__PURE__*/React.createElement("div", {
      className: "prod-text"
    }, /*#__PURE__*/React.createElement("b", null, p.name), /*#__PURE__*/React.createElement("small", null, p.description)), /*#__PURE__*/React.createElement("div", {
      className: "prod-meta"
    }, /*#__PURE__*/React.createElement("b", {
      className: "num",
      style: {
        color: 'var(--ink)'
      }
    }, "R$ ", Number(p.price || 0).toFixed(2).replace('.', ',')), /*#__PURE__*/React.createElement("span", {
      className: `tag ${p.is_active !== false ? 'up' : 'down'}`
    }, p.is_active !== false ? 'ATIVO' : 'INATIVO'), /*#__PURE__*/React.createElement("small", {
      style: {
        color: esgotado ? 'var(--down)' : 'var(--ink-3)'
      }
    }, esgotado ? 'Esgotado' : `${stock} un.`)), /*#__PURE__*/React.createElement("div", {
      className: "row-actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "icon-btn",
      title: "Editar",
      onClick: e => editProd(p, e)
    }, "\u270F"), /*#__PURE__*/React.createElement("button", {
      className: "icon-btn danger",
      title: "Excluir",
      onClick: e => delProd(p, e)
    }, "\uD83D\uDDD1")));
  }), filteredProds.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--ink-4)',
      fontSize: 13,
      padding: 12
    }
  }, "Nenhum produto nesta categoria.")))), catModal && /*#__PURE__*/React.createElement(CategoriaModal, {
    cat: catModal.cat,
    onClose: () => setCatModal(null),
    onSave: saveCat
  }), prodModal && /*#__PURE__*/React.createElement(ProdutoModal, {
    prod: prodModal.prod,
    onClose: () => setProdModal(null),
    onSave: saveProd
  }));
}

/* ========== MODELO MODAL ========== */
function ModeloModal({
  template,
  index,
  onClose,
  onSave,
  onDelete
}) {
  const [title, setTitle] = useStX(template?.title || '');
  const [body, setBody] = useStX(template?.body || '');
  const [saving, setSaving] = useStX(false);
  const isNew = index === undefined;
  const handleSave = () => {
    if (!title.trim() || !body.trim() || saving) return;
    setSaving(true);
    onSave({
      title: title.trim(),
      body: body.trim()
    }, index, () => setSaving(false));
  };
  const handleDelete = () => {
    if (!confirm(`Excluir o modelo "${title}"?`)) return;
    onDelete(index);
  };
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
  }, isNew ? 'Novo Modelo' : 'Editar Modelo'), /*#__PURE__*/React.createElement("p", {
    className: "modal-sub"
  }, "Salve mensagens prontas para disparos r\xE1pidos."), /*#__PURE__*/React.createElement("label", {
    className: "field"
  }, /*#__PURE__*/React.createElement("span", null, "T\xEDtulo"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    value: title,
    onChange: e => setTitle(e.target.value),
    placeholder: "Ex: Promo\xE7\xE3o de s\xE1bado"
  })), /*#__PURE__*/React.createElement("label", {
    className: "field",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("span", null, "Mensagem"), /*#__PURE__*/React.createElement("textarea", {
    className: "inp",
    rows: 8,
    value: body,
    onChange: e => setBody(e.target.value),
    placeholder: "Texto da mensagem. Use {nome} para personalizar."
  })), /*#__PURE__*/React.createElement("div", {
    className: "modal-actions"
  }, !isNew && /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    style: {
      color: 'var(--down)',
      marginRight: 'auto'
    },
    onClick: handleDelete
  }, "Excluir"), /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    onClick: onClose
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: handleSave,
    disabled: saving || !title.trim() || !body.trim()
  }, saving ? 'Salvando…' : 'Salvar'))));
}

/* ========== CENTRAL DE MENSAGENS ========== */
function CentralMsgPage() {
  const [contacts, setContacts] = useStX([]);
  const [loading, setLoading] = useStX(true);
  const [sel, setSel] = useStX(new Set());
  const [msg, setMsg] = useStX('');
  const [sending, setSending] = useStX(false);
  const [newName, setNewName] = useStX('');
  const [newPhone, setNewPhone] = useStX('');
  const [search, setSearch] = useStX('');
  const [deleting, setDeleting] = useStX(new Set());
  const [templates, setTemplates] = useStX([]);
  const [templateModal, setTemplateModal] = useStX(null);
  const loadContacts = useCbX(() => {
    window.apiGet('/api/admin/customers').then(d => setContacts(d || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffX(() => {
    loadContacts();
  }, [loadContacts]);
  useEffX(() => {
    window.apiGet('/api/admin/config').then(d => setTemplates(d?.siteContent?.msg_templates || [])).catch(() => {});
  }, []);
  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    return !q || (c.name || '').toLowerCase().includes(q) || (c.whatsapp || '').includes(q);
  });
  const toggle = id => {
    const s = new Set(sel);
    s.has(id) ? s.delete(id) : s.add(id);
    setSel(s);
  };
  const selAll = () => setSel(new Set(filtered.map(c => c.id)));
  const clearSel = () => setSel(new Set());
  const handleDeleteContact = (e, c) => {
    e.stopPropagation();
    if (!confirm(`Excluir o contato "${c.name}"?`)) return;
    setDeleting(prev => new Set(prev).add(c.id));
    window.apiPost('/api/admin/delete-item', {
      table: 'clientes',
      id: c.id
    }).then(() => {
      setContacts(prev => prev.filter(x => x.id !== c.id));
      setSel(prev => {
        const s = new Set(prev);
        s.delete(c.id);
        return s;
      });
    }).catch(err => alert('Erro ao excluir: ' + err.message)).finally(() => setDeleting(prev => {
      const s = new Set(prev);
      s.delete(c.id);
      return s;
    }));
  };
  const handleSend = () => {
    if (!sel.size || !msg || sending) return;
    const recipients = contacts.filter(c => sel.has(c.id)).map(c => ({
      phone: c.whatsapp,
      name: c.name
    }));
    setSending(true);
    window.apiPost('/api/admin/send-bulk-message', {
      recipients,
      message: msg
    }).then(r => alert(`Envio concluído: ${r.success} enviados, ${r.fail} falhas.`)).catch(e => alert('Erro no envio: ' + e.message)).finally(() => setSending(false));
  };
  const handleAddContact = () => {
    if (!newName || !newPhone) return;
    window.apiPost('/api/admin/save-customer', {
      name: newName,
      whatsapp: newPhone
    }).then(() => {
      setNewName('');
      setNewPhone('');
      loadContacts();
    }).catch(e => alert('Erro: ' + e.message));
  };
  const persistTemplates = (newList, done) => {
    window.apiPost('/api/admin/save-content', {
      key: 'msg_templates',
      value: newList
    }).then(() => {
      setTemplates(newList);
      setTemplateModal(null);
    }).catch(e => alert('Erro ao salvar modelo: ' + e.message)).finally(() => {
      if (done) done();
    });
  };
  const handleSaveTemplate = (data, index, done) => {
    const updated = index === undefined ? [...templates, data] : templates.map((t, i) => i === index ? data : t);
    persistTemplates(updated, done);
  };
  const handleDeleteTemplate = index => {
    persistTemplates(templates.filter((_, i) => i !== index), null);
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
    },
    value: search,
    onChange: e => setSearch(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      fontSize: 12,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("a", {
    className: "link-id",
    onClick: selAll,
    style: {
      cursor: 'pointer'
    }
  }, "Selecionar Todos"), /*#__PURE__*/React.createElement("a", {
    className: "link-muted",
    onClick: clearSel,
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
  }, loading && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--ink-4)',
      fontSize: 13,
      padding: 8
    }
  }, "Carregando\u2026"), filtered.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    className: `contact-row ${sel.has(c.id) ? 'on' : ''}`,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    },
    onClick: () => toggle(c.id)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("b", null, c.name), /*#__PURE__*/React.createElement("small", null, fmtPhoneX(c.whatsapp))), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn danger",
    style: {
      flexShrink: 0,
      opacity: deleting.has(c.id) ? 0.4 : 0.55,
      fontSize: 12
    },
    disabled: deleting.has(c.id),
    onClick: e => handleDeleteContact(e, c),
    title: "Excluir contato"
  }, "\uD83D\uDDD1"))))), /*#__PURE__*/React.createElement("div", {
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
    className: `campaign-btn ${sel.size > 0 && msg ? 'on' : ''}`,
    onClick: handleSend,
    disabled: sending || !sel.size || !msg
  }, sending ? 'ENVIANDO…' : 'ENVIAR CAMPANHA AGORA'), /*#__PURE__*/React.createElement("small", {
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
    },
    value: newName,
    onChange: e => setNewName(e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    placeholder: "WhatsApp (DDD+N\xFAmero)",
    style: {
      marginBottom: 10
    },
    value: newPhone,
    onChange: e => setNewPhone(e.target.value)
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
    },
    onClick: handleAddContact
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
      margin: 0,
      flex: 1
    }
  }, "MODELOS (", templates.length, "/10)"), templates.length < 10 && /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    style: {
      padding: '2px 8px',
      fontSize: 11,
      lineHeight: 1.4
    },
    onClick: () => setTemplateModal({
      mode: 'new'
    })
  }, "+ Adicionar")), templates.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "model-empty"
  }, /*#__PURE__*/React.createElement("b", null, "Crie agilidade"), /*#__PURE__*/React.createElement("small", null, "Salve frases prontas para realizar disparos r\xE1pidos em segundos.")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, templates.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "contact-row",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      cursor: 'pointer'
    },
    onClick: () => setMsg(t.body)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: 12,
      display: 'block',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, t.title)), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    style: {
      flexShrink: 0,
      fontSize: 12,
      opacity: 0.6
    },
    onClick: e => {
      e.stopPropagation();
      setTemplateModal({
        mode: 'edit',
        template: t,
        index: i
      });
    },
    title: "Editar modelo"
  }, "\u270F"))))))), templateModal && /*#__PURE__*/React.createElement(ModeloModal, {
    template: templateModal.template,
    index: templateModal.index,
    onClose: () => setTemplateModal(null),
    onSave: handleSaveTemplate,
    onDelete: handleDeleteTemplate
  }));
}

/* ========== CONFIGURAÇÕES DE MENSAGEM (estático — templates de notificação) ========== */
const TEMPLATES = [{
  key: 'msg_email_confirm',
  title: 'Email confirmação de compra',
  desc: 'Mensagem enviada por e-mail ao cliente após confirmação do pagamento.',
  vars: ['{nome}', '{itens}', '{total}', '{pagamento}'],
  fallback: '✅ Pedido confirmado — {nome}\n\n📍 Retirada\nAv. Presidente Kennedy, 627 — Vila Jurandir\n(Em frente à Tetraforma)\n\n📅 Quando\nSábado, a partir das 15h'
}, {
  key: 'msg_wa_confirm',
  title: 'WhatsApp confirmação de compra',
  desc: 'Notificação via WhatsApp confirmando a compra e informando os próximos passos.',
  vars: ['{nome}', '{itens}', '{total}', '{pagamento}'],
  fallback: '✅ *Pedido confirmado — {nome}*\n\n📍 *Retirada*\nAv. Presidente Kennedy, 627 — Vila Jurandir\n(Em frente à Tetraforma)\n\n📅 *Quando*\nSábado, a partir das 15h'
}, {
  key: 'msg_wa_abandoned',
  title: 'WhatsApp carrinho abandonado',
  desc: 'Recuperação enviada para carrinhos iniciados e não finalizados após 1 hora.',
  vars: ['{nome}', '{itens}', '{link}'],
  fallback: '{nome}, tudo bem? 🥖\n\nVimos que você selecionou alguns produtos, bom gosto!\n\nGaranta essas delícias — finalize seu carrinho antes que esgotem!\n\n🛒\n{itens}'
}, {
  key: 'whatsapp_pix_abandoned',
  title: 'WhatsApp PIX não finalizado',
  desc: 'Enviado quando um pagamento via PIX é iniciado mas não confirmado dentro do prazo.',
  vars: ['{nome}', '{total}', '{link}'],
  fallback: '{nome}, seu pedido de {total} via PIX ainda está aguardando pagamento. 🍞\n\nFinalize agora para garantir sua fornada:\n{link}'
}, {
  key: 'whatsapp_card_abandoned',
  title: 'WhatsApp Cartão não finalizado',
  desc: 'Enviado quando um pagamento via Cartão é iniciado mas não confirmado.',
  vars: ['{nome}', '{total}', '{link}'],
  fallback: '{nome}, seu pedido de {total} via Cartão ainda está aguardando pagamento. 🍞\n\nFinalize agora para garantir sua fornada:\n{link}'
}, {
  key: 'whatsapp_ready_for_pickup',
  title: 'WhatsApp pronto p/ retirada',
  desc: 'Enviado automaticamente quando um pedido é marcado como Pronto para Retirada na fila de produção.',
  vars: ['{nome}'],
  fallback: '🍞 *{nome}, seu pedido está pronto!*\n\nSeu pedido já está pronto para retirada.\n\n📍 *Retirada*\nAv. Presidente Kennedy, 627 — Vila Jurandir\n(Em frente à Tetraforma)\n\nObrigado por escolher a Padaria! 🤍'
}];
function CfgMsgPage() {
  const [texts, setTexts] = useStX({});
  const [saving, setSaving] = useStX({});
  const [msgs, setMsgs] = useStX({});
  const [loaded, setLoaded] = useStX(false);
  useEffX(() => {
    let mounted = true;
    window.apiGet('/api/admin/config').then(d => {
      if (!mounted) return;
      const sc = d?.siteContent || {};
      const initial = {};
      TEMPLATES.forEach(t => {
        initial[t.key] = sc[t.key] != null ? sc[t.key] : t.fallback;
      });
      setTexts(initial);
      setLoaded(true);
    }).catch(() => {
      if (!mounted) return;
      const initial = {};
      TEMPLATES.forEach(t => {
        initial[t.key] = t.fallback;
      });
      setTexts(initial);
      setLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);
  const handleSave = key => {
    setSaving(prev => ({
      ...prev,
      [key]: true
    }));
    setMsgs(prev => ({
      ...prev,
      [key]: ''
    }));
    window.apiPost('/api/admin/save-content', {
      key,
      value: texts[key]
    }).then(() => setMsgs(prev => ({
      ...prev,
      [key]: 'Salvo com sucesso!'
    }))).catch(e => setMsgs(prev => ({
      ...prev,
      [key]: 'Erro: ' + e.message
    }))).finally(() => setSaving(prev => ({
      ...prev,
      [key]: false
    })));
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
  }, "Configura\xE7\xF5es \xB7 Mensagens"), /*#__PURE__*/React.createElement("h1", null, "Configura\xE7\xF5es de Mensagem"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Templates autom\xE1ticos enviados aos clientes em cada etapa."))), !loaded ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(SafeIcon, {
    icon: Ic.msg
  }), /*#__PURE__*/React.createElement("div", null, "Carregando templates\u2026")) : /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, TEMPLATES.map(t => /*#__PURE__*/React.createElement("div", {
    className: "card",
    key: t.key
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
    value: texts[t.key] ?? '',
    onChange: e => setTexts(prev => ({
      ...prev,
      [t.key]: e.target.value
    }))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("small", {
    style: {
      color: (msgs[t.key] || '').startsWith('Erro') ? 'var(--down)' : 'var(--up)',
      minHeight: 18
    }
  }, msgs[t.key] || ''), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: () => handleSave(t.key),
    disabled: !!saving[t.key]
  }, saving[t.key] ? 'Salvando…' : 'Salvar Alterações'))))));
}

/* ========== EDITAR PERFIL ========== */
function EditarPerfilPage() {
  const stored = (() => {
    try {
      return JSON.parse(localStorage.getItem('tocha_admin_user') || '{}');
    } catch {
      return {};
    }
  })();
  const [nome, setNome] = useStX(stored.nome || '');
  const [tel, setTel] = useStX(stored.telefone || '');
  const [email, setEmail] = useStX(stored.email || '');
  const [senha, setSenha] = useStX('');
  const [dirty, setDirty] = useStX(false);
  const [saving, setSaving] = useStX(false);
  const [msg, setMsg] = useStX('');
  const [avatarUrl, setAvatarUrl] = useStX(stored.avatar_url || '');
  const [uploadingAvatar, setUploadingAvatar] = useStX(false);
  const avatarRef = useRefX(null);
  useEffX(() => {
    window.apiGet('/api/admin/config').then(d => {
      const url = d?.siteContent?.admin_profile_avatar;
      if (url) setAvatarUrl(url);
    }).catch(() => {});
  }, []);
  const handleAvatarFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingAvatar(true);
    try {
      const url = await _uploadImage(file);
      setAvatarUrl(url);
      await window.apiPost('/api/admin/save-content', {
        key: 'admin_profile_avatar',
        value: url
      });
      const updated = {
        ...stored,
        avatar_url: url
      };
      localStorage.setItem('tocha_admin_user', JSON.stringify(updated));
    } catch (err) {
      alert('Erro no upload: ' + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };
  const upd = (fn, v) => {
    fn(v);
    setDirty(true);
    setMsg('');
  };
  const handleSave = () => {
    setSaving(true);
    const payload = {
      nome,
      email
    };
    if (senha && senha.trim()) payload.senha = senha;
    window.apiPost('/api/admin/update-profile', payload).then(() => {
      const updated = {
        ...stored,
        nome,
        email,
        telefone: tel
      };
      localStorage.setItem('tocha_admin_user', JSON.stringify(updated));
      setDirty(false);
      setSenha('');
      setMsg('Perfil atualizado com sucesso!');
    }).catch(e => setMsg('Erro: ' + e.message)).finally(() => setSaving(false));
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
    className: "avatar-circle",
    style: {
      cursor: 'pointer',
      overflow: 'hidden'
    },
    onClick: () => avatarRef.current?.click()
  }, avatarUrl ? /*#__PURE__*/React.createElement("img", {
    src: `/${avatarUrl}`,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    className: "avatar-mark"
  }, (nome || 'A')[0].toUpperCase())), /*#__PURE__*/React.createElement("b", {
    className: "av-title"
  }, "Foto de Perfil"), /*#__PURE__*/React.createElement("small", null, "Formato: PNG ou JPG"), /*#__PURE__*/React.createElement("small", null, "Resolu\xE7\xE3o m\xEDnima: 350px x 195px"), /*#__PURE__*/React.createElement("div", {
    className: "av-drop"
  }, "Arraste sua imagem aqui ou escolha uma direto do seu dispositivo"), /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    style: {
      width: '100%'
    },
    onClick: () => avatarRef.current?.click(),
    disabled: uploadingAvatar
  }, uploadingAvatar ? 'Enviando…' : 'Escolher foto'), /*#__PURE__*/React.createElement("input", {
    ref: avatarRef,
    type: "file",
    accept: "image/*",
    style: {
      display: 'none'
    },
    onChange: handleAvatarFile
  })), /*#__PURE__*/React.createElement("div", {
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
    placeholder: "Deixe em branco para manter a atual",
    onChange: e => upd(setSenha, e.target.value)
  })), msg && /*#__PURE__*/React.createElement("div", {
    style: {
      color: msg.startsWith('Erro') ? 'var(--down)' : 'var(--up)',
      fontSize: 13
    }
  }, msg)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: `btn-primary save-wide ${dirty ? '' : 'disabled'}`,
    disabled: !dirty || saving,
    onClick: handleSave
  }, saving ? 'Salvando…' : 'Salvar')));
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
  EditarPerfilPage,
  _uploadImage
});
