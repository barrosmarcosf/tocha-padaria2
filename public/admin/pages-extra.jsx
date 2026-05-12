/* global React, Ic, brl, SafeIcon */
const { useState: useStX, useEffect: useEffX, useCallback: useCbX, useRef: useRefX } = React;

async function _uploadImage(file) {
  const fd = new FormData();
  fd.append('image', file);
  const token = localStorage.getItem('tocha_admin_token');
  const r = await fetch('/api/admin/upload', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Authorization': 'Bearer ' + token },
    body: fd,
  });
  if (!r.ok) throw new Error('Upload falhou');
  return (await r.json()).url;
}

function PH({ title, subtitle, badge }) {
  return (
    <div className="page-head">
      <div>
        <div className="sub" style={{ marginBottom: 6 }}>Inteligência</div>
        <h1>{title}{badge && <span className="page-badge">{badge}</span>}</h1>
        <div className="sub">{subtitle}</div>
      </div>
    </div>
  );
}

/* ---------- shared helpers ---------- */
function fmtDateX(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function fmtPhoneX(w) {
  if (!w) return '—';
  const d = String(w).replace(/\D/g,'');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return w;
}

/* ========== INSIGHTS AUTOMÁTICOS (estático — análise comportamental) ========== */
const INSIGHTS = [
  { title: 'Pico de Visitas', tone: 'c1',
    subtitle: 'Distribuição semanal das visitas ao site',
    unit: '%', kind: 'col',
    data: [
      { l: 'Seg', v: 8 },  { l: 'Ter', v: 11 }, { l: 'Qua', v: 9 },
      { l: 'Qui', v: 11 }, { l: 'Sex', v: 28 }, { l: 'Sáb', v: 33 }, { l: 'Dom', v: 0 },
    ],
    notes: [
      'Sextas e sábados concentram 61% das visitas',
      'Pico diário entre 19h–21h (38% do tráfego)',
      'Segunda-feira: −42% vs. fins de semana',
    ],
  },
  { title: 'Pico de Compras', tone: 'c2',
    subtitle: 'Volume de pedidos por dia da semana',
    unit: '%', kind: 'col',
    data: [
      { l: 'Seg', v: 6 },  { l: 'Ter', v: 9 },  { l: 'Qua', v: 8 },
      { l: 'Qui', v: 12 }, { l: 'Sex', v: 23 }, { l: 'Sáb', v: 34 }, { l: 'Dom', v: 8 },
    ],
    notes: [
      'Sábado lidera com 34% do volume total',
      'Melhor horário para compras: 20h–22h',
      'Compras parceladas mais frequentes às sextas',
    ],
  },
  { title: 'Conversão por Pagamento', tone: 'c3',
    subtitle: 'Taxa de conclusão por método (%)',
    unit: '%', kind: 'bar',
    data: [
      { l: 'PIX',      v: 78 },
      { l: 'Crédito',  v: 63 },
      { l: 'Débito',   v: 71 },
    ],
    notes: [
      'PIX tem taxa de conclusão 23% maior que cartão',
      'Cartão de crédito gera tickets 18% maiores',
      'Débito tem menor taxa de abandono no checkout',
    ],
  },
  { title: 'Padrões de Compra', tone: 'c4',
    subtitle: 'Recompra por janela de dias',
    unit: '%', kind: 'col',
    data: [
      { l: '0–3d',   v: 12 }, { l: '4–7d',  v: 34 },
      { l: '8–14d',  v: 34 }, { l: '15–30d', v: 14 }, { l: '30+',  v: 6 },
    ],
    notes: [
      '68% dos clientes recompram em 7–14 dias',
      'Clientes de sábado têm LTV 31% maior',
      'Combos aparecem em 44% dos carrinhos',
    ],
  },
];

const TONE_COLOR = {
  c1: 'oklch(0.72 0.16 280)',
  c2: 'oklch(0.82 0.13 70)',
  c3: 'oklch(0.78 0.14 160)',
  c4: 'oklch(0.74 0.16 305)',
};

function ColumnChart({ data, color, unit }) {
  const max = Math.max(...data.map(d => d.v), 1);
  const W = 520, H = 180, P = 28, BW = (W - P * 2) / data.length * 0.62;
  const step = (W - P * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {[0.25, 0.5, 0.75, 1].map(g => (
        <line key={g} x1={P} x2={W - P} y1={H - 28 - (H - 56) * g} y2={H - 28 - (H - 56) * g}
              stroke="var(--line)" strokeDasharray="2 4"/>
      ))}
      {data.map((d, i) => {
        const h = (d.v / max) * (H - 56);
        const x = P + step * i + (step - BW) / 2;
        const y = H - 28 - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={BW} height={h} rx="4" fill={color} opacity="0.85"/>
            <text x={x + BW / 2} y={y - 6} textAnchor="middle" fontSize="11" fill="var(--ink-2)" fontFamily="var(--mono)">{d.v}{unit}</text>
            <text x={x + BW / 2} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--ink-4)">{d.l}</text>
          </g>
        );
      })}
    </svg>
  );
}

function BarChart({ data, color, unit }) {
  const max = Math.max(...data.map(d => d.v), 1);
  const W = 520, H = 180, P = 70, RH = (H - 24) / data.length * 0.68;
  const step = (H - 24) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {data.map((d, i) => {
        const w = (d.v / max) * (W - P - 60);
        const y = 12 + step * i + (step - RH) / 2;
        return (
          <g key={i}>
            <text x={P - 10} y={y + RH / 2 + 4} textAnchor="end" fontSize="12" fill="var(--ink-2)">{d.l}</text>
            <rect x={P} y={y} width={W - P - 60} height={RH} rx="4" fill="var(--panel-2)"/>
            <rect x={P} y={y} width={w} height={RH} rx="4" fill={color} opacity="0.85"/>
            <text x={P + w + 8} y={y + RH / 2 + 4} fontSize="12" fill="var(--ink)" fontFamily="var(--mono)">{d.v}{unit}</text>
          </g>
        );
      })}
    </svg>
  );
}

