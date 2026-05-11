/* global React, Ic, KPI, AreaChart, Donut, brl, brlShort */
const { useState: useStD } = React;

function ClientCardModal({ client, onClose }) {
  const initial = client.name.split(' ').map(s => s[0]).slice(0, 1).join('');
  const recurrent = client.status === 'Recorrente';
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal client-card-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose}>×</button>
        <div className="cc-avatar"><span>{initial}</span></div>
        <h2 className="cc-name">{client.name}</h2>
        <div className="cc-phone">(21) 9{Math.floor(1000 + Math.random()*8999)}-{Math.floor(1000 + Math.random()*8999)}</div>
        <span className={`cc-tag ${recurrent ? 'rec' : 'oc'}`}>{recurrent ? 'RECORRENTE' : 'OCASIONAL'}</span>
        <div className="cc-stats">
          <div><small>TOTAL GASTO</small><b>{brl(client.spent)}</b></div>
          <div><small>PEDIDOS</small><b>{client.orders}</b></div>
        </div>
        <div className="cc-score">
          <div><small>RECÊNCIA</small><b>{client.recency} atrás</b></div>
          <div className="rt"><small>SCORE DE RECORRÊNCIA</small><b className="cc-score-v">{client.score}/10</b></div>
        </div>
        <button className="cc-msg">Enviar Mensagem</button>
        <button className="cc-back" onClick={onClose}>Voltar ao Dashboard</button>
      </div>
    </div>
  );
}

