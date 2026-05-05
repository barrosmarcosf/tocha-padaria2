// ============================================================
// MENU SECTION
// ============================================================
const html = window.html;

const MENU_DATA = window.MENU_DATA || {};
const Reveal = window.Reveal || (({ children }) => children);
const ImagePlaceholder = window.ImagePlaceholder || (({ label }) => html`
  <div style=${{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: 12 }}>
    ${label}
  </div>
`);

const TAG_COLORS = {
  'Clássico': 'oklch(72% 0.12 60)',
  'Favorito': 'oklch(72% 0.12 60)',
  'Especial': 'oklch(65% 0.1 200)',
  'Novidade': 'oklch(65% 0.1 130)',
  'Exclusivo': 'oklch(55% 0.1 30)',
  'Sazonal': 'oklch(65% 0.1 160)',
  'Para Servir': 'oklch(65% 0.1 280)'
};

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
        border: '1px solid oklch(26% 0.02 50)',
        borderRadius: 8,
        overflow: 'hidden',
        transition: 'all 0.28s ease',
        transform: hovered ? 'translateY(-3px)' : 'none'
      }}
    >
      <div style=${{ aspectRatio: '16/10', overflow: 'hidden' }}>
        ${product.img
          ? html`<img src=${product.img} alt=${product.name} style=${{ width: '100%', height: '100%', objectFit: 'cover' }} />`
          : html`<${ImagePlaceholder} label=${product.name} />`
        }
      </div>

      <div style=${{ padding: 16 }}>
        <h3 style=${{ color: 'var(--cream)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          ${product.name}
        </h3>
        ${product.desc && html`
          <p style=${{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
            ${product.desc}
          </p>
        `}
        <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style=${{ color: 'var(--amber)', fontSize: 16, fontWeight: 700 }}>
            ${fmt(product.price)}
          </strong>
          <button
            onClick=${handleAdd}
            style=${{
              padding: '8px 16px',
              background: added ? 'oklch(55% 0.12 140)' : 'var(--amber)',
              color: 'oklch(12% 0.018 50)',
              border: 'none', borderRadius: 4, cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-sans)',
              transition: 'background 0.2s'
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
  const activeCategory = MENU_DATA[activeKey] || { items: [] };

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

        ${categories.length > 0 ? html`
          <div>
            <div style=${{ display: 'flex', gap: 8, marginBottom: 36, flexWrap: 'wrap' }}>
              ${categories.map(([key, cat]) => html`
                <button
                  key=${key}
                  onClick=${() => setActiveKey(key)}
                  style=${{
                    padding: '8px 20px',
                    background: activeKey === key ? 'var(--amber)' : 'none',
                    color: activeKey === key ? 'oklch(12% 0.018 50)' : 'var(--text-muted)',
                    border: '1px solid ' + (activeKey === key ? 'var(--amber)' : 'var(--border)'),
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.2s',
                    letterSpacing: '0.04em'
                  }}
                >
                  ${cat.label || key}
                </button>
              `)}
            </div>

            <div style=${{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
        ` : html`
          <p style=${{ color: 'var(--text-muted)', fontSize: 16 }}>Cardápio em breve.</p>
        `}

      </div>
    </section>
  `;
}

window.MenuSection = MenuSection;
