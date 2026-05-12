/* global React, Ic, brl, brlShort, Delta, SafeIcon */
const {
  useState: useStP,
  useEffect: useEffP,
  useCallback: useCbP
} = React;

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
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${fmtDate(iso)}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}
function fmtPhone(w) {
  if (!w) return '—';
  const d = String(w).replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return w;
}
function orderId(o) {
  const s = String(o.id || '');
  const clean = s.replace(/-/g, '').toUpperCase();
  return `#${clean.slice(-5)}`;
}
function parseItems(o) {
  let items = o.items;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
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
  if (['paid', 'pago', 'aceito'].includes(s)) return ['Aceito', 'up'];
  if (['preparo'].includes(s)) return ['Em Preparo', 'gold'];
  if (['retirada', 'pronto'].includes(s)) return ['Pronto', 'up'];
  if (['concluido', 'concluído', 'finalizado', 'entregue', 'delivered', 'completed'].includes(s)) return ['Concluído', 'up'];
  if (['cancelado', 'cancelled', 'payment_failed', 'error'].includes(s)) return ['Cancelado', 'down'];
  return [status || '—', ''];
}
const STATUS_GROUP_MAP = {
  aceito: 'aceitos',
  paid: 'aceitos',
  pago: 'aceitos',
  preparo: 'preparo',
  retirada: 'retirada',
  pronto: 'retirada',
  concluido: 'concluidos',
  'concluído': 'concluidos',
  finalizado: 'concluidos',
  entregue: 'concluidos',
  delivered: 'concluidos',
  completed: 'concluidos',
  cancelado: 'cancelados',
  cancelled: 'cancelados',
  payment_failed: 'cancelados',
  error: 'cancelados'
};
const NEXT_STATUS_MAP = {
  aceitos: 'preparo',
  preparo: 'retirada',
  retirada: 'concluido'
};
const NEXT_LABEL_MAP = {
  aceitos: 'Preparar',
  preparo: 'Pronto',
  retirada: 'Concluído'
};
const PREV_STATUS_MAP = {
  preparo: 'aceito'
};
const PREV_LABEL_MAP = {
  preparo: '← Voltar'
};
const BULK_NEXT_MAP = {
  aceitos: 'preparo',
  preparo: 'retirada',
  retirada: 'concluido'
};
const BULK_NEXT_LABEL = {
  aceitos: 'Preparar selecionados',
  preparo: 'Marcar prontos',
  retirada: 'Concluir selecionados'
};
function PageHead({
  title,
  badge,
  subtitle,
  right
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sub",
    style: {
      marginBottom: 6
    }
  }, "Admin"), /*#__PURE__*/React.createElement("h1", null, title, badge && /*#__PURE__*/React.createElement("span", {
    className: "page-badge"
  }, badge)), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, subtitle)), right);
}