function Dashboard() {
  const D = window.DASH_DATA;
  const [period, setPeriod] = useStD('mes');
  const [openClient, setOpenClient] = useStD(null);

  const today = D.today || new Date();
  const dateLabel = today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="sub" style={{ marginBottom: 6 }}>{dateLabel} · {D.period}</div>
          <h1>Boas vindas, <em>Tocha Padaria</em></h1>
          <div className="sub">
            Próxima fornada em <b>5 dias</b> · <b>{D.fornada.pedidos} pedidos</b> confirmados
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
          value={D.kpis.faturamento.value} prev={D.kpis.faturamento.prev}
          unit="R$" decimals={2} spark={D.kpis.faturamento.spark} color="var(--c1)"/>
        <KPI label="Pedidos" icon={Ic.cart}
          value={D.kpis.pedidos.value} prev={D.kpis.pedidos.prev}
          spark={D.kpis.pedidos.spark} color="var(--c3)"/>
        <KPI label="Ticket médio" icon={Ic.card}
          value={D.kpis.ticket.value} prev={D.kpis.ticket.prev}
          unit="R$" decimals={2} spark={D.kpis.ticket.spark} color="var(--c4)"/>
        <KPI label="Lucro" icon={Ic.bulb}
          value={D.kpis.lucro.value} prev={D.kpis.lucro.prev}
          unit="R$" decimals={2} spark={D.kpis.lucro.spark} color="var(--c2)"/>
      </div>

      {/* Faturamento + Pagamentos */}
      <div className="grid row-2 mt">
        <div className="card hoverable">
          <div className="card-head">
            <h3><Ic.chart/>Faturamento ao longo do tempo</h3>
            <div className="legend">
              <span>
                <i style={{ background: 'var(--gold)' }}/>
                Este mês
              </span>
              <span style={{ color: 'var(--ink-4)' }}>
                <i style={{
                  background: 'none',
                  width: 16,
                  height: 0,
                  borderTop: '2px dashed var(--line-3)',
                  borderRadius: 0,
                  display: 'inline-block',
                  verticalAlign: 'middle',
                }}/>
                Mês anterior
              </span>
            </div>
          </div>
          <AreaChart
            current={D.revenueSeries.current}
            previous={D.revenueSeries.previous}
          />
        </div>
        <div className="card hoverable">
          <div className="card-head">
            <h3><Ic.card/>Formas de pagamento</h3>
            <span className="meta">30 dias</span>
          </div>
          <Donut data={D.payments}/>
        </div>
      </div>

      {/* Top produtos + Recorrência */}
      <div className="grid row-half mt">
        <div className="card hoverable">
          <div className="card-head">
            <h3><Ic.bread/>Top produtos vendidos</h3>
            <span className="meta">30 dias · {D.topProducts.length} itens</span>
          </div>
          {(() => {
            const max = Math.max(...D.topProducts.map(p => p.gross));
            return D.topProducts.map((p, i) => (
              <div className="bar-row" key={p.rank}>
                <span className="rk">#{p.rank}</span>
                <div className="meta-row">
                  <span className="nm">{p.name}</span>
                  <span className="ct">{p.cat} · {p.qty} un.</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{
                      width: `${(p.gross / max) * 100}%`,
                      animationDelay: `${i * 60}ms`,
                    }}/>
                  </div>
                </div>
                <span className="val">
                  {brlShort(p.gross)}
                  <small style={{ color: p.growth >= 0 ? 'var(--up)' : 'var(--down)' }}>
                    {p.growth >= 0 ? '↑' : '↓'} {Math.abs(p.growth)}%
                  </small>
                </span>
              </div>
            ));
          })()}
        </div>

        <div className="card hoverable">
          <div className="card-head">
            <h3><Ic.users/>Ranking de recorrência</h3>
            <span className="meta">Clientes mais leais</span>
          </div>
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
              {D.recurrence.map((c, i) => (
                <tr key={i} className="row-clickable" onClick={() => setOpenClient(c)}>
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
                        <span className={`tag ${c.status === 'Recorrente' ? 'gold' : ''}`}>{c.status}</span>
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
        </div>
      </div>

      {/* Clientes em pausa + Faturamento Acumulado */}
      <div className="grid row-half mt">

        {/* Clientes em pausa */}
        <div className="card pause-card hoverable">
          <div className="card-head">
            <h3><Ic.users/>Clientes em pausa</h3>
            <span className="meta">Recorrentes sem comprar há +15 dias</span>
          </div>

          {D.pausa.healthy ? (
            <>
              <div className="health">
                <div className="pulse"/>
                <b>Base de clientes saudável</b>
                <small>Nenhum cliente recorrente em pausa</small>
              </div>
              <div className="pair">
                <div className="mini">
                  <small>Clientes recorrentes ativos</small>
                  <b>{D.pausa.activeRecurrent}</b>
                </div>
                <div className="mini">
                  <small>Ticket médio (fiel)</small>
                  <b>{brl(D.pausa.avgTicket)}</b>
                </div>
              </div>
              <div className="highlight">
                <small>Intervalo de recompra</small>
                <b>
                  Média de {D.pausa.repurchaseInterval.toLocaleString('pt-BR')} dias
                  {' '}<em>({D.pausa.repurchaseStatus})</em>
                </b>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Ic.users/>
              <span>Nenhum cliente em pausa</span>
            </div>
          )}
        </div>

        {/* Faturamento Acumulado */}
        <div className="card hoverable">
          <div className="card-head">
            <h3><Ic.chart/>Faturamento acumulado</h3>
            <span className="meta">30 dias</span>
          </div>
          <CumulativeChart
            current={D.revenueSeries.current}
            previous={D.revenueSeries.previous}
          />
          <div className="legend" style={{ marginTop: 8 }}>
            <span>
              <i style={{ background: 'var(--gold)' }}/>
              Mês atual{' '}
              <b style={{ color: 'var(--ink)', marginLeft: 4 }}>
                {brlShort(D.revenueSeries.current.reduce((s, d) => s + d.value, 0))}
              </b>
            </span>
            <span>
              <i style={{ background: 'var(--ink-4)' }}/>
              Mês anterior{' '}
              <b style={{ color: 'var(--ink-2)', marginLeft: 4 }}>
                {brlShort(D.revenueSeries.previous.reduce((s, d) => s + d.value, 0))}
              </b>
            </span>
          </div>
        </div>

      </div>

      {/* Fornada + Alertas */}
      <div className="grid row-half mt">

        {/* Fornada */}
        <div className="card fornada hoverable">
          <div className="fornada-head">
            <div>
              <div className="when">
                <Ic.flame style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}/>
                Próxima fornada
              </div>
              <h2>{D.fornada.when}</h2>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                Janela de retirada: 9h – 14h
              </div>
            </div>
            <button className="icon-btn" title="Ver detalhes"><Ic.chev/></button>
          </div>
          <div className="fornada-stats">
            <div className="fornada-stat">
              <small>Pedidos</small>
              <b>{D.fornada.pedidos}</b>
            </div>
            <div className="fornada-stat">
              <small>Itens</small>
              <b>{D.fornada.itens}</b>
            </div>
            <div className="fornada-stat">
              <small>Receita</small>
              <b>{brlShort(D.fornada.faturamento)}</b>
            </div>
          </div>
          <div className="fornada-progress">
            <small>
              <span>Capacidade preenchida</span>
              <span style={{ color: 'var(--gold)', fontWeight: 500 }}>
                {Math.round(D.fornada.capacidade * 100)}%
              </span>
            </small>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${D.fornada.capacidade * 100}%` }}/>
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="card hoverable">
          <div className="card-head">
            <h3><Ic.bell/>Alertas</h3>
            <span className="meta">{D.alerts.length} novos</span>
          </div>
          <div className="alert-list">
            {D.alerts.map((a, i) => (
              <div className={`alert ${a.kind}`} key={i}>
                <span className="a-ic">
                  {a.kind === 'info' ? <Ic.info/> : <Ic.warn/>}
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

function CumulativeChart({ current, previous }) {
  const w = 320, h = 140, padL = 8, padR = 8, padT = 12, padB = 18;
  const iw = w - padL - padR, ih = h - padT - padB;

  const cumA = []; let a = 0;
  current.forEach(d => { a += d.value; cumA.push(a); });
  const cumB = []; let b = 0;
  previous.forEach(d => { b += d.value; cumB.push(b); });

  const max = Math.max(cumA.at(-1), cumB.at(-1)) * 1.05;
  const n = cumA.length;
  const xp = (i) => padL + (i / (n - 1)) * iw;
  const yp = (v) => padT + ih - (v / max) * ih;

  const smooth = (arr) => arr.map((v, i) => {
    if (i === 0) return `M ${xp(i).toFixed(1)} ${yp(v).toFixed(1)}`;
    const cpx = ((xp(i - 1) + xp(i)) / 2).toFixed(1);
    return `C ${cpx} ${yp(arr[i - 1]).toFixed(1)} ${cpx} ${yp(v).toFixed(1)} ${xp(i).toFixed(1)} ${yp(v).toFixed(1)}`;
  }).join(' ');

  const pathA = smooth(cumA);
  const pathB = smooth(cumB);
  const area = `${pathA} L ${xp(n - 1).toFixed(1)} ${padT + ih} L ${padL} ${padT + ih} Z`;

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
      {/* glow discreto: linha larga + opaca sobreposta pela linha precisa */}
      <path d={pathA} fill="none" stroke="var(--gold)" strokeWidth="4" strokeLinecap="round" opacity="0.10"/>
      <path d={pathA} fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

window.Dashboard = Dashboard;
