function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} = React;

/* ---------- ICONS ---------- */
const Ic = {
  home: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"
  })),
  cart: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "20",
    r: "1.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "17",
    cy: "20",
    r: "1.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 4h2l2.5 12h11L21 8H6"
  })),
  list: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M8 6h13M8 12h13M8 18h13"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "3.5",
    cy: "6",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "3.5",
    cy: "12",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "3.5",
    cy: "18",
    r: "1"
  })),
  clock: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 7v5l3 2"
  })),
  calendar: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "5",
    width: "18",
    height: "16",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 9h18M8 3v4M16 3v4"
  })),
  users: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "8",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "17",
    cy: "9",
    r: "2.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 19c0-2.5-1.8-4.5-4.5-4.5"
  })),
  cog: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8L4.2 7a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
  })),
  store: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M3 9l1.5-5h15L21 9M3 9h18M3 9v11h18V9M9 13h6"
  })),
  card: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("rect", {
    x: "2.5",
    y: "6",
    width: "19",
    height: "13",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2.5 10h19M6 15h3"
  })),
  bread: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M5 10c0-3 3-5 7-5s7 2 7 5v9H5z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 13v4M12 13v4M15 13v4"
  })),
  msg: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M21 12a8 8 0 0 1-12 6.9L4 20l1.1-5A8 8 0 1 1 21 12z"
  })),
  chat: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M3 5h18v12H7l-4 4z"
  })),
  chart: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M3 20h18M6 16v-5M11 16V8M16 16v-3M21 16V5"
  })),
  spark: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4"
  })),
  funnel: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M3 4h18l-7 9v7l-4-2v-5z"
  })),
  bell: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M6 8a6 6 0 1 1 12 0v5l2 3H4l2-3zM10 19a2 2 0 0 0 4 0"
  })),
  bulb: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.5V17h8v-2.5A7 7 0 0 0 12 2z"
  })),
  arrowUp: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "12",
    height: "12",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 19V5M5 12l7-7 7 7"
  })),
  arrowDown: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "12",
    height: "12",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12l7 7 7-7"
  })),
  chev: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M9 6l6 6-6 6"
  })),
  search: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 21l-4.3-4.3"
  })),
  download: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 3v12M7 10l5 5 5-5M5 21h14"
  })),
  flame: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 2c1 3 4 4 4 8a4 4 0 1 1-8 0c0-2 1-3 2-4-2 1-4 4-4 7a6 6 0 1 0 12 0c0-5-4-7-6-11z"
  })),
  warn: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 4l10 17H2z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 10v5M12 18h.01"
  })),
  shield: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 12l2 2 4-4"
  })),
  info: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 11v5M12 8h.01"
  })),
  menu: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M4 6h16M4 12h16M4 18h16"
  }))
};

/* ---------- HOOKS ---------- */
function useCount(target, dur = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let start;
    let raf;
    const step = t => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}

/* ---------- HELPERS ---------- */
const brl = n => {
  const val = typeof n === 'number' && isFinite(n) ? n : 0;
  return 'R$ ' + val.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
const brlShort = n => {
  const val = typeof n === 'number' && isFinite(n) ? n : 0;
  return 'R$ ' + Math.round(val).toLocaleString('pt-BR');
};
const pct = (curr, prev) => prev === 0 ? 0 : (curr - prev) / prev * 100;

/* ---------- SAFE RENDERERS ---------- */
// Previne React #130: componente undefined não derruba a árvore inteira
function SafeIcon({
  icon: Icon,
  ...props
}) {
  if (!Icon || typeof Icon !== 'function') {
    if (typeof console !== 'undefined') console.warn('[SafeIcon] ícone inválido ou inexistente:', Icon);
    return null;
  }
  return /*#__PURE__*/React.createElement(Icon, props);
}

// Previne React #130 em renderização dinâmica de componentes de página
function SafeComponent({
  component: Comp,
  fallback,
  ...props
}) {
  if (!Comp || typeof Comp !== 'function') {
    if (typeof console !== 'undefined') console.warn('[SafeComponent] componente inválido:', Comp);
    return fallback || null;
  }
  return /*#__PURE__*/React.createElement(Comp, props);
}

// Stable arrow: always renders the same SVG node, only path data changes.
// Avoids React reconciler insertBefore errors caused by conditional node swapping.
// React.memo: direction rarely changes mid-render — skips unnecessary reconciliation.
const Arrow = React.memo(function Arrow({
  direction
}) {
  const isUp = direction !== 'down';
  const d = isUp ? "M12 19V5M5 12l7-7 7 7" : "M12 5v14M5 12l7 7 7-7";
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "12",
    height: "12",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      visibility: direction === 'flat' ? 'hidden' : 'visible'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: d
  }));
});
function Delta({
  curr,
  prev,
  invert
}) {
  const diff = pct(curr, prev);
  const dir = diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'flat';
  let cls = dir;
  if (invert) cls = dir === 'up' ? 'down' : dir === 'down' ? 'up' : 'flat';
  return /*#__PURE__*/React.createElement("span", {
    className: `delta ${cls}`
  }, /*#__PURE__*/React.createElement(Arrow, {
    direction: dir
  }), Math.abs(diff).toFixed(1), "%");
}