/* ========== CLIENTES ========== */
function ClientesPage() {
  const [clients, setClients] = useStP([]);
  const [loading, setLoading] = useStP(true);
  const [open, setOpen] = useStP(null);
  const [search, setSearch] = useStP('');
  const [filter, setFilter] = useStP('todos');
  useEffP(() => {
    window.apiGet('/api/admin/customers').then(data => {
      setClients(data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || (c.name || '').toLowerCase().includes(q) || (c.whatsapp || '').includes(q);
    const matchFilter = filter === 'todos' || filter === 'recorrentes' && (c.crm_count || 0) >= 2 || filter === 'ocasionais' && (c.crm_count || 0) < 2;
    return matchSearch && matchFilter;
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Clientes",
    subtitle: `${clients.length} clientes cadastrados`
  }), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      padding: '0 0 14px',
      alignItems: 'center',
      borderBottom: '1px solid var(--line)',
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "search-input"
  }, /*#__PURE__*/React.createElement(Ic.search, null), /*#__PURE__*/React.createElement("input", {
    placeholder: "Busque por nome ou telefone\u2026",
    value: search,
    onChange: e => setSearch(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "tb-spacer"
  }), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "Filtrar:"), /*#__PURE__*/React.createElement("select", {
    className: "select-mini",
    value: filter,
    onChange: e => setFilter(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "todos"
  }, "Todos os clientes"), /*#__PURE__*/React.createElement("option", {
    value: "recorrentes"
  }, "Recorrentes"), /*#__PURE__*/React.createElement("option", {
    value: "ocasionais"
  }, "Ocasionais"))), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.list, null), /*#__PURE__*/React.createElement("div", null, "Carregando clientes\u2026")) : /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Nome"), /*#__PURE__*/React.createElement("th", null, "Telefone"), /*#__PURE__*/React.createElement("th", null, "Cliente h\xE1"), /*#__PURE__*/React.createElement("th", null, "\xDAltimo pedido"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Pedidos"))), /*#__PURE__*/React.createElement("tbody", null, filtered.map((c, i) => {
    const isPriority = (c.crm_count || 0) >= 3;
    const since = sinceFmt(c.created_at);
    const lastD = c.crm_last ? sinceFmt(c.crm_last) : '—';
    return /*#__PURE__*/React.createElement("tr", {
      key: c.id || i,
      onClick: () => setOpen(c),
      style: {
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "sb-avatar",
      style: {
        width: 28,
        height: 28,
        fontSize: 10
      }
    }, (c.name || '?').split(' ').map(s => s[0]).slice(0, 2).join('')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--ink)',
        fontWeight: 500
      }
    }, c.name, isPriority && /*#__PURE__*/React.createElement("span", {
      className: "tag gold",
      style: {
        marginLeft: 6
      }
    }, "Prioridade")), /*#__PURE__*/React.createElement("small", {
      style: {
        color: 'var(--ink-4)',
        fontSize: 11
      }
    }, c.email)))), /*#__PURE__*/React.createElement("td", {
      style: {
        fontVariantNumeric: 'tabular-nums'
      }
    }, fmtPhone(c.whatsapp)), /*#__PURE__*/React.createElement("td", {
      style: {
        color: 'var(--ink-3)'
      }
    }, since), /*#__PURE__*/React.createElement("td", {
      style: {
        color: c.crm_last ? 'var(--ink-2)' : 'var(--ink-4)'
      }
    }, lastD), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, c.crm_count || 0));
  }), !loading && filtered.length === 0 && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 5,
    style: {
      textAlign: 'center',
      color: 'var(--ink-4)',
      padding: 20
    }
  }, "Nenhum cliente encontrado."))))), open && /*#__PURE__*/React.createElement(ClienteModal, {
    client: open,
    onClose: () => setOpen(null)
  }));
}
function ClienteModal({
  client,
  onClose
}) {
  const [data, setData] = useStP(null);
  const [loading, setLoading] = useStP(true);
  useEffP(() => {
    if (!client?.id) {
      setLoading(false);
      return;
    }
    let mounted = true;
    window.apiGet(`/api/admin/customer-details/${client.id}`).then(d => {
      if (mounted) setData(d);
    }).catch(() => {}).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [client?.id]);
  const orders = data?.orders || [];
  const summary = data?.summary || {};
  const total = summary.totalOrders || client.crm_count || 0;
  const spent = summary.totalSpent || client.crm_total || 0;
  const avgTicket = total > 0 ? spent / total : 0;
  const lastDate = summary.lastOrderDate || client.crm_last;
  const recLabel = total >= 3 ? 'Prioritário' : total >= 2 ? 'Recorrente' : 'Ocasional';
  const recClass = total >= 3 ? 'gold' : total >= 2 ? 'up' : '';
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-veil",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    className: "modal-close",
    onClick: onClose
  }, "\xD7"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'center',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sb-avatar",
    style: {
      width: 52,
      height: 52,
      fontSize: 17
    }
  }, (client.name || '?').split(' ').map(s => s[0]).slice(0, 2).join('')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--display)',
      fontWeight: 400,
      fontSize: 24,
      color: 'var(--ink)'
    }
  }, client.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)',
      marginTop: 4
    }
  }, fmtPhone(client.whatsapp), " \xB7 ", client.email))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: `tag ${recClass}`
  }, recLabel), lastDate && /*#__PURE__*/React.createElement("small", {
    style: {
      color: 'var(--ink-4)',
      fontSize: 11
    }
  }, "\xDAltimo pedido ", fmtDate(lastDate))), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 12,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mini-card"
  }, /*#__PURE__*/React.createElement("small", null, "Pedidos"), /*#__PURE__*/React.createElement("b", null, total)), /*#__PURE__*/React.createElement("div", {
    className: "mini-card hl"
  }, /*#__PURE__*/React.createElement("small", null, "Total investido"), /*#__PURE__*/React.createElement("b", null, brl(spent))), /*#__PURE__*/React.createElement("div", {
    className: "mini-card"
  }, /*#__PURE__*/React.createElement("small", null, "Ticket m\xE9dio"), /*#__PURE__*/React.createElement("b", null, brl(avgTicket)))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.14em',
      color: 'var(--ink-4)',
      marginBottom: 10
    }
  }, "Hist\xF3rico cronol\xF3gico"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      maxHeight: 300,
      overflowY: 'auto',
      paddingRight: 4
    }
  }, loading && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--ink-4)',
      fontSize: 13,
      padding: 8
    }
  }, "Carregando\u2026"), !loading && orders.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--ink-4)',
      fontSize: 13,
      padding: 8
    }
  }, "Nenhum pedido registrado."), orders.map((o, i) => {
    const [tagLabel, tagClass] = orderStatusTag(o.status);
    const amount = Number(o.total_amount || 0);
    const itemsArr = Array.isArray(o.items) ? o.items.filter(x => x && typeof x === 'object' && x.name) : [];
    const itemsLabel = itemsArr.length > 0 ? itemsArr.map(it => `${it.qty || it.quantity || 1}x ${it.name}`).join(' · ') : `${parseItems(o).length || 1} item`;
    return /*#__PURE__*/React.createElement("div", {
      key: o.id || i,
      className: "order-row-mini"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("b", null, "Pedido ", orderId(o)), /*#__PURE__*/React.createElement("span", {
      className: `tag ${tagClass}`
    }, tagLabel.toUpperCase())), /*#__PURE__*/React.createElement("small", {
      style: {
        color: 'var(--ink-4)',
        fontSize: 11
      }
    }, itemsLabel, " \xB7 ", fmtDate(o.created_at))), /*#__PURE__*/React.createElement("div", {
      className: "num",
      style: {
        color: 'var(--ink)',
        fontWeight: 500
      }
    }, brl(amount)));
  }))));
}

