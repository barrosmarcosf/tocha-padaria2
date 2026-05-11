/* global React, Ic, KPI, AreaChart, Donut, brl, brlShort, Delta, SafeIcon */
const { useState: useStD, useEffect: useEfD } = React;

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
  const DAYS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const d = new Date(dateStr + 'T12:00:00');
  return `${DAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

const PERIOD_MAP   = { hoje: 'today', ontem: 'yesterday', '7d': '7d', mes: 'month', custom: 'custom' };
const PERIOD_LABEL = { hoje: 'Hoje', ontem: 'Ontem', '7d': 'Últimos 7 dias', mes: 'Este mês', custom: 'Personalizado' };
const EMPTY_SPARK  = Array(30).fill(0);

// ---------- client card modal ----------
function ClientCardModal({ client, onClose }) {
  const initial = client.name.split(' ').map(s => s[0]).slice(0, 1).join('');
  const recurrent = client.orders >= 2;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal client-card-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose}>×</button>
        <div className="cc-avatar"><span>{initial}</span></div>
        <h2 className="cc-name">{client.name}</h2>
        <div className="cc-phone">{client.whatsapp || '—'}</div>
        <span className={`cc-tag ${recurrent ? 'rec' : 'oc'}`}>{recurrent ? 'RECORRENTE' : 'OCASIONAL'}</span>
        <div className="cc-stats">
          <div><small>TOTAL GASTO</small><b>{brl(client.spent)}</b></div>
          <div><small>PEDIDOS</small><b>{client.orders}</b></div>
        </div>
        <div className="cc-score">
          <div><small>RECÊNCIA</small><b>{client.recency} atrás</b></div>
          <div className="rt"><small>SCORE DE RECORRÊNCIA</small><b className="cc-score-v">{client.score}/10</b></div>
        </div>
        <button className="cc-back" onClick={onClose}>Voltar ao Dashboard</button>
      </div>
    </div>
  );
}

// ---------- cumulative chart (local, sem dep. de dados externos) ----------
function CumulativeChart({ current, previous }) {
  if (!current || current.length < 2) return null;
  const w = 320, h = 140, padL = 8, padR = 8, padT = 12, padB = 18;
  const iw = w - padL - padR, ih = h - padT - padB;

  const cumA = []; let a = 0;
  current.forEach(d => { a += (d.value || 0); cumA.push(a); });
  const cumB = []; let b = 0;
  (previous || []).forEach(d => { b += (d.value || 0); cumB.push(b); });
  while (cumB.length < cumA.length) cumB.push(cumB[cumB.length - 1] || 0);

  const max = Math.max(cumA.at(-1) || 0, cumB.at(-1) || 0, 1) * 1.05;
  const n   = cumA.length;
  const xp  = (i) => padL + (i / Math.max(n - 1, 1)) * iw;
  const yp  = (v) => padT + ih - ((v || 0) / max) * ih;

  const smooth = (arr) => arr.map((v, i) => {
    if (i === 0) return `M ${xp(i).toFixed(1)} ${yp(v).toFixed(1)}`;
    const cpx = ((xp(i - 1) + xp(i)) / 2).toFixed(1);
    return `C ${cpx} ${yp(arr[i - 1]).toFixed(1)} ${cpx} ${yp(v).toFixed(1)} ${xp(i).toFixed(1)} ${yp(v).toFixed(1)}`;
  }).join(' ');

  const pathA = smooth(cumA);
  const pathB = smooth(cumB);
  const area  = `${pathA} L ${xp(n - 1).toFixed(1)} ${padT + ih} L ${padL} ${padT + ih} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 140, display: 'block' }}>
      <defs>
        <linearGradient id="cumAreaGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.20"/>
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#cumAreaGrad)"/>
      <path d={pathB} fill="none" stroke="var(--ink-4)" strokeWidth="1.2" strokeDasharray="3 4" opacity="0.55"/>
      <path d={pathA} fill="none" stroke="var(--gold)" strokeWidth="4" strokeLinecap="round" opacity="0.10"/>
      <path d={pathA} fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

