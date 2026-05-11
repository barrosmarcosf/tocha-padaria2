/* global React, Ic, brl, brlShort */
const {
  useState: usePgSt,
  useEffect: usePgEff
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
const fmtDateFull = iso => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
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
const isCanc = s => ['cancelled', 'cancelado', 'rejected'].includes((s || '').toLowerCase());
const inAceitos = s => ['paid', 'pago', 'aceito'].includes((s || '').toLowerCase().trim());
const inPreparo = s => (s || '').toLowerCase().trim() === 'preparo';
const inRetirada = s => (s || '').toLowerCase().trim() === 'retirada';

/* currency value (number only, no R$ prefix) */
const fmtR = v => Number(v || 0).toLocaleString('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const pmSource = method => {
  const ml = (method || '').toLowerCase();
  if (ml.includes('pix')) return 'Finalizado via Pix';
  if (ml.includes('cred') || ml.includes('card_credit')) return 'Finalizado via cartão de crédito';
  if (ml.includes('deb') || ml.includes('card_debit')) return 'Finalizado via cartão de débito';
  return 'Finalizado via ' + (method || 'outro meio');
};
const deliveryLabel = order => {
  if (order.scheduled_date) return 'Retirada na fornada ' + fmtDate(order.scheduled_date);
  const t = (order.delivery_type || order.order_type || '').toLowerCase();
  if (t.includes('retirada') || t.includes('pickup')) return 'Retirada em loja';
  if (t.includes('entrega') || t.includes('delivery')) return 'Entrega no endereço';
  return 'A definir';
};

/* next upcoming Friday — the bakery's production day */
function nextFornada() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilFri = (5 - day + 7) % 7 || 7;
  const fri = new Date(now.getTime() + daysUntilFri * 86400000);
  return fri.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/* ─── SHARED: ORDER DETAIL MODAL ─────────────────────────────────────────── */

function OrderModal({
  order,
  onClose,
  variant = 'historico'
}) {
  const items = parseItems(order.items);
  const st = statusInfo(order.status);
  const wpp = (order.customer_whatsapp || '').replace(/\D/g, '');
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal",
    style: {
      maxWidth: 480
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    className: "modal-x",
    onClick: onClose
  }, "\xD7"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--display)',
      fontWeight: 400,
      fontSize: 26,
      margin: 0,
      color: 'var(--ink)'
    }
  }, "#", shortId(order.id)), /*#__PURE__*/React.createElement("span", {
    className: `tag${st.cls ? ' ' + st.cls : ''}`
  }, st.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '14px 20px',
      marginBottom: 20,
      paddingBottom: 20,
      borderBottom: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      textTransform: 'uppercase',
      letterSpacing: '0.16em',
      color: 'var(--ink-4)',
      marginBottom: 5
    }
  }, "Cliente"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: 'var(--ink)',
      fontSize: 13
    }
  }, order.customer_name || 'Sem nome'), wpp && /*#__PURE__*/React.createElement("a", {
    href: `https://wa.me/55${wpp}`,
    target: "_blank",
    rel: "noreferrer",
    style: {
      fontSize: 12,
      color: 'var(--gold)',
      fontFamily: 'var(--mono)',
      textDecoration: 'none',
      display: 'block',
      marginTop: 2
    }
  }, order.customer_whatsapp)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      textTransform: 'uppercase',
      letterSpacing: '0.16em',
      color: 'var(--ink-4)',
      marginBottom: 5
    }
  }, "Pagamento"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: 'var(--ink)',
      fontSize: 13,
      textTransform: 'uppercase'
    }
  }, pmLabel(order.payment_method)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--ink-3)',
      marginTop: 2
    }
  }, pmSource(order.payment_method))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      textTransform: 'uppercase',
      letterSpacing: '0.16em',
      color: 'var(--ink-4)',
      marginBottom: 5
    }
  }, "Tipo de Entrega"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: 'var(--ink)',
      fontSize: 13
    }
  }, deliveryLabel(order))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      textTransform: 'uppercase',
      letterSpacing: '0.16em',
      color: 'var(--ink-4)',
      marginBottom: 5
    }
  }, "Data e Hora"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--mono)',
      fontSize: 12,
      color: 'var(--ink)'
    }
  }, fmtDateLong(order.created_at)))), /*#__PURE__*/React.createElement("div", {
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
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--mono)',
      fontSize: 12,
      color: 'var(--gold)',
      flexShrink: 0,
      minWidth: 22
    }
  }, item.qty || 1, "\xD7"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500,
      color: 'var(--ink)'
    }
  }, item.name)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      color: 'var(--ink)',
      flexShrink: 0
    }
  }, brlShort((item.price || 0) * (item.qty || 1))))) : /*#__PURE__*/React.createElement("div", {
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
      fontFamily: 'var(--display)',
      fontWeight: 400,
      fontSize: 16,
      color: 'var(--ink-2)'
    }
  }, "Total"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--display)',
      fontSize: 22,
      color: 'var(--gold)'
    }
  }, brl(order.total_amount || 0))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 16
    }
  }, wpp ? /*#__PURE__*/React.createElement("a", {
    href: `https://wa.me/55${wpp}`,
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
  }), " WhatsApp") : /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), variant === 'fila' ? /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      flex: 1
    },
    onClick: onClose
  }, "Entrar em preparo") : /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    style: {
      flex: 1
    },
    onClick: onClose
  }, "Fechar hist\xF3rico")), variant === 'fila' && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("a", {
    className: "link-muted",
    style: {
      cursor: 'pointer',
      fontSize: 12
    },
    onClick: onClose
  }, "Voltar para a Fila"))));
}