/* ========== HISTÓRICO ========== */
function HistoricoPage() {
  const [orders, setOrders] = useStP([]);
  const [stats, setStats] = useStP({
    totalRevenue: 0,
    profit: 0,
    totalOrders: 0,
    avgTicket: 0
  });
  const [loading, setLoading] = useStP(true);
  const [open, setOpen] = useStP(null);
  const [startDate, setStartDate] = useStP('');
  const [endDate, setEndDate] = useStP('');
  const [showRejected, setShowRejected] = useStP(false);
  const [total, setTotal] = useStP(0);
  const load = useCbP(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: 1,
      limit: 50
    });
    if (startDate) params.set('start', new Date(startDate).toISOString());
    if (endDate) {
      const d = new Date(endDate);
      d.setHours(23, 59, 59, 999);
      params.set('end', d.toISOString());
    }
    if (showRejected) params.set('includeRejected', 'true');
    window.apiGet(`/api/admin/pedidos/historico?${params}`).then(d => {
      setOrders(d.orders || []);
      setStats(d.stats || {
        totalRevenue: 0,
        profit: 0,
        totalOrders: 0,
        avgTicket: 0
      });
      setTotal(d.count || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [startDate, endDate, showRejected]);
  useEffP(() => {
    load();
  }, [load]);
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Hist\xF3rico de Pedidos",
    subtitle: "Relat\xF3rio consolidado de todas as transa\xE7\xF5es da unidade."
  }), /*#__PURE__*/React.createElement("div", {
    className: "grid kpi-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Faturamento"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "R$"), loading ? '—' : (stats.totalRevenue || 0).toFixed(2).replace('.', ','))), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Lucro"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "R$"), loading ? '—' : (stats.profit || 0).toFixed(2).replace('.', ','))), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "N\xBA pedidos"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, loading ? '—' : stats.totalOrders || 0)), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Ticket m\xE9dio"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "R$"), loading ? '—' : (stats.avgTicket || 0).toFixed(2).replace('.', ',')))), /*#__PURE__*/React.createElement("div", {
    className: "card mt"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "lbl-inline"
  }, "De ", /*#__PURE__*/React.createElement("input", {
    type: "date",
    className: "date-input",
    value: startDate,
    onChange: e => setStartDate(e.target.value)
  })), /*#__PURE__*/React.createElement("label", {
    className: "lbl-inline"
  }, "At\xE9 ", /*#__PURE__*/React.createElement("input", {
    type: "date",
    className: "date-input",
    value: endDate,
    onChange: e => setEndDate(e.target.value)
  })), /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    style: {
      padding: '5px 12px',
      fontSize: 12
    },
    onClick: load
  }, "Buscar"), /*#__PURE__*/React.createElement("div", {
    className: "tb-spacer"
  }), /*#__PURE__*/React.createElement("a", {
    className: "link-muted",
    style: {
      cursor: 'pointer'
    },
    onClick: () => setShowRejected(v => !v)
  }, showRejected ? 'Ocultar recusados' : 'Exibir pedidos recusados')), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.list, null), /*#__PURE__*/React.createElement("div", null, "Carregando\u2026")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "C\xF3digo"), /*#__PURE__*/React.createElement("th", null, "Cliente"), /*#__PURE__*/React.createElement("th", null, "Tipo"), /*#__PURE__*/React.createElement("th", null, "Identificador"), /*#__PURE__*/React.createElement("th", null, "Pagamento"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Itens"), /*#__PURE__*/React.createElement("th", null, "Data"), /*#__PURE__*/React.createElement("th", null, "Agendamento"))), /*#__PURE__*/React.createElement("tbody", null, orders.map((o, i) => {
    const [tagLabel, tagClass] = orderStatusTag(o.status);
    const itemsArr = parseItems(o);
    const method = paymentLabel(o);
    const clientName = o.customer_name || o.clientes?.name || '—';
    const clientPhone = fmtPhone(o.customer_whatsapp || o.clientes?.whatsapp);
    const ident = String(o.stripe_session_id || o.id || '').slice(-8);
    const delivery = o.delivery_type === 'delivery' ? 'Entrega' : 'Retirada';
    const schedDate = (() => {
      let its = o.items;
      if (typeof its === 'string') try {
        its = JSON.parse(its);
      } catch {
        its = {};
      }
      const bd = its?.batch_date || its?.fornada_date;
      return bd ? fmtDate(bd + 'T12:00:00') : '—';
    })();
    return /*#__PURE__*/React.createElement("tr", {
      key: o.id || i,
      onClick: () => setOpen(o),
      style: {
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("a", {
      className: "link-id"
    }, orderId(o))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--ink)'
      }
    }, clientName), /*#__PURE__*/React.createElement("small", {
      style: {
        color: 'var(--ink-4)',
        fontSize: 11
      }
    }, clientPhone)), /*#__PURE__*/React.createElement("td", null, delivery), /*#__PURE__*/React.createElement("td", {
      style: {
        fontFamily: 'var(--mono)',
        fontSize: 11,
        color: 'var(--ink-3)'
      }
    }, ident), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: "tag"
    }, method)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: `tag ${tagClass}`
    }, tagLabel.toUpperCase())), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, itemsArr.length || 1), /*#__PURE__*/React.createElement("td", {
      style: {
        color: 'var(--ink-3)'
      }
    }, fmtDate(o.created_at)), /*#__PURE__*/React.createElement("td", {
      style: {
        color: 'var(--ink-4)'
      }
    }, schedDate));
  }), orders.length === 0 && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 9,
    style: {
      textAlign: 'center',
      color: 'var(--ink-4)',
      padding: 20
    }
  }, "Nenhum pedido encontrado.")))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 4px 0',
      color: 'var(--ink-4)',
      fontSize: 11
    }
  }, "Exibindo ", orders.length, " de ", total, " pedidos"))), open && /*#__PURE__*/React.createElement(OrderModal, {
    order: open,
    variant: "history",
    onClose: () => setOpen(null)
  }));
}
function OrderModal({
  order,
  variant = 'history',
  onClose,
  onStatusChange
}) {
  const [saving, setSaving] = useStP(false);
  const itemsArr = parseItems(order);
  const clientName = order.customer_name || order.clientes?.name || '—';
  const clientPhone = fmtPhone(order.customer_whatsapp || order.clientes?.whatsapp);
  const method = paymentLabel(order);
  const methodSub = paymentSub(order);
  const [tagLabel, tagClass] = orderStatusTag(order.status);
  const tab = STATUS_GROUP_MAP[(order.status || '').toLowerCase()] || 'aceitos';
  const nextStatus = NEXT_STATUS_MAP[tab];
  const nextLabel = NEXT_LABEL_MAP[tab];
  const deliveryLabel = (() => {
    let its = order.items;
    if (typeof its === 'string') try {
      its = JSON.parse(its);
    } catch {
      its = {};
    }
    const bd = its?.batch_date || its?.fornada_date;
    if (bd) return `Retirada na fornada ${fmtDate(bd + 'T12:00:00')}`;
    return order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada';
  })();
  const handleAdvance = () => {
    if (!nextStatus || saving) return;
    setSaving(true);
    window.apiPost('/api/admin/update-order-status', {
      id: order.id,
      status: nextStatus
    }).then(() => {
      if (onStatusChange) onStatusChange(order.id, nextStatus);
      onClose();
    }).catch(e => alert('Erro: ' + e.message)).finally(() => setSaving(false));
  };
  const wppUrl = clientPhone !== '—' ? `https://wa.me/55${String(order.customer_whatsapp || '').replace(/\D/g, '')}` : '#';
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-veil",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal",
    onClick: e => e.stopPropagation(),
    style: {
      maxWidth: 480
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "modal-close",
    onClick: onClose
  }, "\xD7"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--display)',
      fontWeight: 400,
      fontSize: 26,
      color: 'var(--ink)'
    }
  }, orderId(order)), /*#__PURE__*/React.createElement("span", {
    className: `tag ${tagClass}`,
    style: {
      padding: '5px 12px',
      fontSize: 11
    }
  }, tagLabel.toUpperCase())), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '1fr 1fr',
      gap: 14,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", {
    className: "kv-l"
  }, "Cliente"), /*#__PURE__*/React.createElement("b", {
    className: "kv-v"
  }, clientName), /*#__PURE__*/React.createElement("a", {
    className: "link-id",
    style: {
      fontSize: 12,
      display: 'block',
      marginTop: 4
    }
  }, clientPhone)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", {
    className: "kv-l"
  }, "Pagamento"), /*#__PURE__*/React.createElement("b", {
    className: "kv-v"
  }, method), /*#__PURE__*/React.createElement("small", {
    style: {
      color: 'var(--ink-4)',
      fontSize: 11,
      display: 'block',
      marginTop: 2
    }
  }, methodSub)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", {
    className: "kv-l"
  }, "Tipo de entrega"), /*#__PURE__*/React.createElement("b", {
    className: "kv-v"
  }, deliveryLabel)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", {
    className: "kv-l"
  }, "Data e hora"), /*#__PURE__*/React.createElement("b", {
    className: "kv-v",
    style: {
      fontFamily: 'var(--mono)',
      fontSize: 13
    }
  }, fmtDateTime(order.created_at)))), itemsArr.length > 0 ? itemsArr.map((item, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "order-line-item"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--gold)',
      fontWeight: 500
    }
  }, item.qty || item.quantity || 1, "x"), /*#__PURE__*/React.createElement("span", null, item.name || 'Item')), /*#__PURE__*/React.createElement("span", {
    className: "num",
    style: {
      color: 'var(--ink)'
    }
  }, brl((item.price || 0) * (item.qty || item.quantity || 1))))) : /*#__PURE__*/React.createElement("div", {
    className: "order-line-item"
  }, /*#__PURE__*/React.createElement("span", null, "Pedido ", orderId(order)), /*#__PURE__*/React.createElement("span", {
    className: "num",
    style: {
      color: 'var(--ink)'
    }
  }, brl(order.total_amount || 0))), /*#__PURE__*/React.createElement("div", {
    className: "order-total"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--display)',
      fontSize: 22
    }
  }, "Total"), /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--gold)',
      fontSize: 22,
      fontWeight: 500
    }
  }, brl(order.total_amount || 0))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: wppUrl,
    target: "_blank",
    rel: "noreferrer",
    className: "btn-wpp"
  }, /*#__PURE__*/React.createElement(Ic.chat, null), " WhatsApp"), variant === 'fila' && nextStatus ? /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: handleAdvance,
    disabled: saving
  }, saving ? '…' : nextLabel) : /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    onClick: onClose
  }, "Fechar hist\xF3rico")), variant === 'fila' && /*#__PURE__*/React.createElement("a", {
    className: "link-muted",
    style: {
      display: 'block',
      textAlign: 'center',
      marginTop: 12,
      fontSize: 12,
      cursor: 'pointer'
    },
    onClick: onClose
  }, "Voltar para a Fila")));
}

