/* global React, Ic, brl, brlShort */
const {
  useState: useSt,
  useEffect: useEff
} = React;

/* ─── HELPERS ────────────────────────────────────────────────────────────── */

const STATUS_MAP = {
  paid: {
    label: 'Pago',
    cls: 'gold'
  },
  pago: {
    label: 'Pago',
    cls: 'gold'
  },
  aceito: {
    label: 'Aceito',
    cls: 'gold'
  },
  preparo: {
    label: 'Preparo',
    cls: 'gold'
  },
  retirada: {
    label: 'Retirada',
    cls: 'gold'
  },
  concluido: {
    label: 'Concluído',
    cls: 'up'
  },
  'concluído': {
    label: 'Concluído',
    cls: 'up'
  },
  finalizado: {
    label: 'Finalizado',
    cls: 'up'
  },
  entregue: {
    label: 'Entregue',
    cls: 'up'
  },
  delivered: {
    label: 'Entregue',
    cls: 'up'
  },
  pending: {
    label: 'Pendente',
    cls: ''
  },
  cancelled: {
    label: 'Cancelado',
    cls: 'down'
  },
  cancelado: {
    label: 'Cancelado',
    cls: 'down'
  },
  rejected: {
    label: 'Rejeitado',
    cls: 'down'
  }
};
const statusInfo = s => STATUS_MAP[(s || '').toLowerCase().trim()] || {
  label: s || '—',
  cls: ''
};
const pmLabel = m => {
  const ml = (m || '').toLowerCase();
  if (ml.includes('pix')) return 'Pix';
  if (ml.includes('cred') || ml.includes('card_credit')) return 'Crédito';
  if (ml.includes('deb') || ml.includes('card_debit')) return 'Débito';
  if (!m || m === 'outros') return 'Outros';
  return m;
};
const fmtTime = iso => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};
const fmtDate = iso => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
};
const fmtDateLong = iso => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
const parseItems = raw => {
  try {
    let p = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (p && p.actual_items) return p.actual_items;
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
};
const itemsSummary = raw => {
  const items = parseItems(raw);
  if (!items.length) return '—';
  const first = items[0];
  const rest = items.length - 1;
  return `${first.qty || 1}× ${first.name}${rest > 0 ? ` +${rest}` : ''}`;
};
const shortId = id => String(id || '').slice(-5).toUpperCase();
const isDone = s => ['concluido', 'concluído', 'finalizado', 'entregue', 'delivered'].includes((s || '').toLowerCase());
const isProg = s => ['aceito', 'preparo', 'retirada'].includes((s || '').toLowerCase());
const isWait = s => ['paid', 'pago'].includes((s || '').toLowerCase());
const isCanc = s => ['cancelled', 'cancelado', 'rejected'].includes((s || '').toLowerCase());

/* ─── SHARED: ORDER DETAIL MODAL ─────────────────────────────────────────── */

function OrderModal({
  order,
  onClose
}) {
  const items = parseItems(order.items);
  const st = statusInfo(order.status);
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal",
    style: {
      maxWidth: 520
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    className: "modal-x",
    onClick: onClose
  }, "\xD7"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.18em',
      color: 'var(--ink-4)',
      marginBottom: 8
    }
  }, "Pedido #", shortId(order.id), " \xB7 ", fmtDateLong(order.created_at)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--display)',
      fontWeight: 400,
      fontSize: 22,
      margin: 0,
      color: 'var(--ink)'
    }
  }, order.customer_name || 'Sem nome'), /*#__PURE__*/React.createElement("span", {
    className: `tag${st.cls ? ' ' + st.cls : ''}`
  }, st.label)), order.customer_whatsapp && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)',
      marginTop: 6,
      fontFamily: 'var(--mono)'
    }
  }, order.customer_whatsapp)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginBottom: 18
    }
  }, items.length > 0 ? items.map((item, i) => /*#__PURE__*/React.createElement("div", {
    className: "order-line-item",
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      color: 'var(--ink)'
    }
  }, item.name), item.optionals && item.optionals.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--ink-4)',
      marginTop: 2
    }
  }, item.optionals.map(op => op.name || op).join(', '))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      color: 'var(--ink)'
    }
  }, brlShort((item.price || 0) * (item.qty || 1))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--ink-4)'
    }
  }, item.qty || 1, "\xD7 ", brlShort(item.price || 0))))) : /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--ink-4)',
      fontSize: 12,
      textAlign: 'center',
      padding: '16px 0'
    }
  }, "Sem itens detalhados")), /*#__PURE__*/React.createElement("div", {
    className: "order-total"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500,
      color: 'var(--ink-2)'
    }
  }, "Total do pedido"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--display)',
      fontSize: 22,
      color: 'var(--ink)'
    }
  }, brl(order.total_amount || 0))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 16,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mini-card",
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("small", null, "Forma de pagamento"), /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: 15,
      display: 'block',
      marginTop: 4
    }
  }, pmLabel(order.payment_method))), order.customer_whatsapp && /*#__PURE__*/React.createElement("a", {
    href: `https://wa.me/55${(order.customer_whatsapp || '').replace(/\D/g, '')}`,
    target: "_blank",
    rel: "noreferrer",
    className: "btn-wpp",
    style: {
      flex: 1,
      textDecoration: 'none',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ic.msg, {
    style: {
      width: 14,
      height: 14
    }
  }), " WhatsApp"))));
}