/* ─── FILA DE PEDIDOS ────────────────────────────────────────────────────── */

function FilaDePedidos() {
  const [orders, setOrders] = usePgSt([]);
  const [loading, setLoading] = usePgSt(true);
  const [tab, setTab] = usePgSt('aceitos');
  const [selected, setSelected] = usePgSt(null);
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
  usePgEff(() => {
    load();
  }, []);
  const counts = {
    aceitos: orders.filter(o => inAceitos(o.status)).length,
    preparo: orders.filter(o => inPreparo(o.status)).length,
    retirada: orders.filter(o => inRetirada(o.status)).length,
    concluidos: orders.filter(o => isDone(o.status)).length,
    cancelados: orders.filter(o => isCanc(o.status)).length
  };
  const TABS = [['aceitos', 'Aceitos', counts.aceitos], ['preparo', 'Em Preparo', counts.preparo], ['retirada', 'Pronto p/ Retirada', counts.retirada], ['concluidos', 'Concluídos', counts.concluidos], ['cancelados', 'Cancelados', counts.cancelados]];
  const visible = orders.filter(o => {
    if (tab === 'aceitos') return inAceitos(o.status);
    if (tab === 'preparo') return inPreparo(o.status);
    if (tab === 'retirada') return inRetirada(o.status);
    if (tab === 'concluidos') return isDone(o.status);
    if (tab === 'cancelados') return isCanc(o.status);
    return true;
  });

  /* tab-level badge shown on each card */
  const TAB_BADGE = {
    aceitos: {
      label: 'Aceitos',
      cls: 'up'
    },
    preparo: {
      label: 'Em Preparo',
      cls: 'gold'
    },
    retirada: {
      label: 'Retirada',
      cls: 'gold'
    },
    concluidos: {
      label: 'Concluído',
      cls: 'up'
    },
    cancelados: {
      label: 'Cancelado',
      cls: 'down'
    }
  };

  /* primary action label per tab */
  const TAB_ACTION = {
    aceitos: 'Preparar',
    preparo: 'Pronto',
    retirada: 'Entregar',
    concluidos: '',
    cancelados: ''
  };
  const badge = TAB_BADGE[tab] || TAB_BADGE.aceitos;
  const action = TAB_ACTION[tab] || '';
  const fornada = nextFornada();
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sub",
    style: {
      marginBottom: 6
    }
  }, "Admin"), /*#__PURE__*/React.createElement("h1", null, "Fila de ", /*#__PURE__*/React.createElement("em", null, "Produ\xE7\xE3o"), /*#__PURE__*/React.createElement("span", {
    className: "page-badge",
    style: {
      marginLeft: 14
    }
  }, "FORNADA ", fornada)), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Gerencie os pedidos confirmados para a produ\xE7\xE3o deste ciclo.")), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "Atualizar",
    onClick: load,
    style: {
      width: 36,
      height: 36
    }
  }, /*#__PURE__*/React.createElement(Ic.spark, null))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
      gap: 14,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tabs"
  }, TABS.map(([k, l, ct]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: tab === k ? 'on' : '',
    onClick: () => setTab(k)
  }, l, ct > 0 && /*#__PURE__*/React.createElement("span", {
    className: "tab-count"
  }, ct)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("select", {
    className: "select-mini"
  }, /*#__PURE__*/React.createElement("option", null, "A\xE7\xF5es em lote\u2026")), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      padding: '6px 14px'
    }
  }, "Aplicar"))), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.spark, null), /*#__PURE__*/React.createElement("span", null, "Carregando pedidos...")) : !visible.length ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.cart, null), /*#__PURE__*/React.createElement("span", null, "Nenhum pedido nesta fase.")) : /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: 14
    }
  }, visible.map(o => {
    const name = o.customer_name || '—';
    const displayName = name.length > 22 ? name.slice(0, 21) + '…' : name;
    return /*#__PURE__*/React.createElement("div", {
      key: o.id,
      className: "order-card",
      onClick: () => setSelected(o)
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
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      onClick: e => e.stopPropagation()
    }), /*#__PURE__*/React.createElement("span", {
      className: "tag"
    }, "#", shortId(o.id))), /*#__PURE__*/React.createElement("span", {
      className: `tag${badge.cls ? ' ' + badge.cls : ''}`
    }, badge.label)), /*#__PURE__*/React.createElement("div", {
      className: "order-card-body"
    }, /*#__PURE__*/React.createElement("b", null, displayName), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 12,
        color: 'var(--ink-3)',
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("span", null, fmtTime(o.created_at)), /*#__PURE__*/React.createElement("span", null, fmtDateFull(o.created_at)))), /*#__PURE__*/React.createElement("div", {
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
    }, brlShort(o.total_amount || 0))), action && /*#__PURE__*/React.createElement("button", {
      className: "btn-primary",
      style: {
        padding: '6px 12px',
        fontSize: 12
      },
      onClick: e => e.stopPropagation()
    }, action)));
  })), selected && /*#__PURE__*/React.createElement(OrderModal, {
    order: selected,
    variant: "fila",
    onClose: () => setSelected(null)
  }));
}

