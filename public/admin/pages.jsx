/* global React, Ic, brl, brlShort, Delta */
const { useState: useStP } = React;

const MOCK_CLIENTS = [
  { name: 'Gabriel Machado',           email: 'gabriel.machado.carvalho@gmail.com', phone: '(21) 98072-5247', since: '3 dias',  last: '-',       orders: 0 },
  { name: 'Janete José',               email: 'janetejossilva@gmail.com',           phone: '(21) 98016-2578', since: '7 dias',  last: '7 dias',  orders: 1 },
  { name: 'Julia Correa',              email: 'juliafruiz@hotmail.com',             phone: '(21) 96946-0158', since: '12 dias', last: '7 dias',  orders: 2 },
  { name: 'Marcos',                    email: '21987058131@manual.tocha',           phone: '(21) 98705-8131', since: '10 dias', last: '-',       orders: 0 },
  { name: 'Marcos Felipe da Silva Barros', email: 'barros.marcosf@gmail.com',       phone: '(21) 96627-8965', since: '11 dias', last: '0 dia',   orders: 2, priority: true },
  { name: 'StabTest',                  email: 'stab@test.com',                      phone: '(21) 90000-0001', since: '8 dias',  last: '-',       orders: 0 },
  { name: 'Tamiris Barros',            email: 'tamirisbarros@gmail.com',            phone: '(21) 98600-1350', since: '12 dias', last: '12 dias', orders: 1 },
  { name: 'Teste Automatizado',        email: 'teste@exemplo.com',                  phone: '(21) 99999-9999', since: '11 dias', last: '-',       orders: 0 },
  { name: 'Teste CID',                 email: 'testecid@teste.com',                 phone: '(21) 99999-0001', since: '9 dias',  last: '-',       orders: 0 },
  { name: 'Teste Deploy',              email: 'teste@teste.com',                    phone: '(21) 99999-9999', since: '12 dias', last: '-',       orders: 0 },
  { name: 'Teste DevOps',              email: 'teste@example.com',                  phone: '(21) 99999-9999', since: '11 dias', last: '-',       orders: 0 },
];

const MOCK_ORDERS = [
  { id: '#29B47', client: 'Marcos Felipe da Silva Barros', phone: '21966278965', type: 'Entrega', ident: '68797474', payment: 'ONLINE', status: 'paid',  items: 1, date: '11/05/2026' },
  { id: '#560D7', client: 'Marcos Felipe da Silva Barros', phone: '21966278965', type: 'Entrega', ident: '24995896', payment: 'ONLINE', status: 'paid',  items: 1, date: '06/05/2026' },
  { id: '#961ED', client: 'Julia Correa',                  phone: '(21) 96946-0158', type: 'Entrega', ident: '82920092', payment: 'ONLINE', status: 'paid', items: 1, date: '03/05/2026' },
  { id: '#C4C69', client: 'Janete José',                   phone: '(21) 98016-2578', type: 'Entrega', ident: '42895904', payment: 'ONLINE', status: 'paid', items: 1, date: '03/05/2026' },
  { id: '#1E31D', client: 'Tamiris Barros',                phone: '(21) 98600-1350', type: 'Entrega', ident: '2dngxFZ3', payment: 'ONLINE', status: 'paid', items: 1, date: '28/04/2026' },
  { id: '#16145', client: 'Julia Correa',                  phone: '(21) 96946-0158', type: 'Entrega', ident: 'AVKQma7O', payment: 'ONLINE', status: 'paid', items: 1, date: '28/04/2026' },
];

function PageHead({ title, badge, subtitle, right }) {
  return (
    <div className="page-head">
      <div>
        <div className="sub" style={{ marginBottom: 6 }}>Admin</div>
        <h1>
          {title}
          {badge && <span className="page-badge">{badge}</span>}
        </h1>
        <div className="sub">{subtitle}</div>
      </div>
      {right}
    </div>
  );
}