/* ─── FILA DE PEDIDOS ────────────────────────────────────────────────────── */

function FilaDePedidos() {
  const [orders, setOrders] = useSt([]);
  const [loading, setLoading] = useSt(true);
  const [tab, setTab] = useSt('todos');
  const [selected, setSelected] = useSt(null);
  const load = () => {
    setLoading(true);
    window.apiGet('/api/admin/pedidos').then(data => {
      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => {
      setOrders([]);
      setLoading(false);
    });
  };
  useEff(() => {
    load();
  }, []);
  const counts = {
    total: orders.length,
    aguardando: orders.filter(o => isWait(o.status)).length,
    preparo: orders.filter(o => isProg(o.status)).length,
    concluidos: orders.filter(o => isDone(o.status)).length,
    cancelados: orders.filter(o => isCanc(o.status)).length
  };
  const TABS = [['todos', 'Todos', counts.total], ['aguardando', 'Aguardando', counts.aguardando], ['preparo', 'Em preparo', counts.preparo], ['concluidos', 'Concluídos', counts.concluidos], ['cancelados', 'Cancelados', counts.cancelados]];
  const visible = orders.filter(o => {
    if (tab === 'todos') return true;
    if (tab === 'aguardando') return isWait(o.status);
    if (tab === 'preparo') return isProg(o.status);
    if (tab === 'concluidos') return isDone(o.status);
    if (tab === 'cancelados') return isCanc(o.status);
    return true;
  });
  const receita = orders.filter(o => !isCanc(o.status)).reduce((s, o) => s + (o.total_amount || 0), 0);
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sub",
    style: {
      marginBottom: 6
    }
  }, "Opera\xE7\xE3o do dia \xB7 pedidos do ciclo atual"), /*#__PURE__*/React.createElement("h1", null, "Fila de ", /*#__PURE__*/React.createElement("em", null, "Pedidos"))), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "Atualizar",
    onClick: load,
    style: {
      width: 36,
      height: 36
    }
  }, /*#__PURE__*/React.createElement(Ic.spark, null))), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 'var(--gap)',
      marginBottom: 'var(--gap)'
    }
  }, [{
    label: 'Pedidos hoje',
    value: counts.total,
    mono: true
  }, {
    label: 'Aguardando',
    value: counts.aguardando,
    mono: true
  }, {
    label: 'Em preparo',
    value: counts.preparo,
    mono: true
  }, {
    label: 'Receita do dia',
    value: brlShort(receita),
    mono: false
  }].map((c, i) => /*#__PURE__*/React.createElement("div", {
    className: "mini-card",
    key: i,
    style: {
      padding: '16px 18px'
    }
  }, /*#__PURE__*/React.createElement("small", null, c.label), /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: 22,
      display: 'block',
      marginTop: 4,
      fontFamily: c.mono ? 'var(--display)' : undefined
    }
  }, c.value)))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tabs"
  }, TABS.map(([k, l, ct]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: tab === k ? 'on' : '',
    onClick: () => setTab(k)
  }, l, ct > 0 && /*#__PURE__*/React.createElement("span", {
    className: "tab-count"
  }, ct)))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-4)',
      flexShrink: 0
    }
  }, visible.length, " pedido", visible.length !== 1 ? 's' : '')), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.spark, null), /*#__PURE__*/React.createElement("span", null, "Carregando pedidos...")) : !visible.length ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.cart, null), /*#__PURE__*/React.createElement("span", null, "Nenhum pedido neste filtro")) : /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "#"), /*#__PURE__*/React.createElement("th", null, "Cliente"), /*#__PURE__*/React.createElement("th", null, "Itens"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Total"), /*#__PURE__*/React.createElement("th", null, "Pagamento"), /*#__PURE__*/React.createElement("th", null, "Hora"), /*#__PURE__*/React.createElement("th", null, "Status"))), /*#__PURE__*/React.createElement("tbody", null, visible.map(o => {
    const st = statusInfo(o.status);
    return /*#__PURE__*/React.createElement("tr", {
      key: o.id,
      className: "row-clickable",
      onClick: () => setSelected(o)
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: "link-id"
    }, "#", shortId(o.id))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 500,
        color: 'var(--ink)'
      }
    }, o.customer_name || '—'), o.customer_whatsapp && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-4)',
        fontFamily: 'var(--mono)'
      }
    }, o.customer_whatsapp)), /*#__PURE__*/React.createElement("td", {
      style: {
        color: 'var(--ink-2)',
        fontSize: 12.5
      }
    }, itemsSummary(o.items)), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, brlShort(o.total_amount || 0)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: "tag"
    }, pmLabel(o.payment_method))), /*#__PURE__*/React.createElement("td", {
      style: {
        color: 'var(--ink-3)',
        fontFamily: 'var(--mono)',
        fontSize: 12
      }
    }, fmtTime(o.created_at)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: `tag${st.cls ? ' ' + st.cls : ''}`
    }, st.label)));
  })))), selected && /*#__PURE__*/React.createElement(OrderModal, {
    order: selected,
    onClose: () => setSelected(null)
  }));
}

