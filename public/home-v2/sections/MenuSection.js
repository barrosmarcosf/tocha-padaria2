// ============================================================
// MENU SECTION
// ============================================================
(function () {
  const html    = window.html;
  const Reveal  = window.Reveal;
  const MENU_DATA     = window.MENU_DATA || {};
  const PRODUCTS_FLAT = window.PRODUCTS_FLAT || [];

  const TAG_COLORS = {
    'Clássico':    'oklch(72% 0.12 60)',
    'Favorito':    'oklch(72% 0.12 60)',
    'Especial':    'oklch(65% 0.1 200)',
    'Novidade':    'oklch(65% 0.1 130)',
    'Exclusivo':   'oklch(55% 0.1 30)',
    'Sazonal':     'oklch(65% 0.1 160)',
    'Para Servir': 'oklch(65% 0.1 280)',
  };

  function formatPrice(p) {
    return 'R$ ' + Number(p).toFixed(2).replace('.', ',');
  }

  function ImagePlaceholder({ label }) {
    return html`
      <div style=${{
        width: '100%', height: '100%',
        background: 'oklch(14% 0.018 48)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'oklch(40% 0.01 60)', fontSize: 12
      }}>${label}</div>
    `;
  }

  function ProductCard({ product, onAdd }) {
    const [hovered, setHovered] = React.useState(false);
    const [qty, setQty]         = React.useState(1);
    const [added, setAdded]     = React.useState(false);

    function handleAdd() {
      for (let i = 0; i < qty; i++) onAdd(product);
      setAdded(true);
      setTimeout(() => { setAdded(false); setQty(1); }, 1800);
    }

    function changeQty(delta) {
      setQty((q) => Math.max(1, Math.min(99, q + delta)));
    }

    const tagColor = TAG_COLORS[product.tag] || 'oklch(55% 0.015 65)';
    const borderClr = 'oklch(26% 0.02 50)';

    return html`
      <div
        onMouseEnter=${() => setHovered(true)}
        onMouseLeave=${() => setHovered(false)}
        style=${{
          background:    hovered ? 'oklch(19% 0.022 48)' : 'oklch(16% 0.02 48)',
          border:        '1px solid ' + (hovered ? 'oklch(36% 0.028 55)' : borderClr),
          borderRadius:  8,
          overflow:      'hidden',
          transition:    'all 0.28s ease',
          transform:     hovered ? 'translateY(-3px)' : 'translateY(0)',
          boxShadow:     hovered ? '0 12px 36px oklch(0% 0 0 / 0.35)' : 'none',
          display:       'flex',
          flexDirection: 'column',
          height:        '100%',
        }}
      >
        <div style=${{ aspectRatio: '16/10', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
          ${product.img
            ? html`<img
                src=${product.img}
                alt=${product.name}
                style=${{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transform: hovered ? 'scale(1.06)' : 'scale(1)',
                  transition: 'transform 0.55s ease',
                }}
              />`
            : html`<${ImagePlaceholder} label=${'foto\n' + product.name} />`
          }
          <div style=${{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, oklch(16% 0.02 48 / 0.4) 0%, transparent 50%)',
          }} />
          ${product.tag && html`
            <div style=${{
              position: 'absolute', top: 10, left: 10,
              background: 'oklch(10% 0.015 48 / 0.88)',
              backdropFilter: 'blur(10px)',
              border: '1px solid ' + tagColor,
              color: tagColor,
              padding: '3px 9px', borderRadius: 3,
              fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
            }}>
              ${product.tag}
            </div>
          `}
        </div>

        <div style=${{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <h3 style=${{
              fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 500,
              color: 'oklch(93% 0.01 72)', lineHeight: 1.25, flex: 1,
            }}>
              ${product.name}
            </h3>
            <span style=${{
              color: 'oklch(72% 0.12 60)', fontWeight: 700, fontSize: 16,
              whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
            }}>
              ${formatPrice(product.price * qty)}
            </span>
          </div>

          <p style=${{ fontSize: 13, color: 'oklch(60% 0.015 65)', lineHeight: 1.6, fontWeight: 300, flex: 1 }}>
            ${product.desc}
          </p>

          <div style=${{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'stretch' }}>
            <div style=${{
              display: 'flex', alignItems: 'center',
              background: 'oklch(20% 0.02 48)',
              border: '1px solid ' + borderClr,
              borderRadius: 5, overflow: 'hidden', flexShrink: 0,
            }}>
              <button
                onClick=${(e) => { e.stopPropagation(); changeQty(-1); }}
                style=${{
                  width: 32, height: '100%', minHeight: 36,
                  background: 'none', border: 'none',
                  cursor: qty > 1 ? 'pointer' : 'default',
                  color: qty > 1 ? 'oklch(70% 0.012 70)' : 'oklch(35% 0.01 60)',
                  fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'color 0.15s', fontFamily: 'var(--font-sans)',
                }}
              >−</button>
              <span style=${{
                minWidth: 24, textAlign: 'center',
                fontSize: 14, fontWeight: 700,
                color: 'oklch(88% 0.012 70)',
                fontVariantNumeric: 'tabular-nums',
              }}>${qty}</span>
              <button
                onClick=${(e) => { e.stopPropagation(); changeQty(1); }}
                style=${{
                  width: 32, height: '100%', minHeight: 36,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'oklch(72% 0.12 60)',
                  fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'color 0.15s', fontFamily: 'var(--font-sans)',
                }}
              >+</button>
            </div>

            <button
              onClick=${handleAdd}
              style=${{
                flex: 1, padding: '0 12px', minHeight: 36,
                background: added
                  ? 'oklch(55% 0.12 140)'
                  : hovered ? 'oklch(72% 0.12 60)' : 'oklch(22% 0.022 48)',
                border: '1px solid ' + (added
                  ? 'oklch(55% 0.12 140)'
                  : hovered ? 'oklch(72% 0.12 60)' : borderClr),
                color: added ? '#fff' : hovered ? 'oklch(12% 0.018 50)' : 'oklch(60% 0.015 65)',
                borderRadius: 5, cursor: 'pointer',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                transition: 'all 0.22s', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
              }}
            >
              ${added ? '✓ Ok!' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function CategoryNav({ categories, active, onChange }) {
    return html`
      <nav style=${{
        display: 'flex', flexDirection: 'column', gap: 2,
        position: 'sticky', top: 120,
      }}>
        ${categories.map(([key, cat]) => html`
          <button
            key=${key}
            onClick=${() => onChange(key)}
            style=${{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 6,
              border: 'none', cursor: 'pointer', textAlign: 'left',
              background: active === key ? 'oklch(20% 0.025 52)' : 'transparent',
              transition: 'all 0.18s', fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter=${(e) => { if (active !== key) e.currentTarget.style.background = 'oklch(18% 0.02 50)'; }}
            onMouseLeave=${(e) => { if (active !== key) e.currentTarget.style.background = 'transparent'; }}
          >
            <span style=${{ fontSize: 18, lineHeight: 1 }}>${cat.icon}</span>
            <div style=${{ flex: 1 }}>
              <div style=${{
                fontSize: 13, fontWeight: active === key ? 700 : 500,
                color: active === key ? 'oklch(72% 0.12 60)' : 'oklch(65% 0.015 65)',
                transition: 'color 0.18s',
              }}>${key}</div>
              <div style=${{ fontSize: 11, color: 'oklch(42% 0.01 60)', marginTop: 1 }}>
                ${cat.items.length} itens
              </div>
            </div>
            ${active === key && html`
              <div style=${{ width: 3, height: 3, borderRadius: '50%', background: 'oklch(72% 0.12 60)', flexShrink: 0 }} />
            `}
          </button>
        `)}
      </nav>
    `;
  }

  function MenuSection({ cart, onAdd, config }) {
    const categories = Object.entries(MENU_DATA);
    const [activeKey, setActiveKey]       = React.useState(categories[0]?.[0] || '');
    const [search, setSearch]             = React.useState('');
    const [searchFocused, setSearchFocused] = React.useState(false);

    const activeCategory = MENU_DATA[activeKey] || { items: [], desc: '', icon: '' };

    const searchResults = React.useMemo(() => {
      if (!search.trim()) return null;
      const q = search.toLowerCase();
      return PRODUCTS_FLAT.filter((p) =>
        p.name.toLowerCase().includes(q) || (p.desc || '').toLowerCase().includes(q)
      );
    }, [search]);

    const displayItems = searchResults || activeCategory.items;
    const displayTitle = searchResults
      ? searchResults.length + ' resultado' + (searchResults.length !== 1 ? 's' : '') + ' para "' + search + '"'
      : activeKey;

    return html`
      <section id="cardapio" style=${{
        padding: '100px 0 120px',
        background: 'oklch(11% 0.018 49)',
      }}>
        <div style=${{ maxWidth: 1560, margin: '0 auto', padding: '0 56px' }}>

          <${Reveal}>
            <div style=${{
              marginBottom: 56,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              flexWrap: 'wrap', gap: 24,
            }}>
              <div>
                <div style=${{
                  fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: 'oklch(72% 0.12 60)', marginBottom: 12, fontWeight: 600,
                }}>Cardápio</div>
                <h2 style=${{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(36px, 4.5vw, 56px)',
                  fontWeight: 500, color: 'oklch(94% 0.01 75)', lineHeight: 1.1,
                }}>
                  O que sai do<br />
                  <em style=${{ color: 'oklch(72% 0.12 60)', fontStyle: 'italic' }}>nosso forno</em>
                </h2>
              </div>

              <div style=${{ position: 'relative', minWidth: 260 }}>
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value=${search}
                  onChange=${(e) => setSearch(e.target.value)}
                  onFocus=${() => setSearchFocused(true)}
                  onBlur=${() => setSearchFocused(false)}
                  style=${{
                    width: '100%', padding: '12px 16px 12px 40px',
                    background: 'oklch(16% 0.02 48)',
                    border: '1px solid ' + (searchFocused || search ? 'oklch(72% 0.12 60)' : 'oklch(28% 0.02 50)'),
                    borderRadius: 8, color: 'oklch(90% 0.012 70)',
                    fontSize: 14, fontFamily: 'var(--font-sans)',
                    outline: 'none', transition: 'border-color 0.2s',
                  }}
                />
                <span style=${{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  color: 'oklch(50% 0.01 60)', fontSize: 16, pointerEvents: 'none',
                }}>⌕</span>
                ${search && html`
                  <button
                    onClick=${() => setSearch('')}
                    style=${{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'oklch(50% 0.01 60)', fontSize: 16, padding: 4,
                    }}
                  >×</button>
                `}
              </div>
            </div>
          <//>

          <div style=${{
            display: 'grid',
            gridTemplateColumns: '220px 1fr',
            gap: 48,
            alignItems: 'start',
          }}>

            ${!searchResults && html`
              <${Reveal}>
                <${CategoryNav}
                  categories=${categories}
                  active=${activeKey}
                  onChange=${setActiveKey}
                />
              <//>
            `}

            <div style=${{ gridColumn: searchResults ? '1 / -1' : 'auto' }}>
              <${Reveal}>
                <div style=${{ marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid oklch(22% 0.02 50)' }}>
                  ${!searchResults && html`
                    <div style=${{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      <span style=${{ fontSize: 28 }}>${activeCategory.icon}</span>
                      <h3 style=${{
                        fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 500,
                        color: 'oklch(93% 0.01 72)',
                      }}>${activeKey}</h3>
                      <span style=${{
                        background: 'oklch(72% 0.12 60 / 0.12)',
                        border: '1px solid oklch(72% 0.12 60 / 0.3)',
                        color: 'oklch(72% 0.12 60)',
                        padding: '3px 10px', borderRadius: 20,
                        fontSize: 12, fontWeight: 600,
                      }}>${activeCategory.items.length}</span>
                    </div>
                  `}
                  <p style=${{ fontSize: 14, color: 'oklch(55% 0.015 65)', lineHeight: 1.6, fontWeight: 300 }}>
                    ${searchResults
                      ? html`<span style=${{ color: 'oklch(72% 0.12 60)', fontWeight: 600 }}>${displayTitle}</span>`
                      : activeCategory.desc
                    }
                  </p>
                </div>
              <//>

              ${displayItems.length === 0
                ? html`
                    <div style=${{ textAlign: 'center', padding: '60px 20px', color: 'oklch(50% 0.01 60)' }}>
                      <div style=${{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                      <div style=${{ fontFamily: 'var(--font-serif)', fontSize: 20 }}>Nenhum resultado encontrado</div>
                    </div>
                  `
                : html`
                    <div style=${{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap: 20,
                    }}>
                      ${displayItems.map((product, i) => html`
                        <${Reveal} key=${product.id} delay=${Math.min(i * 0.05, 0.3)}>
                          <${ProductCard} product=${product} onAdd=${onAdd} />
                        <//>
                      `)}
                    </div>
                  `
              }
            </div>

          </div>

        </div>
      </section>
    `;
  }

  window.MenuSection = MenuSection;
}());
