// ============================================================
// MENU SECTION
// ============================================================
(function () {
  const html = window.html;
  const MENU_DATA = window.MENU_DATA || {};
  const ImagePlaceholder = window.ImagePlaceholder || (({ label }) => html`
    <div style=${{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: 12 }}>
      ${label}
    </div>
  `);

  function ProductCard({ product, onAdd }) {
    const [hovered, setHovered] = React.useState(false);
    const [added, setAdded] = React.useState(false);

    function handleAdd() {
      onAdd(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }

    const fmt = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');

    return html`
      <div
        onMouseEnter=${() => setHovered(true)}
        onMouseLeave=${() => setHovered(false)}
        style=${{
          background: hovered ? 'oklch(19% 0.022 48)' : 'oklch(16% 0.02 48)',
          border: '1px solid ' + (hovered ? 'oklch(36% 0.028 55)' : 'oklch(26% 0.02 50)'),
          borderRadius: 8,
          overflow: 'hidden',
          transition: 'all 0.28s ease',
          transform: hovered ? 'translateY(-3px)' : 'none',
          boxShadow: hovered ? '0 8px 24px oklch(0% 0 0 / 0.3)' : 'none',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style=${{ aspectRatio: '16/10', overflow: 'hidden', flexShrink: 0 }}>
          ${product.img
            ? html`<img
                src=${product.img}
                alt=${product.name}
                style=${{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transform: hovered ? 'scale(1.04)' : 'scale(1)',
                  transition: 'transform 0.55s ease'
                }}
              />`
            : html`<${ImagePlaceholder} label=${product.name} />`
          }
        </div>

        <div style=${{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style=${{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
            <h3 style=${{ color: 'var(--cream)', fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
              ${product.name}
            </h3>
            ${product.tag && html`
              <span style=${{
                fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'oklch(12% 0.018 50)',
                background: window.T ? window.T.tag(product.tag) : 'var(--amber)',
                padding: '3px 7px', borderRadius: 3, flexShrink: 0,
                fontWeight: 700, lineHeight: 1
              }}>
                ${product.tag}
              </span>
            `}
          </div>
          ${product.desc && html`
            <p style=${{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5, marginBottom: 12, flex: 1 }}>
              ${product.desc}
            </p>
          `}
          <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <strong style=${{ color: 'var(--amber)', fontSize: 15, fontWeight: 700 }}>
              ${fmt(product.price)}
            </strong>
            <button
              onClick=${handleAdd}
              style=${{
                padding: '7px 14px',
                background: added ? 'oklch(55% 0.12 140)' : 'var(--amber)',
                color: 'oklch(12% 0.018 50)',
                border: 'none', borderRadius: 4, cursor: 'pointer',
                fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-sans)',
                transition: 'background 0.2s',
                letterSpacing: '0.02em'
              }}
            >
              ${added ? '✓ Adicionado' : '+ Adicionar'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function MenuSection({ cart, onAdd, config }) {
    const categories = Object.entries(MENU_DATA);
    const [activeKey, setActiveKey] = React.useState(categories[0]?.[0] || '');
    const [transitioning, setTransitioning] = React.useState(false);
    const activeCategory = MENU_DATA[activeKey] || { items: [], desc: '' };

    function switchCategory(key) {
      if (key === activeKey || transitioning) return;
      setTransitioning(true);
      setTimeout(() => {
        setActiveKey(key);
        setTransitioning(false);
      }, 160);
    }

    return html`
      <section id="cardapio" style=${{
        padding: '100px 0',
        background: 'var(--bg-menu, var(--bg))'
      }}>
        <div style=${{ maxWidth: 1500, margin: '0 auto', padding: '0 56px' }}>

          <div style=${{ marginBottom: 48 }}>
            <div style=${{
              fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--amber)', marginBottom: 12, fontWeight: 600
            }}>
              Cardápio
            </div>
            <h2 style=${{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(36px, 4.5vw, 56px)',
              fontWeight: 500, color: 'var(--cream)', lineHeight: 1.1
            }}>
              Feito com paciência
            </h2>
          </div>

          <div style=${{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>

            <nav style=${{
              width: 200,
              flexShrink: 0,
              position: 'sticky',
              top: 120
            }}>
              ${categories.map(([key, cat]) => html`
                <button
                  key=${key}
                  onClick=${() => switchCategory(key)}
                  style=${{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 14px',
                    background: activeKey === key ? 'oklch(18% 0.022 48)' : 'none',
                    color: activeKey === key ? 'var(--cream)' : 'var(--text-muted)',
                    border: 'none',
                    borderLeft: '2px solid ' + (activeKey === key ? 'var(--amber)' : 'transparent'),
                    borderRadius: '0 6px 6px 0',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: activeKey === key ? 600 : 400,
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    letterSpacing: '0.02em',
                    marginBottom: 2
                  }}
                  onMouseEnter=${(e) => {
                    if (activeKey !== key) {
                      e.currentTarget.style.color = 'var(--cream)';
                      e.currentTarget.style.background = 'oklch(15% 0.02 48)';
                    }
                  }}
                  onMouseLeave=${(e) => {
                    if (activeKey !== key) {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.background = 'none';
                    }
                  }}
                >
                  <span style=${{ fontSize: 16 }}>${cat.icon || ''}</span>
                  <span>${key}</span>
                </button>
              `)}
            </nav>

            <div style=${{
              flex: 1,
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? 'translateY(6px)' : 'translateY(0)',
              transition: 'opacity 0.16s ease, transform 0.16s ease'
            }}>
              ${activeCategory.desc && html`
                <p style=${{
                  color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6,
                  marginBottom: 24,
                  paddingBottom: 20,
                  borderBottom: '1px solid oklch(22% 0.02 50)'
                }}>
                  ${activeCategory.desc}
                </p>
              `}

              <div style=${{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 20
              }}>
                ${activeCategory.items.map((product) => html`
                  <${ProductCard}
                    key=${product.id}
                    product=${product}
                    onAdd=${onAdd}
                  />
                `)}
              </div>
            </div>

          </div>

        </div>
      </section>
    `;
  }

  window.MenuSection = MenuSection;
}());
