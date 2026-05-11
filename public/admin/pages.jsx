/* global React, Ic, brl, brlShort */
const { useState: usePgSt, useEffect: usePgEff } = React;

/* ─── HELPERS ────────────────────────────────────────────────────────────── */

const STATUS_MAP = {
  paid:        { label: 'Pago',       cls: 'gold' },
  pago:        { label: 'Pago',       cls: 'gold' },
  aceito:      { label: 'Aceito',     cls: 'gold' },
  preparo:     { label: 'Preparo',    cls: 'gold' },
  retirada:    { label: 'Retirada',   cls: 'gold' },
  concluido:   { label: 'Concluído',  cls: 'up'   },
  'concluído': { label: 'Concluído',  cls: 'up'   },
  finalizado:  { label: 'Finalizado', cls: 'up'   },
  entregue:    { label: 'Entregue',   cls: 'up'   },
  delivered:   { label: 'Entregue',   cls: 'up'   },
  pending:     { label: 'Pendente',   cls: ''     },
  cancelled:   { label: 'Cancelado',  cls: 'down' },
  cancelado:   { label: 'Cancelado',  cls: 'down' },
  rejected:    { label: 'Rejeitado',  cls: 'down' },
};

const statusInfo = (s) => STATUS_MAP[(s || '').toLowerCase().trim()] || { label: s || '—', cls: '' };

const pmLabel = (m) => {
  const ml = (m || '').toLowerCase();
  if (ml.includes('pix')) return 'Pix';
  if (ml.includes('cred') || ml.includes('card_credit')) return 'Crédito';
  if (ml.includes('deb') || ml.includes('card_debit')) return 'Débito';
  if (!m || m === 'outros') return 'Outros';
  return m;
};

const fmtTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const fmtDateLong = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const parseItems = (raw) => {
  try {
    let p = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (p && p.actual_items) return p.actual_items;
    return Array.isArray(p) ? p : [];
  } catch { return []; }
};

const itemsSummary = (raw) => {
  const items = parseItems(raw);
  if (!items.length) return '—';
  const first = items[0];
  const rest = items.length - 1;
  return `${first.qty || 1}× ${first.name}${rest > 0 ? ` +${rest}` : ''}`;
};

const shortId = (id) => String(id || '').slice(-5).toUpperCase();

const isDone   = (s) => ['concluido','concluído','finalizado','entregue','delivered'].includes((s||'').toLowerCase());
const isProg   = (s) => ['aceito','preparo','retirada'].includes((s||'').toLowerCase());
const isWait   = (s) => ['paid','pago'].includes((s||'').toLowerCase());
const isCanc   = (s) => ['cancelled','cancelado','rejected'].includes((s||'').toLowerCase());

/* ─── SHARED: ORDER DETAIL MODAL ─────────────────────────────────────────── */

