/* global React, Ic */
const {
  useState: useSt
} = React;
const NAV = [{
  kind: 'item',
  id: 'home',
  label: 'Início',
  icon: Ic.home
}, {
  kind: 'sec',
  label: 'Pedidos'
}, {
  kind: 'item',
  id: 'fila',
  label: 'Fila de Pedidos',
  icon: Ic.list,
  badge: 8
}, {
  kind: 'item',
  id: 'historico',
  label: 'Histórico de Pedidos',
  icon: Ic.clock
}, {
  kind: 'item',
  id: 'prevenda',
  label: 'Pré-venda',
  icon: Ic.calendar
}, {
  kind: 'item',
  id: 'resumo',
  label: 'Resumo de Pedidos',
  icon: Ic.chart
}, {
  kind: 'sec',
  label: 'Clientes'
}, {
  kind: 'item',
  id: 'clientes',
  label: 'Clientes',
  icon: Ic.users
}, {
  kind: 'sec',
  label: 'Configurações'
}, {
  kind: 'item',
  id: 'loja',
  label: 'Sobre a Loja',
  icon: Ic.store
}, {
  kind: 'item',
  id: 'home-cfg',
  label: 'Home Page',
  icon: Ic.cog
}, {
  kind: 'item',
  id: 'horario',
  label: 'Horário',
  icon: Ic.clock
}, {
  kind: 'item',
  id: 'pagamentos',
  label: 'Formas de Pagamento',
  icon: Ic.card
}, {
  kind: 'sec',
  label: 'Cardápio'
}, {
  kind: 'item',
  id: 'cardapio',
  label: 'Cardápio',
  icon: Ic.bread
}, {
  kind: 'sec',
  label: 'Mensagens'
}, {
  kind: 'item',
  id: 'central-msg',
  label: 'Central',
  icon: Ic.chat,
  badge: 3
}, {
  kind: 'item',
  id: 'cfg-msg',
  label: 'Configurações',
  icon: Ic.msg
}, {
  kind: 'sec',
  label: 'Performance'
}, {
  kind: 'item',
  id: 'inteligencia',
  label: 'Inteligência',
  icon: Ic.spark
}, {
  kind: 'item',
  id: 'pagto-painel',
  label: 'Painel Pagamentos',
  icon: Ic.card
}, {
  kind: 'item',
  id: 'funil',
  label: 'Funil de Vendas',
  icon: Ic.funnel
}, {
  kind: 'sec',
  label: 'Outros'
}, {
  kind: 'item',
  id: 'alertas',
  label: 'Alertas',
  icon: Ic.bell,
  badge: 4
}, {
  kind: 'item',
  id: 'insights',
  label: 'Insights',
  icon: Ic.bulb
}];
function Sidebar({
  active,
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("aside", {
    className: "sb"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sb-brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sb-logo"
  }, "T"), /*#__PURE__*/React.createElement("div", {
    className: "sb-brand-text"
  }, /*#__PURE__*/React.createElement("b", null, "Tocha"), /*#__PURE__*/React.createElement("span", null, "Padaria \xB7 Admin"))), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowY: 'auto',
      flex: 1,
      marginRight: -8,
      paddingRight: 4
    }
  }, NAV.map((n, i) => {
    if (n.kind === 'sec') return /*#__PURE__*/React.createElement("div", {
      className: "sb-section",
      key: i
    }, n.label);
    const Ico = n.icon;
    return /*#__PURE__*/React.createElement("div", {
      key: n.id,
      className: `sb-item ${active === n.id ? 'active' : ''}`,
      onClick: () => onNavigate(n.id)
    }, /*#__PURE__*/React.createElement("span", {
      className: "sb-ic"
    }, /*#__PURE__*/React.createElement(Ico, null)), /*#__PURE__*/React.createElement("span", null, n.label), n.badge && /*#__PURE__*/React.createElement("span", {
      className: "sb-badge"
    }, n.badge));
  })), /*#__PURE__*/React.createElement("div", {
    className: "sb-foot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sb-avatar"
  }, "TP"), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("b", null, "Tocha Padaria"), /*#__PURE__*/React.createElement("small", null, "admin@tochapadaria"))));
}
function Topbar({
  pageLabel,
  onNavigate
}) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (!open) return;
    const fn = () => setOpen(false);
    window.addEventListener('click', fn);
    return () => window.removeEventListener('click', fn);
  }, [open]);
  return /*#__PURE__*/React.createElement("div", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "crumb"
  }, /*#__PURE__*/React.createElement("span", null, "Admin"), /*#__PURE__*/React.createElement(Ic.chev, null), /*#__PURE__*/React.createElement("b", null, pageLabel)), /*#__PURE__*/React.createElement("div", {
    className: "tb-spacer"
  }), /*#__PURE__*/React.createElement("span", {
    className: "status-pill"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), "Loja aberta"), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "Buscar"
  }, /*#__PURE__*/React.createElement(Ic.search, null)), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "Alertas"
  }, /*#__PURE__*/React.createElement(Ic.bell, null)), /*#__PURE__*/React.createElement("div", {
    className: "tb-store user-pop-wrap",
    onClick: e => {
      e.stopPropagation();
      setOpen(o => !o);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lg"
  }, "T"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "TOCHA PADARIA"), /*#__PURE__*/React.createElement("small", null, "S\xE3o Jo\xE3o de Meriti")), open && /*#__PURE__*/React.createElement("div", {
    className: "user-pop",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "user-pop-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lg sm"
  }, "T"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "TOCHA PADARIA"), /*#__PURE__*/React.createElement("small", null, "admin@tochapadaria"))), /*#__PURE__*/React.createElement("button", {
    className: "user-pop-item",
    onClick: () => {
      setOpen(false);
      onNavigate && onNavigate('perfil');
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "up-ic"
  }, "\u270E"), " Editar perfil"), /*#__PURE__*/React.createElement("button", {
    className: "user-pop-item danger",
    onClick: () => {
      setOpen(false);
      onNavigate && onNavigate('logout');
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "up-ic"
  }, "\u21AA"), " Sair"))));
}
window.Sidebar = Sidebar;
window.Topbar = Topbar;
window.NAV = NAV;