function InsightsPage() {
  return (
    <div className="page">
      <PH title="Insights Automáticos" subtitle="Padrões identificados nos dados da sua padaria."/>
      <div className="grid row-2">
        {INSIGHTS.map((g, i) => {
          const c = TONE_COLOR[g.tone];
          const Chart = g.kind === 'bar' ? BarChart : ColumnChart;
          return (
            <div className="card hoverable insight-card" key={i}>
              <div className="card-head">
                <h3><span className={`insight-chip t${g.tone}`}/>{g.title}</h3>
                <span className="meta">{g.subtitle}</span>
              </div>
              <div style={{ margin: '8px 0 14px' }}>
                <Chart data={g.data} color={c} unit={g.unit}/>
              </div>
              <ul className="insight-list">
                {g.notes.map((t, j) => (
                  <li key={j}><span className={`bullet t${g.tone}`}/>{t}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ========== INTELIGÊNCIA — LongTermChart ========== */
function LongTermChart({ data }) {
  const W = 1100, H = 320, PL = 56, PR = 56, PT = 24, PB = 40;
  const iw = W - PL - PR, ih = H - PT - PB;
  const maxR = Math.max(...data.map(d => Math.max(d.f, d.lr)), 1);
  const maxP = Math.max(...data.map(d => d.p), 1);
  const step = iw / Math.max(data.length - 1, 1);
  const bw = Math.min(step * 0.35, 26);
  const yR = v => PT + ih - (v / maxR) * ih;
  const yP = v => PT + ih - (v / maxP) * ih;
  const xAt = i => PL + step * i;
  const [hov, setHov] = useStX(-1);

  const pedPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yP(d.p)}`).join(' ');
  const lrPath  = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yR(d.lr)}`).join(' ');
  const lrArea  = `${lrPath} L ${xAt(data.length - 1)} ${PT + ih} L ${xAt(0)} ${PT + ih} Z`;
  const yGridR = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="lt-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {yGridR.map((g, i) => (
          <g key={i}>
            <line x1={PL} x2={W - PR} y1={PT + ih - ih * g} y2={PT + ih - ih * g}
                  stroke="var(--line)" strokeDasharray="2 4"/>
            <text x={PL - 10} y={PT + ih - ih * g + 4} textAnchor="end"
                  fontSize="10" fill="oklch(0.55 0.20 25)" fontFamily="var(--mono)">
              R$ {(maxR * g) >= 1000 ? `${(maxR * g / 1000).toFixed(1)}k` : Math.round(maxR * g)}
            </text>
            <text x={W - PR + 10} y={PT + ih - ih * g + 4}
                  fontSize="10" fill="oklch(0.55 0.20 25)" fontFamily="var(--mono)">
              {(maxP * g).toFixed(1)} un
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const h = (d.f / maxR) * ih;
          return (
            <rect key={'b' + i} x={xAt(i) - bw / 2} y={yR(d.f)} width={bw} height={h}
                  rx="3" fill="oklch(0.55 0.22 285)" opacity={hov === -1 || hov === i ? 1 : 0.4}/>
          );
        })}

        <path d={lrArea} fill="oklch(0.78 0.14 160)" opacity="0.15"/>
        <path d={lrPath} fill="none" stroke="oklch(0.62 0.15 160)" strokeWidth="2"/>
        {data.map((d, i) => (
          <circle key={'lr' + i} cx={xAt(i)} cy={yR(d.lr)} r="4"
                  fill="white" stroke="oklch(0.62 0.15 160)" strokeWidth="2"/>
        ))}

        <path d={pedPath} fill="none" stroke="oklch(0.6 0.22 25)" strokeWidth="2"/>
        {data.map((d, i) => (
          <circle key={'p' + i} cx={xAt(i)} cy={yP(d.p)} r="4"
                  fill="white" stroke="oklch(0.6 0.22 25)" strokeWidth="2"/>
        ))}

        {data.map((d, i) => (
          <text key={'x' + i} x={xAt(i)} y={H - 14} textAnchor="middle"
                fontSize="10" fill="var(--ink-4)" fontFamily="var(--mono)">{d.l}</text>
        ))}

        {data.map((d, i) => (
          <rect key={'h' + i} x={xAt(i) - step / 2} y={PT} width={step} height={ih}
                fill="transparent" onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(-1)}/>
        ))}

        {hov >= 0 && (
          <g pointerEvents="none">
            <line x1={xAt(hov)} x2={xAt(hov)} y1={PT} y2={PT + ih}
                  stroke="var(--line-2)" strokeDasharray="3 3"/>
            <g transform={`translate(${Math.min(xAt(hov) + 12, W - 170)}, ${PT + 12})`}>
              <rect width="160" height="78" rx="6" fill="var(--panel)" stroke="var(--line-2)"/>
              <text x="10" y="20" fontSize="11" fill="var(--ink)" fontWeight="600">{data[hov].l}</text>
              <text x="10" y="38" fontSize="11" fill="var(--ink-3)">
                <tspan fill="oklch(0.55 0.22 285)">▪ </tspan> Faturamento: R$ {data[hov].f.toFixed(0)}
              </text>
              <text x="10" y="54" fontSize="11" fill="var(--ink-3)">
                <tspan fill="oklch(0.6 0.22 25)">▪ </tspan> Pedidos: {data[hov].p} un
              </text>
              <text x="10" y="70" fontSize="11" fill="var(--ink-3)">
                <tspan fill="oklch(0.62 0.15 160)">▪ </tspan> Lucro Real: R$ {data[hov].lr.toFixed(1)}
              </text>
            </g>
          </g>
        )}
      </svg>
      <div className="lt-legend">
        <span><i className="lg-sw" style={{ background: 'oklch(0.55 0.22 285)' }}/>Faturamento Bruto</span>
        <span><i className="lg-sw o" style={{ borderColor: 'oklch(0.6 0.22 25)' }}/>Pedidos</span>
        <span><i className="lg-sw o" style={{ borderColor: 'oklch(0.62 0.15 160)' }}/>Lucro Real</span>
      </div>
    </div>
  );
}

function buildCalendar(year, month, dailyBreakdown) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDow = new Date(year, month - 1, 1).getDay();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${month}-${d}`;
    const info = dailyBreakdown[key] || { revenue: 0, orders: 0 };
    cells.push({ d, v: info.revenue || 0, p: info.orders || 0 });
  }
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function generate12Months() {
  const now = new Date();
  const months = [];
  const names = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
      label: `${names[d.getMonth()]} de ${d.getFullYear()}`,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
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
    window.apiGet('/api/admin/historical-monthly-metrics')
      .then(d => { if (mounted) setHistorical(d || []); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoadingChart(false); });
    return () => { mounted = false; };
  }, []);

  const fetchMonthDetail = useCbX((value) => {
    const mo = MONTHS.find(m => m.value === value) || currentMonth;
    const mm = String(mo.month).padStart(2, '0');
    const lastDay = new Date(mo.year, mo.month, 0).getDate();
    const from = `${mo.year}-${mm}-01`;
    const to   = `${mo.year}-${mm}-${String(lastDay).padStart(2, '0')}`;
    setLoadingCal(true);
    let mounted = true;
    window.apiGet(`/api/admin/detailed-analytics?period=custom&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&tzOffset=180`)
      .then(d => {
        if (!mounted) return;
        setDailyBreakdown(d?.dailyBreakdown || {});
        setRanking(d?.itemPerformance?.products || []);
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoadingCal(false); });
    return () => { mounted = false; };
  }, []);

  useEffX(() => { fetchMonthDetail(selMonth); }, [selMonth]);

  const chartData = historical.map(m => ({
    l: m.label || m.key,
    f: m.revenue || 0,
    p: m.orders  || 0,
    lr: m.profit  || 0,
  }));

  const lastMonth = historical.length > 0 ? historical[historical.length - 1] : null;
  const prevMonth = historical.length > 1 ? historical[historical.length - 2] : null;
  const revVar = lastMonth && prevMonth && prevMonth.revenue > 0
    ? (((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100).toFixed(1)
    : '0.0';
  const ordVar = lastMonth && prevMonth && prevMonth.orders > 0
    ? (((lastMonth.orders - prevMonth.orders) / prevMonth.orders) * 100).toFixed(1)
    : '0.0';
  const tikVar = lastMonth && prevMonth
    ? (() => {
        const curr = lastMonth.orders > 0 ? lastMonth.revenue / lastMonth.orders : 0;
        const prev = prevMonth.orders > 0 ? prevMonth.revenue / prevMonth.orders : 0;
        return prev > 0 ? (((curr - prev) / prev) * 100).toFixed(1) : '0.0';
      })()
    : '0.0';

  const curRev = lastMonth?.revenue || 0;
  const curOrd = lastMonth?.orders  || 0;
  const curTik = curOrd > 0 ? curRev / curOrd : 0;

  const mo = MONTHS.find(m => m.value === selMonth) || currentMonth;
  const cal = buildCalendar(mo.year, mo.month, dailyBreakdown);
  const dows = ['DOM','SEG','TER','QUA','QUI','SEX','SAB'];

  const totalMes = Object.values(dailyBreakdown).reduce((s, d) => s + (d.revenue || 0), 0);
  const totalOrdMes = Object.values(dailyBreakdown).reduce((s, d) => s + (d.orders || 0), 0);
  const totalSemana = (w) => w.reduce((a, c) => a + (c?.v || 0), 0);
  const totalDow = (i) => cal.reduce((a, w) => a + (w[i]?.v || 0), 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="sub" style={{ marginBottom: 6 }}>Performance</div>
          <h1>Inteligência</h1>
          <div className="sub">Resumo financeiro e operacional da padaria.</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        <div className="kpi-card">
          <small>VENDAS TOTAIS</small>
          <b>R$ {curRev.toFixed(2).replace('.',',')}</b>
          <span>
            <em className={Number(revVar) >= 0 ? 'up-text' : 'dn-text'}>
              {Number(revVar) >= 0 ? '▲' : '▼'} {revVar}%
            </em> vs. mês anterior
          </span>
        </div>
        <div className="kpi-card">
          <small>TICKET MÉDIO</small>
          <b>R$ {curTik.toFixed(2).replace('.',',')}</b>
          <span>
            <em className={Number(tikVar) >= 0 ? 'up-text' : 'dn-text'}>
              {Number(tikVar) >= 0 ? '▲' : '▼'} {tikVar}%
            </em> vs. mês anterior
          </span>
        </div>
        <div className="kpi-card">
          <small>PEDIDOS</small>
          <b>{curOrd}</b>
          <span>
            <em className={Number(ordVar) >= 0 ? 'up-text' : 'dn-text'}>
              {Number(ordVar) >= 0 ? '▲' : '▼'} {ordVar}%
            </em> vs. mês anterior
          </span>
        </div>
      </div>

      <div className="card mt">
        <div className="card-head" style={{ alignItems: 'flex-end' }}>
          <div>
            <h3 style={{ margin: 0 }}>Evolução de Longo Prazo</h3>
            <small style={{ color: 'var(--ink-3)' }}>Histórico mensal consolidado dos últimos 12 meses</small>
          </div>
        </div>
        {lastMonth && (
          <div className="lt-summary">
            <div className="lt-sum-item">
              <small>ÚLTIMO MÊS</small>
              <b className="lt-mono">{lastMonth.label || lastMonth.key}</b>
            </div>
            <div className="lt-sum-item">
              <small>FATURAMENTO</small>
              <div className="lt-sum-line">
                <b>R$ {curRev.toFixed(0)}</b>
                <span className={`delta ${Number(revVar) >= 0 ? 'up' : 'dn'}`}>{Number(revVar) >= 0 ? '+' : ''}{revVar}%</span>
              </div>
            </div>
            <div className="lt-sum-item">
              <small>VENDAS</small>
              <div className="lt-sum-line">
                <b>{curOrd}</b>
                <span className={`delta ${Number(ordVar) >= 0 ? 'up' : 'dn'}`}>{Number(ordVar) >= 0 ? '+' : ''}{ordVar}%</span>
              </div>
            </div>
            <div className="lt-sum-item">
              <small>LUCRO REAL</small>
              <div className="lt-sum-line">
                <b>R$ {(lastMonth.profit || 0).toFixed(1)}</b>
                <span className="delta dn">—</span>
              </div>
            </div>
          </div>
        )}
        {loadingChart ? (
          <div className="empty-state" style={{ height: 160 }}><Ic.clock/><div>Carregando histórico…</div></div>
        ) : chartData.length > 0 ? (
          <LongTermChart data={chartData}/>
        ) : (
          <div className="empty-state" style={{ height: 160 }}><Ic.chart/><div>Sem dados históricos disponíveis.</div></div>
        )}
      </div>

      <div className="card mt">
        <div className="card-head">
          <div>
            <h3 style={{ margin: 0 }}>Vendas do mês</h3>
          </div>
          <select className="inp" style={{ width: 220 }} value={selMonth} onChange={e => setSelMonth(e.target.value)}>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 4 }}>
          <div className="kpi-soft v">
            <small>VENDA TOTAL</small>
            <b>R$ {totalMes.toFixed(2).replace('.', ',')}</b>
          </div>
          <div className="kpi-soft">
            <small>PEDIDOS</small>
            <b>{totalOrdMes}</b>
          </div>
        </div>
        <div className="cal-hint">As informações correspondem ao mês de {MONTHS.find(m => m.value === selMonth)?.label || '—'}</div>

        {loadingCal ? (
          <div className="empty-state" style={{ height: 120 }}><Ic.clock/><div>Carregando calendário…</div></div>
        ) : (
          <div className="cal-grid">
            <div className="cal-head">
              {dows.map(d => <div key={d}>{d}</div>)}
              <div className="cal-total">TOTAL SEMANA</div>
            </div>
            {cal.map((w, wi) => (
              <div className="cal-row" key={wi}>
                {w.map((c, ci) => (
                  <div className={`cal-cell ${c && c.v > 0 ? 'has' : ''} ${!c ? 'empty' : ''}`} key={ci}>
                    {c && <>
                      <span className="cal-d">{c.d}</span>
                      <div className="cal-val">
                        <b>R$ {c.v.toFixed(2).replace('.', ',')}</b>
                        {c.p > 0 && <small>{c.p} pedido{c.p > 1 ? 's' : ''}</small>}
                      </div>
                    </>}
                  </div>
                ))}
                <div className="cal-cell wk-total"><b>R$ {totalSemana(w).toFixed(2).replace('.', ',')}</b></div>
              </div>
            ))}
            <div className="cal-row cal-foot">
              <div className="cal-foot-l">TOTAL MÊS</div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="cal-cell wk-total" key={i}><b>R$ {totalDow(i + 1).toFixed(2).replace('.', ',')}</b></div>
              ))}
              <div className="cal-cell wk-total month"><b>R$ {totalMes.toFixed(2).replace('.', ',')}</b></div>
            </div>
          </div>
        )}
      </div>

      <div className="card mt">
        <div className="card-head">
          <h3 style={{ margin: 0 }}>Ranking de Itens Vendidos (Top 100)</h3>
        </div>
        <div className="rk-table">
          <div className="rk-head">
            <div>#</div>
            <div>PRODUTO</div>
            <div>CAT.</div>
            <div className="rt">QTD</div>
            <div className="rt">BRUTO</div>
            <div className="rt">LUCRO</div>
          </div>
          {ranking.slice(0, 100).map((r, i) => (
            <div className="rk-row" key={i}>
              <div className="rk-pos">{i + 1}</div>
              <div><b>{r.name}</b></div>
              <div><span className="tag">{(r.category || 'PADARIA').toUpperCase()}</span></div>
              <div className="rt num">{r.qty || 0}</div>
              <div className="rt num">R$ {(r.revenue || 0).toFixed(2).replace('.', ',')}</div>
              <div className="rt num up-text">R$ {(r.profit || 0).toFixed(2).replace('.', ',')}</div>
            </div>
          ))}
          {ranking.length === 0 && !loadingCal && (
            <div style={{ textAlign: 'center', color: 'var(--ink-4)', padding: 20, fontSize: 13 }}>Nenhum item vendido neste período.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========== ALERTAS ========== */
function AlertasPage() {
  const [health, setHealth] = useStX(null);
  const [metrics, setMetrics] = useStX(null);
  const [loading, setLoading] = useStX(true);

  useEffX(() => {
    let mounted = true;
    Promise.all([
      window.apiGet('/api/admin/payments-health'),
      window.apiGet('/api/admin/metrics'),
    ]).then(([h, m]) => {
      if (!mounted) return;
      setHealth(h);
      setMetrics(m);
    }).catch(() => {}).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const alerts = [];

  if (!loading && health && metrics) {
    if ((health.stale_locks || 0) > 0) {
      alerts.push({ k: 'crit', title: 'Locks de pagamento presos', desc: `${health.stale_locks} pagamentos em processamento há mais de 2 minutos` });
    }
    if ((health.failed || 0) > 0) {
      alerts.push({ k: 'crit', title: 'Pagamentos com falha', desc: `${health.failed} pedidos com status payment_failed ou error` });
    }
    if ((health.pending || 0) > 10) {
      alerts.push({ k: 'warn', title: 'Volume de pendentes alto', desc: `${health.pending} pedidos aguardando confirmação de pagamento` });
    }
    if ((health.fila_reprocessamento || 0) > 0) {
      alerts.push({ k: 'warn', title: 'Fila de reprocessamento', desc: `${health.fila_reprocessamento} pagamentos aguardando nova tentativa` });
    }
    const ar = metrics?.payments?.approval_rate ?? 100;
    if (ar < 70) {
      alerts.push({ k: 'crit', title: 'Taxa de aprovação crítica', desc: `${ar}% — abaixo do limite mínimo de 70%` });
    } else if (ar < 80) {
      alerts.push({ k: 'warn', title: 'Taxa de aprovação', desc: `${ar}% — abaixo do threshold de 80%` });
    } else {
      alerts.push({ k: 'ok', title: 'Taxa de aprovação', desc: `${ar}% — dentro do esperado` });
    }
    if ((health.paid || 0) > 0) {
      alerts.push({ k: 'ok', title: 'Pagamentos confirmados', desc: `${health.paid} pedidos com status paid` });
    }
    if ((health.pending || 0) <= 10) {
      alerts.push({ k: 'ok', title: 'Fila de pendentes', desc: `${health.pending || 0} pedidos pendentes — dentro do normal` });
    }
  }

  const crit = alerts.filter(a => a.k === 'crit').length;
  const warn = alerts.filter(a => a.k === 'warn').length;
  const ok   = alerts.filter(a => a.k === 'ok').length;
  const labels = { crit: 'CRÍTICO', warn: 'ATENÇÃO', ok: 'OK' };

  return (
    <div className="page">
      <PH title="Alertas" subtitle="Indicadores que precisam da sua atenção."/>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        <div className="alert-summary k-crit"><b>{loading ? '—' : crit}</b><small>CRÍTICOS</small></div>
        <div className="alert-summary k-warn"><b>{loading ? '—' : warn}</b><small>ATENÇÃO</small></div>
        <div className="alert-summary k-ok"><b>{loading ? '—' : ok}</b><small>OK</small></div>
      </div>
      <div className="card mt" style={{ padding: 8 }}>
        {loading && <div className="empty-state" style={{ height: 120 }}><Ic.clock/><div>Carregando alertas…</div></div>}
        {!loading && alerts.length === 0 && (
          <div className="empty-state" style={{ height: 120 }}><Ic.shield/><div>Nenhum alerta ativo.</div></div>
        )}
        {alerts.map((a, i) => (
          <div className={`alert-row k-${a.k}`} key={i}>
            <span className="alert-chip"/>
            <div className="alert-text">
              <b>{a.title}</b>
              <small>{a.desc}</small>
            </div>
            <span className={`alert-pill p-${a.k}`}>{labels[a.k]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========== FUNIL DE VENDAS ========== */
function FunilDonut({ segments, size, stroke, label, sub }) {
  const s = size || 100, w = stroke || 12;
  const r = (s - w) / 2, cx = s / 2, cy = s / 2;
  const circ = 2 * Math.PI * r;
  let prevPct = 0;
  return (
    <div style={{ position: 'relative', width: s, height: s, flexShrink: 0 }}>
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--panel-3)" strokeWidth={w}/>
        {segments && segments.map((g, i) => {
          const sl  = (Math.min(Math.max(g.pct || 0, 0), 100) / 100) * circ;
          const rot = -90 + prevPct / 100 * 360;
          prevPct  += Math.min(Math.max(g.pct || 0, 0), 100);
          return sl > 0 ? (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={g.color} strokeWidth={w}
              strokeDasharray={`${sl} ${circ}`}
              strokeLinecap="butt"
              style={{ transform: `rotate(${rot}deg)`, transformOrigin: `${cx}px ${cy}px` }}
            />
          ) : null;
        })}
      </svg>
      {label !== undefined && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', gap: 2 }}>
          <b style={{ fontFamily: 'var(--display)', fontSize: Math.round(s * 0.19), color: 'var(--ink)', fontWeight: 400, lineHeight: 1 }}>{label}</b>
          {sub && <small style={{ fontSize: Math.round(s * 0.1), color: 'var(--ink-4)' }}>{sub}</small>}
        </div>
      )}
    </div>
  );
}

const _FV_MOCK = {
  steps: [
    { key:'site_enter',        label:'Visitantes',             icon:'site_enter',        count:1248, pct_total:100  },
    { key:'view_product',      label:'Visualização de Produto',icon:'view_product',       count:475,  pct_total:38.1 },
    { key:'cart_created',      label:'Carrinho Criado',         icon:'cart_created',       count:149,  pct_total:11.9 },
    { key:'checkout_started',  label:'Checkout',               icon:'checkout_started',   count:80,   pct_total:6.4  },
    { key:'payment_attempted', label:'Pagamento Tentado',       icon:'payment_attempted',  count:48,   pct_total:3.8  },
    { key:'payment_success',   label:'Pagamento Aprovado',      icon:'payment_success',    count:33,   pct_total:2.6  },
  ],
  advance_rates: [
    { label:'Taxa de avanço',    pct:38.1 },
    { label:'Taxa de avanço',    pct:31.4 },
    { label:'Taxa de avanço',    pct:53.7 },
    { label:'Taxa de avanço',    pct:60.0 },
    { label:'Taxa de conversão', pct:68.8 },
  ],
  kpis: {
    conv_rate:2.6, conv_orders:33, conv_visits:1248,
    avg_ticket:47.30, avg_ticket_delta:null,
    total_revenue:1560.90, total_revenue_delta:null,
    abandoned_value:7388.28,
    avg_funnel_time:'8m 42s', avg_funnel_time_delta:null,
    approval_rate:68.8, approval_rate_delta:null,
  },
  traffic_sources: [
    { label:'Instagram', color:'#8b5cf6', count:474, pct:38, conv_rate:1.4, abandon_rate:71 },
    { label:'Google',    color:'#3b82f6', count:337, pct:27, conv_rate:3.2, abandon_rate:65 },
    { label:'WhatsApp',  color:'#22c55e', count:274, pct:22, conv_rate:5.1, abandon_rate:58 },
    { label:'Direto',    color:'#f59e0b', count:163, pct:13, conv_rate:1.8, abandon_rate:78 },
    { label:'Total', isTotal:true, count:1248, pct:100, conv_rate:2.6, abandon_rate:73.6 },
  ],
  devices: [
    { label:'Mobile',  color:'#22c55e', count:774, pct:62, conv_rate:2.1, abandon_rate:77 },
    { label:'Desktop', color:'#8b5cf6', count:387, pct:31, conv_rate:3.6, abandon_rate:62 },
    { label:'Tablet',  color:'#3b82f6', count:87,  pct:7,  conv_rate:2.3, abandon_rate:74 },
    { label:'Total', isTotal:true, count:1248, pct:100, conv_rate:2.6, abandon_rate:73.6 },
  ],
  payment_methods: [
    { label:'PIX',     color:'#22c55e', attempts:29, pct:61, approved:24, approval_rate:82.8 },
    { label:'Crédito', color:'#3b82f6', attempts:14, pct:29, approved:7,  approval_rate:50.0 },
    { label:'Débito',  color:'#f59e0b', attempts:5,  pct:10, approved:2,  approval_rate:40.0 },
    { label:'Total', isTotal:true, attempts:48, pct:100, approved:33, approval_rate:68.8 },
  ],
  abandonment: {
    rate:73.6, cart_count:109, cart_rate:73.2, checkout_count:47, checkout_rate:58.8,
    total:156, lost_value:7388.28,
    reasons: [
      { label:'Preço percebido alto',    pct:34 },
      { label:'Distrações externas',     pct:28 },
      { label:'Método de pagamento',     pct:19 },
      { label:'Dúvidas sobre o produto', pct:12 },
      { label:'Outros',                  pct:7  },
    ],
  },
  recovery: {
    cart_recovered:40, cart_recovery_rate:36.7,
    checkout_recovered:33, checkout_recovery_rate:70.2,
    count:73, rate:46.8, recovered_value:3455.20,
    channel:'WhatsApp', avg_response_time:'4m 20s', post_contact_conv_rate:58,
  },
  products: {
    most_added: [
      { name:'Pão Francês',       adds:89, conv:78, abandon:22 },
      { name:'Croissant',         adds:67, conv:65, abandon:35 },
      { name:'Bolo de Chocolate', adds:54, conv:71, abandon:29 },
      { name:'Rosca Doce',        adds:43, conv:58, abandon:42 },
      { name:'Pão Integral',      adds:38, conv:82, abandon:18 },
    ],
    worst_conversion: [
      { name:'Bolo Recheado',  adds:45,  purchases:6,  conv:12 },
      { name:'Torta de Limão', adds:67,  purchases:12, conv:18 },
      { name:'Empada',         adds:89,  purchases:20, conv:22 },
      { name:'Quiche',         adds:34,  purchases:9,  conv:26 },
      { name:'Pão de Queijo',  adds:156, purchases:48, conv:31 },
    ],
    most_viewed: [
      { name:'Pão Francês',       views:234, ctr:38 },
      { name:'Croissant',         views:189, ctr:35 },
      { name:'Bolo de Chocolate', views:167, ctr:32 },
      { name:'Rosca Doce',        views:143, ctr:30 },
      { name:'Pão de Queijo',     views:128, ctr:24 },
    ],
  },
  insights: [
    { type:'bottleneck',  label:'GARGALO',     heading:'Visualização de Produto',       body:'Apenas 38.1% dos visitantes visualizam produtos. Otimize a homepage com produtos em destaque e melhore a navegação por categorias.' },
    { type:'product',     label:'PRODUTO',      heading:'Pão de Queijo — Pior Conversão',body:'156 adições mas apenas 31% de conversão. Revise a precificação e a apresentação do produto para reduzir abandono.' },
    { type:'opportunity', label:'OPORTUNIDADE', heading:'Recuperação no Checkout',       body:'Taxa de recuperação de 70.2% no checkout. Considere expandir a estratégia para carrinhos (36.7%) para aumentar a receita recuperada.' },
  ],
};

const FV_STEP_COLORS = ['#8b5cf6','#06b6d4','#f59e0b','#f97316','#ef4444','#22c55e'];
const FV_PILL_BG     = ['rgba(139,92,246,.18)','rgba(6,182,212,.18)','rgba(249,115,22,.18)','rgba(239,68,68,.18)','rgba(34,197,94,.18)'];
const FV_ADV_COLORS  = ['#a78bfa','#22d3ee','#fb923c','#f87171','#4ade80'];

function _fvStepIcon(key, color) {
  const p = { width:20, height:20, viewBox:'0 0 24 24', fill:'none', stroke:color, strokeWidth:'2', strokeLinecap:'round', strokeLinejoin:'round' };
  if (key === 'site_enter')        return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  if (key === 'view_product')      return <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
  if (key === 'cart_created')      return <svg {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
  if (key === 'checkout_started')  return <svg {...p}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
  if (key === 'payment_attempted') return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  if (key === 'payment_success')   return <svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="10"/></svg>;
}

function FunilPage() {
  const [data, setData]       = useStX(null);
  const [loading, setLoading] = useStX(true);
  const [days, setDays]       = useStX(30);

  useEffX(() => {
    let mounted = true;
    setLoading(true);
    window.apiGet('/api/admin/funnel-analytics?days=' + days)
      .then(d => { if (mounted) { setData(d); setLoading(false); } })
      .catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [days]);

  const d      = data || _FV_MOCK;
  const isMock = !data;

  const steps    = d.steps?.length === 6        ? d.steps           : _FV_MOCK.steps;
  const advRates = d.advance_rates?.length === 5 ? d.advance_rates   : _FV_MOCK.advance_rates;
  const kpis     = d.kpis                        || _FV_MOCK.kpis;
  const src      = d.traffic_sources?.length     ? d.traffic_sources : _FV_MOCK.traffic_sources;
  const devs     = d.devices?.length             ? d.devices         : _FV_MOCK.devices;
  const pms      = d.payment_methods?.length     ? d.payment_methods : _FV_MOCK.payment_methods;
  const abd      = d.abandonment                 || _FV_MOCK.abandonment;
  const rec      = d.recovery                    || _FV_MOCK.recovery;
  const prods    = d.products                    || _FV_MOCK.products;
  const insights = d.insights?.length            ? d.insights        : _FV_MOCK.insights;

  const fBrl   = v => brl(+(v || 0));
  const advPct = r => typeof r === 'object' ? (r.pct || 0) : (r || 0);
  const mkSegs = rows => rows.filter(r => !r.isTotal).map(r => ({ pct: r.pct, color: r.color }));

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, gap:16, flexWrap:'wrap' }}>
        <PH title="Funil de Vendas" subtitle="Rastreie a jornada do cliente — do acesso ao pagamento."/>
        <div style={{ display:'flex', alignItems:'center', gap:8, paddingTop:8 }}>
          <div className="fv-period-row">
            {[7,14,30,90].map(d2 => <button key={d2} className={'fv-period-btn'+(days===d2?' on':'')} onClick={()=>setDays(d2)}>{d2}d</button>)}
          </div>
          <span className="fv-realtime">Tempo real</span>
        </div>
      </div>

      {loading ? (
        <div className="empty-state" style={{ height:200 }}><Ic.clock/><div>Carregando métricas…</div></div>
      ) : (
        <React.Fragment>

          {/* 1. FUNNEL STEPS */}
          <div className="card" style={{ marginBottom:14, padding:'20px 16px 16px', position:'relative' }}>
            {isMock && <div className="fv-mock-badge">DADOS DEMONSTRATIVOS</div>}
            <div className="fv-funnel-row">
              {steps.map((step, i) => (
                <React.Fragment key={step.key}>
                  <div className="fv-step-wrap">
                    <div className="fv-step-card" style={{ borderColor: FV_STEP_COLORS[i] + '50' }}>
                      <div className="fv-step-icon-wrap" style={{ background: FV_STEP_COLORS[i] + '1a' }}>
                        {_fvStepIcon(step.key, FV_STEP_COLORS[i])}
                      </div>
                      <div className="fv-step-lbl" style={{ color: FV_STEP_COLORS[i] }}>{step.label}</div>
                      <div className="fv-step-num">{(step.count||0).toLocaleString('pt-BR')}</div>
                      <div className="fv-step-pct-lbl">{i===0 ? '100% do total' : `${(step.pct_total||0).toFixed(1)}% dos visitantes`}</div>
                    </div>
                  </div>
                  {i < steps.length-1 && (
                    <div className="fv-arrow-wrap">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                      <div className="fv-adv-pill" style={{ background:FV_PILL_BG[i], color:FV_ADV_COLORS[i] }}>
                        {typeof advRates[i]==='object' ? advRates[i].label : 'Taxa de avanço'} {advPct(advRates[i])}%
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 2. KPIs */}
          <div className="fv-kpi-grid">
            <div className="fv-kpi-card">
              <div className="fv-kpi-lbl">TAXA DE CONVERSÃO GERAL</div>
              <div className="fv-kpi-val">{(kpis.conv_rate||0).toFixed(1)}%</div>
              <div className="fv-kpi-meta">{kpis.conv_orders||0} pedidos / {(kpis.conv_visits||0).toLocaleString('pt-BR')} visitas</div>
              {kpis.avg_ticket_delta != null && <span className={'fv-delta-chip '+(kpis.avg_ticket_delta>=0?'up':'dn')}>{kpis.avg_ticket_delta>=0?'↑':'↓'} {Math.abs(kpis.avg_ticket_delta)}% vs período anterior</span>}
            </div>
            <div className="fv-kpi-card">
              <div className="fv-kpi-lbl">TICKET MÉDIO</div>
              <div className="fv-kpi-val" style={{ fontSize:20 }}>{fBrl(kpis.avg_ticket)}</div>
              <div className="fv-kpi-meta">por pedido</div>
              {kpis.avg_ticket_delta != null && <span className={'fv-delta-chip '+(kpis.avg_ticket_delta>=0?'up':'dn')}>{kpis.avg_ticket_delta>=0?'↑':'↓'} {Math.abs(kpis.avg_ticket_delta)}% vs período anterior</span>}
            </div>
            <div className="fv-kpi-card">
              <div className="fv-kpi-lbl">FATURAMENTO</div>
              <div className="fv-kpi-val" style={{ fontSize:20 }}>{fBrl(kpis.total_revenue)}</div>
              <div className="fv-kpi-meta">no período</div>
              {kpis.total_revenue_delta != null && <span className={'fv-delta-chip '+(kpis.total_revenue_delta>=0?'up':'dn')}>{kpis.total_revenue_delta>=0?'↑':'↓'} {Math.abs(kpis.total_revenue_delta)}% vs período anterior</span>}
            </div>
            <div className="fv-kpi-card">
              <div className="fv-kpi-lbl">TEMPO MÉDIO DO FUNIL</div>
              <div className="fv-kpi-val" style={{ fontSize:22 }}>{kpis.avg_funnel_time || '—'}</div>
              <div className="fv-kpi-meta">do acesso ao pagamento</div>
              {kpis.avg_funnel_time_delta != null && <span className={'fv-delta-chip '+(kpis.avg_funnel_time_delta<=0?'up':'dn')}>{kpis.avg_funnel_time_delta<=0?'↓':'↑'} {Math.abs(kpis.avg_funnel_time_delta)}% vs período anterior</span>}
            </div>
            <div className="fv-kpi-card">
              <div className="fv-kpi-lbl">TAXA DE APROVAÇÃO (PAGAMENTO)</div>
              <div className="fv-kpi-val">{(kpis.approval_rate||0).toFixed(1)}%</div>
              <div className="fv-kpi-meta">tentativas aprovadas</div>
              {kpis.approval_rate_delta != null && <span className={'fv-delta-chip '+(kpis.approval_rate_delta>=0?'up':'dn')}>{kpis.approval_rate_delta>=0?'↑':'↓'} {Math.abs(kpis.approval_rate_delta)}% vs período anterior</span>}
            </div>
          </div>

          {/* 3. ANALYSIS GRID */}
          <div className="fv-analysis-grid">
            {/* 3a: Origem do Tráfego */}
            <div className="fv-analysis-card">
              <div className="fv-analysis-hdr">ORIGEM DO TRÁFEGO</div>
              <div className="fv-donut-legend-row" style={{ marginBottom:10 }}>
                <FunilDonut segments={mkSegs(src)} size={100} stroke={13} label={src.find(r=>!r.isTotal)?.pct+'%'} sub={src.find(r=>!r.isTotal)?.label?.split(' ')[0]}/>
                <div style={{ flex:1, minWidth:0 }}>
                  {src.filter(r=>!r.isTotal).map((row,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                      <span style={{ width:8, height:8, borderRadius:2, background:row.color, flexShrink:0, display:'inline-block' }}/>
                      <span style={{ flex:1, fontSize:12, color:'var(--ink-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.label}</span>
                      <span style={{ fontSize:12, color:'var(--ink)', fontFamily:'var(--mono)', flexShrink:0 }}>{row.count}</span>
                      <span style={{ fontSize:11, color:'var(--ink-4)', fontFamily:'var(--mono)', flexShrink:0 }}>({row.pct}%)</span>
                    </div>
                  ))}
                  <div style={{ fontSize:10, color:'var(--ink-4)', marginTop:6 }}>Total de visitas: {src.find(r=>r.isTotal)?.count||0}</div>
                </div>
              </div>
              <div style={{ height:1, background:'rgba(255,255,255,.07)', margin:'0 0 8px' }}/>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                <thead><tr>
                  {['ORIGEM','VISITAS','CONVERSÃO','ABANDONO'].map((h,i)=><th key={i} style={{ fontSize:8, letterSpacing:'.1em', color:'var(--ink-4)', textAlign:i===0?'left':'right', padding:'2px 0 5px', fontWeight:400, textTransform:'uppercase', fontFamily:'var(--mono)' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {src.filter(r=>!r.isTotal).map((row,ri) => (
                    <tr key={ri}>
                      <td style={{ padding:'4px 0', color:'var(--ink-3)', borderTop:'1px solid rgba(255,255,255,.04)', display:'flex', alignItems:'center', gap:4 }}><span style={{ width:7,height:7,borderRadius:1,background:row.color,flexShrink:0,display:'inline-block' }}/>{row.label}</td>
                      <td style={{ padding:'4px 0', color:'var(--ink-3)', borderTop:'1px solid rgba(255,255,255,.04)', textAlign:'right', fontFamily:'var(--mono)' }}>{row.count}</td>
                      <td style={{ padding:'4px 0', borderTop:'1px solid rgba(255,255,255,.04)', textAlign:'right' }}><span style={{ display:'inline-flex', alignItems:'center', gap:3, justifyContent:'flex-end' }}><span style={{ height:3, width:Math.round((row.conv_rate||0)/100*32), background:'#22c55e', borderRadius:999, display:'inline-block' }}/><span style={{ color:'#22c55e', fontFamily:'var(--mono)' }}>{row.conv_rate!=null?row.conv_rate+'%':'—'}</span></span></td>
                      <td style={{ padding:'4px 0', borderTop:'1px solid rgba(255,255,255,.04)', textAlign:'right' }}><span style={{ display:'inline-flex', alignItems:'center', gap:3, justifyContent:'flex-end' }}><span style={{ height:3, width:Math.round((row.abandon_rate||0)/100*32), background:'#ef4444', borderRadius:999, display:'inline-block' }}/><span style={{ color:'#ef4444', fontFamily:'var(--mono)' }}>{row.abandon_rate!=null?row.abandon_rate+'%':'—'}</span></span></td>
                    </tr>
                  ))}
                  {src.find(r=>r.isTotal) && (()=>{const t=src.find(r=>r.isTotal); return (<tr>
                    <td style={{ padding:'5px 0 2px', fontWeight:600, color:'var(--ink)', borderTop:'1px solid rgba(255,255,255,.12)', display:'flex', alignItems:'center', gap:4 }}>Total</td>
                    <td style={{ padding:'5px 0 2px', fontWeight:600, color:'var(--ink)', borderTop:'1px solid rgba(255,255,255,.12)', textAlign:'right', fontFamily:'var(--mono)' }}>{t.count}</td>
                    <td style={{ padding:'5px 0 2px', fontWeight:600, color:'#22c55e', borderTop:'1px solid rgba(255,255,255,.12)', textAlign:'right', fontFamily:'var(--mono)' }}>{t.conv_rate!=null?t.conv_rate+'%':'—'}</td>
                    <td style={{ padding:'5px 0 2px', fontWeight:600, color:'#ef4444', borderTop:'1px solid rgba(255,255,255,.12)', textAlign:'right', fontFamily:'var(--mono)' }}>{t.abandon_rate!=null?t.abandon_rate+'%':'—'}</td>
                  </tr>); })()}
                </tbody>
              </table>
            </div>

            {/* 3b: Desempenho por Dispositivo */}
            <div className="fv-analysis-card">
              <div className="fv-analysis-hdr">DESEMPENHO POR DISPOSITIVO</div>
              <div className="fv-donut-legend-row" style={{ marginBottom:10 }}>
                <FunilDonut segments={mkSegs(devs)} size={100} stroke={13} label={devs.find(r=>!r.isTotal)?.pct+'%'} sub={devs.find(r=>!r.isTotal)?.label}/>
                <div style={{ flex:1, minWidth:0 }}>
                  {devs.filter(r=>!r.isTotal).map((row,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                      <span style={{ width:8, height:8, borderRadius:2, background:row.color, flexShrink:0, display:'inline-block' }}/>
                      <span style={{ flex:1, fontSize:12, color:'var(--ink-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.label}</span>
                      <span style={{ fontSize:12, color:'var(--ink)', fontFamily:'var(--mono)', flexShrink:0 }}>{row.count}</span>
                      <span style={{ fontSize:11, color:'var(--ink-4)', fontFamily:'var(--mono)', flexShrink:0 }}>({row.pct}%)</span>
                    </div>
                  ))}
                  <div style={{ fontSize:10, color:'var(--ink-4)', marginTop:6 }}>Total de visitas: {devs.find(r=>r.isTotal)?.count||0}</div>
                </div>
              </div>
              <div style={{ height:1, background:'rgba(255,255,255,.07)', margin:'0 0 8px' }}/>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                <thead><tr>
                  {['DISPOSITIVO','VISITAS','CONVERSÃO','ABANDONO'].map((h,i)=><th key={i} style={{ fontSize:8, letterSpacing:'.1em', color:'var(--ink-4)', textAlign:i===0?'left':'right', padding:'2px 0 5px', fontWeight:400, textTransform:'uppercase', fontFamily:'var(--mono)' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {devs.filter(r=>!r.isTotal).map((row,ri) => (
                    <tr key={ri}>
                      <td style={{ padding:'4px 0', color:'var(--ink-3)', borderTop:'1px solid rgba(255,255,255,.04)', display:'flex', alignItems:'center', gap:4 }}><span style={{ width:7,height:7,borderRadius:1,background:row.color,flexShrink:0,display:'inline-block' }}/>{row.label}</td>
                      <td style={{ padding:'4px 0', color:'var(--ink-3)', borderTop:'1px solid rgba(255,255,255,.04)', textAlign:'right', fontFamily:'var(--mono)' }}>{row.count}</td>
                      <td style={{ padding:'4px 0', borderTop:'1px solid rgba(255,255,255,.04)', textAlign:'right' }}><span style={{ display:'inline-flex', alignItems:'center', gap:3, justifyContent:'flex-end' }}><span style={{ height:3, width:Math.round((row.conv_rate||0)/100*32), background:'#22c55e', borderRadius:999, display:'inline-block' }}/><span style={{ color:'#22c55e', fontFamily:'var(--mono)' }}>{row.conv_rate!=null?row.conv_rate+'%':'—'}</span></span></td>
                      <td style={{ padding:'4px 0', borderTop:'1px solid rgba(255,255,255,.04)', textAlign:'right' }}><span style={{ display:'inline-flex', alignItems:'center', gap:3, justifyContent:'flex-end' }}><span style={{ height:3, width:Math.round((row.abandon_rate||0)/100*32), background:'#ef4444', borderRadius:999, display:'inline-block' }}/><span style={{ color:'#ef4444', fontFamily:'var(--mono)' }}>{row.abandon_rate!=null?row.abandon_rate+'%':'—'}</span></span></td>
                    </tr>
                  ))}
                  {devs.find(r=>r.isTotal) && (()=>{const t=devs.find(r=>r.isTotal); return (<tr>
                    <td style={{ padding:'5px 0 2px', fontWeight:600, color:'var(--ink)', borderTop:'1px solid rgba(255,255,255,.12)', display:'flex', alignItems:'center', gap:4 }}>Total</td>
                    <td style={{ padding:'5px 0 2px', fontWeight:600, color:'var(--ink)', borderTop:'1px solid rgba(255,255,255,.12)', textAlign:'right', fontFamily:'var(--mono)' }}>{t.count}</td>
                    <td style={{ padding:'5px 0 2px', fontWeight:600, color:'#22c55e', borderTop:'1px solid rgba(255,255,255,.12)', textAlign:'right', fontFamily:'var(--mono)' }}>{t.conv_rate!=null?t.conv_rate+'%':'—'}</td>
                    <td style={{ padding:'5px 0 2px', fontWeight:600, color:'#ef4444', borderTop:'1px solid rgba(255,255,255,.12)', textAlign:'right', fontFamily:'var(--mono)' }}>{t.abandon_rate!=null?t.abandon_rate+'%':'—'}</td>
                  </tr>); })()}
                </tbody>
              </table>
            </div>

            {/* 3c: Formas de Pagamento */}
            <div className="fv-analysis-card">
              <div className="fv-analysis-hdr">FORMAS DE PAGAMENTO</div>
              <div className="fv-donut-legend-row" style={{ marginBottom:10 }}>
                <FunilDonut segments={mkSegs(pms)} size={100} stroke={13} label={pms.find(r=>!r.isTotal)?.pct+'%'} sub={pms.find(r=>!r.isTotal)?.label}/>
                <div style={{ flex:1, minWidth:0 }}>
                  {pms.filter(r=>!r.isTotal).map((row,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                      <span style={{ width:8, height:8, borderRadius:2, background:row.color, flexShrink:0, display:'inline-block' }}/>
                      <span style={{ flex:1, fontSize:12, color:'var(--ink-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.label}</span>
                      <span style={{ fontSize:12, color:'var(--ink)', fontFamily:'var(--mono)', flexShrink:0 }}>{row.attempts??0}</span>
                      <span style={{ fontSize:11, color:'var(--ink-4)', fontFamily:'var(--mono)', flexShrink:0 }}>({row.pct}%)</span>
                    </div>
                  ))}
                  <div style={{ fontSize:10, color:'var(--ink-4)', marginTop:6 }}>Total de pagamentos: {pms.find(r=>r.isTotal)?.attempts||0}*</div>
                </div>
              </div>
              <div style={{ height:1, background:'rgba(255,255,255,.07)', margin:'0 0 8px' }}/>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                <thead><tr>
                  {['MÉTODO','TENTATIVAS','APROVAÇÃO','APROVADO'].map((h,i)=><th key={i} style={{ fontSize:8, letterSpacing:'.1em', color:'var(--ink-4)', textAlign:i===0?'left':'right', padding:'2px 0 5px', fontWeight:400, textTransform:'uppercase', fontFamily:'var(--mono)' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {pms.filter(r=>!r.isTotal).map((row,ri) => (
                    <tr key={ri}>
                      <td style={{ padding:'4px 0', color:'var(--ink-3)', borderTop:'1px solid rgba(255,255,255,.04)', display:'flex', alignItems:'center', gap:4 }}><span style={{ width:7,height:7,borderRadius:1,background:row.color,flexShrink:0,display:'inline-block' }}/>{row.label}</td>
                      <td style={{ padding:'4px 0', color:'var(--ink-3)', borderTop:'1px solid rgba(255,255,255,.04)', textAlign:'right', fontFamily:'var(--mono)' }}>{row.attempts??0}</td>
                      <td style={{ padding:'4px 0', color:'#22c55e', borderTop:'1px solid rgba(255,255,255,.04)', textAlign:'right', fontFamily:'var(--mono)' }}>{row.approval_rate!=null?row.approval_rate+'%':'—'}</td>
                      <td style={{ padding:'4px 0', color:'var(--ink-3)', borderTop:'1px solid rgba(255,255,255,.04)', textAlign:'right', fontFamily:'var(--mono)' }}>{row.approved??0}</td>
                    </tr>
                  ))}
                  {pms.find(r=>r.isTotal) && (()=>{const t=pms.find(r=>r.isTotal); return (<tr>
                    <td style={{ padding:'5px 0 2px', fontWeight:600, color:'var(--ink)', borderTop:'1px solid rgba(255,255,255,.12)', display:'flex', alignItems:'center', gap:4 }}>Total</td>
                    <td style={{ padding:'5px 0 2px', fontWeight:600, color:'var(--ink)', borderTop:'1px solid rgba(255,255,255,.12)', textAlign:'right', fontFamily:'var(--mono)' }}>{t.attempts??0}</td>
                    <td style={{ padding:'5px 0 2px', fontWeight:600, color:'#22c55e', borderTop:'1px solid rgba(255,255,255,.12)', textAlign:'right', fontFamily:'var(--mono)' }}>{t.approval_rate!=null?t.approval_rate+'%':'—'}</td>
                    <td style={{ padding:'5px 0 2px', fontWeight:600, color:'var(--ink)', borderTop:'1px solid rgba(255,255,255,.12)', textAlign:'right', fontFamily:'var(--mono)' }}>{t.approved??0}</td>
                  </tr>); })()}
                </tbody>
              </table>
              <div style={{ fontSize:10, color:'var(--ink-4)', marginTop:4 }}>*Inclui tentativas.</div>
            </div>
          </div>

          {/* 4. ABANDONO + RECUPERAÇÃO */}
          <div className="fv-abd-rec-grid">
            <div className="fv-abd-card">
              <div className="fv-abd-hdr">ABANDONO</div>
              <div className="fv-abd-row">
                <div>
                  <div style={{ fontSize:11, color:'var(--ink-4)', marginBottom:4 }}>Carrinhos abandonados</div>
                  <div style={{ fontFamily:'var(--display)', fontSize:32, color:'var(--ink)', fontWeight:400, lineHeight:1.1 }}>{abd.cart_count||0}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'var(--display)', fontSize:24, color:'#ef4444', fontWeight:400, lineHeight:1.1 }}>{abd.cart_rate||0}%</div>
                  <div style={{ fontSize:10, color:'var(--ink-4)', marginTop:3 }}>dos carrinhos</div>
                </div>
              </div>
              <div className="fv-abd-row">
                <div>
                  <div style={{ fontSize:11, color:'var(--ink-4)', marginBottom:4 }}>Checkouts abandonados</div>
                  <div style={{ fontFamily:'var(--display)', fontSize:32, color:'var(--ink)', fontWeight:400, lineHeight:1.1 }}>{abd.checkout_count||0}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'var(--display)', fontSize:24, color:'#ef4444', fontWeight:400, lineHeight:1.1 }}>{abd.checkout_rate||0}%</div>
                  <div style={{ fontSize:10, color:'var(--ink-4)', marginTop:3 }}>dos checkouts iniciados</div>
                </div>
              </div>
              <div style={{ padding:'12px 0 8px' }}>
                <div style={{ fontSize:9, letterSpacing:'.14em', color:'#ef4444', textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>VALOR POTENCIAL PERDIDO</div>
                <div style={{ fontFamily:'var(--display)', fontSize:26, color:'var(--ink)', fontWeight:400 }}>{fBrl(abd.lost_value)}</div>
              </div>
              {abd.reasons?.length > 0 && (
                <React.Fragment>
                  <div style={{ height:1, background:'rgba(255,255,255,.07)', marginBottom:10 }}/>
                  <div className="fv-motivos-hdr">PRINCIPAIS MOTIVOS DE ABANDONO</div>
                  {abd.reasons.map((r,i) => (
                    <div key={i} className="fv-motivo-row">
                      <div className="fv-motivo-lbl">{r.label}</div>
                      <div className="fv-motivo-bar-bg"><div className="fv-motivo-bar-fill" style={{ width:r.pct+'%' }}/></div>
                      <div className="fv-motivo-pct">{r.count ? `${r.count} (${r.pct}%)` : `${r.pct}%`}</div>
                    </div>
                  ))}
                  <div style={{ fontSize:10, color:'var(--ink-4)', marginTop:8, display:'flex', alignItems:'flex-start', gap:4 }}>
                    <span style={{ flexShrink:0 }}>ℹ</span> Os motivos acima são identificados com base no comportamento do cliente.
                  </div>
                </React.Fragment>
              )}
            </div>

            <div className="fv-abd-card">
              <div className="fv-rec-hdr">RECUPERAÇÃO (VIA WHATSAPP)</div>
              <div className="fv-abd-row">
                <div>
                  <div style={{ fontSize:11, color:'var(--ink-4)', marginBottom:4 }}>Carrinhos recuperados</div>
                  <div style={{ fontFamily:'var(--display)', fontSize:32, color:'var(--ink)', fontWeight:400, lineHeight:1.1 }}>{rec.cart_recovered||0}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'var(--display)', fontSize:24, color:'#22c55e', fontWeight:400, lineHeight:1.1 }}>{rec.cart_recovery_rate||0}%</div>
                  <div style={{ fontSize:10, color:'var(--ink-4)', marginTop:3 }}>taxa de recuperação</div>
                </div>
              </div>
              <div className="fv-abd-row">
                <div>
                  <div style={{ fontSize:11, color:'var(--ink-4)', marginBottom:4 }}>Checkouts recuperados</div>
                  <div style={{ fontFamily:'var(--display)', fontSize:32, color:'var(--ink)', fontWeight:400, lineHeight:1.1 }}>{rec.checkout_recovered||0}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'var(--display)', fontSize:24, color:'#22c55e', fontWeight:400, lineHeight:1.1 }}>{rec.checkout_recovery_rate||0}%</div>
                  <div style={{ fontSize:10, color:'var(--ink-4)', marginTop:3 }}>taxa de recuperação</div>
                </div>
              </div>
              <div style={{ padding:'12px 0 8px' }}>
                <div style={{ fontSize:9, letterSpacing:'.14em', color:'#22c55e', textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>VALOR RECUPERADO</div>
                <div style={{ fontFamily:'var(--display)', fontSize:26, color:'var(--ink)', fontWeight:400 }}>{fBrl(rec.recovered_value)}</div>
              </div>
              <div style={{ height:1, background:'rgba(255,255,255,.07)', marginBottom:12 }}/>
              <div className="fv-mini-stats">
                <div className="fv-mini-stat">
                  <div className="fv-mini-lbl">CANAL PRINCIPAL</div>
                  <div className="fv-mini-val" style={{ fontSize:12, color:'#22c55e' }}>{rec.channel||'—'}</div>
                </div>
                <div className="fv-mini-stat">
                  <div className="fv-mini-lbl">TEMPO MÉDIO DE RESPOSTA</div>
                  <div className="fv-mini-val" style={{ fontSize:12 }}>{rec.avg_response_time||'—'}</div>
                </div>
                <div className="fv-mini-stat">
                  <div className="fv-mini-lbl">TAXA DE CONVERSÃO PÓS CONTATO</div>
                  <div className="fv-mini-val">{rec.post_contact_conv_rate!=null?rec.post_contact_conv_rate+'%':'—'}</div>
                </div>
              </div>
              <div style={{ fontSize:10, color:'var(--ink-4)', marginTop:8, display:'flex', alignItems:'flex-start', gap:4 }}>
                <span style={{ flexShrink:0 }}>ℹ</span> A recuperação é feita automaticamente via WhatsApp.
              </div>
            </div>
          </div>

          {/* 5. PRODUCTS */}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, letterSpacing:'.14em', color:'var(--ink-3)', textTransform:'uppercase', fontWeight:700 }}>PERFORMANCE DE PRODUTOS</div>
          </div>
          <div className="fv-prod-grid">
            <div className="fv-prod-card">
              <div className="fv-prod-col-hdr amber">MAIS ADICIONADOS AO CARRINHO</div>
              <table className="fv-table">
                <thead><tr><th>PRODUTO</th><th>ADDS</th><th>CONVERSÃO</th><th>ABANDONO</th></tr></thead>
                <tbody>
                  {(prods.most_added||[]).map((p,i) => (
                    <tr key={i}>
                      <td>{p.name}</td>
                      <td className="fv-num-val">{p.adds}</td>
                      <td className="fv-conv-val">{p.conv}%</td>
                      <td className="fv-bad-val">{p.abandon}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize:11, color:'var(--ink-4)', marginTop:10, cursor:'pointer' }}>Ver todos os produtos →</div>
            </div>
            <div className="fv-prod-card">
              <div className="fv-prod-col-hdr red">PRODUTOS COM PIOR CONVERSÃO</div>
              <table className="fv-table">
                <thead><tr><th>PRODUTO</th><th>ADDS</th><th>COMPRAS</th><th>CONVERSÃO</th></tr></thead>
                <tbody>
                  {(prods.worst_conversion||[]).map((p,i) => (
                    <tr key={i}>
                      <td>{p.name}</td>
                      <td className="fv-num-val">{p.adds}</td>
                      <td className="fv-num-val">{p.purchases}</td>
                      <td className="fv-bad-val">{p.conv}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize:11, color:'var(--ink-4)', marginTop:10, cursor:'pointer' }}>Ver todos os produtos →</div>
            </div>
            <div className="fv-prod-card">
              <div className="fv-prod-col-hdr teal">MAIS VISUALIZADOS</div>
              <table className="fv-table">
                <thead><tr><th>PRODUTO</th><th>VISUALIZAÇÕES</th><th>CTR (VIEW → ADD)</th></tr></thead>
                <tbody>
                  {(prods.most_viewed||[]).map((p,i) => (
                    <tr key={i}>
                      <td>{p.name}</td>
                      <td className="fv-num-val">{p.views}</td>
                      <td className="fv-conv-val">{p.ctr}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize:11, color:'var(--ink-4)', marginTop:10, cursor:'pointer' }}>Ver todos os produtos →</div>
            </div>
          </div>

          {/* 6. INSIGHTS */}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, letterSpacing:'.14em', color:'var(--ink-3)', textTransform:'uppercase', fontWeight:700 }}>INSIGHTS DO PERÍODO</div>
          </div>
          <div className="fv-insights-grid">
            {insights.map((ins,i) => (
              <div key={i} className={'fv-ins-card '+(ins.type||'bottleneck')}>
                <div className={'fv-ins-type-tag '+(ins.type||'bottleneck')}>{ins.label||ins.type}</div>
                <div className="fv-ins-heading">{ins.heading||ins.title}</div>
                <div className="fv-ins-body">{ins.body}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:'var(--ink-4)', textAlign:'center', paddingTop:4, paddingBottom:8 }}>Os dados são atualizados em tempo real.</div>

        </React.Fragment>
      )}
    </div>
  );
}

/* ========== PAINEL DE PAGAMENTOS ========== */
const _REJECT_CODES = {
  'Saldo insuficiente':              'código 51',
  'Limite excedido':                 'código 61',
  'Cartão expirado':                 'código 54',
  'Dados inválidos':                 'código 14',
  'Cartão bloqueado':                'código 62',
  'Suspeita de fraude':              'código 59',
  'Transação não permitida':         'código 57',
  'Emissor indisponível':            'código 91',
  'PIN incorreto':                   'código 55',
  'Limite diário excedido':          'código 65',
  'Banco indisponível':              'código 06',
  'Chave PIX inválida':              'código AB09',
  'Conta do recebedor inativa':      'código AB11',
  'Tempo expirado (timeout)':        'timeout',
  'Limite PIX excedido':             'código AB06',
  'Banco fora do ar':                'código BE17',
  'QR Code expirado':                'código BE15',
  'Erro na API do provedor':         'código BE99',
  'Outros':                          '—',
};

const _MOCK_REJ = {
  card_credit: [
    { label: 'Saldo insuficiente',       count: 6, pct: 40 },
    { label: 'Cartão expirado',          count: 3, pct: 20 },
    { label: 'Dados inválidos',          count: 2, pct: 13 },
    { label: 'Limite excedido',          count: 2, pct: 13 },
    { label: 'Cartão bloqueado',         count: 0, pct: 0  },
    { label: 'Suspeita de fraude',       count: 0, pct: 0  },
    { label: 'Transação não permitida',  count: 0, pct: 0  },
    { label: 'Emissor indisponível',     count: 0, pct: 0  },
    { label: 'Outros',                   count: 2, pct: 13 },
  ],
  card_debit: [
    { label: 'Saldo insuficiente',       count: 4, pct: 44 },
    { label: 'Dados inválidos',          count: 2, pct: 22 },
    { label: 'Cartão bloqueado',         count: 2, pct: 22 },
    { label: 'Transação não permitida',  count: 0, pct: 0  },
    { label: 'Limite diário excedido',   count: 0, pct: 0  },
    { label: 'PIN incorreto',            count: 0, pct: 0  },
    { label: 'Banco indisponível',       count: 0, pct: 0  },
    { label: 'Outros',                   count: 1, pct: 11 },
  ],
  pix: [
    { label: 'Saldo insuficiente',           count: 3, pct: 50 },
    { label: 'Chave PIX inválida',           count: 2, pct: 33 },
    { label: 'Conta do recebedor inativa',   count: 1, pct: 17 },
    { label: 'Tempo expirado (timeout)',     count: 0, pct: 0  },
    { label: 'Limite PIX excedido',         count: 0, pct: 0  },
    { label: 'Banco fora do ar',            count: 0, pct: 0  },
    { label: 'QR Code expirado',            count: 0, pct: 0  },
    { label: 'Erro na API do provedor',     count: 0, pct: 0  },
    { label: 'Outros',                      count: 0, pct: 0  },
  ],
};

const _METHOD_CFG = {
  card_credit: {
    color: { primary: 'oklch(0.68 0.19 25)', border: 'oklch(0.68 0.19 25 / 0.22)' },
    title: 'CARTÃO DE CRÉDITO',
    Icon: () => <Ic.card/>,
  },
  card_debit: {
    color: { primary: 'oklch(0.74 0.14 55)', border: 'oklch(0.74 0.14 55 / 0.22)' },
    title: 'CARTÃO DE DÉBITO',
    Icon: () => <Ic.card/>,
  },
  pix: {
    color: { primary: 'oklch(0.76 0.13 155)', border: 'oklch(0.76 0.13 155 / 0.22)' },
    title: 'PIX',
    Icon: () => (
      <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
        <path d="M8 0L9.3 6.7L16 8L9.3 9.3L8 16L6.7 9.3L0 8L6.7 6.7Z"/>
      </svg>
    ),
  },
};

function RejCard({ data, color, title, Icon, isMock }) {
  const total = data.reduce((s, m) => s + m.count, 0);
  return (
    <div style={{ background: 'var(--panel)', border: `1px solid ${color.border}`, borderRadius: 'var(--r)', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ color: color.primary, display: 'flex', alignItems: 'center' }}><Icon/></span>
        <small style={{ fontSize: 10, letterSpacing: '0.18em', color: color.primary, fontWeight: 500 }}>{title}</small>
        {isMock && <span style={{ fontSize: 9, color: 'var(--ink-4)', marginLeft: 'auto', letterSpacing: '0.05em' }}>exemplo</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {data.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ minWidth: 180, fontSize: 12, color: 'var(--ink-2)', flexShrink: 0 }}>{m.label}</span>
            <div
              title={`${m.label} — ${_REJECT_CODES[m.label] || '—'}`}
              style={{ flex: 1, background: 'var(--panel-2)', borderRadius: 2, height: 6, overflow: 'hidden', cursor: 'default' }}
            >
              <div style={{ width: m.pct + '%', background: color.primary, height: '100%', borderRadius: 2, transition: 'width 0.4s ease' }}/>
            </div>
            <span style={{ minWidth: 92, textAlign: 'right', fontSize: 11, color: 'var(--ink-3)', flexShrink: 0 }}>{m.count} {m.count === 1 ? 'ocorrência' : 'ocorrências'}</span>
            <span style={{ minWidth: 34, textAlign: 'right', fontSize: 11, color: color.primary, fontWeight: 600, flexShrink: 0 }}>{m.pct}%</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--line-2)', display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ color: 'var(--ink-4)' }}>Total</span>
        <span style={{ color: 'var(--ink-3)' }}>{total} {total === 1 ? 'ocorrência' : 'ocorrências'}</span>
      </div>
    </div>
  );
}

function PagtoPainelPage() {
  const [analytics, setAnalytics] = useStX(null);
  const [loading,   setLoading]   = useStX(true);
  const [tab,       setTab]       = useStX('all');

  useEffX(() => {
    let mounted = true;
    const tok = localStorage.getItem('tocha_admin_token');
    fetch('/api/admin/payment-analytics?days=30&ts=' + Date.now(), {
      cache: 'no-store',
      headers: tok ? { 'Authorization': 'Bearer ' + tok } : {}
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(a => { if (!mounted) return; setAnalytics(a); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const approved = analytics?.approved ?? { count: 0, rate: 0, revenue: 0 };
  const pending  = analytics?.pending  ?? { count: 0, revenue: 0 };
  const rejected = analytics?.rejected ?? { count: 0, rate: 0 };
  const refunds  = analytics?.refunds  ?? { count: 0, amount_total: 0 };
  const total    = analytics?.total    ?? 0;
  const mrej     = analytics?.method_rejections ?? {};

  const TABS = [
    { key: 'all',         label: 'Todos' },
    { key: 'card_credit', label: 'Cartão de Crédito' },
    { key: 'card_debit',  label: 'Débito' },
    { key: 'pix',         label: 'Pix' },
  ];

  const getMethodData = (method) => {
    const bucket = mrej[method];
    // Novo formato: { total, reasons: [{ code, label, count, pct }] }
    if (bucket && typeof bucket.total === 'number') {
      return bucket.total > 0
        ? { data: bucket.reasons, isMock: false }
        : { data: _MOCK_REJ[method] || [], isMock: true };
    }
    // Formato legado (array) — compatibilidade retroativa
    const arr = Array.isArray(bucket) ? bucket : [];
    return arr.length > 0
      ? { data: arr, isMock: false }
      : { data: _MOCK_REJ[method] || [], isMock: true };
  };

  const renderCard = (method) => {
    const cfg = _METHOD_CFG[method];
    const { data, isMock } = getMethodData(method);
    return <RejCard key={method} data={data} color={cfg.color} title={cfg.title} Icon={cfg.Icon} isMock={isMock}/>;
  };

  return (
    <div className="page">
      <PH title="Painel de Pagamentos" subtitle="Visão geral de aprovações, rejeições e estornos."/>
      {loading ? (
        <div className="empty-state" style={{ height: 200 }}><Ic.clock/><div>Carregando dados…</div></div>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            <div className="pay-stat k-up">
              <small>APROVADOS</small>
              <b>{approved.count}</b>
              <span>{approved.rate}% do total{approved.revenue > 0 ? ` — ${brl(approved.revenue)}` : ''}</span>
            </div>
            <div className="pay-stat k-warn">
              <small>PENDENTES</small>
              <b>{pending.count}</b>
              <span>{pending.revenue > 0 ? brl(pending.revenue) : 'Aguardando confirmação'}</span>
            </div>
            <div className="pay-stat k-down">
              <small>REJEITADOS</small>
              <b>{rejected.count}</b>
              <span>{rejected.rate}% do total</span>
            </div>
          </div>

          <div className="grid row-2 mt">
            <div className="card" style={{ padding: '18px 20px' }}>
              <small className="kv-l">TOTAL DE TRANSAÇÕES</small>
              <b style={{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 72, lineHeight: 1.05, color: 'var(--ink)', display: 'block', marginTop: 8 }}>{total}</b>
            </div>
            <div className="pay-stat" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <small>ESTORNADOS</small>
              <b>{refunds.count}</b>
              <span>{refunds.amount_total > 0 ? brl(refunds.amount_total) : '—'}</span>
            </div>
          </div>

          <div className="card mt" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
              <small className="kv-l">MOTIVOS DE REJEIÇÃO</small>
              <div style={{ display: 'flex', gap: 4 }}>
                {TABS.map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)} style={{
                    padding: '4px 12px', fontSize: 11, borderRadius: 20, cursor: 'pointer',
                    border: '1px solid var(--line-2)',
                    background: tab === t.key ? 'var(--ink)' : 'transparent',
                    color:      tab === t.key ? 'var(--bg)' : 'var(--ink-3)',
                    fontFamily: 'inherit',
                  }}>{t.label}</button>
                ))}
              </div>
            </div>

            {tab === 'all' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  {renderCard('card_credit')}
                  {renderCard('card_debit')}
                </div>
                {renderCard('pix')}
              </>
            ) : (
              renderCard(tab)
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ========== CARDÁPIO ========== */
function CategoriaModal({ cat, onClose, onSave }) {
  const [name, setName] = useStX(cat?.name || '');
  const [slug, setSlug] = useStX(cat?.slug || '');
  const [desc, setDesc] = useStX(cat?.description || '');
  const [visible, setVisible] = useStX(cat?.is_active !== false);
  const [imageUrl, setImageUrl] = useStX(cat?.image_url || '');
  const [uploading, setUploading] = useStX(false);
  const [saving, setSaving] = useStX(false);
  const imgRef = useRefX(null);
  const isNew = !cat?.id;

  const handleImg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { setImageUrl(await _uploadImage(file)); }
    catch (err) { alert('Erro no upload: ' + err.message); }
    finally { setUploading(false); }
  };

  const handleSave = () => {
    setSaving(true);
    const payload = { slug, name, description: desc, is_active: visible, image_url: imageUrl };
    if (cat?.id) payload.id = cat.id;
    window.apiPost('/api/admin/save-category', payload)
      .then(() => onSave({ ...payload }))
      .catch(e => alert('Erro: ' + e.message))
      .finally(() => setSaving(false));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose} aria-label="Fechar">×</button>
        <h2 className="modal-title">{isNew ? 'Nova Categoria' : 'Editar Categoria'}</h2>
        <p className="modal-sub">Defina como a categoria aparecerá para seus clientes.</p>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <label className="field">
            <span>Título da Categoria</span>
            <input className="inp" value={name} onChange={e => setName(e.target.value)}/>
          </label>
          <label className="field">
            <span>Identificador (Slug)</span>
            <input className="inp" value={slug} onChange={e => setSlug(e.target.value)} disabled={!isNew}/>
          </label>
        </div>

        <label className="field" style={{ marginTop: 12 }}>
          <span>Breve Descrição</span>
          <textarea className="inp" rows={2} value={desc} onChange={e => setDesc(e.target.value)}/>
        </label>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
          <div className="field">
            <span>Foto de vitrine</span>
            <div
              className="img-slot"
              style={{ cursor: 'pointer' }}
              onClick={() => imgRef.current?.click()}
              title="Clique para escolher imagem"
            >
              {uploading ? (
                <div className="img-empty">Enviando…</div>
              ) : imageUrl ? (
                <img src={`/${imageUrl}`} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:4 }}/>
              ) : (
                <div className="img-empty">Escolher Foto</div>
              )}
            </div>
            <input ref={imgRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImg}/>
          </div>
          <div className="field">
            <span style={{ visibility: 'hidden' }}>.</span>
            <div className="toggle-card">
              <label className="switch">
                <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)}/>
                <span className="sw-track"><span className="sw-thumb"/></span>
              </label>
              <div>
                <b>Categoria Visível</b>
                <small>Status 'Inativa' oculta a categoria e todos seus produtos do site.</small>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || uploading}>{saving ? 'Salvando…' : 'Salvar Categoria'}</button>
        </div>
      </div>
    </div>
  );
}

function ProdutoModal({ prod, onClose, onSave }) {
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
  const fillPct = estoque ? Math.min(100, (disp / estoque) * 100) : 0;
  const isNew = !prod?.id;

  const handleImg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { setImageUrl(await _uploadImage(file)); }
    catch (err) { alert('Erro no upload: ' + err.message); }
    finally { setUploading(false); }
  };

  const handleSave = () => {
    setSaving(true);
    const payload = {
      name, price: parseFloat(price) || 0, description: desc,
      is_active: active, initial_stock: parseInt(estoque) || 0,
      category_slug: prod?.category_slug || '',
      image_url: imageUrl,
    };
    if (prod?.id) payload.id = prod.id;
    window.apiPost('/api/admin/save-product', payload)
      .then(() => onSave({ ...payload }))
      .catch(e => alert('Erro: ' + e.message))
      .finally(() => setSaving(false));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose} aria-label="Fechar">×</button>
        <h2 className="modal-title">{isNew ? 'Novo Produto' : 'Editar Produto'}</h2>
        <p className="modal-sub">Cadastre os detalhes do produto para venda.</p>

        <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 14 }}>
          <label className="field">
            <span>Nome do Produto</span>
            <input className="inp" value={name} onChange={e => setName(e.target.value)}/>
          </label>
          <label className="field">
            <span>Preço (R$)</span>
            <input className="inp" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)}/>
          </label>
        </div>

        <label className="field" style={{ marginTop: 12 }}>
          <span>Descrição Complementar</span>
          <textarea className="inp" rows={3} value={desc} onChange={e => setDesc(e.target.value)}/>
        </label>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
          <div className="field">
            <span>Foto do Produto</span>
            <div
              className="img-slot"
              style={{ cursor: 'pointer' }}
              onClick={() => imgRef.current?.click()}
              title="Clique para trocar imagem"
            >
              {uploading ? (
                <div className="img-empty">Enviando…</div>
              ) : imageUrl ? (
                <img src={`/${imageUrl}`} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:4 }}/>
              ) : (
                <div className="img-empty">Escolher Foto</div>
              )}
            </div>
            <input ref={imgRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImg}/>
          </div>

          <div className="field">
            <span>🔥 Estoque Base (Fornada)</span>
            <input className="inp" type="number" value={estoque} onChange={e => setEstoque(parseInt(e.target.value) || 0)}/>
            <small className="hint">Total produzido para venda nesta fornada.</small>

            <div className="stock-card" style={{ marginTop: 10 }}>
              <div className="stock-head">
                <small>DISPONÍVEL AGORA</small>
                <span className="tag warn">↓ {vendidos} VENDIDOS</span>
              </div>
              <b className="stock-num">{disp}</b>
              <div className="stock-bar"><div className="stock-fill" style={{ width: `${fillPct}%` }}/></div>
              <small className="hint">Saldo disponível para novas compras.</small>
            </div>

            <div className="toggle-card" style={{ marginTop: 10 }}>
              <label className="switch">
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}/>
                <span className="sw-track"><span className="sw-thumb"/></span>
              </label>
              <div><b>Produto Ativo</b></div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || uploading}>{saving ? 'Salvando…' : 'Salvar Produto'}</button>
        </div>
      </div>
    </div>
  );
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
    window.apiGet('/api/admin/config')
      .then(d => {
        const cs = d?.categorias || [];
        const ps = d?.produtos || [];
        setCats(cs);
        setProds(ps);
        if (cs.length > 0 && !sel) setSel(cs[0].slug);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffX(() => { loadConfig(); }, [loadConfig]);

  const stop = e => e.stopPropagation();

  const editCat = (cat, e) => { stop(e); setCatModal({ cat }); };
  const delCat = (cat, e) => {
    stop(e);
    if (!confirm(`Excluir categoria "${cat.name}"?`)) return;
    window.apiPost('/api/admin/delete-item', { table: 'categorias', id: cat.id })
      .then(() => setCats(prev => prev.filter(c => c.id !== cat.id)))
      .catch(err => alert('Erro: ' + err.message));
  };
  const newCat = () => setCatModal({ cat: null });
  const saveCat = () => { setCatModal(null); loadConfig(); };

  const editProd = (p, e) => { stop(e); setProdModal({ prod: p }); };
  const delProd = (p, e) => {
    stop(e);
    if (!confirm(`Excluir produto "${p.name}"?`)) return;
    window.apiPost('/api/admin/delete-item', { table: 'produtos', id: p.id })
      .then(() => setProds(prev => prev.filter(x => x.id !== p.id)))
      .catch(err => alert('Erro: ' + err.message));
  };
  const newProd = () => setProdModal({ prod: { category_slug: sel } });
  const saveProd = () => { setProdModal(null); loadConfig(); };

  const filteredProds = prods.filter(p => p.category_slug === sel);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="sub" style={{ marginBottom: 6 }}>Loja · Cardápio</div>
          <h1>Gestão do Cardápio</h1>
          <div className="sub">Categorias e produtos exibidos no site.</div>
        </div>
      </div>
      {loading ? (
        <div className="empty-state" style={{ height: 200 }}><Ic.list/><div>Carregando cardápio…</div></div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="section-title" style={{ margin: 0 }}>CATEGORIAS</div>
              <button className="btn-primary sm" onClick={newCat}>+ Nova Categoria</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cats.map(c => (
                <div key={c.slug} onClick={() => setSel(c.slug)}
                  className={`cat-row ${sel === c.slug ? 'on' : ''}`}>
                  <div className="cat-thumb">
                    {c.image_url && <img src={`/${c.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}/>}
                  </div>
                  <div className="cat-text">
                    <b>{c.name}</b>
                    <small>{c.description}</small>
                    <span className={`tag ${c.is_active !== false ? 'up' : 'down'}`} style={{ marginTop: 4 }}>
                      {c.is_active !== false ? 'ATIVA' : 'INATIVA'}
                    </span>
                  </div>
                  <div className="row-actions">
                    <button className="icon-btn" title="Editar" onClick={(e) => editCat(c, e)}>✏</button>
                    <button className="icon-btn danger" title="Excluir" onClick={(e) => delCat(c, e)}>🗑</button>
                  </div>
                </div>
              ))}
              {cats.length === 0 && (
                <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: 12 }}>Nenhuma categoria cadastrada.</div>
              )}
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <div>
                <small className="kv-l">PRODUTOS DE</small>
                <b style={{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 28, color: 'var(--ink)', display: 'block' }}>
                  {cats.find(c => c.slug === sel)?.name || '—'}
                </b>
              </div>
              <button className="btn-primary" onClick={newProd}>Novo Produto</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 560, overflowY: 'auto', paddingRight: 4 }}>
              {filteredProds.map((p) => {
                const stock = p.stock_quantity ?? p.initial_stock ?? 0;
                const esgotado = stock <= 0;
                return (
                  <div key={p.id} className="prod-row-full">
                    <div className="prod-thumb">
                      {p.image_url && <img src={`/${p.image_url}`} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:4 }}/>}
                    </div>
                    <div className="prod-text">
                      <b>{p.name}</b>
                      <small>{p.description}</small>
                    </div>
                    <div className="prod-meta">
                      <b className="num" style={{ color: 'var(--ink)' }}>R$ {Number(p.price || 0).toFixed(2).replace('.', ',')}</b>
                      <span className={`tag ${p.is_active !== false ? 'up' : 'down'}`}>{p.is_active !== false ? 'ATIVO' : 'INATIVO'}</span>
                      <small style={{ color: esgotado ? 'var(--down)' : 'var(--ink-3)' }}>
                        {esgotado ? 'Esgotado' : `${stock} un.`}
                      </small>
                    </div>
                    <div className="row-actions">
                      <button className="icon-btn" title="Editar" onClick={(e) => editProd(p, e)}>✏</button>
                      <button className="icon-btn danger" title="Excluir" onClick={(e) => delProd(p, e)}>🗑</button>
                    </div>
                  </div>
                );
              })}
              {filteredProds.length === 0 && (
                <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: 12 }}>Nenhum produto nesta categoria.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {catModal && <CategoriaModal cat={catModal.cat} onClose={() => setCatModal(null)} onSave={saveCat}/>}
      {prodModal && <ProdutoModal prod={prodModal.prod} onClose={() => setProdModal(null)} onSave={saveProd}/>}
    </div>
  );
}

