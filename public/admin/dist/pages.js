/* global React, Ic, brl, brlShort, Delta */
const {
  useState: useStP
} = React;
const MOCK_CLIENTS = [{
  name: 'Gabriel Machado',
  email: 'gabriel.machado.carvalho@gmail.com',
  phone: '(21) 98072-5247',
  since: '3 dias',
  last: '-',
  orders: 0
}, {
  name: 'Janete José',
  email: 'janetejossilva@gmail.com',
  phone: '(21) 98016-2578',
  since: '7 dias',
  last: '7 dias',
  orders: 1
}, {
  name: 'Julia Correa',
  email: 'juliafruiz@hotmail.com',
  phone: '(21) 96946-0158',
  since: '12 dias',
  last: '7 dias',
  orders: 2
}, {
  name: 'Marcos',
  email: '21987058131@manual.tocha',
  phone: '(21) 98705-8131',
  since: '10 dias',
  last: '-',
  orders: 0
}, {
  name: 'Marcos Felipe da Silva Barros',
  email: 'barros.marcosf@gmail.com',
  phone: '(21) 96627-8965',
  since: '11 dias',
  last: '0 dia',
  orders: 2,
  priority: true
}, {
  name: 'StabTest',
  email: 'stab@test.com',
  phone: '(21) 90000-0001',
  since: '8 dias',
  last: '-',
  orders: 0
}, {
  name: 'Tamiris Barros',
  email: 'tamirisbarros@gmail.com',
  phone: '(21) 98600-1350',
  since: '12 dias',
  last: '12 dias',
  orders: 1
}, {
  name: 'Teste Automatizado',
  email: 'teste@exemplo.com',
  phone: '(21) 99999-9999',
  since: '11 dias',
  last: '-',
  orders: 0
}, {
  name: 'Teste CID',
  email: 'testecid@teste.com',
  phone: '(21) 99999-0001',
  since: '9 dias',
  last: '-',
  orders: 0
}, {
  name: 'Teste Deploy',
  email: 'teste@teste.com',
  phone: '(21) 99999-9999',
  since: '12 dias',
  last: '-',
  orders: 0
}, {
  name: 'Teste DevOps',
  email: 'teste@example.com',
  phone: '(21) 99999-9999',
  since: '11 dias',
  last: '-',
  orders: 0
}];
const MOCK_ORDERS = [{
  id: '#29B47',
  client: 'Marcos Felipe da Silva Barros',
  phone: '21966278965',
  type: 'Entrega',
  ident: '68797474',
  payment: 'ONLINE',
  status: 'paid',
  items: 1,
  date: '11/05/2026'
}, {
  id: '#560D7',
  client: 'Marcos Felipe da Silva Barros',
  phone: '21966278965',
  type: 'Entrega',
  ident: '24995896',
  payment: 'ONLINE',
  status: 'paid',
  items: 1,
  date: '06/05/2026'
}, {
  id: '#961ED',
  client: 'Julia Correa',
  phone: '(21) 96946-0158',
  type: 'Entrega',
  ident: '82920092',
  payment: 'ONLINE',
  status: 'paid',
  items: 1,
  date: '03/05/2026'
}, {
  id: '#C4C69',
  client: 'Janete José',
  phone: '(21) 98016-2578',
  type: 'Entrega',
  ident: '42895904',
  payment: 'ONLINE',
  status: 'paid',
  items: 1,
  date: '03/05/2026'
}, {
  id: '#1E31D',
  client: 'Tamiris Barros',
  phone: '(21) 98600-1350',
  type: 'Entrega',
  ident: '2dngxFZ3',
  payment: 'ONLINE',
  status: 'paid',
  items: 1,
  date: '28/04/2026'
}, {
  id: '#16145',
  client: 'Julia Correa',
  phone: '(21) 96946-0158',
  type: 'Entrega',
  ident: 'AVKQma7O',
  payment: 'ONLINE',
  status: 'paid',
  items: 1,
  date: '28/04/2026'
}];
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
  const [open, setOpen] = useStP(null);
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Clientes",
    subtitle: `${MOCK_CLIENTS.length} clientes cadastrados`
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
    placeholder: "Busque por nome ou telefone\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    className: "tb-spacer"
  }), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "Filtrar:"), /*#__PURE__*/React.createElement("select", {
    className: "select-mini"
  }, /*#__PURE__*/React.createElement("option", null, "Todos os clientes"), /*#__PURE__*/React.createElement("option", null, "Recorrentes"), /*#__PURE__*/React.createElement("option", null, "Ocasionais")), /*#__PURE__*/React.createElement("select", {
    className: "select-mini"
  }, /*#__PURE__*/React.createElement("option", null, "Todas as prioridades"), /*#__PURE__*/React.createElement("option", null, "Alta"), /*#__PURE__*/React.createElement("option", null, "M\xE9dia"))), /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Nome"), /*#__PURE__*/React.createElement("th", null, "Telefone"), /*#__PURE__*/React.createElement("th", null, "Cliente h\xE1"), /*#__PURE__*/React.createElement("th", null, "\xDAltimo pedido"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Pedidos"))), /*#__PURE__*/React.createElement("tbody", null, MOCK_CLIENTS.map((c, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
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
  }, c.name.split(' ').map(s => s[0]).slice(0, 2).join('')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--ink)',
      fontWeight: 500
    }
  }, c.name, " ", c.priority && /*#__PURE__*/React.createElement("span", {
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
  }, c.phone), /*#__PURE__*/React.createElement("td", {
    style: {
      color: 'var(--ink-3)'
    }
  }, c.since), /*#__PURE__*/React.createElement("td", {
    style: {
      color: c.last === '-' ? 'var(--ink-4)' : 'var(--ink-2)'
    }
  }, c.last), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, c.orders)))))), open && /*#__PURE__*/React.createElement(ClienteModal, {
    client: open,
    onClose: () => setOpen(null)
  }));
}
function ClienteModal({
  client,
  onClose
}) {
  const orders = MOCK_ORDERS.filter(o => o.client === client.name);
  const total = orders.length;
  const invested = orders.length * 38;
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
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sb-avatar",
    style: {
      width: 52,
      height: 52,
      fontSize: 17
    }
  }, client.name.split(' ').map(s => s[0]).slice(0, 2).join('')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
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
  }, client.phone, " \xB7 ", client.email))), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mini-card"
  }, /*#__PURE__*/React.createElement("small", null, "Total de pedidos"), /*#__PURE__*/React.createElement("b", null, total || client.orders)), /*#__PURE__*/React.createElement("div", {
    className: "mini-card hl"
  }, /*#__PURE__*/React.createElement("small", null, "Total investido"), /*#__PURE__*/React.createElement("b", null, brl(invested || 154)))), /*#__PURE__*/React.createElement("div", {
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
      maxHeight: 260,
      overflowY: 'auto',
      paddingRight: 4
    }
  }, (orders.length ? orders : [{
    id: '#A2C47',
    status: 'failed',
    items: 6,
    date: '06/05/2026'
  }, {
    id: '#CBDC5',
    status: 'failed',
    items: 6,
    date: '06/05/2026'
  }]).map((o, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "order-row-mini"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("b", null, "Pedido ", o.id), /*#__PURE__*/React.createElement("span", {
    className: `tag ${o.status === 'paid' ? 'up' : 'down'}`
  }, o.status === 'paid' ? 'PAID' : 'PAYMENT_FAILED')), /*#__PURE__*/React.createElement("small", {
    style: {
      color: 'var(--ink-4)',
      fontSize: 11
    }
  }, o.items, "x Item \xB7 ", o.date)), /*#__PURE__*/React.createElement("div", {
    className: "num",
    style: {
      color: 'var(--ink)',
      fontWeight: 500
    }
  }, "R$ ", (o.status === 'paid' ? 1 : 38).toFixed(2).replace('.', ',')))))));
}

