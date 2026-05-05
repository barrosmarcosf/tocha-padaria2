// ============================================================
// FOOTER
// ============================================================
const html = window.html;

function Footer() {
  return html`
    <footer data-screen-label="Footer" style=${{
      padding: '64px 40px 40px',
      background: 'oklch(9% 0.015 48)',
      borderTop: '1px solid var(--border)'
    }}>
      <div style=${{ maxWidth: 1240, margin: '0 auto' }}>

        <div style=${{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: 48,
          marginBottom: 56
        }}>

          <div>
            <img
              src="https://www.tochapadaria.com/assets/logo-footer%20(1).png"
              alt="Tocha Padaria"
              style=${{ height: 48, marginBottom: 20 }}
            />
            <p style=${{
              color: 'var(--text-dim)', fontSize: 14,
              lineHeight: 1.8, maxWidth: 300, fontWeight: 300
            }}>
              Padaria informal com respeito à longa fermentação. Fornadas aos sábados. Peça com antecedência.
            </p>
          </div>

          <div>
            <div style=${{
              fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--amber)', marginBottom: 20, fontWeight: 600
            }}>
              Site
            </div>
            ${[
              { label: 'Cardápio', href: '#cardapio' },
              { label: 'Como pedir', href: '#como-funciona' },
              { label: 'Food Service', href: '#foodservice' },
              { label: 'Nossa História', href: 'nossa-historia.html' },
              { label: 'Fale Conosco', href: 'fale-conosco.html' }
            ].map((l) => html`
              <a
                key=${l.label}
                href=${l.href}
                style=${{
                  display: 'block', color: 'var(--text-dim)',
                  textDecoration: 'none', fontSize: 14,
                  marginBottom: 10, transition: 'color 0.2s'
                }}
                onMouseEnter=${(e) => (e.currentTarget.style.color = 'var(--amber)')}
                onMouseLeave=${(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
              >
                ${l.label}
              </a>
            `)}
          </div>

          <div>
            <div style=${{
              fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--amber)', marginBottom: 20, fontWeight: 600
            }}>
              Contato
            </div>
            <a
              href="https://wa.me/5521966278965"
              target="_blank"
              rel="noopener"
              style=${{
                display: 'flex', alignItems: 'center', gap: 8,
                color: 'var(--text-dim)', textDecoration: 'none',
                fontSize: 14, marginBottom: 10
              }}
            >
              WhatsApp →
            </a>
            <a
              href="https://instagram.com/tocha.padaria"
              target="_blank"
              rel="noopener"
              style=${{
                display: 'flex', alignItems: 'center', gap: 8,
                color: 'var(--text-dim)', textDecoration: 'none', fontSize: 14
              }}
            >
              @tocha.padaria →
            </a>
          </div>

        </div>

        <div style=${{
          borderTop: '1px solid var(--border)',
          paddingTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <span style=${{ color: 'var(--text-dim)', fontSize: 12 }}>
            © Tocha Padaria desde 2022 — entre idas e vindas, erros e acertos. Nascido e produzido em São João de Meriti.
          </span>
          <span style=${{ color: 'var(--amber)', fontSize: 12, fontWeight: 600 }}>
            Feito com paciência e levain. ✦
          </span>
        </div>

      </div>
    </footer>
  `;
}

window.Footer = Footer;
