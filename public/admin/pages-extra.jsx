/* global React, Ic */
const { useState: useStX } = React;

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

/* ========== INSIGHTS AUTOMÁTICOS ========== */
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

/* ========== INTELIGÊNCIA — DASHBOARD ========== */
const MESES_LONGO = [
  { l: 'Jun/2025', f: 0,    p: 0, lr: 0 },
  { l: 'Jul/2025', f: 0,    p: 0, lr: 0 },
  { l: 'Ago/2025', f: 0,    p: 0, lr: 0 },
  { l: 'Set/2025', f: 0,    p: 0, lr: 0 },
  { l: 'Out/2025', f: 0,    p: 0, lr: 0 },
  { l: 'Nov/2025', f: 0,    p: 0, lr: 0 },
  { l: 'Dez/2025', f: 0,    p: 0, lr: 0 },
  { l: 'Jan/2026', f: 0,    p: 0, lr: 0 },
  { l: 'Fev/2026', f: 0,    p: 0, lr: 0 },
  { l: 'Mar/2026', f: 0,    p: 0, lr: 0 },
  { l: 'Abr/2026', f: 126.7, p: 2, lr: 76 },
  { l: 'Mai/2026', f: 8,    p: 4, lr: 4.8 },
];

function LongTermChart({ data }) {
  const W = 1100, H = 320, PL = 56, PR = 56, PT = 24, PB = 40;
  const iw = W - PL - PR, ih = H - PT - PB;
  const maxR = Math.max(...data.map(d => Math.max(d.f, d.lr)), 1);
  const maxP = Math.max(...data.map(d => d.p), 1);
  const step = iw / (data.length - 1);
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

const CAL_2026_MAI = (() => {
  const sales = { 3: { v: 6, p: 2 }, 6: { v: 1, p: 1 }, 11: { v: 1, p: 1 } };
  const startDow = 5;
  const days = 31;
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push({ d, ...(sales[d] || { v: 0 }) });
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
})();

const RANKING_ITENS = [
  { p: 'Sourdough Tradicional (São João)',     cat: 'PADARIA', qtd: 5, bruto: 128, lucro: 76.8 },
  { p: 'Focaccia de Damasco & Gorgonzola',      cat: 'PADARIA', qtd: 1, bruto: 5,   lucro: 3 },
  { p: 'Sourdough Tradicional',                 cat: 'PADARIA', qtd: 1, bruto: 1,   lucro: 0.6 },
];

function InteligenciaPage() {
  const totalMes = CAL_2026_MAI.flat().reduce((a, c) => a + (c?.v || 0), 0);
  const totalSemana = (w) => w.reduce((a, c) => a + (c?.v || 0), 0);
  const totalDow = (i) => CAL_2026_MAI.reduce((a, w) => a + (w[i]?.v || 0), 0);
  const dows = ['DOM','SEG','TER','QUA','QUI','SEX','SAB'];

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
          <b>R$ 134,00</b>
          <span><em className="up-text">▲ +12.4%</em> vs. mês anterior</span>
        </div>
        <div className="kpi-card">
          <small>TICKET MÉDIO</small>
          <b>R$ 22,33</b>
          <span><em className="dn-text">▼ −3.1%</em> vs. mês anterior</span>
        </div>
        <div className="kpi-card">
          <small>PEDIDOS</small>
          <b>6</b>
          <span><em className="up-text">▲ +100%</em> vs. mês anterior</span>
        </div>
      </div>

      <div className="card mt">
        <div className="card-head" style={{ alignItems: 'flex-end' }}>
          <div>
            <h3 style={{ margin: 0 }}>Evolução de Longo Prazo</h3>
            <small style={{ color: 'var(--ink-3)' }}>Histórico mensal consolidado dos últimos 12 meses</small>
          </div>
        </div>
        <div className="lt-summary">
          <div className="lt-sum-item">
            <small>ÚLTIMO MÊS</small>
            <b className="lt-mono">Mai/2026</b>
          </div>
          <div className="lt-sum-item">
            <small>FATURAMENTO</small>
            <div className="lt-sum-line">
              <b>R$ 8</b>
              <span className="delta dn">−93.7%</span>
            </div>
          </div>
          <div className="lt-sum-item">
            <small>VENDAS</small>
            <div className="lt-sum-line">
              <b>4</b>
              <span className="delta up">+100.0%</span>
            </div>
          </div>
          <div className="lt-sum-item">
            <small>LUCRO REAL</small>
            <div className="lt-sum-line">
              <b>R$ 4,8</b>
              <span className="delta dn">−93.7%</span>
            </div>
          </div>
        </div>
        <LongTermChart data={MESES_LONGO}/>
      </div>

      <div className="card mt">
        <div className="card-head">
          <div>
            <h3 style={{ margin: 0 }}>Vendas do mês</h3>
          </div>
          <select className="inp" style={{ width: 180 }} defaultValue="2026-05">
            <option value="2026-05">Maio de 2026</option>
            <option value="2026-04">Abril de 2026</option>
            <option value="2026-03">Março de 2026</option>
          </select>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 4 }}>
          <div className="kpi-soft v">
            <small>VENDA TOTAL</small>
            <b>R$ {totalMes.toFixed(2).replace('.', ',')}</b>
          </div>
          <div className="kpi-soft">
            <small>PEDIDOS</small>
            <b>4</b>
          </div>
        </div>
        <div className="cal-hint">As informações correspondem ao mês de Maio de 2026</div>

        <div className="cal-grid">
          <div className="cal-head">
            {dows.map(d => <div key={d}>{d}</div>)}
            <div className="cal-total">TOTAL SEMANA</div>
          </div>
          {CAL_2026_MAI.map((w, wi) => (
            <div className="cal-row" key={wi}>
              {w.map((c, ci) => (
                <div className={`cal-cell ${c && c.v > 0 ? 'has' : ''} ${!c ? 'empty' : ''}`} key={ci}>
                  {c && <>
                    <span className="cal-d">{c.d}</span>
                    <div className="cal-val">
                      <b>R$ {c.v.toFixed(2).replace('.', ',')}</b>
                      {c.p && <small>{c.p} pedido{c.p > 1 ? 's' : ''}</small>}
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
          {RANKING_ITENS.map((r, i) => (
            <div className="rk-row" key={i}>
              <div className="rk-pos">{i + 1}</div>
              <div><b>{r.p}</b></div>
              <div><span className="tag">{r.cat}</span></div>
              <div className="rt num">{r.qtd}</div>
              <div className="rt num">R$ {r.bruto.toFixed(2).replace('.', ',')}</div>
              <div className="rt num up-text">R$ {r.lucro.toFixed(2).replace('.', ',')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========== ALERTAS ========== */
const ALERTS = [
  { k: 'crit',  title: 'Taxa de rejeição',     desc: '18% — acima do threshold de 10%' },
  { k: 'warn',  title: 'Ticket médio',         desc: 'Queda de 12% na última semana' },
  { k: 'warn',  title: 'Carrinhos abandonados', desc: '32% de aumento nos últimos 3 dias' },
  { k: 'warn',  title: 'Queda de visitas',     desc: '8% abaixo da média semanal esperada' },
  { k: 'ok',    title: 'Taxa de aprovação',    desc: 'Acima de 80% — dentro do esperado' },
  { k: 'ok',    title: 'Taxa de conversão',    desc: 'Estável em 10,8% — dentro da meta' },
  { k: 'ok',    title: 'Perfil do comprador',  desc: 'Comportamento dentro do padrão histórico' },
];

function AlertasPage() {
  const crit = ALERTS.filter(a => a.k === 'crit').length;
  const warn = ALERTS.filter(a => a.k === 'warn').length;
  const ok   = ALERTS.filter(a => a.k === 'ok').length;
  const labels = { crit: 'CRÍTICO', warn: 'ATENÇÃO', ok: 'OK' };
  return (
    <div className="page">
      <PH title="Alertas" subtitle="Indicadores que precisam da sua atenção."/>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        <div className="alert-summary k-crit"><b>{crit}</b><small>CRÍTICOS</small></div>
        <div className="alert-summary k-warn"><b>{warn}</b><small>ATENÇÃO</small></div>
        <div className="alert-summary k-ok"><b>{ok}</b><small>OK</small></div>
      </div>
      <div className="card mt" style={{ padding: 8 }}>
        {ALERTS.map((a, i) => (
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
const FUNIL = [
  { label: 'VISITANTES',           v: 33, pct: 100,  tone: 'c1' },
  { label: 'CARRINHOS CRIADOS',    v: 10, pct: 30.3, tone: 'c1', step: -0.06 },
  { label: 'CHECKOUTS INICIADOS',  v: 1,  pct: 3.0,  tone: 'c1', step: -0.13 },
  { label: 'PAGAMENTOS CONCLUÍDOS', v: 0, pct: 0.0,  tone: 'c2', step: -0.2 },
];

function FunilPage() {
  return (
    <div className="page">
      <PH title="Funil de Vendas" subtitle="Onde os clientes entram — e onde saem."/>
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
            <div><b>Carrinhos abandonados</b><small>90,0% dos carrinhos</small></div>
            <b className="abandon-v">9</b>
          </div>
          <div className="abandon-row down">
            <div><b>Checkouts abandonados</b><small>100,0% dos checkouts</small></div>
            <b className="abandon-v">1</b>
          </div>
        </div>
        <div className="card">
          <div className="section-title">RECUPERAÇÃO</div>
          <div className="abandon-row up">
            <div><b>Carrinhos recuperados</b><small>233,3% dos abandonados</small></div>
            <b className="abandon-v">21</b>
          </div>
          <div className="abandon-row up">
            <div><b>Checkouts recuperados</b><small>1400,0% dos abandonados</small></div>
            <b className="abandon-v">14</b>
          </div>
        </div>
      </div>

      <div className="grid row-2 mt">
        <div className="card">
          <div className="section-title">ORIGEM DO PAGAMENTO</div>
          {[
            { l: 'PIX', v: 134, pct: 68 },
            { l: 'Cartão de Crédito', v: 48, pct: 24 },
            { l: 'Cartão de Débito', v: 16, pct: 8 },
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
          <small className="section-title" style={{ margin: 0 }}>TEMPO MÉDIO DE CONVERSÃO</small>
          <b style={{ fontFamily: 'var(--display)', fontSize: 40, fontWeight: 400, color: 'var(--ink)', margin: '8px 0' }}>8m 32s</b>
          <small style={{ color: 'var(--ink-4)' }}>do carrinho ao pagamento</small>
        </div>
      </div>
    </div>
  );
}

/* ========== PAINEL DE PAGAMENTOS ========== */
function PagtoPainelPage() {
  const motivos = [
    { l: 'Saldo insuficiente', n: 14, p: 45 },
    { l: 'Cartão expirado',    n: 7,  p: 23 },
    { l: 'Dados inválidos',    n: 5,  p: 16 },
    { l: 'Limite excedido',    n: 3,  p: 10 },
    { l: 'Outros',             n: 2,  p: 6  },
  ];
  return (
    <div className="page">
      <PH title="Painel de Pagamentos" subtitle="Visão geral de aprovações, rejeições e estornos."/>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        <div className="pay-stat k-up"><small>APROVADOS</small><b>6</b><span>4,5% do total — R$ 18.450,00</span></div>
        <div className="pay-stat k-warn"><small>PENDENTES</small><b>115</b><span>R$ 960,00</span></div>
        <div className="pay-stat k-down"><small>REJEITADOS</small><b>10</b><span>7,5% do total</span></div>
      </div>
      <div className="grid row-2 mt">
        <div className="card"><small className="kv-l">TOTAL DE TRANSAÇÕES</small><b style={{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 38, color: 'var(--ink)' }}>134</b></div>
        <div className="card pay-stat k-c1" style={{ background: 'transparent', border: '1px solid var(--line-2)' }}>
          <small className="kv-l">ESTORNADOS</small>
          <b style={{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 38, color: 'var(--ink)' }}>6</b>
          <span style={{ color: 'var(--ink-3)' }}>R$ 420,00</span>
        </div>
      </div>
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
    </div>
  );
}

/* ========== CARDÁPIO ========== */
const CATEGORIAS = [
  { id: 'sourdough',  name: 'Sourdough',           desc: 'O clássico da TOCHA: casca crocante, miolo leve e macio.' },
  { id: 'focaccia',   name: 'Focaccias',           desc: 'Clássicas italianas com azeite de ponta.' },
  { id: 'brioches',   name: 'Brioches',            desc: 'Manteiga, maciez e recheios indescritíveis.' },
  { id: 'mini',       name: 'Mini Brioches',       desc: 'Perfeitos para entradas refinadas.' },
  { id: 'lanches',    name: 'Lanches',             desc: 'Pães brioches para Hambúrguer, Hot Dog e Joelhos.' },
  { id: 'folhados',   name: 'Folhados & Tortas',   desc: 'Massa folhada incrivelmente crocante.' },
  { id: 'doces',      name: 'Confeitaria & Doces', desc: 'A finalização perfeita.' },
  { id: 'queijo',     name: 'Pães de Queijo',      desc: 'Nossa versão especial em vários recheios.' },
];

const PRODUTOS = [
  { name: 'Sourdough Tradicional (São João)', desc: 'O clássico da TOCHA. Crosta caramelizada, miolo alveolado.', price: 1.00,  status: 'ATIVO',    stock: '2 un.' },
  { name: 'Sourdough Integral',                desc: 'Farinha integral, sabor profundo e nutritivo.',             price: 55.00, status: 'ATIVO',    stock: '5 un.' },
  { name: 'Sourdough Gorgonzola',              desc: 'Intenso, ousado, inesquecível.',                            price: 68.00, status: 'ATIVO',    stock: 'Esgotado' },
  { name: 'Sourdough Parmesão',                desc: 'Crosta dourada com parmesão caramelizado.',                 price: 68.00, status: 'ATIVO',    stock: 'Esgotado' },
  { name: 'Sourdough Provolone',               desc: 'Levemente defumado, harmonioso.',                           price: 68.00, status: 'ATIVO',    stock: 'Esgotado' },
  { name: 'Sourdough Multi Grãos',             desc: 'Cheio de textura e personalidade.',                         price: 60.00, status: 'ATIVO',    stock: 'Esgotado' },
  { name: 'Sourdough Ervas com Queijos',       desc: 'Ervas frescas e queijos selecionados.',                     price: 65.00, status: 'ATIVO',    stock: 'Esgotado' },
  { name: 'Sourdough Azeitonas Pretas',        desc: 'Mediterrâneo em cada fatia.',                               price: 65.00, status: 'ATIVO',    stock: 'Esgotado' },
  { name: 'Sourdough Cheddar, Bacon & Jalapeño', desc: 'Para os que gostam de emoção.',                          price: 72.00, status: 'ATIVO',    stock: 'Esgotado' },
  { name: 'Sourdough Cacau com Frutas Caramelizadas', desc: 'Chocolate, doce, complexo e único.',                 price: 75.00, status: 'ATIVO',    stock: 'Esgotado' },
];

function CategoriaModal({ cat, onClose, onSave }) {
  const [name, setName] = useStX(cat?.name || '');
  const [slug, setSlug] = useStX(cat?.id || '');
  const [desc, setDesc] = useStX(cat?.desc || '');
  const [visible, setVisible] = useStX(cat?.visible !== false);
  const isNew = !cat;
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
            <input className="inp" value={slug} onChange={e => setSlug(e.target.value)}/>
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
          <button className="btn-primary" onClick={() => onSave({ id: slug, name, desc, visible })}>Salvar Categoria</button>
        </div>
      </div>
    </div>
  );
}

function ProdutoModal({ prod, onClose, onSave }) {
  const [name, setName] = useStX(prod?.name || '');
  const [price, setPrice] = useStX(prod?.price || 0);
  const [desc, setDesc] = useStX(prod?.desc || '');
  const [estoque, setEstoque] = useStX(prod?.estoque ?? 2);
  const [vendidos] = useStX(prod?.vendidos ?? 0);
  const [active, setActive] = useStX(prod?.status !== 'INATIVO');
  const disp = Math.max(0, estoque - vendidos);
  const fillPct = estoque ? Math.min(100, (disp / estoque) * 100) : 0;
  const isNew = !prod;
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
            <input className="inp" type="number" step="0.01" value={price} onChange={e => setPrice(parseFloat(e.target.value) || 0)}/>
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
              <div className="img-empty">Escolher Foto</div>
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
          <button className="btn-primary" onClick={() => onSave({ name, price, desc, estoque, status: active ? 'ATIVO' : 'INATIVO' })}>Salvar Produto</button>
        </div>
      </div>
    </div>
  );
}

function CardapioPage() {
  const [sel, setSel] = useStX('sourdough');
  const [cats, setCats] = useStX(CATEGORIAS.map(c => ({ ...c, visible: true })));
  const [prods, setProds] = useStX(PRODUTOS.map((p) => ({ ...p, estoque: p.stock === 'Esgotado' ? 0 : parseInt(p.stock) || 2, vendidos: p.stock === 'Esgotado' ? (parseInt(p.stock) || 2) : 0 })));
  const [catModal, setCatModal] = useStX(null);
  const [prodModal, setProdModal] = useStX(null);

  const stop = e => e.stopPropagation();
  const editCat = (cat, e) => { stop(e); setCatModal({ cat }); };
  const delCat = (cat, e) => { stop(e); if (confirm(`Excluir categoria "${cat.name}"?`)) setCats(cats.filter(c => c.id !== cat.id)); };
  const newCat = () => setCatModal({ cat: null });
  const saveCat = (data) => {
    if (catModal.cat) setCats(cats.map(c => c.id === catModal.cat.id ? { ...c, ...data } : c));
    else setCats([...cats, { ...data }]);
    setCatModal(null);
  };

  const editProd = (p, e) => { stop(e); setProdModal({ prod: p }); };
  const delProd = (p, e) => { stop(e); if (confirm(`Excluir produto "${p.name}"?`)) setProds(prods.filter(x => x !== p)); };
  const newProd = () => setProdModal({ prod: null });
  const saveProd = (data) => {
    if (prodModal.prod) setProds(prods.map(p => p === prodModal.prod ? { ...p, ...data } : p));
    else setProds([...prods, { ...data }]);
    setProdModal(null);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="sub" style={{ marginBottom: 6 }}>Loja · Cardápio</div>
          <h1>Gestão do Cardápio</h1>
          <div className="sub">Categorias e produtos exibidos no site.</div>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="section-title" style={{ margin: 0 }}>CATEGORIAS</div>
            <button className="btn-primary sm" onClick={newCat}>+ Nova Categoria</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cats.map(c => (
              <div key={c.id} onClick={() => setSel(c.id)}
                className={`cat-row ${sel === c.id ? 'on' : ''}`}>
                <div className="cat-thumb"/>
                <div className="cat-text">
                  <b>{c.name}</b>
                  <small>{c.desc}</small>
                  <span className={`tag ${c.visible ? 'up' : 'down'}`} style={{ marginTop: 4 }}>
                    {c.visible ? 'ATIVA' : 'INATIVA'}
                  </span>
                </div>
                <div className="row-actions">
                  <button className="icon-btn" title="Editar" onClick={(e) => editCat(c, e)}>✏</button>
                  <button className="icon-btn danger" title="Excluir" onClick={(e) => delCat(c, e)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
            <div>
              <small className="kv-l">PRODUTOS DE</small>
              <b style={{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 28, color: 'var(--ink)', display: 'block' }}>
                {cats.find(c => c.id === sel)?.name || '—'}
              </b>
            </div>
            <button className="btn-primary" onClick={newProd}>Novo Produto</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 560, overflowY: 'auto', paddingRight: 4 }}>
            {prods.map((p, i) => (
              <div key={i} className="prod-row-full">
                <div className="prod-thumb"/>
                <div className="prod-text">
                  <b>{p.name}</b>
                  <small>{p.desc}</small>
                </div>
                <div className="prod-meta">
                  <b className="num" style={{ color: 'var(--ink)' }}>R$ {p.price.toFixed(2).replace('.', ',')}</b>
                  <span className={`tag ${p.status === 'ATIVO' ? 'up' : 'down'}`}>{p.status}</span>
                  <small style={{ color: (p.estoque - (p.vendidos || 0)) <= 0 ? 'var(--down)' : 'var(--ink-3)' }}>
                    {(p.estoque - (p.vendidos || 0)) <= 0 ? 'Esgotado' : `${p.estoque - (p.vendidos || 0)} un.`}
                  </small>
                </div>
                <div className="row-actions">
                  <button className="icon-btn" title="Editar" onClick={(e) => editProd(p, e)}>✏</button>
                  <button className="icon-btn danger" title="Excluir" onClick={(e) => delProd(p, e)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {catModal && <CategoriaModal cat={catModal.cat} onClose={() => setCatModal(null)} onSave={saveCat}/>}
      {prodModal && <ProdutoModal prod={prodModal.prod} onClose={() => setProdModal(null)} onSave={saveProd}/>}
    </div>
  );
}

/* ========== CENTRAL DE MENSAGENS ========== */
const CONTATOS = [
  { name: 'Gabriel Machado',                phone: '(21) 98072-5247' },
  { name: 'Janete José',                    phone: '(21) 98016-2578' },
  { name: 'Julia Correa',                   phone: '(21) 96946-0158' },
  { name: 'Marcos',                         phone: '(21) 98705-8131' },
  { name: 'Marcos Felipe da Silva Ba…',     phone: '(21) 96627-8965' },
  { name: 'StabTest',                       phone: '(21) 90000-0001' },
  { name: 'Tamiris Barros',                 phone: '(21) 98600-1350' },
  { name: 'Teste Automatizado',             phone: '(21) 99999-9999' },
  { name: 'Teste CID',                      phone: '(21) 99999-0001' },
  { name: 'Teste Deploy',                   phone: '(21) 99999-9999' },
  { name: 'Teste DevOps',                   phone: '(21) 99999-9999' },
  { name: 'Teste Resiliencia',              phone: '(21) 99999-0001' },
  { name: 'Validacao Teste',                phone: '(21) 99999-0000' },
];

function CentralMsgPage() {
  const [sel, setSel] = useStX(new Set());
  const [msg, setMsg] = useStX('');
  const toggle = (n) => { const s = new Set(sel); s.has(n) ? s.delete(n) : s.add(n); setSel(s); };
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
          <input className="inp" placeholder="Filtrar por nome ou celular…" style={{ marginBottom: 10 }}/>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, marginBottom: 10 }}>
            <a className="link-id" onClick={() => setSel(new Set(CONTATOS.map(c => c.name)))} style={{ cursor: 'pointer' }}>Selecionar Todos</a>
            <a className="link-muted" onClick={() => setSel(new Set())} style={{ cursor: 'pointer' }}>Limpar Seleção</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 500, overflowY: 'auto' }}>
            {CONTATOS.map((c, i) => (
              <div key={i} className={`contact-row ${sel.has(c.name) ? 'on' : ''}`} onClick={() => toggle(c.name)}>
                <div><b>{c.name}</b><small>{c.phone}</small></div>
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
          <button className={`campaign-btn ${sel.size > 0 && msg ? 'on' : ''}`}>ENVIAR CAMPANHA AGORA</button>
          <small style={{ display: 'block', textAlign: 'center', color: 'var(--ink-4)', marginTop: 6, fontSize: 11 }}>O envio será processado em fila para garantir a entrega.</small>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="insight-chip tc1"/>
              <small className="kv-l" style={{ margin: 0 }}>NOVO CONTATO</small>
            </div>
            <input className="inp" placeholder="Nome do Cliente" style={{ marginBottom: 8 }}/>
            <input className="inp" placeholder="WhatsApp (DDD+Número)" style={{ marginBottom: 10 }}/>
            <small style={{ color: 'var(--ink-4)', fontSize: 11, display: 'block', marginBottom: 10 }}>Cadastre contatos para mensagens futuras</small>
            <button className="btn-primary" style={{ width: '100%' }}>Cadastrar Contato</button>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="insight-chip tc2"/>
              <small className="kv-l" style={{ margin: 0 }}>MODELOS (0/10)</small>
            </div>
            <div className="model-empty">
              <b>Crie agilidade</b>
              <small>Salve frases prontas para realizar disparos rápidos em segundos.</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========== CONFIGURAÇÕES DE MENSAGEM ========== */
const TEMPLATES = [
  { title: 'Email confirmação compra',
    desc: 'Mensagem enviada automaticamente para o cliente no e-mail cadastrado assim que o pagamento é confirmado.',
    vars: ['{nome}','{itens}','{total}','{pagamento}'],
    body: '✅ Pedido confirmado — {nome}\n\n📍 Retirada\nAv. Presidente Kennedy, 627 — Vila Jurandir\n(Em frente à Tetraforma)\n\n📅 Quando\nSábado, a partir das 15h',
  },
  { title: 'WhatsApp confirmação compra',
    desc: 'Notificação instantânea enviada via WhatsApp para o cliente confirmando a compra e informando os próximos passos.',
    vars: ['{nome}','{itens}','{total}','{pagamento}'],
    body: '✅ *Pedido confirmado — {nome}*\n\n📍 *Retirada*\nAv. Presidente Kennedy, 627 — Vila Jurandir\n(Em frente à Tetraforma)\n\n📅 *Quando*\nSábado, a partir das 15h',
  },
  { title: 'WhatsApp carrinho abandonado',
    desc: 'Mensagem de recuperação enviada para carrinhos iniciados que não foram finalizados após 1 hora.',
    vars: ['{nome}','{itens}','{link}'],
    body: '{nome}, tudo bem? 🥖\n\nVimos que você selecionou alguns produtos, bom gosto!\n\nGaranta essas delícias — finalize seu carrinho antes que esgotem!\n\n🛒\n{itens}',
  },
];

function CfgMsgPage() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="sub" style={{ marginBottom: 6 }}>Configurações · Mensagens</div>
          <h1>Configurações de Mensagem</h1>
          <div className="sub">Templates automáticos enviados aos clientes em cada etapa.</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {TEMPLATES.map((t, i) => (
          <div className="card" key={i}>
            <h3 style={{ margin: '0 0 6px' }}>{t.title}</h3>
            <small style={{ display: 'block', color: 'var(--ink-3)', marginBottom: 14, maxWidth: 540 }}>{t.desc}</small>
            <small className="kv-l" style={{ display: 'block', marginBottom: 8 }}>VARIÁVEIS DISPONÍVEIS:</small>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {t.vars.map((v, j) => <span key={j} className="var-chip">{v}</span>)}
            </div>
            <textarea className="inp tmpl" rows={7} defaultValue={t.body}/>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn-primary">Salvar Alterações</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========== EDITAR PERFIL ========== */
function EditarPerfilPage() {
  const [nome, setNome] = useStX('TOCHA PADARIA');
  const [tel, setTel] = useStX('(21) 96627-8965');
  const [email, setEmail] = useStX('admin@tochapadaria');
  const [senha, setSenha] = useStX('••••••••');
  const [dirty, setDirty] = useStX(false);
  const upd = (fn, v) => { fn(v); setDirty(true); };
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
              <div className="avatar-mark">T</div>
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
              <input className="inp" type="password" value={senha} onChange={e => upd(setSenha, e.target.value)}/>
              <a className="link-id" style={{ cursor: 'pointer', marginTop: 4 }}>Alterar Senha</a>
            </label>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <button className={`btn-primary save-wide ${dirty ? '' : 'disabled'}`} disabled={!dirty}>Salvar</button>
      </div>
    </div>
  );
}

Object.assign(window, {
  InsightsPage, InteligenciaPage, AlertasPage, FunilPage, PagtoPainelPage,
  CardapioPage, CentralMsgPage, CfgMsgPage, EditarPerfilPage,
});