/* ---------- SPARKLINE ---------- */
function Sparkline({
  data,
  color = 'var(--gold)',
  area = true
}) {
  const w = 200,
    h = 44,
    pad = 3;
  const safeData = Array.isArray(data) && data.length > 0 ? data : [0, 0];
  const n = safeData.length;
  const min = Math.min(...safeData),
    max = Math.max(...safeData);
  const range = max - min || 1;
  const pts = safeData.map((v, i) => {
    const x = pad + (n <= 1 ? (w - 2 * pad) / 2 : i / (n - 1) * (w - 2 * pad));
    const y = h - pad - (v - min) / range * (h - 2 * pad);
    return [x, y];
  });
  // Smooth curve using catmull-rom
  const path = pts.map((p, i) => {
    if (i === 0) return `M ${p[0]} ${p[1]}`;
    const prev = pts[i - 1];
    const cpx = (prev[0] + p[0]) / 2;
    return `Q ${cpx} ${prev[1]} ${cpx} ${(prev[1] + p[1]) / 2} T ${p[0]} ${p[1]}`;
  }).join(' ');
  const areaPath = `${path} L ${w - pad} ${h} L ${pad} ${h} Z`;
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
  const gradId = `sg-${uid}`;
  const glowId = `gw-${uid}`;
  return /*#__PURE__*/React.createElement("svg", {
    className: "spark",
    viewBox: `0 0 ${w} ${h}`,
    preserveAspectRatio: "none",
    overflow: "visible"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: gradId,
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: color,
    stopOpacity: "0.28"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: color,
    stopOpacity: "0"
  })), /*#__PURE__*/React.createElement("filter", {
    id: glowId,
    x: "-10%",
    y: "-80%",
    width: "120%",
    height: "260%"
  }, /*#__PURE__*/React.createElement("feGaussianBlur", {
    in: "SourceGraphic",
    stdDeviation: "1.8",
    result: "blur"
  }), /*#__PURE__*/React.createElement("feMerge", null, /*#__PURE__*/React.createElement("feMergeNode", {
    in: "blur"
  }), /*#__PURE__*/React.createElement("feMergeNode", {
    in: "SourceGraphic"
  })))), area && /*#__PURE__*/React.createElement("path", {
    d: areaPath,
    fill: `url(#${gradId})`
  }), /*#__PURE__*/React.createElement("path", {
    d: path,
    fill: "none",
    stroke: color,
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    filter: `url(#${glowId})`
  }));
}

/* ---------- KPI ---------- */
function KPI({
  label,
  icon: Icon,
  value,
  prev,
  unit,
  spark,
  color,
  decimals = 0,
  invertDelta
}) {
  const v = useCount(value);
  const formatted = decimals ? v.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }) : Math.round(v).toLocaleString('pt-BR');
  return /*#__PURE__*/React.createElement("div", {
    className: "card kpi hoverable",
    style: {
      '--kpi-color': color
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ic",
    style: {
      color: color,
      background: `color-mix(in oklch, ${color} 14%, transparent)`
    }
  }, /*#__PURE__*/React.createElement(SafeIcon, {
    icon: Icon
  })), label), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, unit && /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, unit), formatted), /*#__PURE__*/React.createElement(Sparkline, {
    data: spark,
    color: color
  }), /*#__PURE__*/React.createElement("div", {
    className: "kpi-foot"
  }, /*#__PURE__*/React.createElement(Delta, {
    curr: value,
    prev: prev,
    invert: invertDelta
  }), /*#__PURE__*/React.createElement("small", null, "vs. m\xEAs anterior")));
}

