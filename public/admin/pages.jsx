/* global React, Ic, brl, brlShort, Delta, SafeIcon */
const { useState: useStP, useEffect: useEffP, useCallback: useCbP } = React;

/* ---------- helpers ---------- */
function daysDiff(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function sinceFmt(iso) {
  const d = daysDiff(iso);
  if (d === null) return '—';
  if (d === 0) return 'hoje';
  return `${d} dia${d !== 1 ? 's' : ''}`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${fmtDate(iso)}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

function fmtPhone(w) {
  if (!w) return '—';
  const d = String(w).replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return w;
}

function orderId(o) {
  const s = String(o.id || '');
  const clean = s.replace(/-/g, '').toUpperCase();
  return `#${clean.slice(-5)}`;
}

function parseItems(o) {
  let items = o.items;
  if (typeof items === 'string') { try { items = JSON.parse(items); } catch { items = []; } }
  if (!items) return [];
  if (Array.isArray(items)) return items;
  return items.actual_items || [];
}

function paymentLabel(o) {
  const m = (o.payment_method || o.metodo_pagamento || '').toLowerCase();
  if (m.includes('pix')) return 'PIX';
  if (m.includes('credito') || m.includes('credit') || m.includes('stripe') || o.stripe_session_id) return 'CARTÃO';
  if (m.includes('debito') || m.includes('debit')) return 'DÉBITO';
  if (m) return m.toUpperCase();
  return 'ONLINE';
}

function paymentSub(o) {
  const m = (o.payment_method || '').toLowerCase();
  if (m.includes('stripe') || o.stripe_session_id) return 'Finalizado via Stripe';
  if (m.includes('pix')) return 'Chave PIX';
  return 'Pagamento online';
}

function orderStatusTag(status) {
  const s = (status || '').toLowerCase();
  if (['paid','pago','aceito'].includes(s)) return ['Aceito', 'up'];
  if (['preparo'].includes(s)) return ['Em Preparo', 'gold'];
  if (['retirada','pronto'].includes(s)) return ['Pronto', 'up'];
  if (['concluido','concluído','finalizado','entregue','delivered','completed'].includes(s)) return ['Concluído', 'up'];
  if (['cancelado','cancelled','payment_failed','error'].includes(s)) return ['Cancelado', 'down'];
  return [status || '—', ''];
}

const STATUS_GROUP_MAP = {
  aceito: 'aceitos', paid: 'aceitos', pago: 'aceitos',
  preparo: 'preparo',
  retirada: 'retirada', pronto: 'retirada',
  concluido: 'concluidos', 'concluído': 'concluidos', finalizado: 'concluidos',
  entregue: 'concluidos', delivered: 'concluidos', completed: 'concluidos',
  cancelado: 'cancelados', cancelled: 'cancelados',
  payment_failed: 'cancelados', error: 'cancelados',
};

const NEXT_STATUS_MAP = { aceitos: 'preparo', preparo: 'retirada', retirada: 'concluido' };
const NEXT_LABEL_MAP  = { aceitos: 'Preparar', preparo: 'Pronto', retirada: 'Concluído' };

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
  const [clients, setClients] = useStP([]);
  const [loading, setLoading] = useStP(true);
  const [open, setOpen] = useStP(null);
  const [search, setSearch] = useStP('');
  const [filter, setFilter] = useStP('todos');

  useEffP(() => {
    window.apiGet('/api/admin/customers')
      .then(data => { setClients(data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || (c.name || '').toLowerCase().includes(q)
      || (c.whatsapp || '').includes(q);
    const matchFilter = filter === 'todos'
      || (filter === 'recorrentes' && (c.crm_count || 0) >= 2)
      || (filter === 'ocasionais'  && (c.crm_count || 0) < 2);
    return matchSearch && matchFilter;
  });

  return (
    <div className="page">
      <PageHead title="Clientes" subtitle={`${clients.length} clientes cadastrados`}/>
      <div className="card">
        <div style={{ display: 'flex', gap: 12, padding: '0 0 14px', alignItems: 'center', borderBottom: '1px solid var(--line)', marginBottom: 4 }}>
          <div className="search-input">
            <Ic.search/>
            <input
              placeholder="Busque por nome ou telefone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="tb-spacer"/>
          <span className="meta">Filtrar:</span>
          <select className="select-mini" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="todos">Todos os clientes</option>
            <option value="recorrentes">Recorrentes</option>
            <option value="ocasionais">Ocasionais</option>
          </select>
        </div>
        {loading ? (
          <div className="empty-state"><Ic.list/><div>Carregando clientes…</div></div>
        ) : (
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
              {filtered.map((c, i) => {
                const isPriority = (c.crm_count || 0) >= 3;
                const since = sinceFmt(c.created_at);
                const lastD = c.crm_last ? sinceFmt(c.crm_last) : '—';
                return (
                  <tr key={c.id || i} onClick={() => setOpen(c)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="sb-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                          {(c.name || '?').split(' ').map(s => s[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <div style={{ color: 'var(--ink)', fontWeight: 500 }}>
                            {c.name}
                            {isPriority && <span className="tag gold" style={{ marginLeft: 6 }}>Prioridade</span>}
                          </div>
                          <small style={{ color: 'var(--ink-4)', fontSize: 11 }}>{c.email}</small>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtPhone(c.whatsapp)}</td>
                    <td style={{ color: 'var(--ink-3)' }}>{since}</td>
                    <td style={{ color: c.crm_last ? 'var(--ink-2)' : 'var(--ink-4)' }}>{lastD}</td>
                    <td className="num">{c.crm_count || 0}</td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-4)', padding: 20 }}>Nenhum cliente encontrado.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {open && <ClienteModal client={open} onClose={() => setOpen(null)}/>}
    </div>
  );
}

function ClienteModal({ client, onClose }) {
  const [data, setData] = useStP(null);
  const [loading, setLoading] = useStP(true);

  useEffP(() => {
    if (!client?.id) { setLoading(false); return; }
    let mounted = true;
    window.apiGet(`/api/admin/customer-details/${client.id}`)
      .then(d => { if (mounted) setData(d); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [client?.id]);

  const orders  = data?.orders || [];
  const summary = data?.summary || {};
  const total   = summary.totalOrders || client.crm_count || 0;
  const spent   = summary.totalSpent  || client.crm_total || 0;

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 22 }}>
          <div className="sb-avatar" style={{ width: 52, height: 52, fontSize: 17 }}>
            {(client.name || '?').split(' ').map(s => s[0]).slice(0, 2).join('')}
          </div>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--display)', fontWeight: 400, fontSize: 24, color: 'var(--ink)' }}>{client.name}</h2>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{fmtPhone(client.whatsapp)} · {client.email}</div>
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
          <div className="mini-card">
            <small>Total de pedidos</small>
            <b>{total}</b>
          </div>
          <div className="mini-card hl">
            <small>Total investido</small>
            <b>{brl(spent)}</b>
          </div>
        </div>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-4)', marginBottom: 10 }}>Histórico cronológico</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
          {loading && <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: 8 }}>Carregando…</div>}
          {!loading && orders.length === 0 && (
            <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: 8 }}>Nenhum pedido registrado.</div>
          )}
          {orders.map((o, i) => {
            const [tagLabel, tagClass] = orderStatusTag(o.status);
            const amount = Number(o.total_amount || 0);
            return (
              <div key={o.id || i} className="order-row-mini">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <b>Pedido {orderId(o)}</b>
                    <span className={`tag ${tagClass}`}>{tagLabel.toUpperCase()}</span>
                  </div>
                  <small style={{ color: 'var(--ink-4)', fontSize: 11 }}>
                    {parseItems(o).length}x Item · {fmtDate(o.created_at)}
                  </small>
                </div>
                <div className="num" style={{ color: 'var(--ink)', fontWeight: 500 }}>{brl(amount)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ========== HISTÓRICO ========== */
function HistoricoPage() {
  const [orders, setOrders] = useStP([]);
  const [stats, setStats] = useStP({ totalRevenue: 0, profit: 0, totalOrders: 0, avgTicket: 0 });
  const [loading, setLoading] = useStP(true);
  const [open, setOpen] = useStP(null);
  const [startDate, setStartDate] = useStP('');
  const [endDate, setEndDate] = useStP('');
  const [showRejected, setShowRejected] = useStP(false);
  const [total, setTotal] = useStP(0);

  const load = useCbP(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: 1, limit: 50 });
    if (startDate) params.set('start', new Date(startDate).toISOString());
    if (endDate) { const d = new Date(endDate); d.setHours(23,59,59,999); params.set('end', d.toISOString()); }
    if (showRejected) params.set('includeRejected', 'true');
    window.apiGet(`/api/admin/pedidos/historico?${params}`)
      .then(d => {
        setOrders(d.orders || []);
        setStats(d.stats || { totalRevenue: 0, profit: 0, totalOrders: 0, avgTicket: 0 });
        setTotal(d.count || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [startDate, endDate, showRejected]);

  useEffP(() => { load(); }, [load]);

  return (
    <div className="page">
      <PageHead title="Histórico de Pedidos" subtitle="Relatório consolidado de todas as transações da unidade."/>
      <div className="grid kpi-row">
        <div className="card kpi"><div className="kpi-label">Faturamento</div><div className="kpi-value"><span className="unit">R$</span>{loading ? '—' : (stats.totalRevenue || 0).toFixed(2).replace('.',',')}</div></div>
        <div className="card kpi"><div className="kpi-label">Lucro</div><div className="kpi-value"><span className="unit">R$</span>{loading ? '—' : (stats.profit || 0).toFixed(2).replace('.',',')}</div></div>
        <div className="card kpi"><div className="kpi-label">Nº pedidos</div><div className="kpi-value">{loading ? '—' : (stats.totalOrders || 0)}</div></div>
        <div className="card kpi"><div className="kpi-label">Ticket médio</div><div className="kpi-value"><span className="unit">R$</span>{loading ? '—' : (stats.avgTicket || 0).toFixed(2).replace('.',',')}</div></div>
      </div>

      <div className="card mt">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          <label className="lbl-inline">
            De <input type="date" className="date-input" value={startDate} onChange={e => setStartDate(e.target.value)}/>
          </label>
          <label className="lbl-inline">
            Até <input type="date" className="date-input" value={endDate} onChange={e => setEndDate(e.target.value)}/>
          </label>
          <button className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }} onClick={load}>Buscar</button>
          <div className="tb-spacer"/>
          <a className="link-muted" style={{ cursor: 'pointer' }} onClick={() => setShowRejected(v => !v)}>
            {showRejected ? 'Ocultar recusados' : 'Exibir pedidos recusados'}
          </a>
        </div>
        {loading ? (
          <div className="empty-state"><Ic.list/><div>Carregando…</div></div>
        ) : (
          <>
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
                {orders.map((o, i) => {
                  const [tagLabel, tagClass] = orderStatusTag(o.status);
                  const itemsArr = parseItems(o);
                  const method = paymentLabel(o);
                  const clientName = o.customer_name || o.clientes?.name || '—';
                  const clientPhone = fmtPhone(o.customer_whatsapp || o.clientes?.whatsapp);
                  const ident = String(o.stripe_session_id || o.id || '').slice(-8);
                  const delivery = (o.delivery_type === 'delivery') ? 'Entrega' : 'Retirada';
                  const schedDate = (() => {
                    let its = o.items;
                    if (typeof its === 'string') try { its = JSON.parse(its); } catch { its = {}; }
                    const bd = its?.batch_date || its?.fornada_date;
                    return bd ? fmtDate(bd + 'T12:00:00') : '—';
                  })();
                  return (
                    <tr key={o.id || i} onClick={() => setOpen(o)} style={{ cursor: 'pointer' }}>
                      <td><a className="link-id">{orderId(o)}</a></td>
                      <td>
                        <div style={{ color: 'var(--ink)' }}>{clientName}</div>
                        <small style={{ color: 'var(--ink-4)', fontSize: 11 }}>{clientPhone}</small>
                      </td>
                      <td>{delivery}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>{ident}</td>
                      <td><span className="tag">{method}</span></td>
                      <td><span className={`tag ${tagClass}`}>{tagLabel.toUpperCase()}</span></td>
                      <td className="num">{itemsArr.length || 1}</td>
                      <td style={{ color: 'var(--ink-3)' }}>{fmtDate(o.created_at)}</td>
                      <td style={{ color: 'var(--ink-4)' }}>{schedDate}</td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--ink-4)', padding: 20 }}>Nenhum pedido encontrado.</td></tr>
                )}
              </tbody>
            </table>
            <div style={{ padding: '10px 4px 0', color: 'var(--ink-4)', fontSize: 11 }}>
              Exibindo {orders.length} de {total} pedidos
            </div>
          </>
        )}
      </div>

      {open && <OrderModal order={open} variant="history" onClose={() => setOpen(null)}/>}
    </div>
  );
}

function OrderModal({ order, variant = 'history', onClose, onStatusChange }) {
  const [saving, setSaving] = useStP(false);

  const itemsArr = parseItems(order);
  const clientName = order.customer_name || order.clientes?.name || '—';
  const clientPhone = fmtPhone(order.customer_whatsapp || order.clientes?.whatsapp);
  const method = paymentLabel(order);
  const methodSub = paymentSub(order);
  const [tagLabel, tagClass] = orderStatusTag(order.status);

  const tab = STATUS_GROUP_MAP[(order.status || '').toLowerCase()] || 'aceitos';
  const nextStatus = NEXT_STATUS_MAP[tab];
  const nextLabel  = NEXT_LABEL_MAP[tab];

  const deliveryLabel = (() => {
    let its = order.items;
    if (typeof its === 'string') try { its = JSON.parse(its); } catch { its = {}; }
    const bd = its?.batch_date || its?.fornada_date;
    if (bd) return `Retirada na fornada ${fmtDate(bd + 'T12:00:00')}`;
    return order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada';
  })();

  const handleAdvance = () => {
    if (!nextStatus || saving) return;
    setSaving(true);
    window.apiPost('/api/admin/update-order-status', { id: order.id, status: nextStatus })
      .then(() => { if (onStatusChange) onStatusChange(order.id, nextStatus); onClose(); })
      .catch(e => alert('Erro: ' + e.message))
      .finally(() => setSaving(false));
  };

  const wppUrl = clientPhone !== '—'
    ? `https://wa.me/55${String(order.customer_whatsapp || '').replace(/\D/g,'')}`
    : '#';

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--display)', fontWeight: 400, fontSize: 26, color: 'var(--ink)' }}>{orderId(order)}</h2>
          <span className={`tag ${tagClass}`} style={{ padding: '5px 12px', fontSize: 11 }}>{tagLabel.toUpperCase()}</span>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div>
            <small className="kv-l">Cliente</small>
            <b className="kv-v">{clientName}</b>
            <a className="link-id" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>{clientPhone}</a>
          </div>
          <div>
            <small className="kv-l">Pagamento</small>
            <b className="kv-v">{method}</b>
            <small style={{ color: 'var(--ink-4)', fontSize: 11, display: 'block', marginTop: 2 }}>{methodSub}</small>
          </div>
          <div>
            <small className="kv-l">Tipo de entrega</small>
            <b className="kv-v">{deliveryLabel}</b>
          </div>
          <div>
            <small className="kv-l">Data e hora</small>
            <b className="kv-v" style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{fmtDateTime(order.created_at)}</b>
          </div>
        </div>
        {itemsArr.length > 0 ? itemsArr.map((item, i) => (
          <div key={i} className="order-line-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{item.qty || item.quantity || 1}x</span>
              <span>{item.name || 'Item'}</span>
            </div>
            <span className="num" style={{ color: 'var(--ink)' }}>{brl((item.price || 0) * (item.qty || item.quantity || 1))}</span>
          </div>
        )) : (
          <div className="order-line-item">
            <span>Pedido {orderId(order)}</span>
            <span className="num" style={{ color: 'var(--ink)' }}>{brl(order.total_amount || 0)}</span>
          </div>
        )}
        <div className="order-total">
          <span style={{ fontFamily: 'var(--display)', fontSize: 22 }}>Total</span>
          <b style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 500 }}>{brl(order.total_amount || 0)}</b>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <a href={wppUrl} target="_blank" rel="noreferrer" className="btn-wpp"><Ic.chat/> WhatsApp</a>
          {variant === 'fila' && nextStatus
            ? <button className="btn-primary" onClick={handleAdvance} disabled={saving}>{saving ? '…' : nextLabel}</button>
            : <button className="btn-ghost" onClick={onClose}>Fechar histórico</button>
          }
        </div>
        {variant === 'fila' && <a className="link-muted" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 12, cursor: 'pointer' }} onClick={onClose}>Voltar para a Fila</a>}
      </div>
    </div>
  );
}

/* ========== FILA DE PEDIDOS ========== */
function FilaPage() {
  const [tab, setTab] = useStP('aceitos');
  const [open, setOpen] = useStP(null);
  const [orders, setOrders] = useStP([]);
  const [loading, setLoading] = useStP(true);
  const [config, setConfig] = useStP(null);
  const advancing = React.useRef(new Set());

  const load = useCbP(() => {
    setLoading(true);
    Promise.all([
      window.apiGet('/api/admin/pedidos?tzOffset=180'),
      window.apiGet('/api/admin/config'),
    ]).then(([ords, cfg]) => {
      setOrders(ords || []);
      setConfig(cfg?.siteContent?.opening_hours || null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffP(() => { load(); }, [load]);

  const currentBakeDate = config?.currentBatch?.bakeDate;
  const badgeLabel = currentBakeDate ? `FORNADA ${fmtDate(currentBakeDate + 'T12:00:00')}` : 'FORNADA';

  const grouped = { aceitos: [], preparo: [], retirada: [], concluidos: [], cancelados: [] };
  orders.forEach(o => {
    const g = STATUS_GROUP_MAP[(o.status || '').toLowerCase()];
    if (g && grouped[g]) grouped[g].push(o);
  });

  const tabs = [
    ['aceitos','Aceitos', grouped.aceitos.length],
    ['preparo','Em Preparo', grouped.preparo.length],
    ['retirada','Pronto p/ Retirada', grouped.retirada.length],
    ['concluidos','Concluídos', grouped.concluidos.length],
    ['cancelados','Cancelados', grouped.cancelados.length],
  ];

  const handleStatusChange = (id, newStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const advance = (e, o) => {
    e.stopPropagation();
    if (advancing.current.has(o.id)) return;
    const g = STATUS_GROUP_MAP[(o.status || '').toLowerCase()];
    const nextStatus = NEXT_STATUS_MAP[g];
    if (!nextStatus) return;
    advancing.current.add(o.id);
    window.apiPost('/api/admin/update-order-status', { id: o.id, status: nextStatus })
      .then(() => handleStatusChange(o.id, nextStatus))
      .catch(err => alert('Erro: ' + err.message))
      .finally(() => advancing.current.delete(o.id));
  };

  const currentOrders = grouped[tab] || [];

  return (
    <div className="page">
      <PageHead
        title="Fila de Produção"
        badge={badgeLabel}
        subtitle="Gerencie os pedidos confirmados para a produção deste ciclo."
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div className="tabs">
          {tabs.map(([k, l, count]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
              {l} {count > 0 && <span className="tab-count">{count}</span>}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={load}>↻ Atualizar</button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><Ic.list/><div>Carregando pedidos…</div></div>
      ) : currentOrders.length === 0 ? (
        <div className="empty-state"><Ic.list/><div>Nenhum pedido nesta fase.</div></div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {currentOrders.map((o, i) => {
            const [tagLabel] = orderStatusTag(o.status);
            const clientName = o.customer_name || o.clientes?.name || '—';
            const total = Number(o.total_amount || 0);
            const dt = o.created_at ? new Date(o.created_at) : null;
            const timeStr = dt ? `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}` : '—';
            const dateStr = dt ? fmtDate(o.created_at) : '—';
            const hasNext = !!NEXT_STATUS_MAP[tab];
            return (
              <div key={o.id || i} className="order-card" onClick={() => setOpen(o)}>
                <div className="order-card-strip"/>
                <div className="order-card-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" onClick={e => e.stopPropagation()}/>
                    <span className="tag">{orderId(o)}</span>
                  </div>
                  <span className="tag up">{tagLabel}</span>
                </div>
                <div className="order-card-body">
                  <b>{clientName.length > 22 ? clientName.slice(0,22) + '…' : clientName}</b>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
                    <span>{timeStr}</span>
                    <span>{dateStr}</span>
                  </div>
                </div>
                <div className="order-card-foot">
                  <div>
                    <small style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-4)' }}>Total gasto</small>
                    <b style={{ display: 'block', color: 'var(--gold)', fontWeight: 500, fontSize: 16 }}>{brl(total)}</b>
                  </div>
                  {hasNext && (
                    <button
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                      onClick={e => advance(e, o)}
                    >
                      {NEXT_LABEL_MAP[tab]}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <OrderModal
          order={open}
          variant="fila"
          onClose={() => setOpen(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

/* ========== PRÉ-VENDA ========== */
function PrevendaPage() {
  const [orders, setOrders] = useStP([]);
  const [loading, setLoading] = useStP(true);
  const [config, setConfig] = useStP(null);

  useEffP(() => {
    let mounted = true;
    Promise.all([
      window.apiGet('/api/admin/pre-orders'),
      window.apiGet('/api/admin/config'),
    ]).then(([ords, cfg]) => {
      if (!mounted) return;
      setOrders(ords || []);
      setConfig(cfg?.siteContent?.opening_hours || null);
    }).catch(() => {}).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const nextBakeDate = config?.nextBatch?.bakeDate;
  const nextLabel = nextBakeDate ? fmtDate(nextBakeDate + 'T12:00:00') : '—';

  const totalItems = orders.reduce((s, o) => s + (parseItems(o).reduce((a, i) => a + (i.qty || i.quantity || 1), 0)), 0);
  const totalRev   = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);

  const prodMap = {};
  orders.forEach(o => {
    parseItems(o).forEach(item => {
      if (!item.name) return;
      const q = item.qty || item.quantity || 1;
      if (!prodMap[item.name]) prodMap[item.name] = 0;
      prodMap[item.name] += q;
    });
  });
  const prodList = Object.entries(prodMap).sort((a,b) => b[1]-a[1]);

  return (
    <div className="page">
      <PageHead title="Pré-venda" badge="PRÓXIMA FORNADA" subtitle={`Fila de pedidos agendados para a fornada de ${nextLabel}.`}/>
      <div className="grid kpi-row">
        <div className="card kpi"><div className="kpi-label">Total pedidos</div><div className="kpi-value">{loading ? '—' : orders.length}</div></div>
        <div className="card kpi"><div className="kpi-label">Total de itens</div><div className="kpi-value">{loading ? '—' : totalItems}</div></div>
        <div className="card kpi"><div className="kpi-label">Faturamento projetado</div><div className="kpi-value"><span className="unit">R$</span>{loading ? '—' : totalRev.toFixed(2).replace('.',',')}</div></div>
        <div className="card kpi"><div className="kpi-label">Data produção</div><div className="kpi-value" style={{ fontSize: 22, fontFamily: 'var(--mono)' }}>{nextLabel}</div></div>
      </div>

      <div className="grid row-2 mt">
        <div className="card">
          <div className="card-head"><h3><Ic.list/>Lista de encomendas</h3></div>
          {loading ? (
            <div className="empty-state" style={{ height: 240 }}><Ic.cart/><div>Carregando…</div></div>
          ) : orders.length === 0 ? (
            <div className="empty-state" style={{ height: 240 }}><Ic.cart/><div>Nenhum pedido de pré-venda encontrado.</div></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
              {orders.map((o, i) => {
                const clientName = o.customer_name || o.clientes?.name || '—';
                const itemsArr = parseItems(o);
                return (
                  <div key={o.id || i} className="order-row-mini">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <b>{orderId(o)}</b>
                        <span className="tag">{clientName.slice(0,18)}{clientName.length > 18 ? '…' : ''}</span>
                      </div>
                      <small style={{ color: 'var(--ink-4)', fontSize: 11 }}>
                        {itemsArr.map(i => `${i.qty||1}x ${i.name}`).join(', ') || 'Sem itens'} · {fmtDate(o.created_at)}
                      </small>
                    </div>
                    <div className="num" style={{ color: 'var(--gold)', fontWeight: 500 }}>{brl(o.total_amount || 0)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-head"><h3><Ic.bread/>Resumo de produção</h3></div>
          {loading ? (
            <div className="empty-state" style={{ height: 240 }}><Ic.flame/><div>Carregando…</div></div>
          ) : prodList.length === 0 ? (
            <div className="empty-state" style={{ height: 240 }}><Ic.flame/><div>Nenhum item para produzir.</div></div>
          ) : prodList.map(([name, qty]) => (
            <div key={name} className="prod-row"><span>{name}</span><b>{qty}</b></div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========== RESUMO DE PEDIDOS ========== */
function ResumoPage() {
  const [analytics, setAnalytics] = useStP(null);
  const [loading, setLoading] = useStP(true);

  useEffP(() => {
    let mounted = true;
    window.apiGet('/api/admin/detailed-analytics?period=today&tzOffset=180')
      .then(d => { if (mounted) setAnalytics(d); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const production    = analytics?.production || {};
  const currentDate   = production.currentBakeDate;
  const nextDate      = production.nextBakeDate;
  const currentLabel  = currentDate ? fmtDate(currentDate + 'T12:00:00') : '—';
  const nextLabel     = nextDate    ? fmtDate(nextDate    + 'T12:00:00') : '—';
  const products      = analytics?.itemPerformance?.products || [];

  const currentItems = products.filter(p => (p.qtyAtual || 0) > 0);
  const nextItems    = products.filter(p => (p.qtyProxima || 0) > 0);
  const currentTotal = currentItems.reduce((s, p) => s + (p.qtyAtual || 0), 0);

  return (
    <div className="page">
      <PageHead title="Resumo de Produção" subtitle={<span><span className="dot-up"/> Consolidado operacional em tempo real por ciclo de fornada</span>}/>
      <div className="grid row-half">
        <div className="card">
          <div className="card-head">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="hot-dot"/>
              Produzir hoje
              <span className="meta" style={{ marginLeft: 4 }}>Fornada {currentLabel}</span>
            </h3>
            {!loading && (
              <div style={{ textAlign: 'right' }}>
                <b style={{ fontSize: 26, fontWeight: 500, color: 'var(--ink)' }}>{currentTotal}</b>
                <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-4)' }}>itens totais</div>
              </div>
            )}
          </div>
          {loading ? (
            <div className="empty-state" style={{ height: 160 }}><Ic.clock/><div>Carregando…</div></div>
          ) : currentItems.length === 0 ? (
            <div className="empty-state" style={{ height: 160 }}><Ic.bread/><div>Nenhum pedido para esta fornada.</div></div>
          ) : currentItems.map(p => (
            <div key={p.name} className="prod-row"><span>{p.name}</span><b>{p.qtyAtual}</b></div>
          ))}
        </div>
        <div className="card">
          <div className="card-head">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="cold-dot"/>
              Próxima fornada
              <span className="meta" style={{ marginLeft: 4 }}>Fila acumulada · {nextLabel}</span>
            </h3>
          </div>
          {loading ? (
            <div className="empty-state" style={{ height: 160 }}><Ic.clock/><div>Carregando…</div></div>
          ) : nextItems.length === 0 ? (
            <div className="empty-state" style={{ height: 160 }}><Ic.clock/><div>Aguardando os primeiros pedidos do próximo ciclo.</div></div>
          ) : nextItems.map(p => (
            <div key={p.name} className="prod-row"><span>{p.name}</span><b>{p.qtyProxima}</b></div>
          ))}
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