/* ========== MODELO MODAL ========== */
function ModeloModal({ template, index, onClose, onSave, onDelete }) {
  const [title, setTitle] = useStX(template?.title || '');
  const [body, setBody] = useStX(template?.body || '');
  const [saving, setSaving] = useStX(false);
  const isNew = index === undefined;

  const handleSave = () => {
    if (!title.trim() || !body.trim() || saving) return;
    setSaving(true);
    onSave({ title: title.trim(), body: body.trim() }, index, () => setSaving(false));
  };

  const handleDelete = () => {
    if (!confirm(`Excluir o modelo "${title}"?`)) return;
    onDelete(index);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose} aria-label="Fechar">×</button>
        <h2 className="modal-title">{isNew ? 'Novo Modelo' : 'Editar Modelo'}</h2>
        <p className="modal-sub">Salve mensagens prontas para disparos rápidos.</p>
        <label className="field">
          <span>Título</span>
          <input className="inp" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Promoção de sábado"/>
        </label>
        <label className="field" style={{ marginTop: 12 }}>
          <span>Mensagem</span>
          <textarea className="inp" rows={8} value={body} onChange={e => setBody(e.target.value)}
            placeholder="Texto da mensagem. Use {nome} para personalizar."/>
        </label>
        <div className="modal-actions">
          {!isNew && (
            <button className="btn-ghost" style={{ color: 'var(--down)', marginRight: 'auto' }} onClick={handleDelete}>
              Excluir
            </button>
          )}
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !title.trim() || !body.trim()}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
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
    window.apiGet('/api/admin/customers')
      .then(d => setContacts(d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffX(() => { loadContacts(); }, [loadContacts]);

  useEffX(() => {
    window.apiGet('/api/admin/config')
      .then(d => setTemplates(d?.siteContent?.msg_templates || []))
      .catch(() => {});
  }, []);

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    return !q || (c.name || '').toLowerCase().includes(q) || (c.whatsapp || '').includes(q);
  });

  const toggle = (id) => { const s = new Set(sel); s.has(id) ? s.delete(id) : s.add(id); setSel(s); };
  const selAll = () => setSel(new Set(filtered.map(c => c.id)));
  const clearSel = () => setSel(new Set());

  const handleDeleteContact = (e, c) => {
    e.stopPropagation();
    if (!confirm(`Excluir o contato "${c.name}"?`)) return;
    setDeleting(prev => new Set(prev).add(c.id));
    window.apiPost('/api/admin/delete-item', { table: 'clientes', id: c.id })
      .then(() => {
        setContacts(prev => prev.filter(x => x.id !== c.id));
        setSel(prev => { const s = new Set(prev); s.delete(c.id); return s; });
      })
      .catch(err => alert('Erro ao excluir: ' + err.message))
      .finally(() => setDeleting(prev => { const s = new Set(prev); s.delete(c.id); return s; }));
  };

  const handleSend = () => {
    if (!sel.size || !msg || sending) return;
    const recipients = contacts
      .filter(c => sel.has(c.id))
      .map(c => ({ phone: c.whatsapp, name: c.name }));
    setSending(true);
    window.apiPost('/api/admin/send-bulk-message', { recipients, message: msg })
      .then(r => alert(`Envio concluído: ${r.success} enviados, ${r.fail} falhas.`))
      .catch(e => alert('Erro no envio: ' + e.message))
      .finally(() => setSending(false));
  };

  const handleAddContact = () => {
    if (!newName || !newPhone) return;
    window.apiPost('/api/admin/save-customer', { name: newName, whatsapp: newPhone })
      .then(() => { setNewName(''); setNewPhone(''); loadContacts(); })
      .catch(e => alert('Erro: ' + e.message));
  };

  const persistTemplates = (newList, done) => {
    window.apiPost('/api/admin/save-content', { key: 'msg_templates', value: newList })
      .then(() => { setTemplates(newList); setTemplateModal(null); })
      .catch(e => alert('Erro ao salvar modelo: ' + e.message))
      .finally(() => { if (done) done(); });
  };

  const handleSaveTemplate = (data, index, done) => {
    const updated = index === undefined
      ? [...templates, data]
      : templates.map((t, i) => i === index ? data : t);
    persistTemplates(updated, done);
  };

  const handleDeleteTemplate = (index) => {
    persistTemplates(templates.filter((_, i) => i !== index), null);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="sub" style={{ marginBottom: 6 }}>Relacionamento &amp; CRM</div>
          <h1>Central de Mensagens</h1>
          <div className="sub">Comunique-se de forma inteligente e gerencie sua base de clientes com automação.</div>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: '300px 1fr 280px', gap: 14 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <small className="kv-l">DESTINATÁRIOS</small>
            <span className="tag gold">{sel.size} selecionados</span>
          </div>
          <input className="inp" placeholder="Filtrar por nome ou celular…" style={{ marginBottom: 10 }}
            value={search} onChange={e => setSearch(e.target.value)}/>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, marginBottom: 10 }}>
            <a className="link-id" onClick={selAll} style={{ cursor: 'pointer' }}>Selecionar Todos</a>
            <a className="link-muted" onClick={clearSel} style={{ cursor: 'pointer' }}>Limpar Seleção</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 500, overflowY: 'auto' }}>
            {loading && <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: 8 }}>Carregando…</div>}
            {filtered.map((c) => (
              <div key={c.id} className={`contact-row ${sel.has(c.id) ? 'on' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => toggle(c.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{c.name}</b><small>{fmtPhoneX(c.whatsapp)}</small>
                </div>
                <button
                  className="icon-btn danger"
                  style={{ flexShrink: 0, opacity: deleting.has(c.id) ? 0.4 : 0.55, fontSize: 12 }}
                  disabled={deleting.has(c.id)}
                  onClick={e => handleDeleteContact(e, c)}
                  title="Excluir contato"
                >🗑</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Mensagem da Campanha</h3>
            <span className="tag">Use {'{nome}'} para personalizar</span>
          </div>
          <textarea className="inp" rows={22} value={msg} onChange={e => setMsg(e.target.value)}
                    placeholder="Escreva sua mensagem aqui. Use {nome} para personalizar automaticamente com o nome do cliente…"/>
          <div className="campaign-status">
            {sel.size === 0 ? 'Nenhum cliente selecionado para o disparo' : `${sel.size} cliente(s) selecionado(s)`}
          </div>
          <button
            className={`campaign-btn ${sel.size > 0 && msg ? 'on' : ''}`}
            onClick={handleSend}
            disabled={sending || !sel.size || !msg}
          >
            {sending ? 'ENVIANDO…' : 'ENVIAR CAMPANHA AGORA'}
          </button>
          <small style={{ display: 'block', textAlign: 'center', color: 'var(--ink-4)', marginTop: 6, fontSize: 11 }}>O envio será processado em fila para garantir a entrega.</small>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="insight-chip tc1"/>
              <small className="kv-l" style={{ margin: 0 }}>NOVO CONTATO</small>
            </div>
            <input className="inp" placeholder="Nome do Cliente" style={{ marginBottom: 8 }}
              value={newName} onChange={e => setNewName(e.target.value)}/>
            <input className="inp" placeholder="WhatsApp (DDD+Número)" style={{ marginBottom: 10 }}
              value={newPhone} onChange={e => setNewPhone(e.target.value)}/>
            <small style={{ color: 'var(--ink-4)', fontSize: 11, display: 'block', marginBottom: 10 }}>Cadastre contatos para mensagens futuras</small>
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleAddContact}>Cadastrar Contato</button>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="insight-chip tc2"/>
              <small className="kv-l" style={{ margin: 0, flex: 1 }}>MODELOS ({templates.length}/10)</small>
              {templates.length < 10 && (
                <button
                  className="btn-ghost"
                  style={{ padding: '2px 8px', fontSize: 11, lineHeight: 1.4 }}
                  onClick={() => setTemplateModal({ mode: 'new' })}
                >+ Adicionar</button>
              )}
            </div>
            {templates.length === 0 ? (
              <div className="model-empty">
                <b>Crie agilidade</b>
                <small>Salve frases prontas para realizar disparos rápidos em segundos.</small>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {templates.map((t, i) => (
                  <div key={i} className="contact-row"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                    onClick={() => setMsg(t.body)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: 12, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</b>
                    </div>
                    <button
                      className="icon-btn"
                      style={{ flexShrink: 0, fontSize: 12, opacity: 0.6 }}
                      onClick={e => { e.stopPropagation(); setTemplateModal({ mode: 'edit', template: t, index: i }); }}
                      title="Editar modelo"
                    >✏</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {templateModal && (
        <ModeloModal
          template={templateModal.template}
          index={templateModal.index}
          onClose={() => setTemplateModal(null)}
          onSave={handleSaveTemplate}
          onDelete={handleDeleteTemplate}
        />
      )}
    </div>
  );
}

/* ========== CONFIGURAÇÕES DE MENSAGEM (estático — templates de notificação) ========== */
const TEMPLATES = [
  { key: 'msg_email_confirm',
    title: 'Email confirmação de compra',
    desc: 'Mensagem enviada por e-mail ao cliente após confirmação do pagamento.',
    vars: ['{nome}','{itens}','{total}','{pagamento}'],
    fallback: '✅ Pedido confirmado — {nome}\n\n📍 Retirada\nAv. Presidente Kennedy, 627 — Vila Jurandir\n(Em frente à Tetraforma)\n\n📅 Quando\nSábado, a partir das 15h',
  },
  { key: 'msg_wa_confirm',
    title: 'WhatsApp confirmação de compra',
    desc: 'Notificação via WhatsApp confirmando a compra e informando os próximos passos.',
    vars: ['{nome}','{itens}','{total}','{pagamento}'],
    fallback: '✅ *Pedido confirmado — {nome}*\n\n📍 *Retirada*\nAv. Presidente Kennedy, 627 — Vila Jurandir\n(Em frente à Tetraforma)\n\n📅 *Quando*\nSábado, a partir das 15h',
  },
  { key: 'msg_wa_abandoned',
    title: 'WhatsApp carrinho abandonado',
    desc: 'Recuperação enviada para carrinhos iniciados e não finalizados após 1 hora.',
    vars: ['{nome}','{itens}','{link}'],
    fallback: '{nome}, tudo bem? 🥖\n\nVimos que você selecionou alguns produtos, bom gosto!\n\nGaranta essas delícias — finalize seu carrinho antes que esgotem!\n\n🛒\n{itens}',
  },
  { key: 'whatsapp_pix_abandoned',
    title: 'WhatsApp PIX não finalizado',
    desc: 'Enviado quando um pagamento via PIX é iniciado mas não confirmado dentro do prazo.',
    vars: ['{nome}','{total}','{link}'],
    fallback: '{nome}, seu pedido de {total} via PIX ainda está aguardando pagamento. 🍞\n\nFinalize agora para garantir sua fornada:\n{link}',
  },
  { key: 'whatsapp_card_abandoned',
    title: 'WhatsApp Cartão não finalizado',
    desc: 'Enviado quando um pagamento via Cartão é iniciado mas não confirmado.',
    vars: ['{nome}','{total}','{link}'],
    fallback: '{nome}, seu pedido de {total} via Cartão ainda está aguardando pagamento. 🍞\n\nFinalize agora para garantir sua fornada:\n{link}',
  },
  { key: 'whatsapp_ready_for_pickup',
    title: 'WhatsApp pronto p/ retirada',
    desc: 'Enviado automaticamente quando um pedido é marcado como Pronto para Retirada na fila de produção.',
    vars: ['{nome}'],
    fallback: '🍞 *{nome}, seu pedido está pronto!*\n\nSeu pedido já está pronto para retirada.\n\n📍 *Retirada*\nAv. Presidente Kennedy, 627 — Vila Jurandir\n(Em frente à Tetraforma)\n\nObrigado por escolher a Padaria! 🤍',
  },
];

function CfgMsgPage() {
  const [texts, setTexts] = useStX({});
  const [saving, setSaving] = useStX({});
  const [msgs, setMsgs] = useStX({});
  const [loaded, setLoaded] = useStX(false);

  useEffX(() => {
    let mounted = true;
    window.apiGet('/api/admin/config')
      .then(d => {
        if (!mounted) return;
        const sc = d?.siteContent || {};
        const initial = {};
        TEMPLATES.forEach(t => { initial[t.key] = sc[t.key] != null ? sc[t.key] : t.fallback; });
        setTexts(initial);
        setLoaded(true);
      })
      .catch(() => {
        if (!mounted) return;
        const initial = {};
        TEMPLATES.forEach(t => { initial[t.key] = t.fallback; });
        setTexts(initial);
        setLoaded(true);
      });
    return () => { mounted = false; };
  }, []);

  const handleSave = (key) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    setMsgs(prev => ({ ...prev, [key]: '' }));
    window.apiPost('/api/admin/save-content', { key, value: texts[key] })
      .then(() => setMsgs(prev => ({ ...prev, [key]: 'Salvo com sucesso!' })))
      .catch(e => setMsgs(prev => ({ ...prev, [key]: 'Erro: ' + e.message })))
      .finally(() => setSaving(prev => ({ ...prev, [key]: false })));
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="sub" style={{ marginBottom: 6 }}>Configurações · Mensagens</div>
          <h1>Configurações de Mensagem</h1>
          <div className="sub">Templates automáticos enviados aos clientes em cada etapa.</div>
        </div>
      </div>
      {!loaded ? (
        <div className="empty-state"><SafeIcon icon={Ic.msg}/><div>Carregando templates…</div></div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {TEMPLATES.map(t => (
            <div className="card" key={t.key}>
              <h3 style={{ margin: '0 0 6px' }}>{t.title}</h3>
              <small style={{ display: 'block', color: 'var(--ink-3)', marginBottom: 14, maxWidth: 540 }}>{t.desc}</small>
              <small className="kv-l" style={{ display: 'block', marginBottom: 8 }}>VARIÁVEIS DISPONÍVEIS:</small>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {t.vars.map((v, j) => <span key={j} className="var-chip">{v}</span>)}
              </div>
              <textarea
                className="inp tmpl"
                rows={7}
                value={texts[t.key] ?? ''}
                onChange={e => setTexts(prev => ({ ...prev, [t.key]: e.target.value }))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <small style={{ color: (msgs[t.key] || '').startsWith('Erro') ? 'var(--down)' : 'var(--up)', minHeight: 18 }}>
                  {msgs[t.key] || ''}
                </small>
                <button
                  className="btn-primary"
                  onClick={() => handleSave(t.key)}
                  disabled={!!saving[t.key]}
                >
                  {saving[t.key] ? 'Salvando…' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ========== EDITAR PERFIL ========== */
function EditarPerfilPage() {
  const stored = (() => { try { return JSON.parse(localStorage.getItem('tocha_admin_user') || '{}'); } catch { return {}; } })();

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
    window.apiGet('/api/admin/config')
      .then(d => { const url = d?.siteContent?.admin_profile_avatar; if (url) setAvatarUrl(url); })
      .catch(() => {});
  }, []);

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingAvatar(true);
    try {
      const url = await _uploadImage(file);
      setAvatarUrl(url);
      await window.apiPost('/api/admin/save-content', { key: 'admin_profile_avatar', value: url });
      const updated = { ...stored, avatar_url: url };
      localStorage.setItem('tocha_admin_user', JSON.stringify(updated));
    } catch (err) { alert('Erro no upload: ' + err.message); }
    finally { setUploadingAvatar(false); }
  };

  const upd = (fn, v) => { fn(v); setDirty(true); setMsg(''); };

  const handleSave = () => {
    setSaving(true);
    const payload = { nome, email };
    if (senha && senha.trim()) payload.senha = senha;
    window.apiPost('/api/admin/update-profile', payload)
      .then(() => {
        const updated = { ...stored, nome, email, telefone: tel };
        localStorage.setItem('tocha_admin_user', JSON.stringify(updated));
        setDirty(false);
        setSenha('');
        setMsg('Perfil atualizado com sucesso!');
      })
      .catch(e => setMsg('Erro: ' + e.message))
      .finally(() => setSaving(false));
  };

  return (
    <div className="page">
      <div className="page-head" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <div>
          <h1 style={{ margin: 0 }}>Perfil</h1>
        </div>
      </div>
      <div className="perfil-tabs">
        <span className="tab on">Editar Perfil</span>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="section-title">DADOS PESSOAIS</div>
        <div className="grid" style={{ gridTemplateColumns: '320px 1fr', gap: 28, marginTop: 8 }}>
          <div className="avatar-uploader">
            <div
              className="avatar-circle"
              style={{ cursor: 'pointer', overflow: 'hidden' }}
              onClick={() => avatarRef.current?.click()}
            >
              {avatarUrl
                ? <img src={`/${avatarUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                : <div className="avatar-mark">{(nome || 'A')[0].toUpperCase()}</div>
              }
            </div>
            <b className="av-title">Foto de Perfil</b>
            <small>Formato: PNG ou JPG</small>
            <small>Resolução mínima: 350px x 195px</small>
            <div className="av-drop">Arraste sua imagem aqui ou escolha uma direto do seu dispositivo</div>
            <button
              className="btn-ghost"
              style={{ width: '100%' }}
              onClick={() => avatarRef.current?.click()}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? 'Enviando…' : 'Escolher foto'}
            </button>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile}/>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label className="field">
                <span>Nome <em className="req">*</em></span>
                <input className="inp" value={nome} onChange={e => upd(setNome, e.target.value)}/>
              </label>
              <label className="field">
                <span>Telefone <em className="req">*</em></span>
                <div className="inp-phone">
                  <span className="flag">🇧🇷</span>
                  <input className="inp" value={tel} onChange={e => upd(setTel, e.target.value)}/>
                </div>
              </label>
            </div>
            <label className="field">
              <span>E-mail <em className="req">*</em></span>
              <input className="inp" value={email} onChange={e => upd(setEmail, e.target.value)}/>
            </label>
            <label className="field">
              <span>Senha</span>
              <input className="inp" type="password" value={senha} placeholder="Deixe em branco para manter a atual"
                onChange={e => upd(setSenha, e.target.value)}/>
            </label>
            {msg && <div style={{ color: msg.startsWith('Erro') ? 'var(--down)' : 'var(--up)', fontSize: 13 }}>{msg}</div>}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <button
          className={`btn-primary save-wide ${dirty ? '' : 'disabled'}`}
          disabled={!dirty || saving}
          onClick={handleSave}
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, {
  InsightsPage, InteligenciaPage, AlertasPage, FunilPage, PagtoPainelPage,
  CardapioPage, CentralMsgPage, CfgMsgPage, EditarPerfilPage,
  _uploadImage,
});
