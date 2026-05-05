// ============================================================
// NAVBAR
// ============================================================
(function () {
  const html = window.html;

  function Navbar({ cartCount, onCartOpen }) {
    const scrolled = window.useScrolled(60);

    const navStyle = {
      position: 'fixed',
      top: scrolled ? 0 : 40,
      left: 0,
      right: 0,
      zIndex: 100,
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 64,
      background: scrolled ? 'oklch(12% 0.018 50 / 0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid oklch(28% 0.02 50)' : '1px solid transparent',
      transition: 'all 0.4s ease'
    };

    const links = [
      { label: 'Início', href: '#hero' },
      { label: 'Cardápio', href: '#cardapio' },
      { label: 'Como pedir', href: '#como-funciona' },
      { label: 'Food Service', href: '#foodservice' },
      { label: 'Nossa História', href: '#nossa-historia' },
      { label: 'Fale Conosco', href: '#contato' }
    ];

    return html`
      <nav style=${navStyle}>
        <a href="#hero" style=${{ textDecoration: 'none' }}>
          <img
            src="https://www.tochapadaria.com/assets/logo.png"
            alt="Tocha Padaria"
            style=${{ height: 40, filter: 'brightness(1.1)' }}
          />
        </a>

        <div style=${{
          display: 'flex',
          gap: 32,
          alignItems: 'center',
          fontFamily: '"DM Sans"'
        }}>
          ${links.map((l) => html`
            <a
              key=${l.label}
              href=${l.href}
              style=${{
                color: 'var(--text-muted)',
                textDecoration: 'none',
                fontSize: 13,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontWeight: 500,
                transition: 'color 0.2s'
              }}
              onMouseEnter=${(e) => (e.target.style.color = 'var(--amber)')}
              onMouseLeave=${(e) => (e.target.style.color = 'var(--text-muted)')}
            >
              ${l.label}
            </a>
          `)}

          <button
            onClick=${onCartOpen}
            style=${{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '8px 18px',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.04em',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-sans)'
            }}
            onMouseEnter=${(e) => {
              e.currentTarget.style.background = 'var(--amber)';
              e.currentTarget.style.color = 'var(--bg)';
              e.currentTarget.style.borderColor = 'var(--amber)';
            }}
            onMouseLeave=${(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--text)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <span>🧺</span>
            <span>Pedido</span>
            ${cartCount > 0 && html`
              <span style=${{
                background: 'var(--amber)',
                color: 'var(--bg)',
                borderRadius: '50%',
                width: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700
              }}>
                ${cartCount}
              </span>
            `}
          </button>
        </div>
      </nav>
    `;
  }

  window.Navbar = Navbar;
}());