/* ========== CLIENTES ========== */
function ClientesPage() {
  const [open, setOpen] = useStP(null);
  return (
    <div className="page">
      <PageHead title="Clientes" subtitle={`${MOCK_CLIENTS.length} clientes cadastrados`}/>
      <div className="card">
        <div style={{ display: 'flex', gap: 12, padding: '0 0 14px', alignItems: 'center', borderBottom: '1px solid var(--line)', marginBottom: 4 }}>
          <div className="search-input">
            <Ic.search/>
            <input placeholder="Busque por nome ou telefone…"/>
          </div>
          <div className="tb-spacer"/>
          <span className="meta">Filtrar:</span>
          <select className="select-mini"><option>Todos os clientes</option><option>Recorrentes</option><option>Ocasionais</option></select>
          <select className="select-mini"><option>Todas as prioridades</option><option>Alta</option><option>Média</option></select>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Cliente há</th>
              <th>Último pedido</th>
              <th style={{ textAlign: 'right' }}>Pedidos</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CLIENTS.map((c, i) => (
              <tr key={i} onClick={() => setOpen(c)} style={{ cursor: 'pointer' }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="sb-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                      {c.name.split(' ').map(s => s[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <div style={{ color: 'var(--ink)', fontWeight: 500 }}>{c.name} {c.priority && <span className="tag gold" style={{ marginLeft: 6 }}>Prioridade</span>}</div>
                      <small style={{ color: 'var(--ink-4)', fontSize: 11 }}>{c.email}</small>
                    </div>
                  </div>
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{c.phone}</td>
                <td style={{ color: 'var(--ink-3)' }}>{c.since}</td>
                <td style={{ color: c.last === '-' ? 'var(--ink-4)' : 'var(--ink-2)' }}>{c.last}</td>
                <td className="num">{c.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && <ClienteModal client={open} onClose={() => setOpen(null)}/>}
    </div>
  );
}

function ClienteModal({ client, onClose }) {
  const orders = MOCK_ORDERS.filter(o => o.client === client.name);
  const total = orders.length;
  const invested = orders.length * 38;
  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 22 }}>
          <div className="sb-avatar" style={{ width: 52, height: 52, fontSize: 17 }}>
            {client.name.split(' ').map(s => s[0]).slice(0, 2).join('')}
          </div>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--display)', fontWeight: 400, fontSize: 24, color: 'var(--ink)' }}>{client.name}</h2>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{client.phone} · {client.email}</div>
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
          <div className="mini-card">
            <small>Total de pedidos</small>
            <b>{total || client.orders}</b>
          </div>
          <div className="mini-card hl">
            <small>Total investido</small>
            <b>{brl(invested || 154)}</b>
          </div>
        </div>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-4)', marginBottom: 10 }}>Histórico cronológico</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
          {(orders.length ? orders : [{ id: '#A2C47', status: 'failed', items: 6, date: '06/05/2026' }, { id: '#CBDC5', status: 'failed', items: 6, date: '06/05/2026' }]).map((o, i) => (
            <div key={i} className="order-row-mini">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <b>Pedido {o.id}</b>
                  <span className={`tag ${o.status === 'paid' ? 'up' : 'down'}`}>{o.status === 'paid' ? 'PAID' : 'PAYMENT_FAILED'}</span>
                </div>
                <small style={{ color: 'var(--ink-4)', fontSize: 11 }}>{o.items}x Item · {o.date}</small>
              </div>
              <div className="num" style={{ color: 'var(--ink)', fontWeight: 500 }}>R$ {(o.status === 'paid' ? 1 : 38).toFixed(2).replace('.', ',')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========== HISTÓRICO ========== */
function HistoricoPage() {
  const [open, setOpen] = useStP(null);
  return (
    <div className="page">
      <PageHead title="Histórico de Pedidos" subtitle="Relatório consolidado de todas as transações da unidade."/>
      <div className="grid kpi-row">
        <div className="card kpi"><div className="kpi-label">Faturamento</div><div className="kpi-value"><span className="unit">R$</span>134,00</div></div>
        <div className="card kpi"><div className="kpi-label">Lucro</div><div className="kpi-value"><span className="unit">R$</span>80,40</div></div>
        <div className="card kpi"><div className="kpi-label">Nº pedidos</div><div className="kpi-value">6</div></div>
        <div className="card kpi"><div className="kpi-label">Ticket médio</div><div className="kpi-value"><span className="unit">R$</span>22,33</div></div>
      </div>

      <div className="card mt">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          <label className="lbl-inline">De <input type="date" className="date-input"/></label>
          <label className="lbl-inline">Até <input type="date" className="date-input"/></label>
          <a className="link-muted">Exibir pedidos recusados</a>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Identificador</th>
              <th>Pagamento</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Itens</th>
              <th>Data</th>
              <th>Agendamento</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ORDERS.map((o, i) => (
              <tr key={i} onClick={() => setOpen(o)} style={{ cursor: 'pointer' }}>
                <td><a className="link-id">{o.id}</a></td>
                <td>
                  <div style={{ color: 'var(--ink)' }}>{o.client}</div>
                  <small style={{ color: 'var(--ink-4)', fontSize: 11 }}>{o.phone}</small>
                </td>
                <td>{o.type}</td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>{o.ident}</td>
                <td><span className="tag">{o.payment}</span></td>
                <td><span className="tag up">PAID</span></td>
                <td className="num">{o.items}</td>
                <td style={{ color: 'var(--ink-3)' }}>{o.date}</td>
                <td style={{ color: 'var(--ink-4)' }}>—</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '10px 4px 0', color: 'var(--ink-4)', fontSize: 11 }}>Exibindo 6 de 6 pedidos</div>
      </div>

      {open && <OrderModal order={open} variant="history" onClose={() => setOpen(null)}/>}
    </div>
  );
}

function OrderModal({ order, variant = 'history', onClose }) {
  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--display)', fontWeight: 400, fontSize: 26, color: 'var(--ink)' }}>{order.id}</h2>
          <span className="tag up" style={{ padding: '5px 12px', fontSize: 11 }}>{variant === 'fila' ? 'PAGO' : 'PAID'}</span>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div>
            <small className="kv-l">Cliente</small>
            <b className="kv-v">{order.client}</b>
            <a className="link-id" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>{order.phone}</a>
          </div>
          <div>
            <small className="kv-l">Pagamento</small>
            <b className="kv-v">CARTÃO</b>
            <small style={{ color: 'var(--ink-4)', fontSize: 11, display: 'block', marginTop: 2 }}>Finalizado via Stripe</small>
          </div>
          <div>
            <small className="kv-l">Tipo de entrega</small>
            <b className="kv-v">Retirada na fornada 16/05</b>
          </div>
          <div>
            <small className="kv-l">Data e hora</small>
            <b className="kv-v" style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>11/05/2026, 10:57:27</b>
          </div>
        </div>
        <div className="order-line-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'var(--gold)', fontWeight: 500 }}>1x</span>
            <span>Sourdough Tradicional</span>
          </div>
          <span className="num" style={{ color: 'var(--ink)' }}>R$ 1,00</span>
        </div>
        <div className="order-total">
          <span style={{ fontFamily: 'var(--display)', fontSize: 22 }}>Total</span>
          <b style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 500 }}>R$ 1,00</b>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="btn-wpp"><Ic.chat/> WhatsApp</button>
          {variant === 'fila'
            ? <button className="btn-primary">Entrar em preparo</button>
            : <button className="btn-ghost" onClick={onClose}>Fechar histórico</button>}
        </div>
        {variant === 'fila' && <a className="link-muted" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 12 }}>Voltar para a Fila</a>}
      </div>
    </div>
  );
}