function OrderModal({ order, onClose }) {
  const items = parseItems(order.items);
  const st = statusInfo(order.status);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose}>×</button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-4)', marginBottom: 8 }}>
            Pedido #{shortId(order.id)} · {fmtDateLong(order.created_at)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 22, margin: 0, color: 'var(--ink)' }}>
              {order.customer_name || 'Sem nome'}
            </h2>
            <span className={`tag${st.cls ? ' ' + st.cls : ''}`}>{st.label}</span>
          </div>
          {order.customer_whatsapp && (
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6, fontFamily: 'var(--mono)' }}>
              {order.customer_whatsapp}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {items.length > 0 ? items.map((item, i) => (
            <div className="order-line-item" key={i}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{item.name}</div>
                {item.optionals && item.optionals.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>
                    {item.optionals.map(op => op.name || op).join(', ')}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{brlShort((item.price || 0) * (item.qty || 1))}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{item.qty || 1}× {brlShort(item.price || 0)}</div>
              </div>
            </div>
          )) : (
            <div style={{ color: 'var(--ink-4)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
              Sem itens detalhados
            </div>
          )}
        </div>

        <div className="order-total">
          <span style={{ fontWeight: 500, color: 'var(--ink-2)' }}>Total do pedido</span>
          <span style={{ fontFamily: 'var(--display)', fontSize: 22, color: 'var(--ink)' }}>{brl(order.total_amount || 0)}</span>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <div className="mini-card" style={{ flex: 1 }}>
            <small>Forma de pagamento</small>
            <b style={{ fontSize: 15, display: 'block', marginTop: 4 }}>{pmLabel(order.payment_method)}</b>
          </div>
          {order.customer_whatsapp && (
            <a
              href={`https://wa.me/55${(order.customer_whatsapp || '').replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="btn-wpp"
              style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}
            >
              <Ic.msg style={{ width: 14, height: 14 }}/> WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── FILA DE PEDIDOS ────────────────────────────────────────────────────── */

function FilaDePedidos() {
  const [orders, setOrders] = usePgSt([]);
  const [loading, setLoading] = usePgSt(true);
  const [tab, setTab]         = usePgSt('todos');
  const [selected, setSelected] = usePgSt(null);

  const load = () => {
    setLoading(true);
    window.apiGet('/api/admin/pedidos')
      .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setOrders([]); setLoading(false); });
  };

  usePgEff(() => { load(); }, []);

  const counts = {
    total:     orders.length,
    aguardando: orders.filter(o => isWait(o.status)).length,
    preparo:    orders.filter(o => isProg(o.status)).length,
    concluidos: orders.filter(o => isDone(o.status)).length,
    cancelados: orders.filter(o => isCanc(o.status)).length,
  };

  const TABS = [
    ['todos',      'Todos',       counts.total],
    ['aguardando', 'Aguardando',  counts.aguardando],
    ['preparo',    'Em preparo',  counts.preparo],
    ['concluidos', 'Concluídos',  counts.concluidos],
    ['cancelados', 'Cancelados',  counts.cancelados],
  ];

  const visible = orders.filter(o => {
    if (tab === 'todos')      return true;
    if (tab === 'aguardando') return isWait(o.status);
    if (tab === 'preparo')    return isProg(o.status);
    if (tab === 'concluidos') return isDone(o.status);
    if (tab === 'cancelados') return isCanc(o.status);
    return true;
  });

  const receita = orders.filter(o => !isCanc(o.status)).reduce((s, o) => s + (o.total_amount || 0), 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="sub" style={{ marginBottom: 6 }}>Operação do dia · pedidos do ciclo atual</div>
          <h1>Fila de <em>Pedidos</em></h1>
        </div>
        <button className="icon-btn" title="Atualizar" onClick={load} style={{ width: 36, height: 36 }}>
          <Ic.spark/>
        </button>
      </div>

      {/* Mini cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        {[
          { label: 'Pedidos hoje',  value: counts.total,     mono: true },
          { label: 'Aguardando',    value: counts.aguardando, mono: true },
          { label: 'Em preparo',    value: counts.preparo,    mono: true },
          { label: 'Receita do dia',value: brlShort(receita), mono: false },
        ].map((c, i) => (
          <div className="mini-card" key={i} style={{ padding: '16px 18px' }}>
            <small>{c.label}</small>
            <b style={{ fontSize: 22, display: 'block', marginTop: 4, fontFamily: c.mono ? 'var(--display)' : undefined }}>{c.value}</b>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 14 }}>
          <div className="tabs">
            {TABS.map(([k, l, ct]) => (
              <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                {l}
                {ct > 0 && <span className="tab-count">{ct}</span>}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 11.5, color: 'var(--ink-4)', flexShrink: 0 }}>
            {visible.length} pedido{visible.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="empty-state"><Ic.spark/><span>Carregando pedidos...</span></div>
        ) : !visible.length ? (
          <div className="empty-state"><Ic.cart/><span>Nenhum pedido neste filtro</span></div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Pagamento</th>
                <th>Hora</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(o => {
                const st = statusInfo(o.status);
                return (
                  <tr key={o.id} className="row-clickable" onClick={() => setSelected(o)}>
                    <td>
                      <span className="link-id">#{shortId(o.id)}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{o.customer_name || '—'}</div>
                      {o.customer_whatsapp && (
                        <div style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>{o.customer_whatsapp}</div>
                      )}
                    </td>
                    <td style={{ color: 'var(--ink-2)', fontSize: 12.5 }}>{itemsSummary(o.items)}</td>
                    <td className="num">{brlShort(o.total_amount || 0)}</td>
                    <td><span className="tag">{pmLabel(o.payment_method)}</span></td>
                    <td style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 12 }}>{fmtTime(o.created_at)}</td>
                    <td><span className={`tag${st.cls ? ' ' + st.cls : ''}`}>{st.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && <OrderModal order={selected} onClose={() => setSelected(null)}/>}
    </div>
  );
}

/* ─── HISTÓRICO DE PEDIDOS ───────────────────────────────────────────────── */

function HistoricoPedidos() {
  const today        = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';

  const [from, setFrom]       = usePgSt(firstOfMonth);
  const [to, setTo]           = usePgSt(today);
  const [pageNum, setPageNum] = usePgSt(1);
  const [data, setData]       = usePgSt(null);
  const [loading, setLoading] = usePgSt(false);
  const [selected, setSelected] = usePgSt(null);

  const LIMIT = 50;

  const load = (p = 1) => {
    setLoading(true);
    const q = new URLSearchParams({
      start: from + 'T00:00:00',
      end:   to   + 'T23:59:59',
      page:  p,
      limit: LIMIT,
    });
    window.apiGet('/api/admin/pedidos/historico?' + q)
      .then(d => { setData(d); setPageNum(p); setLoading(false); })
      .catch(() => setLoading(false));
  };

  usePgEff(() => { load(1); }, [from, to]);

  const orders = data?.orders || [];
  const total  = data?.count  || 0;
  const stats  = data?.stats  || {};
  const pages  = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="sub" style={{ marginBottom: 6 }}>Pedidos confirmados e finalizados</div>
          <h1>Histórico de <em>Pedidos</em></h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="lbl-inline">
            De
            <input className="date-input" type="date" value={from} onChange={e => setFrom(e.target.value)}/>
          </label>
          <label className="lbl-inline">
            Até
            <input className="date-input" type="date" value={to} onChange={e => setTo(e.target.value)}/>
          </label>
          <button className="btn-primary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => load(1)}>
            Filtrar
          </button>
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        {[
          { label: 'Faturamento',    value: brl(stats.totalRevenue || 0) },
          { label: 'Pedidos',        value: (stats.totalOrders || 0).toLocaleString('pt-BR') },
          { label: 'Ticket médio',   value: brl(stats.avgTicket  || 0) },
          { label: 'Lucro estimado', value: brl(stats.profit     || 0) },
        ].map((c, i) => (
          <div className="mini-card" key={i} style={{ padding: '16px 18px' }}>
            <small>{c.label}</small>
            <b style={{ fontSize: i === 1 ? 26 : 15, display: 'block', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
              {c.value}
            </b>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            {loading ? 'Carregando...' : `${total.toLocaleString('pt-BR')} pedido${total !== 1 ? 's' : ''} no período`}
          </span>
          {pages > 1 && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button className="icon-btn" disabled={pageNum <= 1} onClick={() => load(pageNum - 1)}>‹</button>
              <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)', padding: '0 4px' }}>
                {pageNum} / {pages}
              </span>
              <button className="icon-btn" disabled={pageNum >= pages} onClick={() => load(pageNum + 1)}>›</button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="empty-state"><Ic.spark/><span>Carregando histórico...</span></div>
        ) : !orders.length ? (
          <div className="empty-state"><Ic.clock/><span>Nenhum pedido no período selecionado</span></div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Data</th>
                <th>#</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Pagamento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const st = statusInfo(o.status);
                return (
                  <tr key={o.id} className="row-clickable" onClick={() => setSelected(o)}>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-3)' }}>
                      {fmtDate(o.created_at)}
                    </td>
                    <td><span className="link-id">#{shortId(o.id)}</span></td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{o.customer_name || '—'}</div>
                    </td>
                    <td style={{ color: 'var(--ink-2)', fontSize: 12.5 }}>{itemsSummary(o.items)}</td>
                    <td className="num">{brlShort(o.total_amount || 0)}</td>
                    <td><span className="tag">{pmLabel(o.payment_method)}</span></td>
                    <td><span className={`tag${st.cls ? ' ' + st.cls : ''}`}>{st.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {pages > 1 && !loading && (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
            marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)',
          }}>
            <button
              className="btn-ghost"
              style={{ flex: 'none', padding: '6px 16px', fontSize: 12 }}
              disabled={pageNum <= 1}
              onClick={() => load(pageNum - 1)}
            >← Anterior</button>
            <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
              {pageNum} / {pages}
            </span>
            <button
              className="btn-ghost"
              style={{ flex: 'none', padding: '6px 16px', fontSize: 12 }}
              disabled={pageNum >= pages}
              onClick={() => load(pageNum + 1)}
            >Próxima →</button>
          </div>
        )}
      </div>

      {selected && <OrderModal order={selected} onClose={() => setSelected(null)}/>}
    </div>
  );
}

/* ─── CLIENTES ───────────────────────────────────────────────────────────── */

function Clientes() {
  const [customers, setCustomers] = usePgSt([]);
  const [search, setSearch]       = usePgSt('');
  const [filter, setFilter]       = usePgSt('todos');
  const [loading, setLoading]     = usePgSt(true);
  const [selected, setSelected]   = usePgSt(null);

  usePgEff(() => {
    window.apiGet('/api/admin/customers')
      .then(data => { setCustomers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setCustomers([]); setLoading(false); });
  }, []);

  const isRecurrent = (c) => (c.crm_count || 0) >= 2;

  const visible = customers.filter(c => {
    const q = (search || '').toLowerCase();
    const matchSearch = !q
      || (c.name || '').toLowerCase().includes(q)
      || (c.whatsapp || '').includes(q);
    const matchFilter =
      filter === 'todos'
      || (filter === 'recorrentes' && isRecurrent(c))
      || (filter === 'ocasionais'  && !isRecurrent(c));
    return matchSearch && matchFilter;
  });

  const totalRec     = customers.filter(isRecurrent).length;
  const totalOrders  = customers.reduce((s, c) => s + (c.crm_count || 0), 0);
  const avgTicket    = totalOrders > 0
    ? customers.reduce((s, c) => s + (c.crm_total || 0), 0) / totalOrders
    : 0;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="sub" style={{ marginBottom: 6 }}>Base de clientes · CRM</div>
          <h1>Base de <em>Clientes</em></h1>
        </div>
        <div className="search-input" style={{ minWidth: 280 }}>
          <Ic.search/>
          <input
            placeholder="Buscar por nome ou WhatsApp..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        {[
          { label: 'Total de clientes',    value: customers.length,          big: true },
          { label: 'Clientes recorrentes', value: totalRec,                  big: true },
          { label: 'Ticket médio global',  value: brl(avgTicket),            big: false },
        ].map((c, i) => (
          <div className="mini-card" key={i} style={{ padding: '16px 18px' }}>
            <small>{c.label}</small>
            <b style={{ fontSize: c.big ? 28 : 16, display: 'block', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
              {c.value}
            </b>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 14 }}>
          <div className="tabs">
            {[['todos','Todos'],['recorrentes','Recorrentes'],['ocasionais','Ocasionais']].map(([k, l]) => (
              <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
          <span style={{ fontSize: 11.5, color: 'var(--ink-4)', flexShrink: 0 }}>
            {loading ? '' : `${visible.length} cliente${visible.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {loading ? (
          <div className="empty-state"><Ic.spark/><span>Carregando clientes...</span></div>
        ) : !visible.length ? (
          <div className="empty-state"><Ic.users/><span>Nenhum cliente encontrado</span></div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>WhatsApp</th>
                <th style={{ textAlign: 'right' }}>Pedidos</th>
                <th style={{ textAlign: 'right' }}>Total gasto</th>
                <th>Última compra</th>
                <th>Perfil</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(c => {
                const rec = isRecurrent(c);
                const initials = (c.name || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <tr key={c.id} className="row-clickable" onClick={() => setSelected(c)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="sb-avatar" style={{
                          width: 28, height: 28, fontSize: 10,
                          background: rec ? 'linear-gradient(135deg, var(--gold), var(--gold-2))' : undefined,
                          color:      rec ? '#1a1408' : undefined,
                        }}>{initials}</div>
                        <span className="client-link" style={{ fontWeight: 500, color: 'var(--ink)' }}>
                          {c.name || '—'}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>
                      {c.whatsapp || '—'}
                    </td>
                    <td className="num">{(c.crm_count || 0).toLocaleString('pt-BR')}</td>
                    <td className="num">{brlShort(c.crm_total || 0)}</td>
                    <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>{fmtDate(c.crm_last)}</td>
                    <td>
                      <span className={`tag${rec ? ' gold' : ''}`}>{rec ? 'Recorrente' : 'Ocasional'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && <ClienteDrawer customer={selected} onClose={() => setSelected(null)}/>}
    </div>
  );
}

/* ─── CLIENTE DRAWER ─────────────────────────────────────────────────────── */

function ClienteDrawer({ customer, onClose }) {
  const [detail, setDetail]   = usePgSt(null);
  const [loading, setLoading] = usePgSt(true);

  usePgEff(() => {
    window.apiGet('/api/admin/customer-details/' + customer.id)
      .then(d => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [customer.id]);

  const rec      = (customer.crm_count || 0) >= 2;
  const initials = (customer.name || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  const orders   = detail?.orders  || [];
  const summary  = detail?.summary || {};

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose}>×</button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div className="sb-avatar" style={{
            width: 52, height: 52, fontSize: 20, borderRadius: 12, flexShrink: 0,
            background: rec ? 'linear-gradient(135deg, var(--gold), var(--gold-2))' : undefined,
            color:      rec ? '#1a1408' : undefined,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 22, margin: '0 0 6px', color: 'var(--ink)' }}>
              {customer.name || '—'}
            </h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`tag${rec ? ' gold' : ''}`}>{rec ? 'Recorrente' : 'Ocasional'}</span>
              {customer.whatsapp && (
                <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
                  {customer.whatsapp}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total gasto',    value: brl(summary.totalSpent || customer.crm_total || 0),      size: 14 },
            { label: 'Pedidos',        value: summary.totalOrders    || customer.crm_count || 0,       size: 26 },
            { label: 'Última compra',  value: fmtDate(summary.lastOrderDate || customer.crm_last),     size: 13 },
          ].map((s, i) => (
            <div className="mini-card" key={i}>
              <small>{s.label}</small>
              <b style={{ fontSize: s.size, display: 'block', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                {s.value}
              </b>
            </div>
          ))}
        </div>

        {/* Order history */}
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-4)', marginBottom: 10 }}>
          Histórico de pedidos
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <Ic.spark/><span>Carregando...</span>
          </div>
        ) : !orders.length ? (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <Ic.cart/><span>Nenhum pedido encontrado</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
            {orders.slice(0, 25).map(o => {
              const st = statusInfo(o.status);
              return (
                <div className="order-row-mini" key={o.id}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
                    <b>#{shortId(o.id)} · {itemsSummary(o.items)}</b>
                    <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                      {fmtDateLong(o.created_at)} · {pmLabel(o.payment_method)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span className={`tag${st.cls ? ' ' + st.cls : ''}`}>{st.label}</span>
                    <span style={{ fontWeight: 500, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                      {brlShort(o.total_amount || 0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {customer.whatsapp && (
          <a
            href={`https://wa.me/55${(customer.whatsapp || '').replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="btn-wpp"
            style={{ marginTop: 18, width: '100%', textDecoration: 'none', justifyContent: 'center' }}
          >
            <Ic.msg style={{ width: 14, height: 14 }}/> Enviar mensagem no WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

window.FilaDePedidos    = FilaDePedidos;
window.HistoricoPedidos = HistoricoPedidos;
window.Clientes         = Clientes;
