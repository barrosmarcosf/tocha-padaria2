/* global React, Ic, brl, SafeIcon */
const { useState: useStX, useEffect: useEffX, useCallback: useCbX } = React;

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
    const from = new Date(mo.year, mo.month - 1, 1).toISOString();
    const to   = new Date(mo.year, mo.month, 0, 23, 59, 59).toISOString();
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
function FunilPage() {
  const [data, setData] = useStX(null);
  const [loading, setLoading] = useStX(true);

  useEffX(() => {
    let mounted = true;
    window.apiGet('/api/admin/metrics')
      .then(d => { if (mounted) setData(d); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const funnel = data?.funnel || { visitors: 0, add_to_cart: 0, checkout: 0, success: 0 };
  const payments = data?.payments || { total: 0, success: 0, failed: 0, pending: 0, approval_rate: 0 };

  const pct = (v, base) => base > 0 ? ((v / base) * 100).toFixed(1) : '0.0';

  const FUNIL = [
    { label: 'VISITANTES',           v: funnel.visitors,    pct: 100,                                    tone: 'c1' },
    { label: 'CARRINHOS CRIADOS',    v: funnel.add_to_cart, pct: parseFloat(pct(funnel.add_to_cart, funnel.visitors)),  tone: 'c1' },
    { label: 'CHECKOUTS INICIADOS',  v: funnel.checkout,    pct: parseFloat(pct(funnel.checkout, funnel.visitors)),      tone: 'c1' },
    { label: 'PAGAMENTOS CONCLUÍDOS', v: funnel.success,    pct: parseFloat(pct(funnel.success, funnel.visitors)),       tone: 'c2' },
  ];

  const abandoned = Math.max(0, funnel.add_to_cart - funnel.success);
  const abandonedPct = pct(abandoned, funnel.add_to_cart);
  const checkAbandoned = Math.max(0, funnel.checkout - funnel.success);
  const checkAbandonedPct = pct(checkAbandoned, funnel.checkout);

  const pixRev    = 0;
  const creditRev = 0;
  const debitRev  = 0;

  return (
    <div className="page">
      <PH title="Funil de Vendas" subtitle="Onde os clientes entram — e onde saem."/>
      {loading ? (
        <div className="empty-state" style={{ height: 200 }}><Ic.clock/><div>Carregando métricas…</div></div>
      ) : (
        <>
          <div className="card">
            <div className="funnel">
              {FUNIL.map((s, i) => (
                <React.Fragment key={i}>
                  <div className={`funnel-step t${s.tone}`} style={{ marginLeft: `${i * 6}%`, marginRight: `${i * 2}%` }}>
                    <span className="funnel-chip"/>
                    <div className="funnel-meta">
                      <small>{s.label}</small>
                      <b>{s.v}</b>
                    </div>
                    <div className="funnel-pct">
                      <b>{s.pct.toFixed(1)}%</b>
                      <small>de conversão</small>
                    </div>
                  </div>
                  {i < FUNIL.length - 1 && <div className="funnel-arrow">↓</div>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="grid row-2 mt">
            <div className="card">
              <div className="section-title">ABANDONO</div>
              <div className="abandon-row down">
                <div><b>Carrinhos abandonados</b><small>{abandonedPct}% dos carrinhos</small></div>
                <b className="abandon-v">{abandoned}</b>
              </div>
              <div className="abandon-row down">
                <div><b>Checkouts abandonados</b><small>{checkAbandonedPct}% dos checkouts</small></div>
                <b className="abandon-v">{checkAbandoned}</b>
              </div>
            </div>
            <div className="card">
              <div className="section-title">PAGAMENTOS</div>
              <div className="abandon-row up">
                <div><b>Aprovados</b><small>{payments.approval_rate}% de aprovação</small></div>
                <b className="abandon-v">{payments.success}</b>
              </div>
              <div className="abandon-row down">
                <div><b>Reprovados</b><small>Falhas de pagamento</small></div>
                <b className="abandon-v">{payments.failed}</b>
              </div>
            </div>
          </div>

          <div className="grid row-2 mt">
            <div className="card">
              <div className="section-title">ORIGEM DO PAGAMENTO</div>
              {payments.total === 0 ? (
                <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '12px 0' }}>Sem dados de pagamento disponíveis.</div>
              ) : [
                { l: 'PIX', v: 0, pct: 0 },
                { l: 'Cartão de Crédito', v: 0, pct: 0 },
                { l: 'Cartão de Débito', v: 0, pct: 0 },
              ].map((r, i) => (
                <div className="origin-row" key={i}>
                  <span className="origin-lbl">{r.l}</span>
                  <div className="origin-bar"><div className="origin-fill" style={{ width: `${r.pct}%` }}/></div>
                  <span className="origin-v"><b>{r.v}</b> pedidos <span>{r.pct}%</span></span>
                </div>
              ))}
            </div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <span className="insight-chip tc1" style={{ width: 28, height: 28, marginBottom: 12 }}/>
              <small className="section-title" style={{ margin: 0 }}>TAXA DE APROVAÇÃO</small>
              <b style={{ fontFamily: 'var(--display)', fontSize: 40, fontWeight: 400, color: 'var(--ink)', margin: '8px 0' }}>{payments.approval_rate}%</b>
              <small style={{ color: 'var(--ink-4)' }}>total de {payments.total} transações</small>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ========== PAINEL DE PAGAMENTOS ========== */
function PagtoPainelPage() {
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

  const pay = metrics?.payments || { total: 0, success: 0, failed: 0, pending: 0, approval_rate: 0 };
  const h   = health || { pending: 0, paid: 0, failed: 0, stale_locks: 0, fila_reprocessamento: 0 };

  const motivos = [
    { l: 'Saldo insuficiente', n: 0, p: 0 },
    { l: 'Cartão expirado',    n: 0, p: 0 },
    { l: 'Dados inválidos',    n: 0, p: 0 },
    { l: 'Limite excedido',    n: 0, p: 0 },
    { l: 'Outros',             n: pay.failed, p: 100 },
  ].filter(m => m.n > 0 || pay.failed > 0 && m.l === 'Outros');

  return (
    <div className="page">
      <PH title="Painel de Pagamentos" subtitle="Visão geral de aprovações, rejeições e estornos."/>
      {loading ? (
        <div className="empty-state" style={{ height: 200 }}><Ic.clock/><div>Carregando dados…</div></div>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            <div className="pay-stat k-up"><small>APROVADOS</small><b>{h.paid}</b><span>{pay.approval_rate}% do total</span></div>
            <div className="pay-stat k-warn"><small>PENDENTES</small><b>{h.pending}</b><span>Aguardando confirmação</span></div>
            <div className="pay-stat k-down"><small>REJEITADOS</small><b>{h.failed}</b><span>{pay.total > 0 ? ((h.failed / pay.total) * 100).toFixed(1) : '0'}% do total</span></div>
          </div>
          <div className="grid row-2 mt">
            <div className="card"><small className="kv-l">TOTAL DE TRANSAÇÕES</small><b style={{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 38, color: 'var(--ink)' }}>{pay.total}</b></div>
            <div className="card pay-stat k-c1" style={{ background: 'transparent', border: '1px solid var(--line-2)' }}>
              <small className="kv-l">LOCKS PRESOS</small>
              <b style={{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 38, color: 'var(--ink)' }}>{h.stale_locks}</b>
              <span style={{ color: 'var(--ink-3)' }}>Fila de reprocessamento: {h.fila_reprocessamento}</span>
            </div>
          </div>
          {pay.failed > 0 && (
            <div className="card mt">
              <div className="section-title">MOTIVOS DE REJEIÇÃO</div>
              {motivos.map((m, i) => (
                <div className="origin-row" key={i}>
                  <span className="origin-lbl" style={{ color: 'var(--down)' }}>{m.l}</span>
                  <div className="origin-bar"><div className="origin-fill" style={{ width: `${m.p}%`, background: 'var(--down)' }}/></div>
                  <span className="origin-v"><b>{m.n}</b> ocorrências <em style={{ color: 'var(--down)' }}>{m.p}%</em></span>
                </div>
              ))}
            </div>
          )}
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
  const [saving, setSaving] = useStX(false);
  const isNew = !cat?.id;

  const handleSave = () => {
    setSaving(true);
    const payload = { slug, name, description: desc, is_active: visible };
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
          <label className="field">
            <span>Foto de vitrine</span>
            <div className="img-slot">
              <div className="img-empty">Escolher Foto</div>
            </div>
          </label>
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
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando…' : 'Salvar Categoria'}</button>
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
  const [saving, setSaving] = useStX(false);
  const vendidos = prod?.vendidos || 0;
  const disp = Math.max(0, estoque - vendidos);
  const fillPct = estoque ? Math.min(100, (disp / estoque) * 100) : 0;
  const isNew = !prod?.id;

  const handleSave = () => {
    setSaving(true);
    const payload = {
      name, price: parseFloat(price) || 0, description: desc,
      is_active: active, initial_stock: parseInt(estoque) || 0,
      category_slug: prod?.category_slug || '',
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
          <label className="field">
            <span>Foto do Produto</span>
            <div className="img-slot">
              {prod?.image_url
                ? <img src={`/${prod.image_url}`} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:4 }}/>
                : <div className="img-empty">Escolher Foto</div>}
            </div>
          </label>

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
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando…' : 'Salvar Produto'}</button>
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
                  <div className="cat-thumb"/>
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

  const upd = (fn, v) => { fn(v); setDirty(true); setMsg(''); };

  const handleSave = () => {
    setSaving(true);
    const payload = { nome, email, telefone: tel };
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
            <div className="avatar-circle">
              <div className="avatar-mark">{(nome || 'A')[0].toUpperCase()}</div>
            </div>
            <b className="av-title">Foto de Perfil</b>
            <small>Formato: PNG ou JPG</small>
            <small>Resolução mínima: 350px x 195px</small>
            <div className="av-drop">Arraste sua imagem aqui ou escolha uma direto do seu dispositivo</div>
            <button className="btn-ghost" style={{ width: '100%' }}>Escolher foto</button>
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
});