/* ========== HISTÓRICO ========== */
function HistoricoPage() {
  const [open, setOpen] = useStP(null);
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
  }, "R$"), "134,00")), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Lucro"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "R$"), "80,40")), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "N\xBA pedidos"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, "6")), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Ticket m\xE9dio"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "R$"), "22,33"))), /*#__PURE__*/React.createElement("div", {
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
    className: "date-input"
  })), /*#__PURE__*/React.createElement("label", {
    className: "lbl-inline"
  }, "At\xE9 ", /*#__PURE__*/React.createElement("input", {
    type: "date",
    className: "date-input"
  })), /*#__PURE__*/React.createElement("a", {
    className: "link-muted"
  }, "Exibir pedidos recusados")), /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "C\xF3digo"), /*#__PURE__*/React.createElement("th", null, "Cliente"), /*#__PURE__*/React.createElement("th", null, "Tipo"), /*#__PURE__*/React.createElement("th", null, "Identificador"), /*#__PURE__*/React.createElement("th", null, "Pagamento"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Itens"), /*#__PURE__*/React.createElement("th", null, "Data"), /*#__PURE__*/React.createElement("th", null, "Agendamento"))), /*#__PURE__*/React.createElement("tbody", null, MOCK_ORDERS.map((o, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    onClick: () => setOpen(o),
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("a", {
    className: "link-id"
  }, o.id)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--ink)'
    }
  }, o.client), /*#__PURE__*/React.createElement("small", {
    style: {
      color: 'var(--ink-4)',
      fontSize: 11
    }
  }, o.phone)), /*#__PURE__*/React.createElement("td", null, o.type), /*#__PURE__*/React.createElement("td", {
    style: {
      fontFamily: 'var(--mono)',
      fontSize: 11,
      color: 'var(--ink-3)'
    }
  }, o.ident), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "tag"
  }, o.payment)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "tag up"
  }, "PAID")), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, o.items), /*#__PURE__*/React.createElement("td", {
    style: {
      color: 'var(--ink-3)'
    }
  }, o.date), /*#__PURE__*/React.createElement("td", {
    style: {
      color: 'var(--ink-4)'
    }
  }, "\u2014"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 4px 0',
      color: 'var(--ink-4)',
      fontSize: 11
    }
  }, "Exibindo 6 de 6 pedidos")), open && /*#__PURE__*/React.createElement(OrderModal, {
    order: open,
    variant: "history",
    onClose: () => setOpen(null)
  }));
}
function OrderModal({
  order,
  variant = 'history',
  onClose
}) {
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
  }, order.id), /*#__PURE__*/React.createElement("span", {
    className: "tag up",
    style: {
      padding: '5px 12px',
      fontSize: 11
    }
  }, variant === 'fila' ? 'PAGO' : 'PAID')), /*#__PURE__*/React.createElement("div", {
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
  }, order.client), /*#__PURE__*/React.createElement("a", {
    className: "link-id",
    style: {
      fontSize: 12,
      display: 'block',
      marginTop: 4
    }
  }, order.phone)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", {
    className: "kv-l"
  }, "Pagamento"), /*#__PURE__*/React.createElement("b", {
    className: "kv-v"
  }, "CART\xC3O"), /*#__PURE__*/React.createElement("small", {
    style: {
      color: 'var(--ink-4)',
      fontSize: 11,
      display: 'block',
      marginTop: 2
    }
  }, "Finalizado via Stripe")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", {
    className: "kv-l"
  }, "Tipo de entrega"), /*#__PURE__*/React.createElement("b", {
    className: "kv-v"
  }, "Retirada na fornada 16/05")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", {
    className: "kv-l"
  }, "Data e hora"), /*#__PURE__*/React.createElement("b", {
    className: "kv-v",
    style: {
      fontFamily: 'var(--mono)',
      fontSize: 13
    }
  }, "11/05/2026, 10:57:27"))), /*#__PURE__*/React.createElement("div", {
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
  }, "1x"), /*#__PURE__*/React.createElement("span", null, "Sourdough Tradicional")), /*#__PURE__*/React.createElement("span", {
    className: "num",
    style: {
      color: 'var(--ink)'
    }
  }, "R$ 1,00")), /*#__PURE__*/React.createElement("div", {
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
  }, "R$ 1,00")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-wpp"
  }, /*#__PURE__*/React.createElement(Ic.chat, null), " WhatsApp"), variant === 'fila' ? /*#__PURE__*/React.createElement("button", {
    className: "btn-primary"
  }, "Entrar em preparo") : /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    onClick: onClose
  }, "Fechar hist\xF3rico")), variant === 'fila' && /*#__PURE__*/React.createElement("a", {
    className: "link-muted",
    style: {
      display: 'block',
      textAlign: 'center',
      marginTop: 12,
      fontSize: 12
    }
  }, "Voltar para a Fila")));
}

