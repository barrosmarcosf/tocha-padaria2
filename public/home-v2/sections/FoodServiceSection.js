// ============================================================
// FOODSERVICE SECTION (B2B)
// ============================================================
(function () {
  const html = window.html;
  const Reveal = window.Reveal;
  const ImagePlaceholder = window.ImagePlaceholder;

  function FoodServiceSection() {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;

    return html`
      <section
        id="foodservice"
        data-screen-label="Foodservice"
        style=${{
          padding: isMobile ? '80px 0' : '100px 0',
          background: 'oklch(10% 0.018 48)',
          borderTop: '1px solid var(--border)'
        }}
      >
        <div style=${{ maxWidth: 1480, margin: '0 auto', padding: '0 24px' }}>
          <div style=${{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? 48 : 64,
            alignItems: 'center'
          }}>

            <${Reveal}>
              <div style=${{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                aspectRatio: '1'
              }}>
                ${[
                  'restaurante mesa posta elegante',
                  'cesta de paes artesanal',
                  'cafeteria vitrine paes',
                  'brunch tostas gourmet'
                ].map((label, i) => html`
                  <div key=${i} style=${{
                    borderRadius: 6,
                    overflow: 'hidden',
                    background: 'oklch(20% 0.02 48)'
                  }}>
                    <${ImagePlaceholder} label=${label} />
                  </div>
                `)}
              </div>
            <//>

            <${Reveal} delay=${0.1}>
              <div>
                <div style=${{
                  fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: 'var(--amber)', marginBottom: 16, fontWeight: 600
                }}>
                  B2B & Parcerias
                </div>
                <h2 style=${{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(32px, 4vw, 52px)',
                  fontWeight: 600, color: 'var(--cream)',
                  lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.01em'
                }}>
                  Foodservice
                </h2>
                <p style=${{
                  fontSize: 15, color: 'var(--text-muted)',
                  lineHeight: 1.75, fontWeight: 300,
                  marginBottom: 28, maxWidth: 520
                }}>
                  Pães artesanais com padrão consistente para restaurantes,
                  cafeterias e operações que valorizam qualidade e experiência.
                  Produção organizada, fornecimento confiável e possibilidade de
                  adaptação conforme sua demanda.
                </p>
                <a
                  href="https://wa.me/5521966278965?text=Ol%C3%A1%21+Tenho+interesse+em+foodservice."
                  target="_blank"
                  rel="noopener noreferrer"
                  style=${{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                    background: 'var(--cream)', color: 'oklch(12% 0.018 50)',
                    padding: '16px 32px', borderRadius: 6, textDecoration: 'none',
                    fontWeight: 700, fontSize: 13, letterSpacing: '0.12em',
                    textTransform: 'uppercase', transition: 'all 0.25s'
                  }}
                  onMouseEnter=${(e) => {
                    e.currentTarget.style.background = 'var(--amber)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave=${(e) => {
                    e.currentTarget.style.background = 'var(--cream)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Falar no WhatsApp →
                </a>
              </div>
            <//>

          </div>
        </div>
      </section>
    `;
  }

  window.FoodServiceSection = FoodServiceSection;
}());