/* ---------- AREA CHART ---------- */
function AreaChart({
  current,
  previous,
  style = 'area'
}) {
  const [hover, setHover] = useState(null);
  const wrapRef = useRef(null);
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
  const w = 800,
    h = 240;
  const padL = 50,
    padR = 20,
    padT = 16,
    padB = 32;
  const iw = w - padL - padR,
    ih = h - padT - padB;
  const all = [...current.map(d => d.value), ...previous.map(d => d.value)];
  const maxVal = Math.max(...all, 1);
  const max = maxVal * 1.08;
  const n = current.length;
  const xCoord = i => padL + (n <= 1 ? iw / 2 : i / (n - 1) * iw);
  const yCoord = v => padT + ih - v / max * ih;
  const smoothPath = data => {
    const pts = data.map((d, i) => [xCoord(i), yCoord(d.value)]);
    return pts.map((p, i) => {
      if (i === 0) return `M ${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
      const pr = pts[i - 1];
      const cpx = (pr[0] + p[0]) / 2;
      return `C ${cpx.toFixed(2)} ${pr[1].toFixed(2)} ${cpx.toFixed(2)} ${p[1].toFixed(2)} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
    }).join(' ');
  };
  const currPath = smoothPath(current);
  const prevPath = smoothPath(previous);
  const areaPath = `${currPath} L ${xCoord(n - 1)} ${padT + ih} L ${padL} ${padT + ih} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(max * t));
  const xLabels = current.filter((_, i) => i % 5 === 0 || i === n - 1);
  const gradId = `ag-${uid}`;
  const glowId = `gl-${uid}`;
  const onMove = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) / rect.width * w;
    const idx = Math.max(0, Math.min(n - 1, Math.round((svgX - padL) / iw * (n - 1))));
    const pxX = e.clientX - rect.left;
    const pxY = yCoord(current[idx].value) / h * rect.height;
    setHover({
      i: idx,
      pxX,
      pxY
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "chart-wrap",
    ref: wrapRef,
    onMouseLeave: () => setHover(null)
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${w} ${h}`,
    style: {
      width: '100%',
      height: 240,
      display: 'block',
      overflow: 'visible'
    },
    onMouseMove: onMove
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: gradId,
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "var(--gold)",
    stopOpacity: "0.26"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "55%",
    stopColor: "var(--gold)",
    stopOpacity: "0.07"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "var(--gold)",
    stopOpacity: "0"
  })), /*#__PURE__*/React.createElement("filter", {
    id: glowId,
    x: "-4%",
    y: "-120%",
    width: "108%",
    height: "340%"
  }, /*#__PURE__*/React.createElement("feGaussianBlur", {
    in: "SourceGraphic",
    stdDeviation: "2.8",
    result: "blur"
  }), /*#__PURE__*/React.createElement("feMerge", null, /*#__PURE__*/React.createElement("feMergeNode", {
    in: "blur"
  }), /*#__PURE__*/React.createElement("feMergeNode", {
    in: "SourceGraphic"
  })))), ticks.slice(1).map((t, i) => /*#__PURE__*/React.createElement("line", {
    key: i,
    x1: padL,
    x2: w - padR,
    y1: yCoord(t),
    y2: yCoord(t),
    stroke: "var(--line)",
    strokeOpacity: "0.55",
    strokeDasharray: "1 6",
    strokeWidth: "1"
  })), /*#__PURE__*/React.createElement("line", {
    x1: padL,
    x2: w - padR,
    y1: padT + ih,
    y2: padT + ih,
    stroke: "var(--line-2)",
    strokeWidth: "1"
  }), ticks.map((t, i) => /*#__PURE__*/React.createElement("text", {
    key: i,
    x: padL - 10,
    y: yCoord(t) + 4,
    fill: "var(--ink-4)",
    fontSize: "9.5",
    textAnchor: "end",
    fontFamily: "var(--mono)"
  }, t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t)), xLabels.map((d, i) => {
    const idx = current.indexOf(d);
    return /*#__PURE__*/React.createElement("text", {
      key: i,
      x: xCoord(idx),
      y: h - 10,
      fill: "var(--ink-4)",
      fontSize: "9.5",
      textAnchor: "middle",
      fontFamily: "var(--mono)"
    }, d.label);
  }), /*#__PURE__*/React.createElement("path", {
    d: prevPath,
    fill: "none",
    stroke: "var(--line-3)",
    strokeWidth: "1.1",
    strokeDasharray: "3 5",
    opacity: "0.55"
  }), style === 'area' && /*#__PURE__*/React.createElement("path", {
    d: areaPath,
    fill: `url(#${gradId})`
  }), /*#__PURE__*/React.createElement("path", {
    d: currPath,
    fill: "none",
    stroke: "var(--gold)",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    filter: `url(#${glowId})`
  }), hover && /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("line", {
    x1: xCoord(hover.i),
    x2: xCoord(hover.i),
    y1: padT,
    y2: padT + ih,
    stroke: "var(--gold)",
    strokeWidth: "1",
    opacity: "0.3",
    strokeDasharray: "2 4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: xCoord(hover.i),
    cy: yCoord(previous[hover.i]?.value ?? 0),
    r: "3.5",
    fill: "var(--bg)",
    stroke: "var(--line-3)",
    strokeWidth: "1.4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: xCoord(hover.i),
    cy: yCoord(current[hover.i].value),
    r: "7",
    fill: "var(--gold)",
    opacity: "0.14"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: xCoord(hover.i),
    cy: yCoord(current[hover.i].value),
    r: "4.5",
    fill: "var(--bg)",
    stroke: "var(--gold)",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: xCoord(hover.i),
    cy: yCoord(current[hover.i].value),
    r: "1.6",
    fill: "var(--gold)"
  }))), hover && /*#__PURE__*/React.createElement("div", {
    className: "tt on",
    style: {
      left: `clamp(76px, ${hover.pxX}px, calc(100% - 76px))`,
      top: hover.pxY,
      transform: 'translate(-50%, calc(-100% - 14px))'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-d"
  }, current[hover.i].label), /*#__PURE__*/React.createElement("div", {
    className: "tt-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "l"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      background: 'var(--gold)'
    }
  }), "Este m\xEAs"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, brlShort(current[hover.i].value))), /*#__PURE__*/React.createElement("div", {
    className: "tt-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "l"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      background: 'var(--line-3)',
      opacity: 0.8
    }
  }), "M\xEAs anterior"), /*#__PURE__*/React.createElement("span", {
    className: "v",
    style: {
      color: 'var(--ink-2)'
    }
  }, brlShort(previous[hover.i]?.value ?? 0)))));
}

