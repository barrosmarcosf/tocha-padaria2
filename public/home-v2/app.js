(function () {
  'use strict';

  const { useState, useEffect, useRef, useMemo } = window.React;
  const html = window.htm.bind(window.React.createElement);

  const C = {
    bg:          'oklch(12% 0.018 50)',
    bg2:         'oklch(16% 0.018 50)',
    bg3:         'oklch(20% 0.015 50)',
    amber:       'oklch(72% 0.15 65)',
    cream:       'oklch(92% 0.012 70)',
    muted:       'oklch(55% 0.01 60)',
    border:      'oklch(100% 0 0 / 0.08)',
    borderHover: 'oklch(100% 0 0 / 0.15)',
  };

  const fmt = v => 'R$ ' + Number(v).toFixed(2).replace('.', ',');

  function getCart() {
    try { return JSON.parse(localStorage.getItem('tocha-cart') || '[]'); } catch { return []; }
  }
  function saveCart(c) { localStorage.setItem('tocha-cart', JSON.stringify(c)); }

  function fetchWithTimeout(url, options, timeout) {
    timeout = timeout || 10000;
    const ctrl = new AbortController();
    const id = setTimeout(function () { ctrl.abort(); }, timeout);
    return fetch(url, Object.assign({}, options, { signal: ctrl.signal }))
      .finally(function () { clearTimeout(id); });
  }

  function safeTrack(event, props) {
    if (typeof window.track === 'function') {
      window.track(event, props);
    } else {
      console.warn('[track] window.track não está carregado — evento descartado:', event, props);
    }
  }

  /* ── hooks ── */
  function useScrolled(threshold) {
    threshold = threshold || 40;
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
      const h = () => setScrolled(window.scrollY > threshold);
      window.addEventListener('scroll', h, { passive: true });
      return () => window.removeEventListener('scroll', h);
    }, [threshold]);
    return scrolled;
  }

  function useScrollReveal() {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
      if (!ref.current) return;
      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
      }, { threshold: 0.08 });
      obs.observe(ref.current);
      return () => obs.disconnect();
    }, []);
    return [ref, visible];
  }

  function useCountdown(target) {
    const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
    useEffect(() => {
      if (!target) return;
      const tick = () => {
        const diff = new Date(target) - Date.now();
        if (diff <= 0) { setT({ d: 0, h: 0, m: 0, s: 0 }); return; }
        setT({
          d: Math.floor(diff / 86400000),
          h: Math.floor((diff % 86400000) / 3600000),
          m: Math.floor((diff % 3600000) / 60000),
          s: Math.floor((diff % 60000) / 1000),
        });
      };
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }, [target]);
    return t;
  }

  function useIsMobile() {
    const [v, setV] = useState(() => window.innerWidth < 768);
    useEffect(() => {
      const h = () => setV(window.innerWidth < 768);
      window.addEventListener('resize', h, { passive: true });
      return () => window.removeEventListener('resize', h);
    }, []);
    return v;
  }

  /* ── Reveal ── */
  function Reveal({ children, delay, style }) {
    const [ref, visible] = useScrollReveal();
    const d = delay || 0;
    return html`<div ref=${ref} style=${{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.6s ease ' + d + 's, transform 0.6s ease ' + d + 's',
      ...(style || {}),
    }}>${children}</div>`;
  }

  /* ── AnnouncementBar ── */
  function AnnouncementBar({ status }) {
    const t = useCountdown(status && status.nextBatch);
    if (!status) return null;
    const pad = n => String(n).padStart(2, '0');
    return html`
      <div style=${{
        background: status.isOpen ? 'oklch(32% 0.12 145)' : C.bg2,
        borderBottom: '1px solid ' + C.border,
        padding: '8px 20px',
        textAlign: 'center',
        fontSize: '13px',
        color: C.cream,
        position: 'relative',
        zIndex: 100,
      }}>
        ${status.isOpen
          ? html`<span>Pedidos abertos — Próxima fornada: <strong style=${{ color: C.amber }}>${status.batchLabel || 'Sábado'}</strong></span>`
          : status.nextBatch
            ? html`<span>Próxima fornada em: <strong style=${{ color: C.amber }}>${t.d}d ${pad(t.h)}:${pad(t.m)}:${pad(t.s)}</strong></span>`
            : html`<span style=${{ color: C.muted }}>Pedidos fechados por enquanto — em breve novas fornadas</span>`
        }
      </div>`;
  }

  /* ── Navbar ── */
  function Navbar({ cartCount, onCartOpen }) {
    const scrolled = useScrolled(40);
    const mobile = useIsMobile();
    return html`
      <nav style=${{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        height: '64px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 max(20px, calc((100vw - 1200px) / 2))',
        background: scrolled ? 'oklch(12% 0.018 50 / 0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid ' + C.border : '1px solid transparent',
        transition: 'background 0.3s, border-color 0.3s',
      }}>
        <a href="/" style=${{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/assets/logo-gold.png" alt="Tocha Padaria" style=${{ height: '34px', width: 'auto' }} />
        </a>
        <div style=${{ display: 'flex', alignItems: 'center', gap: mobile ? '12px' : '32px' }}>
          ${!mobile ? html`
            <div style=${{ display: 'flex', gap: '24px' }}>
              <a href="#cardapio" style=${{ color: C.cream, textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Cardápio</a>
              <a href="/nossa-historia.html" style=${{ color: C.cream, textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Nossa História</a>
              <a href="/fale-conosco.html" style=${{ color: C.cream, textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Contato</a>
            </div>
          ` : null}
          <button onClick=${onCartOpen} style=${{
            position: 'relative', background: C.amber, border: 'none',
            borderRadius: '12px', padding: '10px 16px',
            color: C.bg, fontWeight: 700, fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            fontFamily: 'DM Sans, system-ui, sans-serif',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            ${mobile ? '' : 'Carrinho'}
            ${cartCount > 0 ? html`<span style=${{
              background: C.bg, color: C.amber, borderRadius: '50%',
              width: '18px', height: '18px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '10px', fontWeight: 800,
            }}>${cartCount}</span>` : null}
          </button>
        </div>
      </nav>`;
  }

  /* ── Hero ── */
  function Hero({ status, onShop }) {
    return html`
      <section style=${{
        position: 'relative', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        <div style=${{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/assets/sourdough.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.3)',
        }} />
        <div style=${{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, oklch(12% 0.018 50 / 0.1) 0%, oklch(12% 0.018 50 / 0.55) 65%, oklch(12% 0.018 50) 100%)',
        }} />
        <div style=${{
          position: 'relative', textAlign: 'center',
          padding: '80px 24px 0', maxWidth: '680px',
          animation: 'fadeUp 0.9s ease both',
        }}>
          <p style=${{
            fontFamily: 'DM Sans, system-ui, sans-serif',
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: C.amber, marginBottom: '18px',
          }}>Fermentação Natural · São João de Meriti</p>
          <h1 style=${{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(46px, 8vw, 92px)',
            fontWeight: 700, lineHeight: 1.06, color: C.cream,
            marginBottom: '24px', letterSpacing: '-0.02em',
          }}>
            Pão que${' '}
            <em style=${{ color: C.amber, fontStyle: 'italic' }}>alimenta</em>
            ${' '}de verdade
          </h1>
          <p style=${{
            fontFamily: 'DM Sans, system-ui, sans-serif',
            fontSize: '17px', lineHeight: 1.65, color: 'oklch(78% 0.01 70)',
            margin: '0 auto 40px', maxWidth: '460px',
          }}>Brioches, sourdoughs e doces artesanais.<br/>Fornadas às sextas e sábados.</p>
          <div style=${{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick=${onShop} style=${{
              background: C.amber, color: C.bg, border: 'none',
              borderRadius: '14px', padding: '15px 32px',
              fontSize: '16px', fontWeight: 700, cursor: 'pointer',
              fontFamily: 'DM Sans, system-ui, sans-serif',
            }}>Ver Cardápio</button>
            <a href="https://wa.me/5521966278965" target="_blank" rel="noopener noreferrer" style=${{
              background: 'transparent', color: C.cream,
              border: '1.5px solid ' + C.border,
              borderRadius: '14px', padding: '15px 32px',
              fontSize: '16px', fontWeight: 500,
              fontFamily: 'DM Sans, system-ui, sans-serif', textDecoration: 'none',
            }}>Falar no WhatsApp</a>
          </div>
        </div>
        <div style=${{
          position: 'absolute', bottom: '28px', left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
        }}>
          <span style=${{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: C.muted, opacity: 0.5 }}>role</span>
          <div style=${{ width: '1.5px', height: '36px', background: C.muted, animation: 'scrollLine 2s ease-in-out infinite' }} />
        </div>
      </section>`;
  }

  /* ── ManifestoStrip ── */
  function ManifestoStrip() {
    const items = ['Fermentação Natural', 'Sem Aditivos', 'Fornada Artesanal', 'São João de Meriti', 'Feito com Amor', 'Trigo de Qualidade'];
    const all = [...items, ...items, ...items];
    return html`
      <div style=${{
        overflow: 'hidden',
        borderTop: '1px solid ' + C.border,
        borderBottom: '1px solid ' + C.border,
        background: C.bg2, padding: '16px 0',
      }}>
        <div style=${{
          display: 'flex', gap: '48px', whiteSpace: 'nowrap',
          width: 'max-content', animation: 'marquee 28s linear infinite',
        }}>
          ${all.map((item, i) => html`
            <span key=${i} style=${{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '15px', fontStyle: 'italic',
              color: i % 3 === 0 ? C.amber : C.muted,
              display: 'inline-flex', alignItems: 'center', gap: '48px',
            }}>
              ${item}
              <span style=${{ color: C.amber, fontSize: '7px', opacity: 0.5 }}>◆</span>
            </span>`)}
        </div>
      </div>`;
  }

  /* ── HowItWorksSection ── */
  function HowItWorksSection() {
    const steps = [
      { n: '01', title: 'Escolha', text: 'Navegue pelo cardápio e monte seu pedido com os pães e doces que quiser.' },
      { n: '02', title: 'Pedido', text: 'Finalize com PIX ou cartão. Confirmação direto no WhatsApp.' },
      { n: '03', title: 'Fornada', text: 'Seu pão é preparado com fermentação natural de até 48h.' },
      { n: '04', title: 'Retirada', text: 'Retire na padaria ou combine entrega. Pão quentinho, fresquinho.' },
    ];
    const rules = ['Pedidos até quinta-feira', 'Fornadas sexta e sábado', 'Retirada ou entrega local', 'Pagamento antecipado'];
    return html`
      <section style=${{ padding: 'clamp(60px, 8vw, 112px) max(20px, calc((100vw - 1200px) / 2))' }}>
        <${Reveal}>
          <p style=${{ fontFamily: 'DM Sans', fontSize: '11px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.amber, marginBottom: '12px' }}>Como funciona</p>
          <h2 style=${{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: 700, color: C.cream, marginBottom: '52px', lineHeight: 1.15 }}>Do pedido até a sua mesa</h2>
        </${Reveal}>
        <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          ${steps.map((s, i) => html`
            <${Reveal} key=${s.n} delay=${i * 0.08}>
              <div style=${{ background: C.bg2, border: '1px solid ' + C.border, borderRadius: '20px', padding: '28px 22px', height: '100%' }}>
                <div style=${{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '38px', fontWeight: 700, color: C.amber, opacity: 0.28, lineHeight: 1, marginBottom: '14px' }}>${s.n}</div>
                <h3 style=${{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '20px', fontWeight: 600, color: C.cream, marginBottom: '8px' }}>${s.title}</h3>
                <p style=${{ fontFamily: 'DM Sans', fontSize: '14px', lineHeight: 1.6, color: C.muted, margin: 0 }}>${s.text}</p>
              </div>
            </${Reveal}>
          `)}
        </div>
        <${Reveal} delay=${0.2}>
          <div style=${{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            ${rules.map((r, i) => html`
              <span key=${i} style=${{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: C.bg3, border: '1px solid ' + C.border,
                borderRadius: '100px', padding: '8px 16px',
                fontSize: '13px', color: C.cream,
                fontFamily: 'DM Sans, system-ui, sans-serif',
              }}>
                <span style=${{ color: C.amber, fontSize: '8px' }}>◆</span>${r}
              </span>`)}
          </div>
        </${Reveal}>
      </section>`;
  }

  /* ── ProductCard ── */
  function ProductCard({ product, onAdd }) {
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);
    const [hovered, setHovered] = useState(false);
    function handleAdd() {
      onAdd(product, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 1600);
    }
    return html`
      <div
        onMouseEnter=${() => setHovered(true)}
        onMouseLeave=${() => setHovered(false)}
        style=${{
          background: C.bg2,
          border: '1px solid ' + (hovered ? C.borderHover : C.border),
          borderRadius: '20px', overflow: 'hidden',
          transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
          transform: hovered ? 'translateY(-3px)' : 'none',
          boxShadow: hovered ? '0 8px 32px oklch(0% 0 0 / 0.3)' : 'none',
          display: 'flex', flexDirection: 'column',
        }}
      >
        ${product.image_url ? html`
          <div style=${{ aspectRatio: '4/3', overflow: 'hidden', background: C.bg3, flexShrink: 0 }}>
            <img src=${product.image_url} alt=${product.name} loading="lazy"
              style=${{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', transform: hovered ? 'scale(1.06)' : 'scale(1)' }} />
          </div>
        ` : html`
          <div style=${{ aspectRatio: '4/3', background: 'linear-gradient(135deg,' + C.bg3 + ',' + C.bg2 + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style=${{ fontSize: '44px', opacity: 0.3 }}>🍞</span>
          </div>
        `}
        <div style=${{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h3 style=${{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '17px', fontWeight: 600, color: C.cream, margin: 0, lineHeight: 1.3 }}>${product.name}</h3>
          ${product.description ? html`<p style=${{ fontFamily: 'DM Sans', fontSize: '13px', lineHeight: 1.5, color: C.muted, margin: 0 }}>${product.description}</p>` : null}
          <div style=${{ marginTop: 'auto', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <span style=${{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '20px', fontWeight: 700, color: C.amber }}>${fmt(product.price)}</span>
            <div style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style=${{ display: 'flex', alignItems: 'center', background: C.bg3, border: '1px solid ' + C.border, borderRadius: '10px', overflow: 'hidden' }}>
                <button onClick=${() => setQty(q => Math.max(1, q - 1))} style=${{ background: 'none', border: 'none', color: C.cream, padding: '7px 11px', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}>−</button>
                <span style=${{ padding: '0 8px', fontSize: '13px', color: C.cream, fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>${qty}</span>
                <button onClick=${() => setQty(q => q + 1)} style=${{ background: 'none', border: 'none', color: C.cream, padding: '7px 11px', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}>+</button>
              </div>
              <button onClick=${handleAdd} style=${{
                background: added ? 'oklch(52% 0.14 145)' : C.amber,
                color: C.bg, border: 'none', borderRadius: '10px',
                padding: '9px 14px', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', transition: 'background 0.3s',
                fontFamily: 'DM Sans, system-ui, sans-serif', whiteSpace: 'nowrap',
              }}>${added ? '✓ Ok' : 'Adicionar'}</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  /* ── MenuSection ── */
  function MenuSection({ config, onAdd }) {
    const mobile = useIsMobile();
    const [activeCat, setActiveCat] = useState(null);

    const categories = useMemo(() => {
      if (!config) return [];
      return (config.categorias || []).filter(c => c.is_active).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }, [config]);

    const products = useMemo(() => {
      if (!config) return [];
      return (config.produtos || []).filter(p => p.is_active);
    }, [config]);

    useEffect(() => {
      if (categories.length > 0 && !activeCat) setActiveCat(categories[0].id);
    }, [categories]);

    const filtered = useMemo(() => {
      if (!activeCat) return products;
      return products.filter(p => p.category_id === activeCat).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }, [products, activeCat]);

    return html`
      <section id="cardapio" style=${{ padding: 'clamp(60px, 8vw, 112px) max(20px, calc((100vw - 1200px) / 2))' }}>
        <${Reveal}>
          <p style=${{ fontFamily: 'DM Sans', fontSize: '11px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.amber, marginBottom: '12px' }}>Cardápio</p>
          <h2 style=${{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: 700, color: C.cream, marginBottom: '40px', lineHeight: 1.15 }}>Nosso Pão, Nossa Arte</h2>
        </${Reveal}>

        ${config ? html`
          <div style=${{ display: 'flex', flexDirection: mobile ? 'column' : 'row', gap: '40px', alignItems: 'flex-start' }}>
            ${mobile ? html`
              <div style=${{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', width: '100%' }}>
                ${categories.map(cat => html`
                  <button key=${cat.id} onClick=${() => setActiveCat(cat.id)} style=${{
                    flexShrink: 0, background: activeCat === cat.id ? C.amber : C.bg3,
                    color: activeCat === cat.id ? C.bg : C.muted,
                    border: '1px solid ' + (activeCat === cat.id ? C.amber : C.border),
                    borderRadius: '100px', padding: '8px 18px',
                    fontSize: '13px', fontWeight: activeCat === cat.id ? 700 : 400,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    fontFamily: 'DM Sans, system-ui, sans-serif', transition: 'all 0.2s',
                  }}>${cat.name}</button>`)}
              </div>
            ` : html`
              <div style=${{ flexShrink: 0, width: '190px', position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                ${categories.map(cat => html`
                  <button key=${cat.id} onClick=${() => setActiveCat(cat.id)} style=${{
                    background: activeCat === cat.id ? C.amber : 'transparent',
                    color: activeCat === cat.id ? C.bg : C.muted,
                    border: 'none', borderRadius: '10px', padding: '10px 14px',
                    textAlign: 'left', cursor: 'pointer', fontSize: '14px',
                    fontWeight: activeCat === cat.id ? 700 : 400,
                    transition: 'all 0.2s', fontFamily: 'DM Sans, system-ui, sans-serif',
                  }}>${cat.name}</button>`)}
              </div>
            `}
            <div style=${{ flex: 1, minWidth: 0 }}>
              ${filtered.length === 0
                ? html`<p style=${{ color: C.muted, fontFamily: 'DM Sans', fontSize: '15px', textAlign: 'center', padding: '60px 0' }}>Nenhum produto disponível nesta categoria.</p>`
                : html`
                  <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
                    ${filtered.map(p => html`<${ProductCard} key=${p.id} product=${p} onAdd=${onAdd} />`)}
                  </div>`
              }
            </div>
          </div>
        ` : html`
          <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
            ${[0,1,2,3,4,5].map(i => html`
              <div key=${i} style=${{
                background: C.bg2, borderRadius: '20px', height: '300px',
                opacity: 0.5, animation: 'fadeIn 0.6s ease ' + (i * 0.1) + 's both',
              }} />`)}
          </div>`}
      </section>`;
  }

  /* ── FoodserviceSection ── */
  function FoodserviceSection() {
    const mobile = useIsMobile();
    return html`
      <section style=${{ padding: 'clamp(60px, 8vw, 112px) max(20px, calc((100vw - 1200px) / 2))', background: C.bg2 }}>
        <div style=${{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '48px', alignItems: 'center' }}>
          <${Reveal}>
            <p style=${{ fontFamily: 'DM Sans', fontSize: '11px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.amber, marginBottom: '12px' }}>Foodservice</p>
            <h2 style=${{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, color: C.cream, marginBottom: '18px', lineHeight: 1.2 }}>Pão artesanal para o seu negócio</h2>
            <p style=${{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: 1.7, color: C.muted, marginBottom: '32px', margin: '0 0 32px' }}>Fornecemos para restaurantes, cafés e eventos. Produtos personalizados com a qualidade da Tocha Padaria.</p>
            <a href="https://wa.me/5521966278965?text=Olá!%20Tenho%20interesse%20no%20fornecimento%20para%20meu%20negócio." target="_blank" rel="noopener noreferrer" style=${{
              display: 'inline-block', background: C.amber, color: C.bg,
              textDecoration: 'none', borderRadius: '12px', padding: '14px 28px',
              fontSize: '15px', fontWeight: 700, fontFamily: 'DM Sans, system-ui, sans-serif',
            }}>Falar sobre fornecimento</a>
          </${Reveal}>
          <${Reveal} delay=${0.12}>
            <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              ${[1,2,3,4].map(i => html`
                <div key=${i} style=${{ borderRadius: '16px', overflow: 'hidden', aspectRatio: '1', background: C.bg3 }}>
                  <img src=${'/assets/foodservice' + i + '.png'} alt="Foodservice" loading="lazy"
                    style=${{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>`)}
            </div>
          </${Reveal}>
        </div>
      </section>`;
  }

  /* ── Footer ── */
  function Footer() {
    const mobile = useIsMobile();
    return html`
      <footer style=${{ borderTop: '1px solid ' + C.border, padding: '48px max(20px, calc((100vw - 1200px) / 2)) 32px', background: C.bg }}>
        <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '32px', marginBottom: '40px' }}>
          <div>
            <img src="/assets/logo-footer (1).png" alt="Tocha Padaria" style=${{ height: '44px', width: 'auto', marginBottom: '14px', display: 'block' }} />
            <p style=${{ fontFamily: 'DM Sans', fontSize: '14px', color: C.muted, maxWidth: '260px', lineHeight: 1.6, margin: 0 }}>Pão de fermentação natural com amor e técnica. São João de Meriti, RJ.</p>
          </div>
          <div style=${{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            <div>
              <p style=${{ fontFamily: 'DM Sans', fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.amber, marginBottom: '14px', marginTop: 0 }}>Links</p>
              <div style=${{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                ${[['Cardápio', '#cardapio'], ['Nossa História', '/nossa-historia.html'], ['Fale Conosco', '/fale-conosco.html']].map(([label, href]) => html`
                  <a key=${label} href=${href} style=${{ fontFamily: 'DM Sans', fontSize: '14px', color: C.muted, textDecoration: 'none' }}>${label}</a>`)}
              </div>
            </div>
            <div>
              <p style=${{ fontFamily: 'DM Sans', fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.amber, marginBottom: '14px', marginTop: 0 }}>Contato</p>
              <div style=${{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a href="https://wa.me/5521966278965" target="_blank" style=${{ fontFamily: 'DM Sans', fontSize: '14px', color: C.muted, textDecoration: 'none' }}>WhatsApp</a>
                <a href="https://www.instagram.com/tocha.padaria" target="_blank" style=${{ fontFamily: 'DM Sans', fontSize: '14px', color: C.muted, textDecoration: 'none' }}>Instagram</a>
              </div>
            </div>
          </div>
        </div>
        <div style=${{ borderTop: '1px solid ' + C.border, paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style=${{ fontFamily: 'DM Sans', fontSize: '13px', color: C.muted, margin: 0 }}>© 2025 Tocha Padaria. Todos os direitos reservados.</p>
          <div style=${{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <a href="https://www.instagram.com/tocha.padaria" target="_blank">
              <img src="/assets/instagram-footer.png" alt="Instagram" style=${{ width: '22px', height: '22px', objectFit: 'contain' }} />
            </a>
            <a href="https://wa.me/5521966278965" target="_blank">
              <img src="/assets/whatsapp-footer.png" alt="WhatsApp" style=${{ width: '22px', height: '22px', objectFit: 'contain' }} />
            </a>
          </div>
        </div>
      </footer>`;
  }

  /* ── WhatsAppFloat ── */
  function WhatsAppFloat() {
    return html`
      <a href="https://wa.me/5521966278965" target="_blank" rel="noopener noreferrer" style=${{
        position: 'fixed', bottom: '24px', left: '24px', zIndex: 150,
        width: '54px', height: '54px', background: '#25D366', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 18px rgba(37,211,102,0.38)', transition: 'transform 0.2s',
        textDecoration: 'none',
      }}
        onMouseEnter=${e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave=${e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <img src="/assets/whatsapp-icon.svg" alt="WhatsApp" style=${{ width: '28px', height: '28px' }} />
      </a>`;
  }

  /* ── EarlyCaptureModal ── */
  function EarlyCaptureModal({ open, onClose }) {
    const [name, setName] = useState('');
    const [wa, setWa] = useState('');

    useEffect(() => {
      if (!open) return;
      try {
        const s = JSON.parse(localStorage.getItem('tocha-customer') || 'null');
        if (s && s.name) setName(s.name);
        if (s && s.whatsapp) setWa(s.whatsapp);
      } catch {}
    }, [open]);

    function fmtWA(v) {
      const x = v.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
      return x ? (!x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '')) : v;
    }

    function save() {
      if (!name && !wa) { onClose(); return; }
      try {
        const existing = JSON.parse(localStorage.getItem('tocha-customer') || '{}');
        const updated = Object.assign({}, existing);
        if (name) updated.name = name;
        if (wa) updated.whatsapp = wa;
        localStorage.setItem('tocha-customer', JSON.stringify(updated));
        fetch('/api/customer/save', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        }).catch(function () {});
      } catch {}
      onClose();
    }

    if (!open) return null;

    const inp = {
      width: '100%', height: '48px', padding: '0 14px',
      borderRadius: '12px', border: '1px solid ' + C.border,
      background: C.bg3, color: C.cream, fontSize: '16px',
      fontFamily: 'DM Sans, system-ui, sans-serif',
      boxSizing: 'border-box', outline: 'none',
    };

    return html`
      <div onClick=${onClose} style=${{
        position: 'fixed', inset: 0, zIndex: 10002,
        background: 'rgba(0,0,0,0.72)', display: 'flex',
        alignItems: 'flex-end', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}>
        <div onClick=${e => e.stopPropagation()} style=${{
          background: 'oklch(16% 0.018 50)',
          borderRadius: '24px 24px 0 0',
          padding: '28px 24px 44px',
          width: '100%', maxWidth: '480px',
          border: '1px solid ' + C.border, borderBottom: 'none',
          animation: 'slideUp 0.3s ease',
        }}>
          <div style=${{ width: '36px', height: '4px', background: C.border, borderRadius: '2px', margin: '0 auto 24px' }} />
          <h3 style=${{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', fontWeight: 700, color: C.amber, margin: '0 0 8px' }}>Oi! Uma perguntinha rápida</h3>
          <p style=${{ fontFamily: 'DM Sans', fontSize: '14px', lineHeight: 1.55, color: 'oklch(78% 0.01 70)', margin: '0 0 20px' }}>Para organizar sua fornada e facilitar seus próximos pedidos, informe seu nome e WhatsApp.</p>
          <input type="text" placeholder="Seu nome" value=${name} onInput=${e => setName(e.target.value)} style=${{ ...inp, marginBottom: '10px' }} />
          <input type="tel" placeholder="(00) 00000-0000" value=${wa} onInput=${e => setWa(fmtWA(e.target.value))} style=${{ ...inp, marginBottom: '18px' }} />
          <button onClick=${save} style=${{
            width: '100%', height: '52px', background: C.amber, color: C.bg,
            border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif', marginBottom: '6px',
          }}>Salvar</button>
          <button onClick=${onClose} style=${{
            width: '100%', padding: '12px', background: 'transparent',
            color: C.muted, border: 'none', borderRadius: '12px',
            fontSize: '14px', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif',
          }}>Agora não</button>
        </div>
      </div>`;
  }

  /* ── CartDrawer ── */
  function CartDrawer({ open, onClose, cart, onUpdateQty, onRemove, status }) {
    const [step, setStep] = useState('summary');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [wa, setWa] = useState('');
    const [payment, setPayment] = useState('pix');
    const [err, setErr] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      if (!open) return;
      setStep('summary'); setErr('');
      try {
        const s = JSON.parse(localStorage.getItem('tocha-customer') || 'null');
        if (s) {
          if (s.name) setName(s.name);
          if (s.email) setEmail(s.email);
          if (s.whatsapp) setWa(s.whatsapp);
        }
      } catch {}
    }, [open]);

    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const totalItems = cart.reduce((s, i) => s + i.qty, 0);

    function fmtWA(v) {
      const x = v.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
      return x ? (!x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '')) : v;
    }

    async function handleCheckout() {
      if (!name.trim() || !email.trim() || !wa.trim()) { setErr('Preencha todos os campos obrigatórios.'); return; }
      if (!email.includes('@')) { setErr('E-mail inválido.'); return; }
      if (submitting) return;
      setErr(''); setSubmitting(true); setStep('loading');

      const customer = { name: name.trim(), email: email.trim(), whatsapp: wa.trim() };
      localStorage.setItem('tocha-customer', JSON.stringify(customer));
      fetch('/api/customer/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      }).catch(function () {});

      safeTrack('start_checkout', { method: payment, items: cart.length });

      const key = crypto.randomUUID();

      try {
        if (payment === 'mp_card') {
          const res = await fetchWithTimeout('/api/mercadopago/prepare-card-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-idempotency-key': key },
            body: JSON.stringify({ customer: customer, cart: cart }),
          });
          if (!res.ok) { const d = await res.json().catch(function () { return {}; }); throw new Error(d.error || 'Erro ao preparar pedido com cartão.'); }
          const data = await res.json();
          if (!data.order_id) throw new Error('Pedido não gerado pelo servidor. Não prossiga — tente novamente.');
          localStorage.setItem('tocha-order-id', String(data.order_id));
          window.location.href = '/checkout-mp.html?order_id=' + data.order_id;
          return;
        }

        const prepRes = await fetchWithTimeout('/api/mercadopago/prepare-pix-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-idempotency-key': key },
          body: JSON.stringify({ customer: customer, cart: cart }),
        });
        if (!prepRes.ok) { const d = await prepRes.json().catch(function () { return {}; }); throw new Error(d.error || 'Erro ao preparar pedido PIX.'); }
        const prepData = await prepRes.json();
        const pixOrderId = prepData.order_id;
        if (!pixOrderId) throw new Error('ID do pedido não recebido. Não prossiga — tente novamente.');

        const attemptId = crypto.randomUUID();
        const pixRes = await fetchWithTimeout('/api/mercadopago/create-pix-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: pixOrderId, attempt_id: attemptId, customer: customer, cart: cart }),
        });
        if (!pixRes.ok) { const d = await pixRes.json().catch(function () { return {}; }); throw new Error(d.error || 'Erro ao gerar código PIX.'); }
        const pixData = await pixRes.json();
        if (!pixData.order_id) throw new Error('Confirmação do pedido não recebida. Não prossiga.');
        if (!pixData.pix_code && !pixData.checkout_url) throw new Error('Código PIX não recebido. Tente novamente.');
        localStorage.setItem('tocha-order-id', String(pixData.order_id));
        localStorage.setItem('tocha-pix-data', JSON.stringify(pixData));
        localStorage.removeItem('tocha-cart');
        window.location.href = '/pagamento-pix.html';
      } catch (e) {
        const msg = e.name === 'AbortError'
          ? 'Tempo de resposta excedido. Verifique sua conexão e tente novamente.'
          : (e.message || 'Erro ao processar pagamento.');
        setStep('checkout');
        setErr(msg);
        setSubmitting(false);
      }
    }

    if (!open) return null;

    const inp = {
      width: '100%', height: '48px', padding: '0 14px',
      borderRadius: '12px', border: '1px solid ' + C.border,
      background: C.bg3, color: C.cream, fontSize: '16px',
      fontFamily: 'DM Sans, system-ui, sans-serif',
      boxSizing: 'border-box', outline: 'none',
    };

    return html`
      <div>
        <div onClick=${onClose} style=${{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          zIndex: 10000, animation: 'fadeIn 0.2s ease',
        }} />
        <div style=${{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(440px, 100vw)',
          background: 'oklch(15% 0.018 50)',
          borderLeft: '1px solid ' + C.border,
          zIndex: 10001, display: 'flex', flexDirection: 'column',
          animation: 'slideIn 0.3s ease',
        }}>
          <div style=${{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', borderBottom: '1px solid ' + C.border, flexShrink: 0,
          }}>
            <div style=${{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style=${{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '20px', fontWeight: 600, color: C.cream, margin: 0 }}>
                ${step === 'summary' ? 'Carrinho' : step === 'checkout' ? 'Finalizar Pedido' : 'Processando...'}
              </h2>
              ${step === 'summary' && totalItems > 0 ? html`<span style=${{ fontFamily: 'DM Sans', fontSize: '13px', color: C.muted }}>(${totalItems} ${totalItems === 1 ? 'item' : 'itens'})</span>` : null}
            </div>
            <button onClick=${onClose} style=${{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '20px', padding: '4px', lineHeight: 1 }}>✕</button>
          </div>

          <div style=${{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            ${step === 'loading' ? html`
              <div style=${{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', gap: '20px' }}>
                <div style=${{ width: '44px', height: '44px', border: '3px solid ' + C.border, borderTop: '3px solid ' + C.amber, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style=${{ fontFamily: 'DM Sans', fontSize: '15px', color: C.muted, margin: 0 }}>Processando seu pedido...</p>
              </div>
            ` : step === 'checkout' ? html`
              <div style=${{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style=${{ fontFamily: 'DM Sans', fontSize: '11px', fontWeight: 600, color: C.muted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nome <span style=${{ color: C.amber }}>*</span></label>
                  <input type="text" placeholder="Seu nome" value=${name} onInput=${e => setName(e.target.value)} style=${inp} />
                </div>
                <div>
                  <label style=${{ fontFamily: 'DM Sans', fontSize: '11px', fontWeight: 600, color: C.muted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>E-mail <span style=${{ color: C.amber }}>*</span></label>
                  <input type="email" placeholder="seu@email.com" value=${email} onInput=${e => setEmail(e.target.value)} style=${inp} />
                </div>
                <div>
                  <label style=${{ fontFamily: 'DM Sans', fontSize: '11px', fontWeight: 600, color: C.muted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>WhatsApp <span style=${{ color: C.amber }}>*</span></label>
                  <input type="tel" placeholder="(00) 00000-0000" value=${wa} onInput=${e => setWa(fmtWA(e.target.value))} style=${inp} />
                </div>
                <div>
                  <p style=${{ fontFamily: 'DM Sans', fontSize: '11px', fontWeight: 600, color: C.muted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pagamento</p>
                  <div style=${{ display: 'flex', gap: '10px' }}>
                    ${[['pix', 'PIX'], ['mp_card', 'Cartão']].map(function (opt) {
                      const val = opt[0], label = opt[1];
                      return html`
                        <button key=${val} onClick=${() => setPayment(val)} style=${{
                          flex: 1, padding: '12px', borderRadius: '12px',
                          border: '1.5px solid ' + (payment === val ? C.amber : C.border),
                          background: payment === val ? 'oklch(72% 0.15 65 / 0.1)' : C.bg3,
                          color: payment === val ? C.amber : C.muted,
                          cursor: 'pointer', fontSize: '14px',
                          fontWeight: payment === val ? 700 : 400,
                          fontFamily: 'DM Sans, system-ui, sans-serif', transition: 'all 0.2s',
                        }}>${label}</button>`;
                    })}
                  </div>
                </div>
                ${status && status.batchLabel ? html`
                  <div style=${{ background: 'oklch(72% 0.15 65 / 0.07)', border: '1px solid oklch(72% 0.15 65 / 0.18)', borderRadius: '10px', padding: '10px 14px', fontFamily: 'DM Sans', fontSize: '13px', color: C.amber }}>
                    Fornada: ${status.batchLabel}
                  </div>` : null}
                ${err ? html`
                  <div style=${{ background: 'oklch(40% 0.15 15 / 0.18)', border: '1px solid oklch(50% 0.15 15 / 0.28)', borderRadius: '10px', padding: '10px 14px', fontFamily: 'DM Sans', fontSize: '14px', color: 'oklch(80% 0.1 15)' }}>${err}</div>` : null}
              </div>
            ` : cart.length === 0 ? html`
              <div style=${{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '14px' }}>
                <span style=${{ fontSize: '44px', opacity: 0.25 }}>🛒</span>
                <p style=${{ fontFamily: 'DM Sans', fontSize: '15px', color: C.muted, margin: 0 }}>Seu carrinho está vazio.</p>
              </div>
            ` : html`
              <div style=${{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                ${cart.map(function (item) {
                  return html`
                    <div key=${item.id} style=${{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: C.bg3, borderRadius: '14px', border: '1px solid ' + C.border }}>
                      ${item.image
                        ? html`<img src=${item.image} alt=${item.name} style=${{ width: '54px', height: '54px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />`
                        : html`<div style=${{ width: '54px', height: '54px', borderRadius: '10px', background: C.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style=${{ fontSize: '22px', opacity: 0.3 }}>🍞</span></div>`}
                      <div style=${{ flex: 1, minWidth: 0 }}>
                        <p style=${{ fontFamily: 'DM Sans', fontSize: '14px', fontWeight: 600, color: C.cream, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>${item.name}</p>
                        <p style=${{ fontFamily: 'DM Sans', fontSize: '13px', color: C.amber, margin: 0 }}>${fmt(item.price)}</p>
                      </div>
                      <div style=${{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <div style=${{ display: 'flex', alignItems: 'center', background: C.bg2, border: '1px solid ' + C.border, borderRadius: '8px', overflow: 'hidden' }}>
                          <button onClick=${() => onUpdateQty(item.id, item.qty - 1)} style=${{ background: 'none', border: 'none', color: C.cream, padding: '5px 9px', cursor: 'pointer', fontSize: '14px' }}>−</button>
                          <span style=${{ fontSize: '13px', color: C.cream, padding: '0 6px', fontWeight: 600 }}>${item.qty}</span>
                          <button onClick=${() => onUpdateQty(item.id, item.qty + 1)} style=${{ background: 'none', border: 'none', color: C.cream, padding: '5px 9px', cursor: 'pointer', fontSize: '14px' }}>+</button>
                        </div>
                        <button onClick=${() => onRemove(item.id)} style=${{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '16px', padding: '4px', lineHeight: 1 }}>✕</button>
                      </div>
                    </div>`;
                })}
              </div>`}
          </div>

          ${step !== 'loading' && cart.length > 0 ? html`
            <div style=${{ borderTop: '1px solid ' + C.border, padding: '18px 24px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style=${{ fontFamily: 'DM Sans', fontSize: '14px', color: C.muted }}>Total</span>
                <span style=${{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', fontWeight: 700, color: C.amber }}>${fmt(subtotal)}</span>
              </div>
              <button
                onClick=${step === 'summary' ? () => setStep('checkout') : handleCheckout}
                disabled=${submitting}
                style=${{
                  width: '100%', height: '52px', background: C.amber, color: C.bg,
                  border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  fontFamily: 'DM Sans, system-ui, sans-serif',
                }}
              >${step === 'summary' ? 'Ir para o Checkout →' : submitting ? 'Aguarde...' : 'Confirmar Pedido →'}</button>
              ${step === 'checkout' ? html`
                <button onClick=${() => { setStep('summary'); setErr(''); }} style=${{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '14px', textAlign: 'center', fontFamily: 'DM Sans', padding: '4px' }}>← Voltar</button>` : null}
            </div>` : null}
        </div>
      </div>`;
  }

  /* ── App ── */
  function App() {
    const [config, setConfig] = useState(null);
    const [status, setStatus] = useState(null);
    const [cart, setCart] = useState(getCart);
    const [cartOpen, setCartOpen] = useState(false);
    const [captureOpen, setCaptureOpen] = useState(false);

    useEffect(function () {
      Promise.all([
        fetch('/api/config').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
        fetch('/api/store-status').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      ]).then(function (results) {
        if (results[0]) setConfig(results[0]);
        if (results[1]) setStatus(results[1]);
      });
    }, []);

    useEffect(function () {
      var h = function () { setCart(getCart()); };
      window.addEventListener('storage', h);
      return function () { window.removeEventListener('storage', h); };
    }, []);

    function persist(newCart) {
      saveCart(newCart);
      setCart(newCart);
    }

    function handleAdd(product, qty) {
      var wasEmpty = cart.length === 0;
      var productId = String(product.id);
      var newCart = cart.map(function (i) { return Object.assign({}, i); });
      var existing = newCart.find(function (i) { return String(i.id) === productId; });
      if (existing) {
        existing.qty += qty;
      } else {
        newCart.push({ id: product.id, name: product.name, price: product.price, image: product.image_url || null, qty: qty });
      }
      persist(newCart);
        safeTrack('add_to_cart', { product_id: product.id, name: product.name, price: product.price, qty: qty });
      setCartOpen(true);

      if (wasEmpty && !sessionStorage.getItem('tocha-capture-shown')) {
        var stored = null;
        try { stored = JSON.parse(localStorage.getItem('tocha-customer') || 'null'); } catch {}
        if (!stored || !stored.whatsapp) {
          setTimeout(function () {
            setCaptureOpen(true);
            sessionStorage.setItem('tocha-capture-shown', '1');
          }, 700);
        }
      }
    }

    function handleUpdateQty(id, qty) {
      if (qty <= 0) { persist(cart.filter(function (i) { return String(i.id) !== String(id); })); return; }
      persist(cart.map(function (i) { return String(i.id) === String(id) ? Object.assign({}, i, { qty: qty }) : i; }));
    }

    function handleRemove(id) {
      persist(cart.filter(function (i) { return String(i.id) !== String(id); }));
    }

    var totalItems = cart.reduce(function (s, i) { return s + i.qty; }, 0);

    function scrollToMenu() {
      var el = document.getElementById('cardapio');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    return html`
      <div>
        <${AnnouncementBar} status=${status} />
        <${Navbar} cartCount=${totalItems} onCartOpen=${() => setCartOpen(true)} />
        <${Hero} status=${status} onShop=${scrollToMenu} />
        <${ManifestoStrip} />
        <${HowItWorksSection} />
        <${MenuSection} config=${config} onAdd=${handleAdd} />
        <${FoodserviceSection} />
        <${Footer} />
        <${WhatsAppFloat} />
        <${EarlyCaptureModal} open=${captureOpen} onClose=${() => setCaptureOpen(false)} />
        <${CartDrawer}
          open=${cartOpen}
          onClose=${() => setCartOpen(false)}
          cart=${cart}
          onUpdateQty=${handleUpdateQty}
          onRemove=${handleRemove}
          status=${status}
        />
      </div>`;
  }

  window.ReactDOM.createRoot(document.getElementById('root')).render(window.React.createElement(App));
}());