/* ========== FILA DE PEDIDOS ========== */
function FilaPage() {
  const [tab, setTab] = useStP('aceitos');
  const [open, setOpen] = useStP(null);
  const [orders, setOrders] = useStP([]);
  const [loading, setLoading] = useStP(true);
  const [config, setConfig] = useStP(null);
  const [selected, setSelected] = useStP(new Set());
  const advancing = React.useRef(new Set());
  const bulking = React.useRef(false);
  const load = useCbP(() => {
    setLoading(true);
    Promise.all([window.apiGet('/api/admin/pedidos?tzOffset=180'), window.apiGet('/api/admin/config')]).then(([ords, cfg]) => {
      setOrders(ords || []);
      setConfig(cfg?.siteContent?.opening_hours || null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffP(() => {
    load();
  }, [load]);
  useEffP(() => {
    setSelected(new Set());
  }, [tab]);
  const currentBakeDate = config?.currentBatch?.bakeDate;
  const badgeLabel = currentBakeDate ? `FORNADA ${fmtDate(currentBakeDate + 'T12:00:00')}` : 'FORNADA';
  const grouped = {
    aceitos: [],
    preparo: [],
    retirada: [],
    concluidos: [],
    cancelados: []
  };
  orders.forEach(o => {
    const g = STATUS_GROUP_MAP[(o.status || '').toLowerCase()];
    if (g && grouped[g]) grouped[g].push(o);
  });
  const tabs = [['aceitos', 'Aceitos', grouped.aceitos.length], ['preparo', 'Em Preparo', grouped.preparo.length], ['retirada', 'Pronto p/ Retirada', grouped.retirada.length], ['concluidos', 'Concluídos', grouped.concluidos.length], ['cancelados', 'Cancelados', grouped.cancelados.length]];
  const handleStatusChange = (id, newStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? {
      ...o,
      status: newStatus
    } : o));
  };
  const advance = (e, o) => {
    e.stopPropagation();
    if (advancing.current.has(o.id)) return;
    const g = STATUS_GROUP_MAP[(o.status || '').toLowerCase()];
    const nextStatus = NEXT_STATUS_MAP[g];
    if (!nextStatus) return;
    advancing.current.add(o.id);
    window.apiPost('/api/admin/update-order-status', {
      id: o.id,
      status: nextStatus
    }).then(() => handleStatusChange(o.id, nextStatus)).catch(err => alert('Erro: ' + err.message)).finally(() => advancing.current.delete(o.id));
  };
  const revert = (e, o) => {
    e.stopPropagation();
    if (advancing.current.has(o.id)) return;
    const g = STATUS_GROUP_MAP[(o.status || '').toLowerCase()];
    const prevStatus = PREV_STATUS_MAP[g];
    if (!prevStatus) return;
    advancing.current.add(o.id);
    window.apiPost('/api/admin/update-order-status', {
      id: o.id,
      status: prevStatus
    }).then(() => handleStatusChange(o.id, prevStatus)).catch(err => alert('Erro: ' + err.message)).finally(() => advancing.current.delete(o.id));
  };
  const toggleSelect = id => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);else next.add(id);
      return next;
    });
  };
  const currentOrders = grouped[tab] || [];
  const selectAll = () => {
    setSelected(prev => prev.size === currentOrders.length ? new Set() : new Set(currentOrders.map(o => o.id)));
  };
  const handleBulkAdvance = () => {
    if (bulking.current || selected.size === 0) return;
    const nextStatus = BULK_NEXT_MAP[tab];
    if (!nextStatus) return;
    const count = selected.size;
    if (!confirm(`Mover ${count} pedido${count !== 1 ? 's' : ''} para "${NEXT_LABEL_MAP[tab]}"?`)) return;
    bulking.current = true;
    const ids = [...selected];
    window.apiPost('/api/admin/bulk-update-status', {
      ids,
      status: nextStatus
    }).then(() => {
      setOrders(prev => prev.map(o => ids.includes(o.id) ? {
        ...o,
        status: nextStatus
      } : o));
      setSelected(new Set());
    }).catch(err => alert('Erro: ' + err.message)).finally(() => {
      bulking.current = false;
    });
  };
  const hasBulk = !!BULK_NEXT_MAP[tab];
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Fila de Produ\xE7\xE3o",
    badge: badgeLabel,
    subtitle: "Gerencie os pedidos confirmados para a produ\xE7\xE3o deste ciclo."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tabs"
  }, tabs.map(([k, l, count]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: tab === k ? 'on' : '',
    onClick: () => setTab(k)
  }, l, " ", count > 0 && /*#__PURE__*/React.createElement("span", {
    className: "tab-count"
  }, count)))), hasBulk && currentOrders.length > 0 && /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      cursor: 'pointer',
      fontSize: 13,
      color: 'var(--ink-3)',
      userSelect: 'none'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: selected.size > 0 && selected.size === currentOrders.length,
    onChange: selectAll,
    onClick: e => e.stopPropagation()
  }), selected.size > 0 ? `${selected.size} selecionado${selected.size !== 1 ? 's' : ''}` : 'Selecionar todos')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, hasBulk && selected.size > 0 && /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      padding: '6px 12px',
      fontSize: 12
    },
    onClick: handleBulkAdvance
  }, BULK_NEXT_LABEL[tab], " (", selected.size, ")"), /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    style: {
      padding: '6px 12px',
      fontSize: 12
    },
    onClick: load
  }, "\u21BB Atualizar"))), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.list, null), /*#__PURE__*/React.createElement("div", null, "Carregando pedidos\u2026")) : currentOrders.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.list, null), /*#__PURE__*/React.createElement("div", null, "Nenhum pedido nesta fase.")) : /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: 14
    }
  }, currentOrders.map((o, i) => {
    const [tagLabel] = orderStatusTag(o.status);
    const clientName = o.customer_name || o.clientes?.name || '—';
    const total = Number(o.total_amount || 0);
    const dt = o.created_at ? new Date(o.created_at) : null;
    const timeStr = dt ? `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}` : '—';
    const dateStr = dt ? fmtDate(o.created_at) : '—';
    const hasNext = !!NEXT_STATUS_MAP[tab];
    const hasPrev = !!PREV_STATUS_MAP[tab];
    return /*#__PURE__*/React.createElement("div", {
      key: o.id || i,
      className: "order-card",
      onClick: () => setOpen(o)
    }, /*#__PURE__*/React.createElement("div", {
      className: "order-card-strip"
    }), /*#__PURE__*/React.createElement("div", {
      className: "order-card-head"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, hasBulk && /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: selected.has(o.id),
      onChange: () => toggleSelect(o.id),
      onClick: e => e.stopPropagation()
    }), /*#__PURE__*/React.createElement("span", {
      className: "tag"
    }, orderId(o))), /*#__PURE__*/React.createElement("span", {
      className: "tag up"
    }, tagLabel)), /*#__PURE__*/React.createElement("div", {
      className: "order-card-body"
    }, /*#__PURE__*/React.createElement("b", null, clientName.length > 22 ? clientName.slice(0, 22) + '…' : clientName), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 12,
        color: 'var(--ink-3)',
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("span", null, timeStr), /*#__PURE__*/React.createElement("span", null, dateStr))), /*#__PURE__*/React.createElement("div", {
      className: "order-card-foot"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", {
      style: {
        fontSize: 9.5,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: 'var(--ink-4)'
      }
    }, "Total gasto"), /*#__PURE__*/React.createElement("b", {
      style: {
        display: 'block',
        color: 'var(--gold)',
        fontWeight: 500,
        fontSize: 16
      }
    }, brl(total))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6
      }
    }, hasPrev && /*#__PURE__*/React.createElement("button", {
      className: "btn-secondary",
      style: {
        padding: '6px 10px',
        fontSize: 11
      },
      onClick: e => revert(e, o)
    }, PREV_LABEL_MAP[tab]), hasNext && /*#__PURE__*/React.createElement("button", {
      className: "btn-primary",
      style: {
        padding: '6px 12px',
        fontSize: 12
      },
      onClick: e => advance(e, o)
    }, NEXT_LABEL_MAP[tab]))));
  })), open && /*#__PURE__*/React.createElement(OrderModal, {
    order: open,
    variant: "fila",
    onClose: () => setOpen(null),
    onStatusChange: handleStatusChange
  }));
}