/* ========== FILA DE PEDIDOS ========== */
function FilaPage() {
  const [tab, setTab] = useStP('aceitos');
  const [open, setOpen] = useStP(null);
  const tabs = [['aceitos', 'Aceitos', 1], ['preparo', 'Em Preparo', 0], ['pronto', 'Pronto p/ Retirada', 0], ['concluidos', 'Concluídos', 5], ['cancelados', 'Cancelados', 0]];
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Fila de Produ\xE7\xE3o",
    badge: "FORNADA 16/05/2026",
    subtitle: "Gerencie os pedidos confirmados para a produ\xE7\xE3o deste ciclo."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tabs"
  }, tabs.map(([k, l, count]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: tab === k ? 'on' : '',
    onClick: () => setTab(k)
  }, l, " ", count > 0 && /*#__PURE__*/React.createElement("span", {
    className: "tab-count"
  }, count)))), /*#__PURE__*/React.createElement("div", {
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
  }, "Aplicar"))), tab === 'aceitos' && /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "order-card",
    onClick: () => setOpen(MOCK_ORDERS[0])
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
  }, "#29B47")), /*#__PURE__*/React.createElement("span", {
    className: "tag up"
  }, "Aceitos")), /*#__PURE__*/React.createElement("div", {
    className: "order-card-body"
  }, /*#__PURE__*/React.createElement("b", null, "Marcos Felipe da Silv\u2026"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 12,
      color: 'var(--ink-3)',
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("span", null, "10:57"), /*#__PURE__*/React.createElement("span", null, "11/05/2026"))), /*#__PURE__*/React.createElement("div", {
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
  }, "R$ 1,00")), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      padding: '6px 12px',
      fontSize: 12
    },
    onClick: e => {
      e.stopPropagation();
    }
  }, "Preparar")))), tab !== 'aceitos' && /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.list, null), /*#__PURE__*/React.createElement("div", null, "Nenhum pedido nesta fase.")), open && /*#__PURE__*/React.createElement(OrderModal, {
    order: open,
    variant: "fila",
    onClose: () => setOpen(null)
  }));
}

