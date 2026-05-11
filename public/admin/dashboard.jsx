/* global React, Ic, KPI, AreaChart, brl, brlShort */
const { useState: useStD } = React;

function Dashboard() {
  const D = window.DASH_DATA;
  const [period, setPeriod] = useStD('mes');

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

      {/* Revenue chart — full width while donut is pending */}
      <div className="mt">
        <div className="card hoverable">
          <div className="card-head">
            <h3><Ic.chart/>Faturamento ao longo do tempo</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div className="legend">
                <span>
                  <i style={{ background: 'var(--gold)' }}/>
                  Este mês
                </span>
                <span style={{ opacity: 0.6 }}>
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
          </div>
          <AreaChart
            current={D.revenueSeries.current}
            previous={D.revenueSeries.previous}
          />
        </div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
