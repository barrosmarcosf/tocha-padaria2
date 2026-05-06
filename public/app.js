// @ts-nocheck
(function () {
  'use strict';

  if (!document.getElementById('root')) return;

  const { useState, useEffect } = window.React;
  const html = window.htm.bind(window.React.createElement);

  const GlobalStyles       = window.GlobalStyles;
  const AnnouncementBar    = window.AnnouncementBar;
  const Navbar             = window.Navbar;
  const Hero               = window.Hero;
  const ManifestoStrip     = window.ManifestoStrip;
  const HowItWorksSection  = window.HowItWorksSection;
  const MenuSection        = window.MenuSection;
  const HistoriaSection    = window.HistoriaSection;
  const InstagramStrip     = window.InstagramStrip;
  const FoodServiceSection = window.FoodServiceSection;
  const Footer             = window.Footer;
  const WhatsAppFloating   = window.WhatsAppFloating;
  const EarlyCaptureModal  = window.EarlyCaptureModal;
  const CartDrawer         = window.CartDrawer;

  function getCart() {
    try { return JSON.parse(localStorage.getItem('tocha-cart') || '[]'); } catch { return []; }
  }

  function saveCart(c) {
    localStorage.setItem('tocha-cart', JSON.stringify(c));
  }

  function fetchSafe(url) {
    return fetch(url, { signal: AbortSignal.timeout(8000) })
      .then(r => r.json()).catch(() => null);
  }

  function App() {
    const [status, setStatus]               = useState(null);
    const [config, setConfig]               = useState(null);
    const [cart, setCart]                   = useState(getCart);
    const [cartOpen, setCartOpen]           = useState(false);
    const [captureOpen, setCaptureOpen]     = useState(false);
    const [checkoutStatus, setCheckoutStatus] = useState('idle');
    const [customerInfo, setCustomerInfo]   = useState(null);
    const [pendingItem, setPendingItem]     = useState(null);

    useEffect(() => {
      fetchSafe('/api/status').then(d => d && setStatus(d));
      fetchSafe('/api/config').then(d => d && setConfig(d));
    }, []);

    useEffect(() => {
      const h = () => setCart(getCart());
      window.addEventListener('storage', h);
      return () => window.removeEventListener('storage', h);
    }, []);

    function persist(next) { saveCart(next); setCart(next); }

    function handleUpdateQty(id, qty) {
      if (qty <= 0) return persist(cart.filter(i => String(i.id) !== String(id)));
      persist(cart.map(i => String(i.id) === String(id) ? { ...i, qty } : i));
    }

    function handleRemove(id) {
      persist(cart.filter(i => String(i.id) !== String(id)));
    }

    function scrollToMenu() {
      const el = document.getElementById('cardapio');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    function addToCart(item) {
      setCart(prev => {
        const existing = prev.find(i => i.id === item.id);
        const next = existing
          ? prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
          : [...prev, { ...item, qty: 1 }];
        saveCart(next);
        return next;
      });
      setCartOpen(true);
    }

    function handleAdd(item) {
      if (!customerInfo) { setPendingItem(item); setCaptureOpen(true); return; }
      addToCart(item);
    }

    const totalItems = cart.reduce((s, i) => s + i.qty, 0);

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

        ${HistoriaSection && html`<${HistoriaSection} />`}

        <${FoodServiceSection} />

        <${InstagramStrip} />

        <${Footer} />

        <${WhatsAppFloating} />

        <${EarlyCaptureModal}
          open=${captureOpen}
          onClose=${() => { setCaptureOpen(false); setPendingItem(null); }}
          onConfirm=${(data) => {
            setCustomerInfo(data);
            setCaptureOpen(false);
            if (pendingItem) { addToCart(pendingItem); setPendingItem(null); }
          }}
        />

        <${CartDrawer}
          open=${cartOpen}
          onClose=${() => { setCartOpen(false); setCheckoutStatus('idle'); }}
          cart=${cart}
          onUpdateQty=${handleUpdateQty}
          onRemove=${handleRemove}
          status=${checkoutStatus}
          onCheckout=${() => {}}
          pixData=${null}
          customerInfo=${customerInfo}
          onUpdateCustomer=${setCustomerInfo}
        />
      </div>
    `;
  }

  window.ReactDOM.createRoot(document.getElementById('root'))
    .render(window.React.createElement(App));

}());
