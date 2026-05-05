(function () {
  'use strict';

  const { useState, useEffect, useRef, useMemo } = window.React;
  const html        = window.htm.bind(window.React.createElement);
  const T           = window.T;
  const useIsMobile = window.useIsMobile;
  const CategoryNav = window.CategoryNav;
  const ProductCard = window.ProductCard;

  // ── Mock data (fallback quando config ainda não chegou) ──────────

  const MOCK_CATEGORIES = [
    { id: 'paes',      label: 'Pães Naturais' },
    { id: 'brioches',  label: 'Brioches'      },
    { id: 'doces',     label: 'Doces'         },
    { id: 'especiais', label: 'Especiais'     },
  ];

  const MOCK_PRODUCTS = [
    { id: 1, category: 'paes',      name: 'Pão de Fermentação Natural', description: 'Massa hidratada, fermentação de 18 horas, crosta crocante e miolo aberto.',     price: 28, tag: 'Clássico'  },
    { id: 2, category: 'paes',      name: 'Pão Integral com Sementes',  description: 'Farinha integral, linhaça, girassol e gergelim. Rico em fibras.',              price: 32, tag: 'Favorito'  },
    { id: 3, category: 'paes',      name: 'Pão de Centeio',             description: 'Sabor intenso com centeio integral e longa fermentação natural.',              price: 35, tag: 'Especial'  },
    { id: 4, category: 'brioches',  name: 'Brioche Tradicional',        description: 'Macio, levemente adocicado, perfeito com manteiga e geleia.',                  price: 24, tag: 'Clássico'  },
    { id: 5, category: 'brioches',  name: 'Brioche com Chocolate',      description: 'Recheado com chocolate 70% cacau, textura aveludada e aroma intenso.',         price: 28, tag: 'Especial'  },
    { id: 6, category: 'brioches',  name: 'Brioche de Baunilha',        description: 'Com fava de baunilha natural, cobertura de açúcar cristal.',                   price: 26, tag: 'Novidade'  },
    { id: 7, category: 'doces',     name: 'Cinnamon Roll',              description: 'Canela, açúcar mascavo e cobertura generosa de cream cheese.',                  price: 18, tag: 'Favorito'  },
    { id: 8, category: 'doces',     name: 'Cookie de Chocolate',        description: 'Crocante nas bordas, macio no centro, com gotas de chocolate 55%.',             price: 12, tag: 'Novidade'  },
    { id: 9, category: 'especiais', name: 'Focaccia de Alecrim',        description: 'Alecrim fresco, flor de sal e azeite extra virgem da Sicília.',                 price: 22, tag: 'Sazonal'   },
    { id:10, category: 'especiais', name: 'Pão de Queijo Mineiro',      description: 'Receita artesanal com polvilho azedo e queijo meia-cura.',                      price: 16, tag: 'Favorito'  },
  ];

  // ── SearchInput ──────────────────────────────────────────────────

  function SearchInput({ value, onChange }) {
    const [focused, setFocused] = useState(false);

    const wrapStyle = {
      position:     'relative',
      maxWidth:     '360px',
      width:        '100%',
    };

    const inputStyle = {
      width:        '100%',
      height:       '40px',
      padding:      `0 ${T.space[4]} 0 ${T.space[10]}`,
      borderRadius: T.radius.pill,
      border:       `1px solid ${focused ? T.color.borderFocus : T.color.border}`,
      background:   T.color.bg2,
      color:        T.color.text,
      fontFamily:   T.font.sans,
      fontSize:     T.fontSize.sm,
      fontWeight:   T.fontWeight.regular,
      transition:   `border-color ${T.transition.fast}`,
      boxSizing:    'border-box',
    };

    const iconStyle = {
      position:   'absolute',
      left:       T.space[4],
      top:        '50%',
      transform:  'translateY(-50%)',
      fontSize:   '14px',
      color:      T.color.textDim,
      pointerEvents: 'none',
    };

    const clearStyle = {
      position:   'absolute',
      right:      T.space[3],
      top:        '50%',
      transform:  'translateY(-50%)',
      background: 'none',
      border:     'none',
      color:      T.color.textDim,
      cursor:     'pointer',
      fontSize:   T.fontSize.base,
      padding:    T.space[1],
      display:    value ? 'block' : 'none',
    };

    return html`
      <div style=${wrapStyle}>
        <span style=${iconStyle}>🔍</span>
        <input
          type="search"
          placeholder="Buscar produto…"
          value=${value}
          onInput=${e => onChange(e.target.value)}
          onFocus=${() => setFocused(true)}
          onBlur=${()  => setFocused(false)}
          style=${inputStyle}
          aria-label="Buscar no cardápio"
        />
        <button
          style=${clearStyle}
          onClick=${() => onChange('')}
          aria-label="Limpar busca"
          tabIndex=${value ? 0 : -1}
        >✕</button>
      </div>
    `;
  }

  // ── ProductGroup ─────────────────────────────────────────────────

  function ProductGroup({ category, products, getQty, onAdd, onUpdateQty }) {
    const groupStyle = {
      marginBottom: T.space[16],
    };

    const headStyle = {
      display:      'flex',
      alignItems:   'baseline',
      gap:          T.space[3],
      marginBottom: T.space[8],
      paddingBottom:T.space[4],
      borderBottom: `1px solid var(--border-subtle)`,
    };

    const catTitleStyle = {
      fontFamily:  T.font.serif,
      fontSize:    T.fontSize.h4,
      fontWeight:  T.fontWeight.regular,
      color:       T.color.cream,
      lineHeight:  T.lineHeight.tight,
    };

    const catCountStyle = {
      fontFamily:  T.font.sans,
      fontSize:    T.fontSize.sm,
      color:       T.color.textDim,
    };

    const gridStyle = {
      display:             'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap:                 T.space.grid,
    };

    return html`
      <div
        id=${'cat-' + category.id}
        style=${groupStyle}
        style=${{ ...groupStyle, scrollMarginTop: 'calc(var(--announce-h) + var(--navbar-h) + 24px)' }}
      >
        <div style=${headStyle}>
          <h3 style=${catTitleStyle}>${category.label}</h3>
          <span style=${catCountStyle}>${products.length} ${products.length === 1 ? 'item' : 'itens'}</span>
        </div>
        <div style=${gridStyle}>
          ${products.map(p => html`
            <${ProductCard}
              key=${p.id}
              id=${p.id}
              name=${p.name}
              description=${p.description}
              price=${p.price}
              tag=${p.tag}
              image=${p.image_url || null}
              quantity=${getQty(p.id)}
              onAdd=${onAdd}
              onUpdateQty=${onUpdateQty}
            />
          `)}
        </div>
      </div>
    `;
  }

  // ── MenuSection ──────────────────────────────────────────────────

  function MenuSection({ cart, onAdd, onUpdateQty, config }) {
    const isMobile = useIsMobile();

    const [activeCategory, setActiveCategory] = useState(null);
    const [search, setSearch]                 = useState('');

    // Deriva dados do config da API ou usa mock
    const categories = useMemo(() => {
      return (config && config.categories && config.categories.length)
        ? config.categories
        : MOCK_CATEGORIES;
    }, [config]);

    const allProducts = useMemo(() => {
      return (config && (config.products || config.items) && (config.products || config.items).length)
        ? (config.products || config.items)
        : MOCK_PRODUCTS;
    }, [config]);

    // Inicia activeCategory na primeira categoria disponível
    useEffect(() => {
      if (categories.length && !activeCategory) {
        setActiveCategory(categories[0].id);
      }
    }, [categories]);

    // Intersect observer: atualiza categoria ativa conforme scroll
    const sectionRef = useRef(null);
    useEffect(() => {
      const observers = [];
      categories.forEach(cat => {
        const el = document.getElementById('cat-' + cat.id);
        if (!el) return;
        const obs = new IntersectionObserver(
          ([entry]) => { if (entry.isIntersecting) setActiveCategory(cat.id); },
          { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
        );
        obs.observe(el);
        observers.push(obs);
      });
      return () => observers.forEach(o => o.disconnect());
    }, [categories, search]);

    // Helper: quantidade no carrinho
    function getQty(productId) {
      const item = (cart || []).find(i => String(i.id) === String(productId));
      return item ? item.qty : 0;
    }

    // Produtos filtrados pela busca
    const searchResults = useMemo(() => {
      if (!search.trim()) return null;
      const q = search.toLowerCase();
      return allProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }, [allProducts, search]);

    // Grupos por categoria (sem busca)
    const grouped = useMemo(() => {
      return categories.map(cat => ({
        ...cat,
        products: allProducts.filter(p =>
          String(p.category || p.category_id) === String(cat.id)
        ),
      })).filter(g => g.products.length > 0);
    }, [categories, allProducts]);

    // Categorias com contagem para o nav
    const categoriesWithCount = useMemo(() => {
      return categories.map(cat => ({
        ...cat,
        count: allProducts.filter(p =>
          String(p.category || p.category_id) === String(cat.id)
        ).length,
      }));
    }, [categories, allProducts]);

    // ── Estilos ──────────────────────────────────────────────────

    const sectionStyle = {
      padding:         T.space.sectionPad,
      background:      T.color.bg,
      scrollMarginTop: 'calc(var(--announce-h) + var(--navbar-h))',
    };

    const containerStyle = {
      maxWidth: T.space.containerMd,
      margin:   '0 auto',
      padding:  T.space.containerPad,
    };

    const headerStyle = {
      display:       'flex',
      alignItems:    'flex-end',
      justifyContent:'space-between',
      flexWrap:      'wrap',
      gap:           T.space[6],
      marginBottom:  T.space[12],
    };

    const titleBlockStyle = { display: 'flex', flexDirection: 'column', gap: T.space[3] };

    const eyebrowStyle = {
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.xs,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing['4xl'],
      textTransform: 'uppercase',
      color:         T.color.amber,
    };

    const titleStyle = {
      fontFamily:  T.font.serif,
      fontSize:    T.fontSize.h2,
      fontWeight:  T.fontWeight.regular,
      lineHeight:  T.lineHeight.tight,
      color:       T.color.cream,
    };

    const bodyStyle = {
      display: 'flex',
      gap:     T.space.gridLg,
      alignItems: 'flex-start',
    };

    const contentStyle = { flex: 1, minWidth: 0 };

    // Resultados de busca (layout flat)
    const searchGridStyle = {
      display:             'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap:                 T.space.grid,
    };

    const emptyStyle = {
      padding:    `${T.space[16]} 0`,
      textAlign:  'center',
      fontFamily: T.font.sans,
      fontSize:   T.fontSize.base,
      color:      T.color.textDim,
    };

    return html`
      <section id="cardapio" ref=${sectionRef} style=${sectionStyle}>
        <div style=${containerStyle}>

          <!-- Cabeçalho -->
          <div style=${headerStyle}>
            <div style=${titleBlockStyle}>
              <p style=${eyebrowStyle}>Cardápio</p>
              <h2 style=${titleStyle}>Escolha seus pães</h2>
            </div>
            <${SearchInput} value=${search} onChange=${setSearch} />
          </div>

          <!-- Corpo -->
          <div style=${bodyStyle}>

            <!-- Sidebar de categorias (desktop only) -->
            ${!isMobile && !search.trim() && html`
              <${CategoryNav}
                categories=${categoriesWithCount}
                active=${activeCategory}
                onSelect=${setActiveCategory}
              />
            `}

            <!-- Produtos -->
            <div style=${contentStyle}>

              ${searchResults
                ? searchResults.length > 0
                  ? html`
                      <div style=${searchGridStyle}>
                        ${searchResults.map(p => html`
                          <${ProductCard}
                            key=${p.id}
                            id=${p.id}
                            name=${p.name}
                            description=${p.description}
                            price=${p.price}
                            tag=${p.tag}
                            image=${p.image_url || null}
                            quantity=${getQty(p.id)}
                            onAdd=${onAdd}
                            onUpdateQty=${onUpdateQty}
                          />
                        `)}
                      </div>
                    `
                  : html`<p style=${emptyStyle}>Nenhum produto encontrado para "${search}".</p>`

                : grouped.map(group => html`
                    <${ProductGroup}
                      key=${group.id}
                      category=${group}
                      products=${group.products}
                      getQty=${getQty}
                      onAdd=${onAdd}
                      onUpdateQty=${onUpdateQty}
                    />
                  `)
              }

            </div>
          </div>

        </div>
      </section>
    `;
  }

  window.MenuSection = MenuSection;
}());