// ---------- main dashboard ----------
function Dashboard() {
  const [period,         setPeriod]         = useStD('mes');
  const [openClient,     setOpenClient]      = useStD(null);
  const [stats,          setStats]           = useStD(null);
  const [analytics,      setAnalytics]       = useStD(null);
  const [customers,      setCustomers]       = useStD(null);
  const [config,         setConfig]          = useStD(null);
  const [health,         setHealth]          = useStD(null);
  const [loading,        setLoading]         = useStD(true);

  const today     = new Date();
  const dateLabel = today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Fetch period-dependent data
  useEfD(() => {
    let mounted = true;
    const p = PERIOD_MAP[period] || 'month';
    setLoading(true);
    Promise.all([
      window.apiGet(`/api/admin/stats?period=${p}`),
      window.apiGet(`/api/admin/detailed-analytics?period=${p}`),
    ]).then(([s, a]) => {
      if (!mounted) return;
      setStats(s);
      setAnalytics(a);
      setLoading(false);
    }).catch(e => {
      if (!mounted) return;
      console.error('[Dashboard] stats/analytics error:', e.message);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [period]);

  // Fetch once: customers, config, payments health
  useEfD(() => {
    let mounted = true;
    window.apiGet('/api/admin/customers')
      .then(d => { if (mounted) setCustomers(d); }).catch(e => console.warn('[Dashboard] customers:', e.message));
    window.apiGet('/api/admin/config')
      .then(d => { if (mounted) setConfig(d); }).catch(e => console.warn('[Dashboard] config:', e.message));
    window.apiGet('/api/admin/payments-health')
      .then(d => { if (mounted) setHealth(d); }).catch(e => console.warn('[Dashboard] health:', e.message));
    return () => { mounted = false; };
  }, []);

  // ---------- derived: KPIs ----------
  const K = stats ? {
    faturamento: { value: stats.faturamento,  prev: prevFromPct(stats.faturamento,  stats.variacao?.faturamento),  spark: (stats.serieTemporal || []).map(s => s.faturamento) },
    pedidos:     { value: stats.pedidos,       prev: prevFromPct(stats.pedidos,       stats.variacao?.pedidos),       spark: (stats.serieTemporal || []).map(s => s.pedidos) },
    ticket:      { value: stats.ticketMedio,   prev: prevFromPct(stats.ticketMedio,   stats.variacao?.ticketMedio),   spark: (stats.serieTemporal || []).map(s => s.ticketMedio) },
    lucro:       { value: stats.lucro,         prev: prevFromPct(stats.lucro,         stats.variacao?.lucro),         spark: (stats.serieTemporal || []).map(s => s.lucro) },
  } : {
    faturamento: { value: 0, prev: 0, spark: EMPTY_SPARK },
    pedidos:     { value: 0, prev: 0, spark: EMPTY_SPARK },
    ticket:      { value: 0, prev: 0, spark: EMPTY_SPARK },
    lucro:       { value: 0, prev: 0, spark: EMPTY_SPARK },
  };

  // ---------- derived: revenue series ----------
  const serie = stats ? {
    current:  (stats.serieTemporal || []).map(s => ({ date: s.data, label: s.data, value: s.faturamento })),
    previous: (stats.serieAnterior || []).map(s => ({ date: s.data, label: s.data, value: s.faturamento })),
  } : {
    current:  EMPTY_SPARK.map((_, i) => ({ label: String(i + 1), value: 0 })),
    previous: EMPTY_SPARK.map((_, i) => ({ label: String(i + 1), value: 0 })),
  };

  // ---------- derived: payments donut ----------
  const rawPmt = analytics?.paymentBreakdown;
  const payments = rawPmt ? [
    { label: 'Pix',               value: rawPmt.pix?.revenue    || 0, count: rawPmt.pix?.count    || 0, color: 'var(--c1)' },
    { label: 'Cartão de crédito', value: rawPmt.credito?.revenue || 0, count: rawPmt.credito?.count || 0, color: 'var(--c2)' },
    { label: 'Cartão de débito',  value: rawPmt.debito?.revenue  || 0, count: rawPmt.debito?.count  || 0, color: 'var(--c3)' },
    { label: 'Outros',            value: rawPmt.outros?.revenue  || 0, count: rawPmt.outros?.count  || 0, color: 'var(--c4)' },
  ].filter(p => p.value > 0) : null;
  const donutData = payments && payments.length > 0 ? payments : [{ label: 'Sem dados', value: 1, count: 0, color: 'var(--line-2)' }];

  // ---------- derived: top products ----------
  const topProducts = analytics?.itemPerformance?.products?.slice(0, 5).map((p, i) => ({
    rank: i + 1,
    name: p.name,
    cat:  p.category || 'Padaria',
    qty:  p.qty || 0,
    gross: p.revenue || 0,
  })) || [];

  // ---------- derived: recurrence ranking ----------
  const recList = customers
    ? customers
        .filter(c => (c.crm_count || 0) >= 2)
        .sort((a, b) => (b.crm_count || 0) - (a.crm_count || 0))
        .slice(0, 5)
        .map(c => ({
          id:      c.id,
          name:    c.name,
          whatsapp: c.whatsapp,
          status:  'Recorrente',
          orders:  c.crm_count || 0,
          spent:   c.crm_total || 0,
          score:   Math.min(10, Math.round((c.crm_count || 0) * 1.5)),
          recency: formatRecency(c.crm_last),
        }))
    : [];

  // ---------- derived: clientes em pausa ----------
  const pausaData = (() => {
    if (!customers) return { healthy: true, activeRecurrent: 0, avgTicket: 0, repurchaseInterval: 7, repurchaseStatus: '—', paused: 0 };
    const recurrent = customers.filter(c => (c.crm_count || 0) >= 2);
    const now = Date.now();
    const active = recurrent.filter(c => c.crm_last && (now - new Date(c.crm_last).getTime()) / 86400000 <= 15);
    const paused = recurrent.filter(c => !c.crm_last || (now - new Date(c.crm_last).getTime()) / 86400000 > 15);
    const avgTicket = recurrent.length > 0
      ? recurrent.reduce((sum, c) => sum + ((c.crm_count > 0) ? (c.crm_total / c.crm_count) : 0), 0) / recurrent.length
      : 0;
    return {
      healthy: paused.length === 0,
      paused:  paused.length,
      activeRecurrent: active.length,
      avgTicket,
      repurchaseInterval: 7,
      repurchaseStatus: active.length >= 3 ? 'ótimo' : active.length >= 1 ? 'bom' : 'aguardando',
    };
  })();

  // ---------- derived: fornada ----------
  const openingHours  = config?.siteContent?.opening_hours || {};
  const currentBatch  = openingHours.currentBatch || {};
  const bakeDateStr   = currentBatch.bakeDate || '';
  const fornadaWhen   = formatBakeDate(bakeDateStr);
  const fornadaItens  = analytics?.itemPerformance?.products?.reduce((s, p) => s + (p.qtyAtual || 0), 0) || 0;
  const fornadaPedidos    = stats?.pedidos || 0;
  const fornadaFaturamento = stats?.faturamento || 0;
  const fornadaCapacidade  = fornadaItens > 0 ? Math.min(1, fornadaItens / 200) : 0;

  // ---------- derived: alerts ----------
  const dynamicAlerts = [];
  if (health) {
    if (health.pending > 0)      dynamicAlerts.push({ kind: 'info', title: `${health.pending} pedido${health.pending > 1 ? 's' : ''} aguardando`, body: 'Confirme com clientes para liberar a fila.', meta: 'agora' });
    if (health.failed > 0)       dynamicAlerts.push({ kind: 'warn', title: `${health.failed} pagamento${health.failed > 1 ? 's' : ''} falharam`, body: 'Verifique a fila de reprocessamento.', meta: 'agora' });
    if (health.stale_locks > 0)  dynamicAlerts.push({ kind: 'warn', title: `${health.stale_locks} lock${health.stale_locks > 1 ? 's' : ''} travado${health.stale_locks > 1 ? 's' : ''}`, body: 'Transações de processamento expiraram.', meta: 'agora' });
    if (health.fila_reprocessamento > 0) dynamicAlerts.push({ kind: 'info', title: `${health.fila_reprocessamento} item${health.fila_reprocessamento > 1 ? 's' : ''} na fila de reprocessamento`, body: 'Aguardando retry automático.', meta: 'agora' });
  }
  const alerts = dynamicAlerts.length > 0 ? dynamicAlerts : [
    { kind: 'ok', title: 'Sistema operando normalmente', body: 'Nenhum alerta crítico no momento.', meta: 'agora' },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="sub" style={{ marginBottom: 6 }}>{dateLabel} · {PERIOD_LABEL[period]}</div>
          <h1>Boas vindas, TOCHA PADARIA</h1>
          <div className="sub">
            {bakeDateStr
              ? <>Próxima fornada: <b>{fornadaWhen}</b> · <b>{fornadaPedidos} pedidos</b> confirmados</>
              : loading ? 'Carregando dados...' : 'Configure os ciclos de venda em Horário.'}
          </div>
        </div>
        <div className="range">
          {[['hoje','Hoje'],['ontem','Ontem'],['7d','7 dias'],['mes','Este mês'],['custom','Personalizar']].map(([k, l]) => (
            <button key={k} className={period === k ? 'on' : ''} onClick={() => setPeriod(k)}>{l}</button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid kpi-row">
        <KPI label="Faturamento" icon={Ic.chart}
          value={K.faturamento.value} prev={K.faturamento.prev}
          unit="R$" decimals={2} spark={K.faturamento.spark} color="var(--c1)"/>
        <KPI label="Pedidos" icon={Ic.cart}
          value={K.pedidos.value} prev={K.pedidos.prev}
          spark={K.pedidos.spark} color="var(--c3)"/>
        <KPI label="Ticket médio" icon={Ic.card}
          value={K.ticket.value} prev={K.ticket.prev}
          unit="R$" decimals={2} spark={K.ticket.spark} color="var(--c4)"/>
        <KPI label="Lucro" icon={Ic.bulb}
          value={K.lucro.value} prev={K.lucro.prev}
          unit="R$" decimals={2} spark={K.lucro.spark} color="var(--c2)"/>
      </div>

      {/* Faturamento + Pagamentos */}
      <div className="grid row-2 mt">
        <div className="card hoverable">
          <div className="card-head">
            <h3><Ic.chart/>Faturamento ao longo do tempo</h3>
            <div className="legend">
              <span><i style={{ background: 'var(--gold)' }}/>Este período</span>
              <span style={{ color: 'var(--ink-4)' }}>
                <i style={{ background: 'none', width: 16, height: 0, borderTop: '2px dashed var(--line-3)', borderRadius: 0, display: 'inline-block', verticalAlign: 'middle' }}/>
                Período anterior
              </span>
            </div>
          </div>
          {loading
            ? <div className="empty-state" style={{ height: 240 }}><Ic.chart/><div>Carregando...</div></div>
            : <AreaChart current={serie.current} previous={serie.previous}/>}
        </div>
        <div className="card hoverable">
          <div className="card-head">
            <h3><Ic.card/>Formas de pagamento</h3>
            <span className="meta">{PERIOD_LABEL[period]}</span>
          </div>
          {loading
            ? <div className="empty-state" style={{ height: 148 }}><Ic.card/><div>Carregando...</div></div>
            : <Donut data={donutData}/>}
        </div>
      </div>

      {/* Top produtos + Recorrência */}
      <div className="grid row-half mt">
        <div className="card hoverable">
          <div className="card-head">
            <h3><Ic.bread/>Top produtos vendidos</h3>
            <span className="meta">{PERIOD_LABEL[period]} · {topProducts.length} itens</span>
          </div>
          {loading ? (
            <div className="empty-state"><Ic.bread/><div>Carregando...</div></div>
          ) : topProducts.length === 0 ? (
            <div className="empty-state"><Ic.bread/><div>Nenhum produto vendido neste período.</div></div>
          ) : (() => {
            const max = Math.max(...topProducts.map(p => p.gross), 1);
            return topProducts.map((p, i) => (
              <div className="bar-row" key={p.rank}>
                <span className="rk">#{p.rank}</span>
                <div className="meta-row">
                  <span className="nm">{p.name}</span>
                  <span className="ct">{p.cat} · {p.qty} un.</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(p.gross / max) * 100}%`, animationDelay: `${i * 60}ms` }}/>
                  </div>
                </div>
                <span className="val">{brlShort(p.gross)}</span>
              </div>
            ));
          })()}
        </div>

        <div className="card hoverable">
          <div className="card-head">
            <h3><Ic.users/>Ranking de recorrência</h3>
            <span className="meta">Clientes mais leais</span>
          </div>
          {recList.length === 0 ? (
            <div className="empty-state"><Ic.users/><div>{customers ? 'Nenhum cliente recorrente encontrado.' : 'Carregando...'}</div></div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th style={{ textAlign: 'right' }}>Pedidos</th>
                  <th style={{ textAlign: 'right' }}>Gasto</th>
                  <th style={{ textAlign: 'right' }}>Score</th>
                  <th style={{ textAlign: 'right' }}>Recência</th>
                </tr>
              </thead>
              <tbody>
                {recList.map((c, i) => (
                  <tr key={c.id || i} className="row-clickable" onClick={() => setOpenClient(c)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="sb-avatar" style={{
                          width: 28, height: 28, fontSize: 10,
                          background: i === 0 ? 'linear-gradient(135deg, var(--gold), var(--gold-2))' : undefined,
                          color: i === 0 ? '#1a1408' : undefined,
                        }}>
                          {c.name.split(' ').map(s => s[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <div style={{ color: 'var(--ink)', fontWeight: 500 }} className="client-link">{c.name}</div>
                          <span className="tag gold">{c.status}</span>
                        </div>
                      </div>
                    </td>
                    <td className="num">{c.orders}</td>
                    <td className="num">{brlShort(c.spent)}</td>
                    <td className="num">
                      <span style={{ color: c.score >= 8 ? 'var(--gold)' : c.score >= 6 ? 'var(--ink)' : 'var(--ink-3)' }}>
                        {c.score}/10
                      </span>
                    </td>
                    <td className="num">{c.recency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Clientes em pausa + Faturamento Acumulado */}
      <div className="grid row-half mt">
        <div className="card pause-card hoverable">
          <div className="card-head">
            <h3><Ic.users/>Clientes em pausa</h3>
            <span className="meta">Recorrentes sem comprar há +15 dias</span>
          </div>
          {pausaData.healthy ? (
            <>
              <div className="health">
                <div className="pulse"/>
                <b>Base de clientes saudável</b>
                <small>Nenhum cliente recorrente em pausa</small>
              </div>
              <div className="pair">
                <div className="mini"><small>Clientes recorrentes ativos</small><b>{pausaData.activeRecurrent}</b></div>
                <div className="mini"><small>Ticket médio (fiel)</small><b>{brl(pausaData.avgTicket)}</b></div>
              </div>
              <div className="highlight">
                <small>Intervalo de recompra</small>
                <b>Média de {pausaData.repurchaseInterval} dias ({pausaData.repurchaseStatus})</b>
              </div>
            </>
          ) : (
            <>
              <div className="health">
                <div className="pulse" style={{ background: 'var(--down)' }}/>
                <b style={{ color: 'var(--down)' }}>{pausaData.paused} cliente{pausaData.paused > 1 ? 's' : ''} em pausa</b>
                <small>Recorrentes sem comprar há +15 dias</small>
              </div>
              <div className="pair">
                <div className="mini"><small>Clientes recorrentes ativos</small><b>{pausaData.activeRecurrent}</b></div>
                <div className="mini"><small>Ticket médio (fiel)</small><b>{brl(pausaData.avgTicket)}</b></div>
              </div>
            </>
          )}
        </div>

        <div className="card hoverable">
          <div className="card-head">
            <h3><Ic.chart/>Faturamento acumulado</h3>
            <span className="meta">{PERIOD_LABEL[period]}</span>
          </div>
          {loading
            ? <div className="empty-state" style={{ height: 140 }}><Ic.chart/><div>Carregando...</div></div>
            : <CumulativeChart current={serie.current} previous={serie.previous}/>}
          <div className="legend" style={{ marginTop: 8 }}>
            <span>
              <i style={{ background: 'var(--gold)' }}/>
              Este período{' '}
              <b style={{ color: 'var(--ink)', marginLeft: 4 }}>
                {brlShort(serie.current.reduce((s, d) => s + (d.value || 0), 0))}
              </b>
            </span>
            <span>
              <i style={{ background: 'var(--ink-4)' }}/>
              Período anterior{' '}
              <b style={{ color: 'var(--ink-2)', marginLeft: 4 }}>
                {brlShort(serie.previous.reduce((s, d) => s + (d.value || 0), 0))}
              </b>
            </span>
          </div>
        </div>
      </div>

      {/* Fornada + Alertas */}
      <div className="grid row-half mt">
        <div className="card fornada hoverable">
          <div className="fornada-head">
            <div>
              <div className="when">
                <Ic.flame style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}/>
                Próxima fornada
              </div>
              <h2>{fornadaWhen}</h2>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Janela de retirada: 9h – 14h</div>
            </div>
            <button className="icon-btn" title="Ver detalhes"><Ic.chev/></button>
          </div>
          <div className="fornada-stats">
            <div className="fornada-stat"><small>Pedidos</small><b>{fornadaPedidos}</b></div>
            <div className="fornada-stat"><small>Itens</small><b>{fornadaItens || fornadaPedidos}</b></div>
            <div className="fornada-stat"><small>Receita</small><b>{brlShort(fornadaFaturamento)}</b></div>
          </div>
          <div className="fornada-progress">
            <small>
              <span>Capacidade preenchida</span>
              <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{Math.round(fornadaCapacidade * 100)}%</span>
            </small>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.min(100, fornadaCapacidade * 100)}%` }}/>
            </div>
          </div>
        </div>

        <div className="card hoverable">
          <div className="card-head">
            <h3><Ic.bell/>Alertas</h3>
            <span className="meta">{alerts.filter(a => a.kind !== 'ok').length || 'Nenhum'} ativo{alerts.filter(a => a.kind !== 'ok').length !== 1 ? 's' : ''}</span>
          </div>
          <div className="alert-list">
            {alerts.map((a, i) => (
              <div className={`alert ${a.kind}`} key={i}>
                <span className="a-ic">
                  <SafeIcon icon={a.kind === 'info' ? Ic.info : a.kind === 'ok' ? Ic.shield : Ic.warn}/>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{a.title}</b>
                  <small>{a.body}</small>
                </div>
                <small style={{ flexShrink: 0, color: 'var(--ink-4)', fontSize: 10 }}>{a.meta}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      {openClient && <ClientCardModal client={openClient} onClose={() => setOpenClient(null)}/>}
    </div>
  );
}

window.Dashboard = Dashboard;