/* ─── HISTÓRICO DE PEDIDOS ───────────────────────────────────────────────── */

function HistoricoPedidos() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';
  const [from, setFrom] = useSt(firstOfMonth);
  const [to, setTo] = useSt(today);
  const [pageNum, setPageNum] = useSt(1);
  const [data, setData] = useSt(null);
  const [loading, setLoading] = useSt(false);
  const [selected, setSelected] = useSt(null);
  const LIMIT = 50;
  const load = (p = 1) => {
    setLoading(true);
    const q = new URLSearchParams({
      start: from + 'T00:00:00',
      end: to + 'T23:59:59',
      page: p,
      limit: LIMIT
    });
    window.apiGet('/api/admin/pedidos/historico?' + q).then(d => {
      setData(d);
      setPageNum(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEff(() => {
    load(1);
  }, [from, to]);
  const orders = data?.orders || [];
  const total = data?.count || 0;
  const stats = data?.stats || {};
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sub",
    style: {
      marginBottom: 6
    }
  }, "Pedidos confirmados e finalizados"), /*#__PURE__*/React.createElement("h1", null, "Hist\xF3rico de ", /*#__PURE__*/React.createElement("em", null, "Pedidos"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "lbl-inline"
  }, "De", /*#__PURE__*/React.createElement("input", {
    className: "date-input",
    type: "date",
    value: from,
    onChange: e => setFrom(e.target.value)
  })), /*#__PURE__*/React.createElement("label", {
    className: "lbl-inline"
  }, "At\xE9", /*#__PURE__*/React.createElement("input", {
    className: "date-input",
    type: "date",
    value: to,
    onChange: e => setTo(e.target.value)
  })), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      fontSize: 12,
      padding: '7px 14px'
    },
    onClick: () => load(1)
  }, "Filtrar"))), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 'var(--gap)',
      marginBottom: 'var(--gap)'
    }
  }, [{
    label: 'Faturamento',
    value: brl(stats.totalRevenue || 0)
  }, {
    label: 'Pedidos',
    value: (stats.totalOrders || 0).toLocaleString('pt-BR')
  }, {
    label: 'Ticket médio',
    value: brl(stats.avgTicket || 0)
  }, {
    label: 'Lucro estimado',
    value: brl(stats.profit || 0)
  }].map((c, i) => /*#__PURE__*/React.createElement("div", {
    className: "mini-card",
    key: i,
    style: {
      padding: '16px 18px'
    }
  }, /*#__PURE__*/React.createElement("small", null, c.label), /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: i === 1 ? 26 : 15,
      display: 'block',
      marginTop: 4,
      fontVariantNumeric: 'tabular-nums'
    }
  }, c.value)))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)'
    }
  }, loading ? 'Carregando...' : `${total.toLocaleString('pt-BR')} pedido${total !== 1 ? 's' : ''} no período`), pages > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    disabled: pageNum <= 1,
    onClick: () => load(pageNum - 1)
  }, "\u2039"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--ink-3)',
      fontFamily: 'var(--mono)',
      padding: '0 4px'
    }
  }, pageNum, " / ", pages), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    disabled: pageNum >= pages,
    onClick: () => load(pageNum + 1)
  }, "\u203A"))), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.spark, null), /*#__PURE__*/React.createElement("span", null, "Carregando hist\xF3rico...")) : !orders.length ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.clock, null), /*#__PURE__*/React.createElement("span", null, "Nenhum pedido no per\xEDodo selecionado")) : /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Data"), /*#__PURE__*/React.createElement("th", null, "#"), /*#__PURE__*/React.createElement("th", null, "Cliente"), /*#__PURE__*/React.createElement("th", null, "Itens"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Total"), /*#__PURE__*/React.createElement("th", null, "Pagamento"), /*#__PURE__*/React.createElement("th", null, "Status"))), /*#__PURE__*/React.createElement("tbody", null, orders.map(o => {
    const st = statusInfo(o.status);
    return /*#__PURE__*/React.createElement("tr", {
      key: o.id,
      className: "row-clickable",
      onClick: () => setSelected(o)
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        fontFamily: 'var(--mono)',
        fontSize: 11.5,
        color: 'var(--ink-3)'
      }
    }, fmtDate(o.created_at)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: "link-id"
    }, "#", shortId(o.id))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 500,
        color: 'var(--ink)'
      }
    }, o.customer_name || '—')), /*#__PURE__*/React.createElement("td", {
      style: {
        color: 'var(--ink-2)',
        fontSize: 12.5
      }
    }, itemsSummary(o.items)), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, brlShort(o.total_amount || 0)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: "tag"
    }, pmLabel(o.payment_method))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: `tag${st.cls ? ' ' + st.cls : ''}`
    }, st.label)));
  }))), pages > 1 && !loading && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
      marginTop: 16,
      paddingTop: 14,
      borderTop: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    style: {
      flex: 'none',
      padding: '6px 16px',
      fontSize: 12
    },
    disabled: pageNum <= 1,
    onClick: () => load(pageNum - 1)
  }, "\u2190 Anterior"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)',
      fontFamily: 'var(--mono)'
    }
  }, pageNum, " / ", pages), /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    style: {
      flex: 'none',
      padding: '6px 16px',
      fontSize: 12
    },
    disabled: pageNum >= pages,
    onClick: () => load(pageNum + 1)
  }, "Pr\xF3xima \u2192"))), selected && /*#__PURE__*/React.createElement(OrderModal, {
    order: selected,
    onClose: () => setSelected(null)
  }));
}

