/* global React, ReactDOM, Sidebar, Topbar, NAV */

const AUTH_KEY = 'tocha_admin_token';

function App() {
  const [page, setPage] = React.useState(
    localStorage.getItem('tocha_admin_section') || 'home'
  );
  const [authed, setAuthed] = React.useState(!!localStorage.getItem(AUTH_KEY));

  const navItem = NAV.find(n => n.id === page);
  const label = navItem ? navItem.label : 'Início';

  const handleNavigate = (id) => {
    if (id === 'logout') {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem('tocha_admin_user');
      setAuthed(false);
      return;
    }
    setPage(id);
    localStorage.setItem('tocha_admin_section', id);
  };

  if (!authed) return <Login onAuth={() => setAuthed(true)} />;

  return (
    <div className="app">
      <Sidebar active={page} onNavigate={handleNavigate}/>
      <div className="main">
        <Topbar pageLabel={label} onNavigate={handleNavigate}/>
        <div className="page">
          <div className="page-head">
            <div>
              <h1><em>{label}</em></h1>
              <p className="sub">Módulo em implementação</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Login({ onAuth }) {
  const [email, setEmail] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');

  const submit = async () => {
    if (!email || !pass) { setErr('Preencha todos os campos'); return; }
    setLoading(true); setErr('');
    try {
      const resp = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
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

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-deep)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{ width: 340, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 32, height: 32, border: '1px solid var(--gold-line)',
            borderRadius: 4, display: 'grid', placeItems: 'center',
            fontFamily: 'var(--display)', fontSize: 18, color: 'var(--gold)',
          }}>T</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 20, color: 'var(--ink)', fontStyle: 'italic' }}>Tocha</div>
        </div>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--ink-4)', marginBottom: 40 }}>Painel Administrativo</div>
        <input
          className="inp" type="email" placeholder="E-mail"
          value={email} onChange={e => setEmail(e.target.value)}
          style={{ marginBottom: 10, background: 'var(--panel)', display: 'block', width: '100%' }}
        />
        <input
          className="inp" type="password" placeholder="Senha"
          value={pass} onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ marginBottom: 20, background: 'var(--panel)', display: 'block', width: '100%' }}
        />
        {err && <div style={{ color: 'var(--down)', fontSize: 12, marginBottom: 14 }}>{err}</div>}
        <button
          className="btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: 13 }}
          onClick={submit}
          disabled={loading}
        >
          {loading ? 'Verificando...' : 'Entrar'}
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