/* ========== PRÉ-VENDA ========== */
function PrevendaPage() {
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "Pr\xE9-venda",
    badge: "PR\xD3XIMA FORNADA",
    subtitle: "Fila de pedidos agendados para a fornada de 23/05/2026."
  }), /*#__PURE__*/React.createElement("div", {
    className: "grid kpi-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Total pedidos"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, "0")), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Total de itens"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, "0")), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Faturamento projetado"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "R$"), "0,00")), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, "Data produ\xE7\xE3o"), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value",
    style: {
      fontSize: 22,
      fontFamily: 'var(--mono)'
    }
  }, "23/05/2026"))), /*#__PURE__*/React.createElement("div", {
    className: "grid row-2 mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.list, null), "Lista de encomendas")), /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 240
    }
  }, /*#__PURE__*/React.createElement(Ic.cart, null), /*#__PURE__*/React.createElement("div", null, "Nenhum pedido de pr\xE9-venda encontrado."))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.bread, null), "Resumo de produ\xE7\xE3o")), /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 240
    }
  }, /*#__PURE__*/React.createElement(Ic.flame, null), /*#__PURE__*/React.createElement("div", null, "Nenhum item para produzir.")))));
}

/* ========== RESUMO DE PEDIDOS ========== */
function ResumoPage() {
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
  }, "Fornada 16/05")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: 26,
      fontWeight: 500,
      color: 'var(--ink)'
    }
  }, "6"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      textTransform: 'uppercase',
      letterSpacing: '0.14em',
      color: 'var(--ink-4)'
    }
  }, "itens totais"))), /*#__PURE__*/React.createElement("div", {
    className: "prod-row"
  }, /*#__PURE__*/React.createElement("span", null, "Sourdough Tradicional (S\xE3o Jo\xE3o)"), /*#__PURE__*/React.createElement("b", null, "5")), /*#__PURE__*/React.createElement("div", {
    className: "prod-row"
  }, /*#__PURE__*/React.createElement("span", null, "Focaccia de Damasco & Gorgonzola"), /*#__PURE__*/React.createElement("b", null, "1"))), /*#__PURE__*/React.createElement("div", {
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
  }, "Fila acumulada \xB7 23/05"))), /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 160
    }
  }, /*#__PURE__*/React.createElement(Ic.clock, null), /*#__PURE__*/React.createElement("div", null, "Aguardando os primeiros pedidos do pr\xF3ximo ciclo.")))));
}
window.ClientesPage = ClientesPage;
window.HistoricoPage = HistoricoPage;
window.FilaPage = FilaPage;
window.PrevendaPage = PrevendaPage;
window.ResumoPage = ResumoPage;