/* ─── CLIENTES ───────────────────────────────────────────────────────────── */

function Clientes() {
  const [customers, setCustomers] = useSt([]);
  const [search, setSearch] = useSt('');
  const [filter, setFilter] = useSt('todos');
  const [loading, setLoading] = useSt(true);
  const [selected, setSelected] = useSt(null);
  useEff(() => {
    window.apiGet('/api/admin/customers').then(data => {
      setCustomers(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => {
      setCustomers([]);
      setLoading(false);
    });
  }, []);
  const isRecurrent = c => (c.crm_count || 0) >= 2;
  const visible = customers.filter(c => {
    const q = (search || '').toLowerCase();
    const matchSearch = !q || (c.name || '').toLowerCase().includes(q) || (c.whatsapp || '').includes(q);
    const matchFilter = filter === 'todos' || filter === 'recorrentes' && isRecurrent(c) || filter === 'ocasionais' && !isRecurrent(c);
    return matchSearch && matchFilter;
  });
  const totalRec = customers.filter(isRecurrent).length;
  const totalOrders = customers.reduce((s, c) => s + (c.crm_count || 0), 0);
  const avgTicket = totalOrders > 0 ? customers.reduce((s, c) => s + (c.crm_total || 0), 0) / totalOrders : 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sub",
    style: {
      marginBottom: 6
    }
  }, "Base de clientes \xB7 CRM"), /*#__PURE__*/React.createElement("h1", null, "Base de ", /*#__PURE__*/React.createElement("em", null, "Clientes"))), /*#__PURE__*/React.createElement("div", {
    className: "search-input",
    style: {
      minWidth: 280
    }
  }, /*#__PURE__*/React.createElement(Ic.search, null), /*#__PURE__*/React.createElement("input", {
    placeholder: "Buscar por nome ou WhatsApp...",
    value: search,
    onChange: e => setSearch(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 'var(--gap)',
      marginBottom: 'var(--gap)'
    }
  }, [{
    label: 'Total de clientes',
    value: customers.length,
    big: true
  }, {
    label: 'Clientes recorrentes',
    value: totalRec,
    big: true
  }, {
    label: 'Ticket médio global',
    value: brl(avgTicket),
    big: false
  }].map((c, i) => /*#__PURE__*/React.createElement("div", {
    className: "mini-card",
    key: i,
    style: {
      padding: '16px 18px'
    }
  }, /*#__PURE__*/React.createElement("small", null, c.label), /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: c.big ? 28 : 16,
      display: 'block',
      marginTop: 4,
      fontVariantNumeric: 'tabular-nums'
    }
  }, c.value)))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tabs"
  }, [['todos', 'Todos'], ['recorrentes', 'Recorrentes'], ['ocasionais', 'Ocasionais']].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: filter === k ? 'on' : '',
    onClick: () => setFilter(k)
  }, l))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-4)',
      flexShrink: 0
    }
  }, loading ? '' : `${visible.length} cliente${visible.length !== 1 ? 's' : ''}`)), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.spark, null), /*#__PURE__*/React.createElement("span", null, "Carregando clientes...")) : !visible.length ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.users, null), /*#__PURE__*/React.createElement("span", null, "Nenhum cliente encontrado")) : /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Cliente"), /*#__PURE__*/React.createElement("th", null, "WhatsApp"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Pedidos"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Total gasto"), /*#__PURE__*/React.createElement("th", null, "\xDAltima compra"), /*#__PURE__*/React.createElement("th", null, "Perfil"))), /*#__PURE__*/React.createElement("tbody", null, visible.map(c => {
    const rec = isRecurrent(c);
    const initials = (c.name || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
    return /*#__PURE__*/React.createElement("tr", {
      key: c.id,
      className: "row-clickable",
      onClick: () => setSelected(c)
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
        fontSize: 10,
        background: rec ? 'linear-gradient(135deg, var(--gold), var(--gold-2))' : undefined,
        color: rec ? '#1a1408' : undefined
      }
    }, initials), /*#__PURE__*/React.createElement("span", {
      className: "client-link",
      style: {
        fontWeight: 500,
        color: 'var(--ink)'
      }
    }, c.name || '—'))), /*#__PURE__*/React.createElement("td", {
      style: {
        fontFamily: 'var(--mono)',
        fontSize: 12,
        color: 'var(--ink-3)'
      }
    }, c.whatsapp || '—'), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, (c.crm_count || 0).toLocaleString('pt-BR')), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, brlShort(c.crm_total || 0)), /*#__PURE__*/React.createElement("td", {
      style: {
        fontSize: 12,
        color: 'var(--ink-3)'
      }
    }, fmtDate(c.crm_last)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: `tag${rec ? ' gold' : ''}`
    }, rec ? 'Recorrente' : 'Ocasional')));
  })))), selected && /*#__PURE__*/React.createElement(ClienteDrawer, {
    customer: selected,
    onClose: () => setSelected(null)
  }));
}

