// @ts-nocheck — variáveis declaradas aqui serão consumidas pelas seções/componentes dos próximos passos
(function () {
  'use strict';

  // ── Runtime globals ───────────────────────────────────────────
  const { useState, useEffect, useRef, useMemo, useCallback } = window.React;
  const html = window.htm.bind(window.React.createElement);

  // ── Design tokens (tokens.js carregado antes deste arquivo) ──
  const T = window.T;

  // ── Hooks (hooks/*.js carregados antes deste arquivo) ─────────
  const useScrollReveal = window.useScrollReveal;
  const useScrolled     = window.useScrolled;
  const useParallax     = window.useParallax;
  const useCountdown    = window.useCountdown;
  const useIsMobile     = window.useIsMobile;

  // ── Sections ──────────────────────────────────────────────────
  const AnnouncementBar = window.AnnouncementBar;
  const Navbar          = window.Navbar;
  const Hero            = window.Hero;

  // ─────────────────────────────────────────────────────────────
  // UTILS
  // ─────────────────────────────────────────────────────────────

  function formatPrice(v) {
    return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
  }

  function getCart() {
    try { return JSON.parse(localStorage.getItem('tocha-cart') || '[]'); } catch { return []; }
  }

  function saveCart(c) {
    localStorage.setItem('tocha-cart', JSON.stringify(c));
  }

  function fetchWithTimeout(url, options, timeout) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeout || 10000);
    return fetch(url, { ...options, signal: ctrl.signal })
      .finally(() => clearTimeout(id));
  }

  function safeTrack(event, props) {
    if (typeof window.track === 'function') window.track(event, props);
  }

  // ─────────────────────────────────────────────────────────────
  // APP
  // ─────────────────────────────────────────────────────────────

  function App() {

    // ── Server state ────────────────────────────────────────────
    const [status, setStatus] = useState(null);
    const [config, setConfig] = useState(null);

    // ── UI state ────────────────────────────────────────────────
    const [cart, setCart]             = useState(getCart);
    const [cartOpen, setCartOpen]     = useState(false);
    const [captureOpen, setCaptureOpen] = useState(false);

    // ── Boot: busca status e config da API ───────────────────────
    useEffect(() => {
      fetchWithTimeout('/api/status', {}, 8000)
        .then(r => r.json()).then(setStatus).catch(() => {});

      fetchWithTimeout('/api/config', {}, 8000)
        .then(r => r.json()).then(setConfig).catch(() => {});
    }, []);

    // ── Sincroniza carrinho entre abas ───────────────────────────
    useEffect(() => {
      const h = () => setCart(getCart());
      window.addEventListener('storage', h);
      return () => window.removeEventListener('storage', h);
    }, []);

    // ── Ações do carrinho ────────────────────────────────────────
    function persist(newCart) {
      saveCart(newCart);
      setCart(newCart);
    }

    function handleAdd(product, qty) {
      qty = qty || 1;
      const wasEmpty = cart.length === 0;
      const newCart = cart.map(i => ({ ...i }));
      const existing = newCart.find(i => String(i.id) === String(product.id));

      if (existing) {
        existing.qty += qty;
      } else {
        newCart.push({
          id:    product.id,
          name:  product.name,
          price: product.price,
          image: product.image_url || null,
          qty,
        });
      }

      persist(newCart);
      safeTrack('add_to_cart', { product_id: product.id, name: product.name, qty });
      setCartOpen(true);

      // Early capture: pede dados na primeira adição se ainda não salvos
      if (wasEmpty && !sessionStorage.getItem('tocha-capture-shown')) {
        let stored = null;
        try { stored = JSON.parse(localStorage.getItem('tocha-customer') || 'null'); } catch {}
        if (!stored || !stored.whatsapp) {
          setTimeout(() => {
            setCaptureOpen(true);
            sessionStorage.setItem('tocha-capture-shown', '1');
          }, 700);
        }
      }
    }

    function handleUpdateQty(id, qty) {
      if (qty <= 0) { persist(cart.filter(i => String(i.id) !== String(id))); return; }
      persist(cart.map(i => String(i.id) === String(id) ? { ...i, qty } : i));
    }

    function handleRemove(id) {
      persist(cart.filter(i => String(i.id) !== String(id)));
    }

    function scrollToMenu() {
      const el = document.getElementById('cardapio');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    const totalItems = cart.reduce((s, i) => s + i.qty, 0);

    // ── Render ───────────────────────────────────────────────────
    // Seções serão adicionadas aqui, uma por vez, nos próximos passos.
    // Cada componente receberá as props necessárias listadas abaixo:
    //
    //   <AnnouncementBar status=${status} />
    //   <Navbar cartCount=${totalItems} onCartOpen=${() => setCartOpen(true)} />
    //   <Hero status=${status} onShop=${scrollToMenu} />
    //   <ManifestoStrip />
    //   <HowItWorksSection />
    //   <MenuSection config=${config} onAdd=${handleAdd} />
    //   <FoodserviceSection />
    //   <Footer />
    //   <WhatsAppFloat />
    //   <EarlyCaptureModal open=${captureOpen} onClose=${() => setCaptureOpen(false)} />
    //   <CartDrawer
    //     open=${cartOpen}
    //     onClose=${() => setCartOpen(false)}
    //     cart=${cart}
    //     onUpdateQty=${handleUpdateQty}
    //     onRemove=${handleRemove}
    //     status=${status}
    //   />

    return html`
      <div id="app-root">
        <${AnnouncementBar} status=${status} />
        <${Navbar} cart=${cart} setCartOpen=${setCartOpen} scrollToMenu=${scrollToMenu} />
        <${Hero} scrollToMenu=${scrollToMenu} />
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────
  // MOUNT
  // ─────────────────────────────────────────────────────────────
  window.ReactDOM.createRoot(document.getElementById('root'))
    .render(window.React.createElement(App));

}());