/* ─── HISTÓRICO DE PEDIDOS ───────────────────────────────────────────────── */

function HistoricoPedidos() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';
  const [from, setFrom] = usePgSt(firstOfMonth);
  const [to, setTo] = usePgSt(today);
  const [pageNum, setPageNum] = usePgSt(1);
  const [data, setData] = usePgSt(null);
  const [loading, setLoading] = usePgSt(false);
  const [selected, setSelected] = usePgSt(null);
  const [showCanc, setShowCanc] = usePgSt(false);
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
  usePgEff(() => {
    load(1);
  }, [from, to]);
  const orders = data?.orders || [];
  const total = data?.count || 0;
  const stats = data?.stats || {};
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const visibleOrders = showCanc ? orders : orders.filter(o => !isCanc(o.status));
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sub",
    style: {
      marginBottom: 6
    }
  }, "Admin"), /*#__PURE__*/React.createElement("h1", null, "Hist\xF3rico de ", /*#__PURE__*/React.createElement("em", null, "Pedidos")), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Relat\xF3rio consolidado de todas as transa\xE7\xF5es da unidade."))), /*#__PURE__*/React.createElement("div", {
    className: "grid kpi-row",
    style: {
      marginBottom: 'var(--gap)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Faturamento"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "R$"), fmtR(stats.totalRevenue))), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Lucro"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "R$"), fmtR(stats.profit))), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "N\xBA Pedidos"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, (stats.totalOrders || 0).toLocaleString('pt-BR'))), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Ticket M\xE9dio"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "R$"), fmtR(stats.avgTicket)))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      marginBottom: 14,
      paddingBottom: 14,
      borderBottom: '1px solid var(--line)'
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
  })), /*#__PURE__*/React.createElement("a", {
    className: "link-muted",
    onClick: () => setShowCanc(s => !s),
    style: {
      cursor: 'pointer'
    }
  }, showCanc ? 'Ocultar pedidos recusados' : 'Exibir pedidos recusados')), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.spark, null), /*#__PURE__*/React.createElement("span", null, "Carregando hist\xF3rico...")) : !visibleOrders.length ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.clock, null), /*#__PURE__*/React.createElement("span", null, "Nenhum pedido no per\xEDodo selecionado")) : /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "C\xF3digo"), /*#__PURE__*/React.createElement("th", null, "Cliente"), /*#__PURE__*/React.createElement("th", null, "Tipo"), /*#__PURE__*/React.createElement("th", null, "Identificador"), /*#__PURE__*/React.createElement("th", null, "Pagamento"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Itens"), /*#__PURE__*/React.createElement("th", null, "Data"), /*#__PURE__*/React.createElement("th", null, "Agendamento"))), /*#__PURE__*/React.createElement("tbody", null, visibleOrders.map(o => {
    const st = statusInfo(o.status);
    const itemCount = parseItems(o.items).length || 1;
    const ident = o.external_id || o.payment_id || String(o.id || '').replace(/-/g, '').slice(-8).toUpperCase();
    const tipo = o.delivery_type || o.order_type || 'Entrega';
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
        color: 'var(--ink-2)'
      }
    }, tipo), /*#__PURE__*/React.createElement("td", {
      style: {
        fontFamily: 'var(--mono)',
        fontSize: 11,
        color: 'var(--ink-3)'
      }
    }, ident), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: "tag"
    }, pmLabel(o.payment_method))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: `tag${st.cls ? ' ' + st.cls : ''}`
    }, st.label)), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, itemCount), /*#__PURE__*/React.createElement("td", {
      style: {
        fontFamily: 'var(--mono)',
        fontSize: 11.5,
        color: 'var(--ink-3)'
      }
    }, fmtDate(o.created_at)), /*#__PURE__*/React.createElement("td", {
      style: {
        color: 'var(--ink-4)'
      }
    }, o.scheduled_date ? fmtDate(o.scheduled_date) : '—'));
  }))), !loading && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 10,
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--ink-4)'
    }
  }, "Exibindo ", visibleOrders.length, " de ", total, " pedido", total !== 1 ? 's' : ''), pages > 1 && /*#__PURE__*/React.createElement("div", {
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
  }, "\u203A")))), selected && /*#__PURE__*/React.createElement(OrderModal, {
    order: selected,
    onClose: () => setSelected(null)
  }));
}

/* ─── CLIENTES ───────────────────────────────────────────────────────────── */

function Clientes() {
  const [customers, setCustomers] = usePgSt([]);
  const [search, setSearch] = usePgSt('');
  const [filter, setFilter] = usePgSt('todos');
  const [loading, setLoading] = usePgSt(true);
  const [selected, setSelected] = usePgSt(null);
  usePgEff(() => {
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
  const [detail, setDetail] = usePgSt(null);
  const [loading, setLoading] = usePgSt(true);
  usePgEff(() => {
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