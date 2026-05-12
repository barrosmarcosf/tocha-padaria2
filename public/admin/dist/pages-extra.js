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
function FunilPage() {
  const [data, setData] = useStX(null);
  const [loading, setLoading] = useStX(true);
  useEffX(() => {
    let mounted = true;
    window.apiGet('/api/admin/metrics').then(d => {
      if (mounted) setData(d);
    }).catch(() => {}).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);
  const funnel = data?.funnel || {
    visitors: 0,
    add_to_cart: 0,
    checkout: 0,
    success: 0
  };
  const payments = data?.payments || {
    total: 0,
    success: 0,
    failed: 0,
    pending: 0,
    approval_rate: 0
  };
  const pct = (v, base) => base > 0 ? (v / base * 100).toFixed(1) : '0.0';
  const FUNIL = [{
    label: 'VISITANTES',
    v: funnel.visitors,
    pct: 100,
    tone: 'c1'
  }, {
    label: 'CARRINHOS CRIADOS',
    v: funnel.add_to_cart,
    pct: parseFloat(pct(funnel.add_to_cart, funnel.visitors)),
    tone: 'c1'
  }, {
    label: 'CHECKOUTS INICIADOS',
    v: funnel.checkout,
    pct: parseFloat(pct(funnel.checkout, funnel.visitors)),
    tone: 'c1'
  }, {
    label: 'PAGAMENTOS CONCLUÍDOS',
    v: funnel.success,
    pct: parseFloat(pct(funnel.success, funnel.visitors)),
    tone: 'c2'
  }];
  const abandoned = Math.max(0, funnel.add_to_cart - funnel.success);
  const abandonedPct = pct(abandoned, funnel.add_to_cart);
  const checkAbandoned = Math.max(0, funnel.checkout - funnel.success);
  const checkAbandonedPct = pct(checkAbandoned, funnel.checkout);
  const pixRev = 0;
  const creditRev = 0;
  const debitRev = 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PH, {
    title: "Funil de Vendas",
    subtitle: "Onde os clientes entram \u2014 e onde saem."
  }), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 200
    }
  }, /*#__PURE__*/React.createElement(Ic.clock, null), /*#__PURE__*/React.createElement("div", null, "Carregando m\xE9tricas\u2026")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Carrinhos abandonados"), /*#__PURE__*/React.createElement("small", null, abandonedPct, "% dos carrinhos")), /*#__PURE__*/React.createElement("b", {
    className: "abandon-v"
  }, abandoned)), /*#__PURE__*/React.createElement("div", {
    className: "abandon-row down"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Checkouts abandonados"), /*#__PURE__*/React.createElement("small", null, checkAbandonedPct, "% dos checkouts")), /*#__PURE__*/React.createElement("b", {
    className: "abandon-v"
  }, checkAbandoned))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "PAGAMENTOS"), /*#__PURE__*/React.createElement("div", {
    className: "abandon-row up"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Aprovados"), /*#__PURE__*/React.createElement("small", null, payments.approval_rate, "% de aprova\xE7\xE3o")), /*#__PURE__*/React.createElement("b", {
    className: "abandon-v"
  }, payments.success)), /*#__PURE__*/React.createElement("div", {
    className: "abandon-row down"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Reprovados"), /*#__PURE__*/React.createElement("small", null, "Falhas de pagamento")), /*#__PURE__*/React.createElement("b", {
    className: "abandon-v"
  }, payments.failed)))), /*#__PURE__*/React.createElement("div", {
    className: "grid row-2 mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "ORIGEM DO PAGAMENTO"), payments.total === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--ink-4)',
      fontSize: 13,
      padding: '12px 0'
    }
  }, "Sem dados de pagamento dispon\xEDveis.") : [{
    l: 'PIX',
    v: 0,
    pct: 0
  }, {
    l: 'Cartão de Crédito',
    v: 0,
    pct: 0
  }, {
    l: 'Cartão de Débito',
    v: 0,
    pct: 0
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
  }, "TAXA DE APROVA\xC7\xC3O"), /*#__PURE__*/React.createElement("b", {
    style: {
      fontFamily: 'var(--display)',
      fontSize: 40,
      fontWeight: 400,
      color: 'var(--ink)',
      margin: '8px 0'
    }
  }, payments.approval_rate, "%"), /*#__PURE__*/React.createElement("small", {
    style: {
      color: 'var(--ink-4)'
    }
  }, "total de ", payments.total, " transa\xE7\xF5es")))));
}

