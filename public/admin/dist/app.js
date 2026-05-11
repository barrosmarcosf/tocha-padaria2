/* global React, ReactDOM, Sidebar, Topbar, NAV, Dashboard, FilaDePedidos, HistoricoPedidos, Clientes */

const AUTH_KEY = 'tocha_admin_token';
function App() {
  const [page, setPage] = React.useState(localStorage.getItem('tocha_admin_section') || 'home');
  const [authed, setAuthed] = React.useState(!!localStorage.getItem(AUTH_KEY));
  const [sbOpen, setSbOpen] = React.useState(false);
  const navItem = NAV.find(n => n.id === page);
  const label = navItem ? navItem.label : 'Início';
  const handleNavigate = id => {
    if (id === 'logout') {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem('tocha_admin_user');
      setAuthed(false);
      return;
    }
    setPage(id);
    setSbOpen(false);
    localStorage.setItem('tocha_admin_section', id);
  };
  if (!authed) return /*#__PURE__*/React.createElement(Login, {
    onAuth: () => setAuthed(true)
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement(Sidebar, {
    active: page,
    onNavigate: handleNavigate,
    mobileOpen: sbOpen,
    onClose: () => setSbOpen(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "main"
  }, /*#__PURE__*/React.createElement(Topbar, {
    pageLabel: label,
    onNavigate: handleNavigate,
    onHamburger: () => setSbOpen(o => !o)
  }), page === 'home' && /*#__PURE__*/React.createElement(Dashboard, null), page === 'fila' && /*#__PURE__*/React.createElement(FilaDePedidos, null), page === 'historico' && /*#__PURE__*/React.createElement(HistoricoPedidos, null), page === 'clientes' && /*#__PURE__*/React.createElement(Clientes, null), !['home', 'fila', 'historico', 'clientes'].includes(page) && /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, /*#__PURE__*/React.createElement("em", null, label)), /*#__PURE__*/React.createElement("p", {
    className: "sub"
  }, "M\xF3dulo em implementa\xE7\xE3o"))))));
}
function Login({
  onAuth
}) {
  const [email, setEmail] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');
  const submit = async () => {
    if (!email || !pass) {
      setErr('Preencha todos os campos');
      return;
    }
    setLoading(true);
    setErr('');
    try {
      const resp = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password: pass
        })
      });
      const data = await resp.json();
      if (data.success) {
        localStorage.setItem(AUTH_KEY, data.token);
        localStorage.setItem('tocha_admin_user', JSON.stringify(data.user || {}));
        onAuth();
      } else {
        setErr(data.error || 'Credenciais inválidas');
      }
    } catch (e) {
      setErr('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-deep)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 340,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      border: '1px solid var(--gold-line)',
      borderRadius: 4,
      display: 'grid',
      placeItems: 'center',
      fontFamily: 'var(--display)',
      fontSize: 18,
      color: 'var(--gold)'
    }
  }, "T"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--display)',
      fontSize: 20,
      color: 'var(--ink)',
      fontStyle: 'italic'
    }
  }, "Tocha")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      color: 'var(--ink-4)',
      marginBottom: 40
    }
  }, "Painel Administrativo"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    type: "email",
    placeholder: "E-mail",
    value: email,
    onChange: e => setEmail(e.target.value),
    style: {
      marginBottom: 10,
      background: 'var(--panel)',
      display: 'block',
      width: '100%'
    }
  }), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    type: "password",
    placeholder: "Senha",
    value: pass,
    onChange: e => setPass(e.target.value),
    onKeyDown: e => e.key === 'Enter' && submit(),
    style: {
      marginBottom: 20,
      background: 'var(--panel)',
      display: 'block',
      width: '100%'
    }
  }), err && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--down)',
      fontSize: 12,
      marginBottom: 14
    }
  }, err), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      width: '100%',
      padding: '12px',
      fontSize: 13
    },
    onClick: submit,
    disabled: loading
  }, loading ? 'Verificando...' : 'Entrar')));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));