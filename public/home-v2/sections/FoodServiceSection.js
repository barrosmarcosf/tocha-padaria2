// ============================================================
// FOODSERVICE SECTION (B2B) — entry point para /food-service.html
// ============================================================
(function () {
  const html = window.html;
  const Reveal = window.Reveal;

  const FS_PAGE = '/food-service.html';

  const THUMBNAILS = [
    { src: '/assets/foodservice1.png', alt: 'Fornecimento para restaurantes' },
    { src: '/assets/foodservice2.png', alt: 'Pães artesanais em escala' },
    { src: '/assets/foodservice3.png', alt: 'Cafeteria e hamburguerias' },
    { src: '/assets/foodservice4.png', alt: 'Eventos e brunch gourmet' },
  ];

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

            <!-- imagens: cada uma é um link para /food-service.html -->
            <${Reveal}>
              <a
                href=${FS_PAGE}
                style=${{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  aspectRatio: '1',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
                aria-label="Ver página Food Service"
              >
                ${THUMBNAILS.map((t, i) => html`
                  <div
                    key=${i}
                    style=${{
                      borderRadius: 6,
                      overflow: 'hidden',
                      background: 'oklch(20% 0.02 48)',
                      transition: 'opacity 0.22s',
                      aspectRatio: '1'
                    }}
                    onMouseEnter=${(e) => { e.currentTarget.style.opacity = '0.82'; }}
                    onMouseLeave=${(e) => { e.currentTarget.style.opacity = '1'; }}
                  >
                    <img
                      src=${t.src}
                      alt=${t.alt}
                      style=${{
                        width: '100%', height: '100%',
                        objectFit: 'cover', display: 'block'
                      }}
                      loading="lazy"
                    />
                  </div>
                `)}
              </a>
            <//>

            <${Reveal} delay=${0.1}>
              <div>
                <div style=${{
                  fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: 'var(--amber)', marginBottom: 16, fontWeight: 600
                }}>
                  B2B &amp; Parcerias
                </div>

                <h2 style=${{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(32px, 4vw, 52px)',
                  fontWeight: 600, color: 'var(--cream)',
                  lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.01em'
                }}>
                  Fornecimento para<br/>o seu negócio
                </h2>

                <p style=${{
                  fontSize: 15, color: 'var(--text-muted)',
                  lineHeight: 1.75, fontWeight: 300,
                  marginBottom: 12, maxWidth: 520
                }}>
                  Pães artesanais em escala para restaurantes, cafeterias,
                  hamburguerias e eventos. Produção sob demanda, personalização
                  completa e qualidade consistente a cada fornada.
                </p>

                <p style=${{
                  fontSize: 14, color: 'var(--text-dim)',
                  lineHeight: 1.7, fontWeight: 300,
                  marginBottom: 32, maxWidth: 520
                }}>
                  Tamanho, peso, receita e embalagem — tudo adaptado
                  ao ritmo da sua operação.
                </p>

                <div style=${{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <a
                    href=${FS_PAGE}
                    style=${{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      background: 'var(--cream)', color: 'oklch(12% 0.018 50)',
                      padding: '15px 30px', borderRadius: 4, textDecoration: 'none',
                      fontWeight: 700, fontSize: 13, letterSpacing: '0.1em',
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
                    Ver produtos B2B →
                  </a>

                  <a
                    href=${'https://wa.me/' + ((window.SITE_CONFIG && window.SITE_CONFIG.phone) || '5521966278965') + '?text=Ol%C3%A1%21+Tenho+interesse+em+foodservice.+Gostaria+de+mais+informa%C3%A7%C3%B5es.'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style=${{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      border: '1px solid oklch(50% 0.02 60)',
                      color: 'var(--text-muted)',
                      padding: '15px 30px', borderRadius: 4, textDecoration: 'none',
                      fontWeight: 500, fontSize: 13, letterSpacing: '0.1em',
                      textTransform: 'uppercase', transition: 'all 0.25s'
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
                    Falar no WhatsApp
                  </a>
                </div>
              </div>
            <//>

          </div>
        </div>
      </section>
    `;
  }

  window.FoodServiceSection = FoodServiceSection;
}());