/* ========== PRÉ-VENDA ========== */
function PrevendaPage() {
  const [orders, setOrders] = useStP([]);
  const [loading, setLoading] = useStP(true);
  const [config, setConfig] = useStP(null);
  const [open, setOpen] = useStP(null);
  const load = useCbP(() => {
    setLoading(true);
    let mounted = true;
    Promise.all([window.apiGet('/api/admin/pre-orders'), window.apiGet('/api/admin/config')]).then(([ords, cfg]) => {
      if (!mounted) return;
      setOrders(ords || []);
      setConfig(cfg?.siteContent?.opening_hours || null);
    }).catch(() => {}).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);
  useEffP(() => {
    load();
  }, [load]);
  const nextBakeDate = config?.nextBatch?.bakeDate;
  const nextLabel = nextBakeDate ? fmtDate(nextBakeDate + 'T12:00:00') : '—';
  const totalItems = orders.reduce((s, o) => s + parseItems(o).reduce((a, i) => a + (i.qty || i.quantity || 1), 0), 0);
  const totalRev = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const prodMap = {};
  orders.forEach(o => {
    parseItems(o).forEach(item => {
      if (!item.name) return;
      const q = item.qty || item.quantity || 1;
      if (!prodMap[item.name]) prodMap[item.name] = 0;
      prodMap[item.name] += q;
    });
  });
  const prodList = Object.entries(prodMap).sort((a, b) => b[1] - a[1]);
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Pr\xE9-venda",
    badge: "PR\xD3XIMA FORNADA",
    subtitle: `Fila de pedidos agendados para a fornada de ${nextLabel}.`
  }), /*#__PURE__*/React.createElement("div", {
    className: "grid kpi-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Total pedidos"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, loading ? '—' : orders.length)), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Total de itens"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, loading ? '—' : totalItems)), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Faturamento projetado"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "R$"), loading ? '—' : totalRev.toFixed(2).replace('.', ','))), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Data produ\xE7\xE3o"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value",
    style: {
      fontSize: 22,
      fontFamily: 'var(--mono)'
    }
  }, nextLabel))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: 18,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    style: {
      padding: '6px 12px',
      fontSize: 12
    },
    onClick: load
  }, "\u21BB Atualizar")), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.list, null), /*#__PURE__*/React.createElement("div", null, "Carregando pedidos\u2026")) : orders.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.cart, null), /*#__PURE__*/React.createElement("div", null, "Nenhum pedido de pr\xE9-venda encontrado.")) : /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: 14
    }
  }, orders.map((o, i) => {
    const [tagLabel] = orderStatusTag(o.status);
    const clientName = o.customer_name || o.clientes?.name || '—';
    const total = Number(o.total_amount || 0);
    const dt = o.created_at ? new Date(o.created_at) : null;
    const timeStr = dt ? `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}` : '—';
    const dateStr = dt ? fmtDate(o.created_at) : '—';
    return /*#__PURE__*/React.createElement("div", {
      key: o.id || i,
      className: "order-card",
      onClick: () => setOpen(o)
    }, /*#__PURE__*/React.createElement("div", {
      className: "order-card-strip"
    }), /*#__PURE__*/React.createElement("div", {
      className: "order-card-head"
    }, /*#__PURE__*/React.createElement("span", {
      className: "tag"
    }, orderId(o)), /*#__PURE__*/React.createElement("span", {
      className: "tag up"
    }, tagLabel)), /*#__PURE__*/React.createElement("div", {
      className: "order-card-body"
    }, /*#__PURE__*/React.createElement("b", null, clientName.length > 22 ? clientName.slice(0, 22) + '…' : clientName), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 12,
        color: 'var(--ink-3)',
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("span", null, timeStr), /*#__PURE__*/React.createElement("span", null, dateStr))), /*#__PURE__*/React.createElement("div", {
      className: "order-card-foot"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", {
      style: {
        fontSize: 9.5,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: 'var(--ink-4)'
      }
    }, "Total gasto"), /*#__PURE__*/React.createElement("b", {
      style: {
        display: 'block',
        color: 'var(--gold)',
        fontWeight: 500,
        fontSize: 16
      }
    }, brl(total)))));
  })), prodList.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "card mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.bread, null), "Resumo de produ\xE7\xE3o")), prodList.map(([name, qty]) => /*#__PURE__*/React.createElement("div", {
    key: name,
    className: "prod-row"
  }, /*#__PURE__*/React.createElement("span", null, name), /*#__PURE__*/React.createElement("b", null, qty)))), open && /*#__PURE__*/React.createElement(OrderModal, {
    order: open,
    variant: "history",
    onClose: () => setOpen(null)
  }));
}

