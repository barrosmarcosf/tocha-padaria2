// @ts-nocheck
(function () {
  'use strict';

  const { useState, useEffect, useRef, useMemo, useCallback } = window.React;
  const html = window.htm.bind(window.React.createElement);
  const T = window.T;

  const useScrollReveal = window.useScrollReveal;
  const useScrolled     = window.useScrolled;
  const useParallax     = window.useParallax;
  const useCountdown    = window.useCountdown;
  const useIsMobile     = window.useIsMobile;

  const GlobalStyles      = window.GlobalStyles;
  const AnnouncementBar   = window.AnnouncementBar;
  const Navbar            = window.Navbar;
  const Hero              = window.Hero;
  const ManifestoStrip    = window.ManifestoStrip;
  const HowItWorksSection = window.HowItWorksSection;
  const MenuSection       = window.MenuSection;
  const InstagramStrip    = window.InstagramStrip;
  const FoodServiceSection = window.FoodServiceSection;
  const Footer            = window.Footer;
  const WhatsAppFloating  = window.WhatsAppFloating;
  const EarlyCaptureModal = window.EarlyCaptureModal;
  const CartDrawer        = window.CartDrawer;

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
    return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(id));
  }

  function safeTrack(event, props) {
    if (typeof window.track === 'function') window.track(event, props);
  }

  function App() {
    const [status, setStatus]               = useState(null);
    const [config, setConfig]               = useState(null);
    const [cart, setCart]                   = useState(getCart);
    const [cartOpen, setCartOpen]           = useState(false);
    const [captureOpen, setCaptureOpen]     = useState(false);
    const [checkoutStatus, setCheckoutStatus] = useState('idle');
    const [pixData, setPixData]             = useState(null);

    useEffect(() => {
      fetchWithTimeout('/api/status', {}, 8000)
        .then(r => r.json()).then(setStatus).catch(() => {});
      fetchWithTimeout('/api/config', {}, 8000)
        .then(r => r.json()).then(setConfig).catch(() => {});
    }, []);

    useEffect(() => {
      const h = () => setCart(getCart());
      window.addEventListener('storage', h);
      return () => window.removeEventListener('storage', h);
    }, []);

    function persist(newCart) {
      saveCart(newCart);
      setCart(newCart);
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

    function handleCheckout() {}

    const totalItems = cart.reduce((s, i) => s + i.qty, 0);

    const [customerInfo, setCustomerInfo] = useState(null);
    const [pendingItem, setPendingItem] = useState(null);

    function addToCart(item) {
      setCart((prev) => {
        const existing = prev.find((i) => i.id === item.id);

        if (existing) {
          return prev.map((i) =>
            i.id === item.id ? { ...i, qty: i.qty + 1 } : i
          );
        }

        return [...prev, { ...item, qty: 1 }];
      });

      if (customerInfo) {
        setCartOpen(true);
      }
    }

    function handleAdd(item) {
      if (!customerInfo) {
        setPendingItem(item);
        setCaptureOpen(true);
        return;
      }

      addToCart(item);
    }

    return html`
  <div id="app-root">
    <${GlobalStyles} />

    <${AnnouncementBar} status=${status} />

    <${Navbar}
      cartCount=${totalItems}
      onCartOpen=${() => setCartOpen(true)}
    />

    <${Hero} status=${status} scrollToMenu=${scrollToMenu} />

    <${ManifestoStrip} />

    <${HowItWorksSection} />

    <${MenuSection}
      cart=${cart}
      onAdd=${handleAdd}
      onUpdateQty=${handleUpdateQty}
      config=${config}
    />

    <${InstagramStrip} />
    <${FoodServiceSection} />

    <${Footer} />
    <${WhatsAppFloating} />

    <${EarlyCaptureModal}
      open=${captureOpen}
      onClose=${() => {
        setCaptureOpen(false);
        setPendingItem(null);
      }}
      onConfirm=${(data) => {
        setCustomerInfo(data);
        setCaptureOpen(false);

        if (pendingItem) {
          addToCart(pendingItem);
          setPendingItem(null);
        }
      }}
    />

    <${CartDrawer}
      open=${cartOpen}
      onClose=${() => {
        setCartOpen(false);
        setCheckoutStatus('idle');
      }}
      cart=${cart}
      onUpdateQty=${handleUpdateQty}
      onRemove=${handleRemove}
      status=${checkoutStatus}
      onCheckout=${handleCheckout}
      pixData=${pixData}
      customerInfo=${customerInfo}
      onUpdateCustomer=${setCustomerInfo}
    />
  </div>
`;
  }

  window.ReactDOM.createRoot(document.getElementById('root'))
    .render(window.React.createElement(App));

}());