/* ========== FILA DE PEDIDOS ========== */
function FilaPage() {
  const [tab, setTab] = useStP('aceitos');
  const [open, setOpen] = useStP(null);
  const tabs = [['aceitos','Aceitos',1],['preparo','Em Preparo',0],['pronto','Pronto p/ Retirada',0],['concluidos','Concluídos',5],['cancelados','Cancelados',0]];

  return (
    <div className="page">
      <PageHead title="Fila de Produção" badge="FORNADA 16/05/2026" subtitle="Gerencie os pedidos confirmados para a produção deste ciclo."/>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div className="tabs">
          {tabs.map(([k, l, count]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
              {l} {count > 0 && <span className="tab-count">{count}</span>}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="select-mini"><option>Ações em lote…</option></select>
          <button className="btn-primary" style={{ padding: '6px 14px' }}>Aplicar</button>
        </div>
      </div>

      {tab === 'aceitos' && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          <div className="order-card" onClick={() => setOpen(MOCK_ORDERS[0])}>
            <div className="order-card-strip"/>
            <div className="order-card-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" onClick={e => e.stopPropagation()}/>
                <span className="tag">#29B47</span>
              </div>
              <span className="tag up">Aceitos</span>
            </div>
            <div className="order-card-body">
              <b>Marcos Felipe da Silv…</b>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
                <span>10:57</span>
                <span>11/05/2026</span>
              </div>
            </div>
            <div className="order-card-foot">
              <div>
                <small style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-4)' }}>Total gasto</small>
                <b style={{ display: 'block', color: 'var(--gold)', fontWeight: 500, fontSize: 16 }}>R$ 1,00</b>
              </div>
              <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={e => { e.stopPropagation(); }}>Preparar</button>
            </div>
          </div>
        </div>
      )}

      {tab !== 'aceitos' && (
        <div className="empty-state">
          <Ic.list/>
          <div>Nenhum pedido nesta fase.</div>
        </div>
      )}

      {open && <OrderModal order={open} variant="fila" onClose={() => setOpen(null)}/>}
    </div>
  );
}

/* ========== PRÉ-VENDA ========== */
function PrevendaPage() {
  return (
    <div className="page">
      <PageHead title="Pré-venda" badge="PRÓXIMA FORNADA" subtitle="Fila de pedidos agendados para a fornada de 23/05/2026."/>
      <div className="grid kpi-row">
        <div className="card kpi"><div className="kpi-label">Total pedidos</div><div className="kpi-value">0</div></div>
        <div className="card kpi"><div className="kpi-label">Total de itens</div><div className="kpi-value">0</div></div>
        <div className="card kpi"><div className="kpi-label">Faturamento projetado</div><div className="kpi-value"><span className="unit">R$</span>0,00</div></div>
        <div className="card kpi"><div className="kpi-label">Data produção</div><div className="kpi-value" style={{ fontSize: 22, fontFamily: 'var(--mono)' }}>23/05/2026</div></div>
      </div>

      <div className="grid row-2 mt">
        <div className="card">
          <div className="card-head"><h3><Ic.list/>Lista de encomendas</h3></div>
          <div className="empty-state" style={{ height: 240 }}>
            <Ic.cart/>
            <div>Nenhum pedido de pré-venda encontrado.</div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3><Ic.bread/>Resumo de produção</h3></div>
          <div className="empty-state" style={{ height: 240 }}>
            <Ic.flame/>
            <div>Nenhum item para produzir.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========== RESUMO DE PEDIDOS ========== */
function ResumoPage() {
  return (
    <div className="page">
      <PageHead title="Resumo de Produção" subtitle={<span><span className="dot-up"/> Consolidado operacional em tempo real por ciclo de fornada</span>}/>
      <div className="grid row-half">
        <div className="card">
          <div className="card-head">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="hot-dot"/>
              Produzir hoje
              <span className="meta" style={{ marginLeft: 4 }}>Fornada 16/05</span>
            </h3>
            <div style={{ textAlign: 'right' }}>
              <b style={{ fontSize: 26, fontWeight: 500, color: 'var(--ink)' }}>6</b>
              <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-4)' }}>itens totais</div>
            </div>
          </div>
          <div className="prod-row"><span>Sourdough Tradicional (São João)</span><b>5</b></div>
          <div className="prod-row"><span>Focaccia de Damasco & Gorgonzola</span><b>1</b></div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="cold-dot"/>
              Próxima fornada
              <span className="meta" style={{ marginLeft: 4 }}>Fila acumulada · 23/05</span>
            </h3>
          </div>
          <div className="empty-state" style={{ height: 160 }}>
            <Ic.clock/>
            <div>Aguardando os primeiros pedidos do próximo ciclo.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ClientesPage  = ClientesPage;
window.HistoricoPage = HistoricoPage;
window.FilaPage      = FilaPage;
window.PrevendaPage  = PrevendaPage;
window.ResumoPage    = ResumoPage;
