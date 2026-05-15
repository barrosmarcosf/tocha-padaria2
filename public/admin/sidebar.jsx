/* global React, Ic, SafeIcon */
const { useState: useSt } = React;

const LOGO = '/assets/logo.png';

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

function _readUser() {
  try { return JSON.parse(localStorage.getItem('tocha_admin_user') || '{}'); } catch { return {}; }
}

function Sidebar({ active, onNavigate }) {
  const [user, setUser] = React.useState(_readUser);

  React.useEffect(() => {
    const handler = (e) => setUser(prev => ({ ...prev, ...e.detail }));
    window.addEventListener('tocha:profile-updated', handler);
    return () => window.removeEventListener('tocha:profile-updated', handler);
  }, []);

  const initials = (user.nome || 'T')[0].toUpperCase();
  const avatarUrl = user.avatar_url;
  const email = user.email || 'admin@tochapadaria';

  return (
    <aside className="sb">
      <div className="sb-brand">
        <img src={LOGO} style={{ width: 26, height: 'auto', objectFit: 'contain' }}/>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, marginRight: -8, paddingRight: 4 }}>
        {NAV.map((n, i) => {
          if (n.kind === 'sec') return <div className="sb-section" key={i}>{n.label}</div>;
          return (
            <div
              key={n.id}
              className={`sb-item ${active === n.id ? 'active' : ''}`}
              onClick={() => onNavigate(n.id)}
            >
              <span className="sb-ic"><SafeIcon icon={n.icon}/></span>
              <span>{n.label}</span>
              {n.badge && <span className="sb-badge">{n.badge}</span>}
            </div>
          );
        })}
      </div>
      <div className="sb-foot">
        <div className="sb-avatar" style={{ overflow: 'hidden', padding: avatarUrl ? 0 : undefined }}>
          {avatarUrl
            ? <img src={'/' + avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            : initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <b>TOCHA PADARIA</b>
          <small style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{email}</small>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ pageLabel, onNavigate, onHamburger }) {
  const [open, setOpen] = React.useState(false);
  const [user, setUser] = React.useState(_readUser);

  React.useEffect(() => {
    if (!open) return;
    const fn = () => setOpen(false);
    window.addEventListener('click', fn);
    return () => window.removeEventListener('click', fn);
  }, [open]);

  React.useEffect(() => {
    const handler = (e) => setUser(prev => ({ ...prev, ...e.detail }));
    window.addEventListener('tocha:profile-updated', handler);
    return () => window.removeEventListener('tocha:profile-updated', handler);
  }, []);

  const avatarUrl = user.avatar_url;
  const email = user.email || 'admin@tochapadaria';

  const AvatarOrLogo = ({ small }) => (
    <div className={`lg${small ? ' sm' : ''}`}>
      {avatarUrl
        ? <img src={'/' + avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}/>
        : <img src={LOGO} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }}/>}
    </div>
  );

  return (
    <div className="topbar">
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
        <AvatarOrLogo/>
        <div>
          <b>TOCHA PADARIA</b>
        </div>
        {open && (
          <div className="user-pop" onClick={e => e.stopPropagation()}>
            <div className="user-pop-head">
              <AvatarOrLogo small/>
              <div>
                <b>TOCHA PADARIA</b>
                <small>{email}</small>
              </div>
            </div>
            <button className="user-pop-item" onClick={() => { setOpen(false); onNavigate && onNavigate('perfil'); }}>
              <span className="up-ic">✎</span> Editar perfil
            </button>
            <button className="user-pop-item danger" onClick={() => { setOpen(false); onNavigate && onNavigate('logout'); }}>
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