/* ========== PAINEL DE PAGAMENTOS ========== */
function PagtoPainelPage() {
  const [health, setHealth] = useStX(null);
  const [analytics, setAnalytics] = useStX(null);
  const [loading, setLoading] = useStX(true);
  useEffX(() => {
    let mounted = true;
    Promise.all([window.apiGet('/api/admin/payments-health'), window.apiGet('/api/admin/payment-analytics?days=30')]).then(([h, a]) => {
      if (!mounted) return;
      setHealth(h);
      setAnalytics(a);
    }).catch(() => {}).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Acessores seguros — nunca quebram mesmo se API retornar nulo/vazio
  const h = health ?? {};
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
    rate: 0,
    top_reason: 'Sem dados'
  };
  const refunds = analytics?.refunds ?? {
    count: 0,
    rate: 0,
    amount_total: 0
  };
  const chargebacks_d = analytics?.chargebacks ?? {
    count: 0,
    rate: 0
  };
  const total = analytics?.total ?? 0;
  const motivos = analytics?.rejection_reasons ?? [];
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
  }, /*#__PURE__*/React.createElement("small", null, "APROVADOS"), /*#__PURE__*/React.createElement("b", null, h.paid ?? approved.count ?? 0), /*#__PURE__*/React.createElement("span", null, approved.rate ?? 0, "% do total", (approved.revenue ?? 0) > 0 ? ` — ${brl(approved.revenue ?? 0)}` : '')), /*#__PURE__*/React.createElement("div", {
    className: "pay-stat k-warn"
  }, /*#__PURE__*/React.createElement("small", null, "PENDENTES"), /*#__PURE__*/React.createElement("b", null, h.pending ?? pending.count ?? 0), /*#__PURE__*/React.createElement("span", null, (pending.revenue ?? 0) > 0 ? brl(pending.revenue ?? 0) : 'Aguardando confirmação')), /*#__PURE__*/React.createElement("div", {
    className: "pay-stat k-down"
  }, /*#__PURE__*/React.createElement("small", null, "REJEITADOS"), /*#__PURE__*/React.createElement("b", null, h.failed ?? rejected.count ?? 0), /*#__PURE__*/React.createElement("span", null, rejected.rate ?? 0, "% do total", (rejected.top_reason ?? 'Sem dados') !== 'Sem dados' ? ` — ${rejected.top_reason ?? 'Sem dados'}` : ''))), /*#__PURE__*/React.createElement("div", {
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
  }, total)), /*#__PURE__*/React.createElement("div", {
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
  }, h.refunded ?? (refunds.count ?? 0) + (chargebacks_d.count ?? 0)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-3)'
    }
  }, (refunds.amount_total ?? 0) > 0 ? brl(refunds.amount_total ?? 0) : 'Reembolsos + chargebacks'))), (motivos?.length ?? 0) > 0 && /*#__PURE__*/React.createElement("div", {
    className: "card mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "MOTIVOS DE REJEI\xC7\xC3O"), (motivos ?? []).map((m, i) => /*#__PURE__*/React.createElement("div", {
    className: "origin-row",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "origin-lbl",
    style: {
      color: 'var(--down)'
    }
  }, m?.label ?? '—'), /*#__PURE__*/React.createElement("div", {
    className: "origin-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "origin-fill",
    style: {
      width: `${m?.pct ?? 0}%`,
      background: 'var(--down)'
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "origin-v"
  }, /*#__PURE__*/React.createElement("b", null, m?.count ?? 0), " ocorr\xEAncias ", /*#__PURE__*/React.createElement("em", {
    style: {
      color: 'var(--down)'
    }
  }, m?.pct ?? 0, "%")))))));
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