/* ---------- DONUT ---------- */
function Donut({
  data,
  size = 148
}) {
  const [hovered, setHovered] = useState(null);
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
  const glowId = `dg-${uid}`;
  const total = Math.max(data.reduce((s, d) => s + (d.value || 0), 0), 0.001);
  const stroke = 20;
  const r = size / 2 - stroke / 2 - 3;
  const cx = size / 2,
    cy = size / 2;
  const GAP = 0.010;
  let acc = 0;
  const arcs = data.map(d => {
    const frac = d.value / total;
    const from = acc + GAP / 2;
    const to = acc + frac - GAP / 2;
    acc += frac;
    return {
      ...d,
      frac,
      from,
      to
    };
  });
  const polar = t => {
    const a = -Math.PI / 2 + t * 2 * Math.PI;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const onEnter = useCallback(i => setHovered(i), []);
  const onLeave = useCallback(() => setHovered(null), []);
  return /*#__PURE__*/React.createElement("div", {
    className: "donut-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "donut",
    style: {
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("filter", {
    id: glowId,
    x: "-50%",
    y: "-50%",
    width: "200%",
    height: "200%"
  }, /*#__PURE__*/React.createElement("feGaussianBlur", {
    in: "SourceGraphic",
    stdDeviation: "3.5",
    result: "blur"
  }), /*#__PURE__*/React.createElement("feMerge", null, /*#__PURE__*/React.createElement("feMergeNode", {
    in: "blur"
  }), /*#__PURE__*/React.createElement("feMergeNode", {
    in: "SourceGraphic"
  })))), /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: r,
    fill: "none",
    stroke: "var(--panel-3)",
    strokeWidth: stroke
  }), arcs.map((a, i) => {
    if (a.to <= a.from) return null;
    const [x1, y1] = polar(a.from);
    const [x2, y2] = polar(a.to);
    const large = a.to - a.from > 0.5 ? 1 : 0;
    const active = hovered === i;
    const dim = hovered !== null && !active;
    return /*#__PURE__*/React.createElement("path", {
      key: i,
      d: `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      fill: "none",
      stroke: a.color,
      strokeWidth: active ? stroke + 4 : stroke,
      strokeLinecap: "butt",
      opacity: dim ? 0.25 : 1,
      filter: i === 0 && hovered === null ? `url(#${glowId})` : undefined,
      style: {
        animation: `barIn 720ms var(--ease) ${i * 90}ms backwards`,
        transition: 'opacity 200ms var(--ease)'
      },
      onMouseEnter: () => onEnter(i),
      onMouseLeave: onLeave
    });
  })), /*#__PURE__*/React.createElement("div", {
    className: "donut-center"
  }, /*#__PURE__*/React.createElement("small", null, "total"), /*#__PURE__*/React.createElement("b", null, brlShort(total)))), /*#__PURE__*/React.createElement("div", {
    className: "donut-legend"
  }, arcs.map((a, i) => /*#__PURE__*/React.createElement("div", {
    className: "row",
    key: i,
    style: {
      opacity: hovered !== null && hovered !== i ? 0.32 : 1,
      transition: 'opacity 180ms var(--ease)'
    },
    onMouseEnter: () => onEnter(i),
    onMouseLeave: onLeave
  }, /*#__PURE__*/React.createElement("span", {
    className: "sw",
    style: {
      background: a.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "lbl"
  }, a.label), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, brlShort(a.value), /*#__PURE__*/React.createElement("small", null, (a.frac * 100).toFixed(0), "%"))))));
}
Object.assign(window, {
  Ic,
  useCount,
  brl,
  brlShort,
  pct,
  Delta,
  SafeIcon,
  SafeComponent,
  Sparkline,
  KPI,
  AreaChart,
  Donut
});
