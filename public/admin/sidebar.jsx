/* global React, Ic */
const { useState: useSt } = React;

const NAV = [
  { kind: 'item', id: 'home', label: 'Início', icon: Ic.home },
  { kind: 'sec', label: 'Pedidos' },
  { kind: 'item', id: 'fila',       label: 'Fila de Pedidos',     icon: Ic.list, badge: 8 },
  { kind: 'item', id: 'historico',  label: 'Histórico de Pedidos', icon: Ic.clock },
  { kind: 'item', id: 'prevenda',   label: 'Pré-venda',           icon: Ic.calendar },
  { kind: 'item', id: 'resumo',     label: 'Resumo de Pedidos',   icon: Ic.chart },
  { kind: 'sec', label: 'Clientes' },
  { kind: 'item', id: 'clientes',   label: 'Clientes',            icon: Ic.users },
  { kind: 'sec', label: 'Configurações' },
  { kind: 'item', id: 'loja',       label: 'Sobre a Loja',        icon: Ic.store },
  { kind: 'item', id: 'home-cfg',   label: 'Home Page',           icon: Ic.cog },
  { kind: 'item', id: 'horario',    label: 'Horário',             icon: Ic.clock },
  { kind: 'item', id: 'pagamentos', label: 'Formas de Pagamento', icon: Ic.card },
  { kind: 'sec', label: 'Cardápio' },
  { kind: 'item', id: 'cardapio',   label: 'Cardápio',            icon: Ic.bread },
  { kind: 'sec', label: 'Mensagens' },
  { kind: 'item', id: 'central-msg', label: 'Central',             icon: Ic.chat, badge: 3 },
  { kind: 'item', id: 'cfg-msg',     label: 'Configurações',       icon: Ic.msg },
  { kind: 'sec', label: 'Performance' },
  { kind: 'item', id: 'inteligencia', label: 'Inteligência',       icon: Ic.spark },
  { kind: 'item', id: 'pagto-painel', label: 'Painel Pagamentos', icon: Ic.card },
  { kind: 'item', id: 'funil',        label: 'Funil de Vendas',   icon: Ic.funnel },
  { kind: 'sec', label: 'Outros' },
  { kind: 'item', id: 'alertas',  label: 'Alertas',  icon: Ic.bell, badge: 4 },
  { kind: 'item', id: 'insights', label: 'Insights', icon: Ic.bulb },
];

function Sidebar({ active, onNavigate, mobileOpen, onClose }) {
  const handleNav = (id) => {
    onNavigate(id);
    onClose && onClose();
  };
  return (
    <>
      {mobileOpen && (
        <div className="sb-overlay" onClick={onClose} />
      )}
      <aside className={`sb${mobileOpen ? ' open' : ''}`}>
        <div className="sb-brand">
          <div className="sb-logo">T</div>
          <div className="sb-brand-text">
            <b>Tocha</b>
            <span>Padaria · Admin</span>
          </div>
          <button
            className="sb-close"
            onClick={onClose}
            aria-label="Fechar menu"
            style={{
              marginLeft: 'auto',
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'var(--ink-3)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 'var(--r-sm)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="15" y2="15"/>
              <line x1="15" y1="3" x2="3" y2="15"/>
            </svg>
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, marginRight: -8, paddingRight: 4 }}>
          {NAV.map((n, i) => {
            if (n.kind === 'sec') return <div className="sb-section" key={i}>{n.label}</div>;
            const Ico = n.icon;
            return (
              <div
                key={n.id}
                className={`sb-item ${active === n.id ? 'active' : ''}`}
                onClick={() => handleNav(n.id)}
              >
                <span className="sb-ic"><Ico/></span>
                <span>{n.label}</span>
                {n.badge && <span className="sb-badge">{n.badge}</span>}
              </div>
            );
          })}
        </div>
        <div className="sb-foot">
          <div className="sb-avatar">TP</div>
          <div style={{ minWidth: 0 }}>
            <b>Tocha Padaria</b>
            <small>admin@tochapadaria</small>
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ pageLabel, onNavigate, onHamburger }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (!open) return;
    const fn = () => setOpen(false);
    window.addEventListener('click', fn);
    return () => window.removeEventListener('click', fn);
  }, [open]);
  return (
    <div className="topbar">
      <button className="ham-btn" onClick={onHamburger} aria-label="Abrir menu">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="2" y1="4.5" x2="16" y2="4.5"/>
          <line x1="2" y1="9"   x2="16" y2="9"/>
          <line x1="2" y1="13.5" x2="16" y2="13.5"/>
        </svg>
      </button>
      <div className="crumb">
        <span>Admin</span>
        <Ic.chev/>
        <b>{pageLabel}</b>
      </div>
      <div className="tb-spacer"/>
      <span className="status-pill"><span className="dot"/>Loja aberta</span>
      <button className="icon-btn" title="Buscar"><Ic.search/></button>
      <button className="icon-btn" title="Alertas"><Ic.bell/></button>
      <div className="tb-store user-pop-wrap"
           onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}>
        <div className="lg">T</div>
        <div>
          <b>TOCHA PADARIA</b>
          <small>São João de Meriti</small>
        </div>
        {open && (
          <div className="user-pop" onClick={e => e.stopPropagation()}>
            <div className="user-pop-head">
              <div className="lg sm">T</div>
              <div>
                <b>TOCHA PADARIA</b>
                <small>admin@tochapadaria</small>
              </div>
            </div>
            <button className="user-pop-item" onClick={() => { setOpen(false); onNavigate && onNavigate('perfil'); }}>
              <span className="up-ic">✎</span> Editar perfil
            </button>
            <button className="user-pop-item danger" onClick={() => setOpen(false)}>
              <span className="up-ic">↪</span> Sair
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

window.Sidebar = Sidebar;
window.Topbar = Topbar;
window.NAV = NAV;