/* ─── CLIENTE DRAWER ─────────────────────────────────────────────────────── */

function ClienteDrawer({
  customer,
  onClose
}) {
  const [detail, setDetail] = useSt(null);
  const [loading, setLoading] = useSt(true);
  useEff(() => {
    window.apiGet('/api/admin/customer-details/' + customer.id).then(d => {
      setDetail(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [customer.id]);
  const rec = (customer.crm_count || 0) >= 2;
  const initials = (customer.name || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  const orders = detail?.orders || [];
  const summary = detail?.summary || {};
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal",
    style: {
      maxWidth: 560
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    className: "modal-x",
    onClick: onClose
  }, "\xD7"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sb-avatar",
    style: {
      width: 52,
      height: 52,
      fontSize: 20,
      borderRadius: 12,
      flexShrink: 0,
      background: rec ? 'linear-gradient(135deg, var(--gold), var(--gold-2))' : undefined,
      color: rec ? '#1a1408' : undefined
    }
  }, initials), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--display)',
      fontWeight: 400,
      fontSize: 22,
      margin: '0 0 6px',
      color: 'var(--ink)'
    }
  }, customer.name || '—'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: `tag${rec ? ' gold' : ''}`
  }, rec ? 'Recorrente' : 'Ocasional'), customer.whatsapp && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)',
      fontFamily: 'var(--mono)'
    }
  }, customer.whatsapp)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 10,
      marginBottom: 20
    }
  }, [{
    label: 'Total gasto',
    value: brl(summary.totalSpent || customer.crm_total || 0),
    size: 14
  }, {
    label: 'Pedidos',
    value: summary.totalOrders || customer.crm_count || 0,
    size: 26
  }, {
    label: 'Última compra',
    value: fmtDate(summary.lastOrderDate || customer.crm_last),
    size: 13
  }].map((s, i) => /*#__PURE__*/React.createElement("div", {
    className: "mini-card",
    key: i
  }, /*#__PURE__*/React.createElement("small", null, s.label), /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: s.size,
      display: 'block',
      marginTop: 4,
      fontVariantNumeric: 'tabular-nums'
    }
  }, s.value)))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.14em',
      color: 'var(--ink-4)',
      marginBottom: 10
    }
  }, "Hist\xF3rico de pedidos"), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      padding: '20px 0'
    }
  }, /*#__PURE__*/React.createElement(Ic.spark, null), /*#__PURE__*/React.createElement("span", null, "Carregando...")) : !orders.length ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      padding: '20px 0'
    }
  }, /*#__PURE__*/React.createElement(Ic.cart, null), /*#__PURE__*/React.createElement("span", null, "Nenhum pedido encontrado")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      maxHeight: 260,
      overflowY: 'auto'
    }
  }, orders.slice(0, 25).map(o => {
    const st = statusInfo(o.status);
    return /*#__PURE__*/React.createElement("div", {
      className: "order-row-mini",
      key: o.id
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        minWidth: 0,
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("b", null, "#", shortId(o.id), " \xB7 ", itemsSummary(o.items)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--ink-4)'
      }
    }, fmtDateLong(o.created_at), " \xB7 ", pmLabel(o.payment_method))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: `tag${st.cls ? ' ' + st.cls : ''}`
    }, st.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 500,
        color: 'var(--ink)',
        fontVariantNumeric: 'tabular-nums',
        fontSize: 13
      }
    }, brlShort(o.total_amount || 0))));
  })), customer.whatsapp && /*#__PURE__*/React.createElement("a", {
    href: `https://wa.me/55${(customer.whatsapp || '').replace(/\D/g, '')}`,
    target: "_blank",
    rel: "noreferrer",
    className: "btn-wpp",
    style: {
      marginTop: 18,
      width: '100%',
      textDecoration: 'none',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ic.msg, {
    style: {
      width: 14,
      height: 14
    }
  }), " Enviar mensagem no WhatsApp")));
}
window.FilaDePedidos = FilaDePedidos;
window.HistoricoPedidos = HistoricoPedidos;
window.Clientes = Clientes;