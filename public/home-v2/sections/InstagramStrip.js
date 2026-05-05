// ============================================================
// INSTAGRAM STRIP
// ============================================================
(function () {
  const html = window.html;
  const Reveal = window.Reveal;
  const ImagePlaceholder = window.ImagePlaceholder;

  function InstagramStrip() {
    const [hoverIndex, setHoverIndex] = React.useState(null);

    const items = [
      'bastidores da fornada',
      'o levain crescendo',
      'pão saindo do forno',
      'corte do sourdough'
    ];

    return html`
      <section
        data-screen-label="Instagram"
        style=${{ padding: '100px 0', background: 'var(--bg)' }}
      >
        <div style=${{ maxWidth: 1500, margin: '0 auto', padding: '0 56px' }}>

          <${Reveal}>
            <div style=${{ textAlign: 'center', marginBottom: 56 }}>
              <div style=${{
                fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--amber)', marginBottom: 16, fontWeight: 600
              }}>
                Nos acompanhe
              </div>
              <h2 style=${{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(32px, 4vw, 48px)',
                fontWeight: 500, color: 'var(--cream)'
              }}>
                Cada fornada,<br />
                <em style=${{ color: 'var(--amber)', fontStyle: 'italic' }}>uma história</em>
              </h2>
            </div>
          <//>

          <div style=${{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 40
          }}>
            ${items.map((label, i) => html`
              <${Reveal} key=${i} delay=${i * 0.1}>
                <div
                  style=${{
                    aspectRatio: '1',
                    borderRadius: 4,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onMouseEnter=${() => setHoverIndex(i)}
                  onMouseLeave=${() => setHoverIndex(null)}
                >
                  <${ImagePlaceholder} label=${label} />
                  <div style=${{
                    position: 'absolute', inset: 0,
                    background: 'oklch(72% 0.12 60 / 0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: hoverIndex === i ? 1 : 0,
                    transition: 'opacity 0.25s'
                  }}>
                    <span style=${{ color: 'white', fontSize: 28 }}>♥</span>
                  </div>
                </div>
              <//>
            `)}
          </div>

          <${Reveal} delay=${0.3}>
            <div style=${{ textAlign: 'center' }}>
              <a
                href="https://instagram.com/tocha.padaria"
                target="_blank"
                rel="noopener noreferrer"
                style=${{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  border: '1px solid var(--border)', color: 'var(--text-muted)',
                  padding: '14px 32px', borderRadius: 2, textDecoration: 'none',
                  fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
                  transition: 'all 0.25s', fontWeight: 500
                }}
                onMouseEnter=${(e) => {
                  e.currentTarget.style.borderColor = 'var(--amber)';
                  e.currentTarget.style.color = 'var(--amber)';
                }}
                onMouseLeave=${(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                @tocha.padaria →
              </a>
            </div>
          <//>

        </div>
      </section>
    `;
  }

  window.InstagramStrip = InstagramStrip;
}());