/* ========== RESUMO DE PEDIDOS ========== */
function ResumoPage() {
  const [analytics, setAnalytics] = useStP(null);
  const [loading, setLoading] = useStP(true);
  useEffP(() => {
    let mounted = true;
    window.apiGet('/api/admin/detailed-analytics?period=30d&tzOffset=180').then(d => {
      if (mounted) setAnalytics(d);
    }).catch(() => {}).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);
  const production = analytics?.production || {};
  const currentDate = production.currentBakeDate;
  const nextDate = production.nextBakeDate;
  const currentLabel = currentDate ? fmtDate(currentDate + 'T12:00:00') : '—';
  const nextLabel = nextDate ? fmtDate(nextDate + 'T12:00:00') : '—';
  const products = analytics?.itemPerformance?.products || [];
  const currentItems = products.filter(p => (p.qtyAtual || 0) > 0);
  const nextItems = products.filter(p => (p.qtyProxima || 0) > 0);
  const currentTotal = currentItems.reduce((s, p) => s + (p.qtyAtual || 0), 0);
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Resumo de Produ\xE7\xE3o",
    subtitle: /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
      className: "dot-up"
    }), " Consolidado operacional em tempo real por ciclo de fornada")
  }), /*#__PURE__*/React.createElement("div", {
    className: "grid row-half"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "hot-dot"
  }), "Produzir hoje", /*#__PURE__*/React.createElement("span", {
    className: "meta",
    style: {
      marginLeft: 4
    }
  }, "Fornada ", currentLabel)), !loading && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: 26,
      fontWeight: 500,
      color: 'var(--ink)'
    }
  }, currentTotal), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      textTransform: 'uppercase',
      letterSpacing: '0.14em',
      color: 'var(--ink-4)'
    }
  }, "itens totais"))), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 160
    }
  }, /*#__PURE__*/React.createElement(Ic.clock, null), /*#__PURE__*/React.createElement("div", null, "Carregando\u2026")) : currentItems.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 160
    }
  }, /*#__PURE__*/React.createElement(Ic.bread, null), /*#__PURE__*/React.createElement("div", null, "Nenhum pedido para esta fornada.")) : currentItems.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.name,
    className: "prod-row"
  }, /*#__PURE__*/React.createElement("span", null, p.name), /*#__PURE__*/React.createElement("b", null, p.qtyAtual)))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "cold-dot"
  }), "Pr\xF3xima fornada", /*#__PURE__*/React.createElement("span", {
    className: "meta",
    style: {
      marginLeft: 4
    }
  }, "Fila acumulada \xB7 ", nextLabel))), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 160
    }
  }, /*#__PURE__*/React.createElement(Ic.clock, null), /*#__PURE__*/React.createElement("div", null, "Carregando\u2026")) : nextItems.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 160
    }
  }, /*#__PURE__*/React.createElement(Ic.clock, null), /*#__PURE__*/React.createElement("div", null, "Aguardando os primeiros pedidos do pr\xF3ximo ciclo.")) : nextItems.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.name,
    className: "prod-row"
  }, /*#__PURE__*/React.createElement("span", null, p.name), /*#__PURE__*/React.createElement("b", null, p.qtyProxima))))));
}
window.ClientesPage = ClientesPage;
window.HistoricoPage = HistoricoPage;
window.FilaPage = FilaPage;
window.PrevendaPage = PrevendaPage;
window.ResumoPage = ResumoPage;