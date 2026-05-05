// ============================================================
// HERO
// ============================================================
const html = window.html;

function Hero({ status, scrollToMenu }) {
  const parallax = window.useParallax(0.25);

  return html`
    <section
      id="hero"
      data-screen-label="Hero"
      style=${{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        paddingLeft: 'clamp(140px, 18vw, 340px)'
      }}
    >
      <div style=${{
        position: 'absolute',
        inset: 0,
        transform: 'translateY(' + parallax + 'px)',
        willChange: 'transform'
      }}>
        <img
          src="https://www.tochapadaria.com/assets/sourdough.jpg"
          alt=""
          style=${{ width: '100%', height: '115%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style=${{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(105deg, oklch(10% 0.02 48 / 0.96) 0%, oklch(12% 0.018 50 / 0.7) 60%, oklch(12% 0.018 50 / 0.3) 100%)'
        }}></div>
      </div>

      <div style=${{
        position: 'absolute',
        inset: 0,
        opacity: 0.04,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'repeat',
        backgroundSize: '200px'
      }}></div>

      <div style=${{
        position: 'relative',
        zIndex: 2,
        padding: '0 24px 0 0',
        maxWidth: 900
      }}>
        <div style=${{
          display: 'inline-block',
          padding: '6px 16px',
          border: '1px solid var(--amber)',
          borderRadius: 2,
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--amber)',
          fontWeight: 600,
          marginBottom: 28,
          animation: 'fadeUp 0.8s ease 0.2s both'
        }}>
          Fermentação Natural · São João de Meriti
        </div>

        <h1 style=${{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(52px, 7vw, 96px)',
          fontWeight: 500,
          lineHeight: 1.05,
          color: 'var(--cream)',
          marginBottom: 28,
          animation: 'fadeUp 0.8s ease 0.35s both'
        }}>
          O pão que<br />
          <em style=${{ color: 'var(--amber)', fontStyle: 'italic' }}>transforma</em><br />
          o seu dia
        </h1>

        <p style=${{
          fontSize: 18,
          lineHeight: 1.7,
          color: 'var(--text-muted)',
          maxWidth: 480,
          marginBottom: 48,
          fontWeight: 300,
          animation: 'fadeUp 0.8s ease 0.5s both'
        }}>
          Cada pão nasce de levain vivo, farinha de qualidade e tempo. Não tem atalho — tem respeito.
        </p>

        <div style=${{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          animation: 'fadeUp 0.8s ease 0.65s both'
        }}>
          <a
            href="#cardapio"
            style=${{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--amber)',
              color: 'var(--bg)',
              padding: '16px 36px',
              borderRadius: 2,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              transition: 'all 0.25s'
            }}
            onMouseEnter=${(e) => {
              e.currentTarget.style.background = 'var(--amber-bright)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave=${(e) => {
              e.currentTarget.style.background = 'var(--amber)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Ver Cardápio <span style=${{ fontSize: 18 }}>→</span>
          </a>

          <a
            href="#como-funciona"
            onClick=${(e) => {
              e.preventDefault();
              const el = document.getElementById('como-funciona');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            style=${{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              border: '1px solid oklch(50% 0.02 60)',
              color: 'var(--text-muted)',
              padding: '16px 36px',
              borderRadius: 2,
              textDecoration: 'none',
              fontSize: 14,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              transition: 'all 0.25s',
              fontWeight: 500
            }}
            onMouseEnter=${(e) => {
              e.currentTarget.style.borderColor = 'var(--amber)';
              e.currentTarget.style.color = 'var(--amber)';
            }}
            onMouseLeave=${(e) => {
              e.currentTarget.style.borderColor = 'oklch(50% 0.02 60)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            Como pedir
          </a>
        </div>
      </div>

      <div style=${{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        color: 'var(--text-dim)',
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        animation: 'fadeUp 1s ease 1s both'
      }}>
        <div style=${{
          width: 1,
          height: 48,
          background: 'linear-gradient(to bottom, transparent, var(--amber))',
          animation: 'scrollLine 2s ease-in-out infinite'
        }}></div>
        scroll
      </div>
    </section>
  `;
}

window.Hero = Hero;
