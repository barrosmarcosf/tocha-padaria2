// ============================================================
// MENU SECTION
// ============================================================

// 👇 GARANTE QUE NÃO QUEBRE SE NÃO EXISTIR
const MENU_DATA = window.MENU_DATA || {};
const PRODUCTS_FLAT = window.PRODUCTS_FLAT || [];
const Reveal = window.Reveal || (({ children }) => children);
const ImagePlaceholder = window.ImagePlaceholder || (({ label }) => (
  <div style={{
    width: '100%',
    height: '100%',
    background: '#111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    fontSize: 12,
    textAlign: 'center'
  }}>
    {label}
  </div>
));

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
  const [qty, setQty] = React.useState(1);
  const [added, setAdded] = React.useState(false);

  function handleAdd() {
    for (let i = 0; i < qty; i++) onAdd(product);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setQty(1);
    }, 1800);
  }

  function changeQty(delta) {
    setQty((q) => Math.max(1, Math.min(99, q + delta)));
  }

  const tagColor = TAG_COLORS[product.tag] || 'oklch(55% 0.015 65)';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'oklch(19% 0.022 48)' : 'oklch(16% 0.02 48)',
        border: '1px solid oklch(26% 0.02 50)',
        borderRadius: 8,
        overflow: 'hidden',
        transition: 'all 0.28s ease',
        transform: hovered ? 'translateY(-3px)' : 'none'
      }}
    >
      <div style={{ aspectRatio: '16/10' }}>
        {product.img ? (
          <img src={product.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <ImagePlaceholder label={product.name} />
        )}
      </div>

      <div style={{ padding: 16 }}>
        <h3 style={{ color: 'white' }}>{product.name}</h3>
        <p style={{ color: '#aaa' }}>{product.desc}</p>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong style={{ color: 'var(--amber)' }}>
            {formatPrice(product.price * qty)}
          </strong>

          <button onClick={handleAdd}>
            {added ? '✓' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================

function MenuSection({ onAdd }) {
  const categories = Object.entries(MENU_DATA);

  const [activeKey, setActiveKey] = React.useState(
    categories[0]?.[0] || ''
  );

  const activeCategory = MENU_DATA[activeKey] || { items: [] };

  return (
    <section id="menu">
      <h2>Cardápio</h2>

      <div style={{ display: 'flex', gap: 40 }}>
        
        {/* Sidebar */}
        <div>
          {categories.map(([key]) => (
            <button key={key} onClick={() => setActiveKey(key)}>
              {key}
            </button>
          ))}
        </div>

        {/* Produtos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: 20
        }}>
          {activeCategory.items.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={onAdd}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

// 👇 ESSENCIAL
window.MenuSection = MenuSection;