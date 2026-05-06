// ============================================================
// MAIN.JS — Tocha Padaria home-v2 (vanilla JS)
// ============================================================
(function () {
  'use strict';

  // ──────────────────────────────────────────────
  // UTILS
  // ──────────────────────────────────────────────
  function fmt(v) {
    return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
  }

  function pad(n) {
    return String(n || 0).padStart(2, '0');
  }

  function safeTrack(event, props) {
    if (typeof window.track === 'function') window.track(event, props);
  }

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  // ──────────────────────────────────────────────
  // TAG COLORS
  // ──────────────────────────────────────────────
  const TAG_COLORS = {
    'Clássico':    'oklch(72% 0.12 60)',
    'Favorito':    'oklch(72% 0.12 60)',
    'Especial':    'oklch(65% 0.1 200)',
    'Novidade':    'oklch(65% 0.1 130)',
    'Exclusivo':   'oklch(55% 0.1 30)',
    'Sazonal':     'oklch(65% 0.1 160)',
    'Para Servir': 'oklch(65% 0.1 280)',
  };

  // ──────────────────────────────────────────────
  // CART STATE
  // ──────────────────────────────────────────────
  function getCart() {
    try { return JSON.parse(localStorage.getItem('tocha-cart') || '[]'); } catch { return []; }
  }

  function saveCart(c) {
    localStorage.setItem('tocha-cart', JSON.stringify(c));
  }

  const state = {
    cart: getCart(),
    customerInfo: null,
    cartOpen: false,
    captureOpen: false,
    pendingItem: null,
    activeCategory: Object.keys(window.MENU_DATA)[0],
    search: '',
    drawerView: 'cart',
    orderNote: '',
    checkoutPayment: 'whatsapp',
  };

  // ──────────────────────────────────────────────
  // ANNOUNCEMENT BAR — countdown
  // ──────────────────────────────────────────────
  function initCountdown() {
    const el = qs('#countdown');
    const bar = qs('#announcement-bar');
    if (!el) return;

    function getTarget() {
      const now = new Date();
      const day = now.getDay();
      const daysUntilSat = (6 - day + 7) % 7 || 7;
      const sat = new Date(now);
      sat.setDate(now.getDate() + daysUntilSat);
      sat.setHours(11, 0, 0, 0);
      return sat.getTime();
    }

    const target = getTarget();

    function tick() {
      const diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      el.textContent = `${d}D ${String(h).padStart(2,'0')}H ${String(m).padStart(2,'0')}M`;
      if (diff <= 0) clearInterval(id);
    }

    tick();
    const id = setInterval(tick, 1000);

    // Hide bar on scroll past 80px
    window.addEventListener('scroll', function () {
      if (bar) bar.classList.toggle('bar-hidden', window.scrollY >= 80);
    }, { passive: true });
  }

  // ──────────────────────────────────────────────
  // NAVBAR — scroll state
  // ──────────────────────────────────────────────
  function initNavbar() {
    const nav = qs('#navbar');
    if (!nav) return;

    let ticking = false;

    function update() {
      nav.classList.toggle('scrolled', window.scrollY >= 60);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    update();
  }

  // ──────────────────────────────────────────────
  // HERO PARALLAX
  // ──────────────────────────────────────────────
  function initHeroParallax() {
    const bg = qs('#hero-bg');
    if (!bg) return;

    let ticking = false;

    function update() {
      bg.style.transform = 'translateY(' + (window.scrollY * 0.25) + 'px)';
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    // Smooth scroll for "Como pedir" link
    const howLink = qs('#hero-how-link');
    if (howLink) {
      howLink.addEventListener('click', function (e) {
        e.preventDefault();
        const el = qs('#como-funciona');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  // ──────────────────────────────────────────────
  // MANIFESTO STRIP — build marquee HTML
  // ──────────────────────────────────────────────
  function initManifestoStrip() {
    const track = qs('#marquee-track');
    if (!track) return;

    const items = [
      'Levain ativo desde 2022',
      'Sem conservantes',
      'Fermentação longa',
      'Fornadas aos sábados',
      'Feito com paciência',
      'São João de Meriti',
    ];

    // Triple the items so the marquee loops seamlessly
    const all = [...items, ...items, ...items];
    track.innerHTML = all.map(function (item) {
      return '<span class="marquee-item">' + item +
             '<span class="marquee-star" aria-hidden="true">✦</span></span>';
    }).join('');
  }

  // ──────────────────────────────────────────────
  // HOW IT WORKS — staggered step reveal
  // ──────────────────────────────────────────────
  function initHowItWorks() {
    const HOW_STEPS = [
      { n: '01', label: 'Pedido',   title: 'Peça com antecedência',      desc: 'Pedidos abertos de domingo a quinta-feira, até às 16h.',                                              meta: 'Dom – Qui · até 16h' },
      { n: '02', label: 'Produção', title: 'Fornada de sábado',           desc: 'Produzimos sob demanda na manhã do sábado. Cada pedido recebe seu lugar no forno.',                   meta: 'Sábado · sob demanda' },
      { n: '03', label: 'Aviso',    title: 'Mensagem no WhatsApp',        desc: 'Quando seu pedido estiver pronto, você recebe um aviso com instruções de retirada.',                   meta: 'Notificação por WhatsApp' },
      { n: '04', label: 'Retirada', title: 'Retire a partir das 15h',     desc: 'Presencial em São João de Meriti ou via 99 / Uber Flash por sua conta.',                              meta: 'Sábado · a partir 15h' },
    ];

    const grid = qs('#steps-grid');
    if (!grid) return;

    grid.innerHTML = HOW_STEPS.map(function (step) {
      return '<div class="step-wrap" data-step>' +
        '<div class="step-card">' +
          '<div class="step-header">' +
            '<div class="step-num">' + step.n + '</div>' +
            '<div class="step-label-text">' + step.label + '</div>' +
          '</div>' +
          '<h3 class="step-title">' + step.title + '</h3>' +
          '<p class="step-desc">' + step.desc + '</p>' +
          '<div class="step-meta">' + step.meta + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    const section = qs('#como-funciona');
    const stepEls = qsa('.step-wrap', grid);

    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          stepEls.forEach(function (el, i) {
            setTimeout(function () { el.classList.add('visible'); }, i * 180);
          });
          obs.disconnect();
        }
      });
    }, { threshold: 0.15 });

    if (section) obs.observe(section);
  }

  // ──────────────────────────────────────────────
  // SCROLL REVEAL — generic
  // ──────────────────────────────────────────────
  function initScrollReveal() {
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });

    qsa('.reveal-wrap').forEach(function (el) { obs.observe(el); });
  }

  // ──────────────────────────────────────────────
  // MENU SECTION
  // ──────────────────────────────────────────────
  function initMenu() {
    const MENU_DATA     = window.MENU_DATA || {};
    const PRODUCTS_FLAT = window.PRODUCTS_FLAT || [];
    const categories    = Object.entries(MENU_DATA);

    if (!categories.length) return;

    const categoryNav  = qs('#category-nav');
    const productsArea = qs('#products-area');
    const searchInput  = qs('#menu-search');
    const searchClear  = qs('#search-clear');
    const menuLayout   = qs('#menu-layout');

    // ── Build category nav ──
    categoryNav.innerHTML = categories.map(function (entry) {
      const key = entry[0];
      const cat = entry[1];
      return '<button class="cat-btn' + (key === state.activeCategory ? ' active' : '') +
             '" data-cat="' + escHtml(key) + '">' +
               '<span class="cat-icon" aria-hidden="true">' + cat.icon + '</span>' +
               '<div class="cat-info">' +
                 '<div class="cat-name">' + escHtml(key) + '</div>' +
                 '<div class="cat-count">' + cat.items.length + ' itens</div>' +
               '</div>' +
               '<div class="cat-dot" aria-hidden="true"></div>' +
             '</button>';
    }).join('');

    // Category click
    categoryNav.addEventListener('click', function (e) {
      const btn = e.target.closest('.cat-btn');
      if (!btn) return;
      state.activeCategory = btn.dataset.cat;
      state.search = '';
      searchInput.value = '';
      searchInput.classList.remove('has-value');
      searchClear.classList.remove('visible');
      menuLayout.classList.remove('search-active');
      renderProducts();
      updateCatButtons();
    });

    // ── Search ──
    searchInput.addEventListener('input', function () {
      state.search = searchInput.value;
      const hasValue = !!state.search.trim();
      searchInput.classList.toggle('has-value', hasValue);
      searchClear.classList.toggle('visible', hasValue);
      menuLayout.classList.toggle('search-active', hasValue);
      renderProducts();
    });

    searchClear.addEventListener('click', function () {
      state.search = '';
      searchInput.value = '';
      searchInput.classList.remove('has-value');
      searchClear.classList.remove('visible');
      menuLayout.classList.remove('search-active');
      renderProducts();
    });

    // ── Initial render ──
    renderProducts();

    function updateCatButtons() {
      qsa('.cat-btn', categoryNav).forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.cat === state.activeCategory);
      });
    }

    function renderProducts() {
      const q = state.search.trim().toLowerCase();
      const isSearch = !!q;

      let items, headerHTML;

      if (isSearch) {
        items = PRODUCTS_FLAT.filter(function (p) {
          return p.name.toLowerCase().includes(q) || (p.desc || '').toLowerCase().includes(q);
        });
        const label = items.length + ' resultado' + (items.length !== 1 ? 's' : '') + ' para "' + escHtml(state.search) + '"';
        headerHTML = '<div class="products-header">' +
          '<p class="products-cat-desc"><span class="search-result-label">' + label + '</span></p>' +
          '</div>';
      } else {
        const cat = MENU_DATA[state.activeCategory] || { items: [], icon: '', desc: '' };
        items = cat.items;
        headerHTML = '<div class="products-header">' +
          '<div class="products-title-row">' +
            '<span class="products-cat-icon" aria-hidden="true">' + cat.icon + '</span>' +
            '<h3 class="products-cat-name">' + escHtml(state.activeCategory) + '</h3>' +
            '<span class="products-count-badge">' + items.length + '</span>' +
          '</div>' +
          '<p class="products-cat-desc">' + escHtml(cat.desc) + '</p>' +
        '</div>';
      }

      if (items.length === 0) {
        productsArea.innerHTML = headerHTML +
          '<div class="no-results">' +
            '<div class="no-results-icon">🔍</div>' +
            '<div class="no-results-text">Nenhum resultado encontrado</div>' +
          '</div>';
        return;
      }

      const cardsHTML = items.map(function (product, i) {
        return buildProductCard(product, i);
      }).join('');

      productsArea.innerHTML = headerHTML +
        '<div class="products-grid">' + cardsHTML + '</div>';

      // Wire up card interactions
      qsa('.product-card', productsArea).forEach(initProductCard);

      // Reveal stagger
      qsa('.product-card', productsArea).forEach(function (card, i) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.45s ease ' + Math.min(i * 0.04, 0.3) + 's, transform 0.45s ease ' + Math.min(i * 0.04, 0.3) + 's';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            card.style.opacity = '';
            card.style.transform = '';
          });
        });
      });
    }
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildProductCard(product) {
    const tagColor = TAG_COLORS[product.tag] || 'oklch(55% 0.015 65)';

    const imgHTML = product.img
      ? '<img class="card-img" src="' + escHtml(product.img) + '" alt="' + escHtml(product.name) + '" loading="lazy">'
      : '<div class="card-img-placeholder">' + escHtml(product.name) + '</div>';

    const tagHTML = product.tag
      ? '<div class="card-tag" style="border-color:' + tagColor + ';color:' + tagColor + '">' + escHtml(product.tag) + '</div>'
      : '';

    return '<div class="product-card" data-id="' + product.id + '">' +
      '<div class="card-img-wrap">' +
        imgHTML +
        '<div class="card-img-gradient"></div>' +
        tagHTML +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-top-row">' +
          '<h3 class="card-name">' + escHtml(product.name) + '</h3>' +
          '<span class="card-price" data-base-price="' + product.price + '">' + fmt(product.price) + '</span>' +
        '</div>' +
        '<p class="card-desc">' + escHtml(product.desc || '') + '</p>' +
        '<div class="card-actions">' +
          '<div class="qty-ctrl">' +
            '<button class="qty-btn minus" data-delta="-1" aria-label="Diminuir quantidade">−</button>' +
            '<span class="qty-value" data-qty="1">1</span>' +
            '<button class="qty-btn plus can-minus" data-delta="1" aria-label="Aumentar quantidade">+</button>' +
          '</div>' +
          '<button class="add-btn" data-product-id="' + product.id + '">Adicionar</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function initProductCard(card) {
    const productId = parseInt(card.dataset.id, 10);
    const product   = findProduct(productId);
    if (!product) return;

    const minusBtn  = qs('.qty-btn.minus', card);
    const plusBtn   = qs('.qty-btn.plus', card);
    const qtyEl     = qs('.qty-value', card);
    const priceEl   = qs('.card-price', card);
    const addBtn    = qs('.add-btn', card);

    let qty = 1;
    let addedTimer = null;

    function updateQtyUI() {
      qtyEl.textContent = qty;
      qtyEl.dataset.qty = qty;
      priceEl.textContent = fmt(product.price * qty);
      minusBtn.classList.toggle('can-minus', qty > 1);
    }

    minusBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (qty > 1) { qty--; updateQtyUI(); }
    });

    plusBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      qty = Math.min(99, qty + 1);
      updateQtyUI();
    });

    addBtn.addEventListener('click', function () {
      handleAdd({ ...product, _qty: qty });
      addBtn.classList.add('added');
      addBtn.textContent = '✓ Ok!';
      clearTimeout(addedTimer);
      addedTimer = setTimeout(function () {
        addBtn.classList.remove('added');
        addBtn.textContent = 'Adicionar';
        qty = 1;
        updateQtyUI();
      }, 1800);
    });
  }

  function findProduct(id) {
    return (window.PRODUCTS_FLAT || []).find(function (p) { return p.id === id; });
  }

  // ──────────────────────────────────────────────
  // CART MANAGEMENT
  // ──────────────────────────────────────────────
  function addToCart(item, qty) {
    qty = qty || 1;
    const existing = state.cart.find(function (i) { return i.id === item.id; });
    if (existing) {
      state.cart = state.cart.map(function (i) {
        return i.id === item.id ? { ...i, qty: i.qty + qty } : i;
      });
    } else {
      state.cart = [...state.cart, { ...item, qty: qty }];
    }
    saveCart(state.cart);
    updateCartUI();
    safeTrack('add_to_cart', { id: item.id, name: item.name, qty: qty });
  }

  function handleAdd(item) {
    const qty = item._qty || 1;
    if (!state.customerInfo) {
      state.pendingItem = { ...item, _qty: qty };
      openCapture();
      return;
    }
    addToCart(item, qty);
    openCart();
  }

  function updateQty(id, qty) {
    if (qty <= 0) {
      state.cart = state.cart.filter(function (i) { return String(i.id) !== String(id); });
    } else {
      state.cart = state.cart.map(function (i) {
        return String(i.id) === String(id) ? { ...i, qty: qty } : i;
      });
    }
    saveCart(state.cart);
    updateCartUI();
  }

  function removeFromCart(id) {
    state.cart = state.cart.filter(function (i) { return String(i.id) !== String(id); });
    saveCart(state.cart);
    updateCartUI();
  }

  function updateCartUI() {
    const total = state.cart.reduce(function (s, i) { return s + i.qty; }, 0);
    const badge = qs('#cart-badge');
    if (badge) {
      badge.textContent = total;
      badge.dataset.count = total;
    }
    if (['success', 'error_card', 'error_generic'].includes(state.drawerView)) {
      state.drawerView = 'cart';
    }
    renderDrawerBody();
  }

  // ──────────────────────────────────────────────
  // CART DRAWER — state machine
  // ──────────────────────────────────────────────
  function openCart() {
    state.cartOpen = true;
    if (['success', 'error_card', 'error_generic'].includes(state.drawerView)) {
      state.drawerView = 'cart';
    }
    const drawer = qs('#cart-drawer');
    if (drawer) drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderDrawerBody();
  }

  function closeCart() {
    state.cartOpen = false;
    const drawer = qs('#cart-drawer');
    if (drawer) drawer.classList.remove('open');
    document.body.style.overflow = '';
  }

  function updateDrawerGreeting() {
    const greetingEl = qs('#drawer-greeting');
    if (!greetingEl) return;
    const firstName = state.customerInfo && state.customerInfo.name
      ? state.customerInfo.name.trim().split(/\s+/)[0] : '';
    greetingEl.textContent = firstName ? 'Olá, ' + firstName + '!' : '';
    greetingEl.style.display = firstName ? '' : 'none';
  }

  function updateDrawerTabs() {
    const tabsEl = qs('#drawer-tabs');
    if (!tabsEl) return;
    const v = state.drawerView;
    const cartActive = v === 'cart' || v === 'loading';
    const coActive   = v === 'checkout' || v === 'pix_pending' || v === 'success' || v === 'error_card' || v === 'error_generic';
    const cartCount  = state.cart.length ? ' (' + state.cart.length + ')' : '';
    tabsEl.innerHTML =
      '<button class="drawer-tab' + (cartActive ? ' active' : '') + '" data-tab="cart">Carrinho' + cartCount + '</button>' +
      '<button class="drawer-tab' + (coActive   ? ' active' : '') + '" data-tab="checkout">Checkout</button>';
    qsa('.drawer-tab', tabsEl).forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.dataset.tab === 'cart') {
          state.drawerView = 'cart';
          renderDrawerBody();
        } else if (btn.dataset.tab === 'checkout' && state.cart.length > 0) {
          state.drawerView = 'checkout';
          renderDrawerBody();
          safeTrack('checkout_started', { cart: state.cart });
        }
      });
    });
  }

  function renderDrawerBody() {
    updateDrawerGreeting();
    updateDrawerTabs();
    const body   = qs('#drawer-body');
    const footer = qs('#drawer-footer');
    if (!body) return;

    switch (state.drawerView) {
      case 'checkout':    renderCheckoutView(body, footer);   break;
      case 'loading':     renderLoadingView(body, footer);    break;
      case 'pix_pending': renderPixPendingView(body, footer); break;
      case 'success':     renderSuccessView(body, footer);    break;
      case 'error_card':
      case 'error_generic': renderErrorView(body, footer);   break;
      default:            renderCartView(body, footer);
    }
  }

  function renderCartView(body, footer) {
    if (!state.cart || state.cart.length === 0) {
      body.innerHTML =
        '<div class="cart-empty">' +
          '<div class="cart-empty-icon">🧺</div>' +
          '<p>Seu pedido está vazio.</p>' +
        '</div>';
      if (footer) footer.style.display = 'none';
      return;
    }

    const itemsHTML = state.cart.map(function (item) {
      return '<div class="cart-item" data-id="' + item.id + '">' +
        '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + escHtml(item.name) + '</div>' +
          '<div class="cart-item-price">' + fmt(item.price * item.qty) + '</div>' +
        '</div>' +
        '<div class="cart-item-controls">' +
          '<button class="ci-btn ci-minus" aria-label="Diminuir">−</button>' +
          '<span class="ci-qty">' + item.qty + '</span>' +
          '<button class="ci-btn ci-plus" aria-label="Aumentar">+</button>' +
          '<button class="ci-remove" aria-label="Remover">✕</button>' +
        '</div>' +
      '</div>';
    }).join('');

    const noteHTML =
      '<div class="order-note-box">' +
        '<div class="order-note-label">Observações</div>' +
        '<textarea class="order-note-input" id="order-note" placeholder="Alguma observação para o pedido?" rows="3">' +
          escHtml(state.orderNote) +
        '</textarea>' +
      '</div>';

    body.innerHTML = itemsHTML + noteHTML;

    qsa('.cart-item', body).forEach(function (el) {
      const id   = el.dataset.id;
      const item = state.cart.find(function (i) { return String(i.id) === id; });
      if (!item) return;
      qs('.ci-minus',  el).addEventListener('click', function () { updateQty(id, item.qty - 1); });
      qs('.ci-plus',   el).addEventListener('click', function () { updateQty(id, item.qty + 1); });
      qs('.ci-remove', el).addEventListener('click', function () { removeFromCart(id); });
    });

    const noteInput = qs('#order-note');
    if (noteInput) noteInput.addEventListener('input', function () { state.orderNote = noteInput.value; });

    if (footer) {
      footer.style.display = '';
      const totalVal = state.cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
      const totalEl  = qs('#cart-total');
      if (totalEl) totalEl.textContent = fmt(totalVal);
      const btn = qs('#whatsapp-order-btn');
      if (btn) {
        btn.textContent = 'Finalizar pedido →';
        btn.removeAttribute('href');
        btn.onclick = function () {
          state.drawerView = 'checkout';
          renderDrawerBody();
          safeTrack('checkout_started', { cart: state.cart });
        };
      }
    }
  }

  function renderCheckoutView(body, footer) {
    const name  = state.customerInfo && state.customerInfo.name     ? state.customerInfo.name     : '';
    const phone = state.customerInfo && state.customerInfo.whatsapp ? state.customerInfo.whatsapp : '';
    const totalVal = state.cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);

    body.innerHTML =
      '<div class="checkout-form">' +
        '<div class="checkout-section-label">Seus dados</div>' +
        '<input id="co-name"  class="checkout-input" type="text" placeholder="Nome" value="' + escHtml(name) + '" autocomplete="name">' +
        '<input id="co-phone" class="checkout-input" type="tel"  placeholder="(21) 99999-9999" value="' + escHtml(phone) + '" autocomplete="tel">' +
        '<div class="checkout-section-label" style="margin-top:20px">Forma de pagamento</div>' +
        '<div class="payment-options">' +
          '<button class="payment-opt' + (state.checkoutPayment === 'whatsapp' ? ' active' : '') + '" data-payment="whatsapp">' +
            '<span class="payment-opt-icon">💬</span>' +
            '<div><div class="payment-opt-title">WhatsApp</div><div class="payment-opt-desc">Acertar direto no chat</div></div>' +
          '</button>' +
          '<button class="payment-opt' + (state.checkoutPayment === 'pix' ? ' active' : '') + '" data-payment="pix">' +
            '<span class="payment-opt-icon">⚡</span>' +
            '<div><div class="payment-opt-title">PIX</div><div class="payment-opt-desc">Chave: 21966278965</div></div>' +
          '</button>' +
        '</div>' +
      '</div>';

    qsa('.payment-opt', body).forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.checkoutPayment = btn.dataset.payment;
        qsa('.payment-opt', body).forEach(function (b) {
          b.classList.toggle('active', b.dataset.payment === state.checkoutPayment);
        });
      });
    });

    if (footer) {
      footer.style.display = '';
      const totalEl = qs('#cart-total');
      if (totalEl) totalEl.textContent = fmt(totalVal);
      const btn = qs('#whatsapp-order-btn');
      if (btn) {
        btn.textContent = 'Confirmar pedido →';
        btn.removeAttribute('href');
        btn.onclick = function () {
          const coName  = qs('#co-name');
          const coPhone = qs('#co-phone');
          const name2   = coName  ? coName.value.trim()  : name;
          const phone2  = coPhone ? coPhone.value.trim() : phone;
          state.customerInfo = { name: name2, whatsapp: phone2 };
          safeTrack('payment_attempt', { payment: state.checkoutPayment, total: totalVal });
          if (state.checkoutPayment === 'pix') {
            state.drawerView = 'loading';
            renderDrawerBody();
            setTimeout(function () {
              state.drawerView = 'pix_pending';
              renderDrawerBody();
            }, 1200);
          } else {
            const lines = state.cart.map(function (i) {
              return '• ' + i.name + ' x' + i.qty + ' — ' + fmt(i.price * i.qty);
            });
            const note = state.orderNote ? '\n\nObs: ' + state.orderNote : '';
            const msg  = 'Olá! Quero fazer um pedido:\n' + lines.join('\n') + '\n\nTotal: ' + fmt(totalVal) + note;
            state.drawerView = 'success';
            renderDrawerBody();
            safeTrack('purchase_success', { payment: 'whatsapp', total: totalVal });
            setTimeout(function () {
              window.open('https://wa.me/5521966278965?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
            }, 400);
          }
        };
      }
    }
  }

  function renderLoadingView(body, footer) {
    body.innerHTML =
      '<div class="drawer-state-view">' +
        '<div class="drawer-spinner"></div>' +
        '<p class="drawer-state-text">Processando...</p>' +
      '</div>';
    if (footer) footer.style.display = 'none';
  }

  function renderPixPendingView(body, footer) {
    body.innerHTML =
      '<div class="drawer-state-view">' +
        '<div class="pix-icon">⚡</div>' +
        '<h3 class="drawer-state-title">PIX gerado</h3>' +
        '<p class="drawer-state-text">Chave PIX: <strong style="color:var(--cream)">21966278965</strong></p>' +
        '<p class="drawer-state-text pix-hint">Após o pagamento, envie o comprovante no WhatsApp.</p>' +
        '<a href="https://wa.me/5521966278965" target="_blank" rel="noopener" class="btn-whatsapp-order" style="margin-top:24px;text-decoration:none;display:block;text-align:center">Enviar comprovante →</a>' +
      '</div>';
    if (footer) footer.style.display = 'none';
  }

  function renderSuccessView(body, footer) {
    body.innerHTML =
      '<div class="drawer-state-view">' +
        '<div class="drawer-success-icon">✓</div>' +
        '<h3 class="drawer-state-title">Pedido enviado!</h3>' +
        '<p class="drawer-state-text">Você será redirecionado ao WhatsApp para confirmar o pedido.</p>' +
        '<button id="success-close-btn" class="btn-success-close">Fechar</button>' +
      '</div>';
    if (footer) footer.style.display = 'none';
    const btn = qs('#success-close-btn');
    if (btn) btn.addEventListener('click', closeCart);
  }

  function renderErrorView(body, footer) {
    const isCard = state.drawerView === 'error_card';
    body.innerHTML =
      '<div class="drawer-state-view">' +
        '<div class="drawer-error-icon">✕</div>' +
        '<h3 class="drawer-state-title">' + (isCard ? 'Falha no pagamento' : 'Erro no pedido') + '</h3>' +
        '<p class="drawer-state-text">' + (isCard ? 'Não foi possível processar. Tente outra forma de pagamento.' : 'Algo deu errado. Tente novamente ou fale conosco.') + '</p>' +
        '<button id="retry-btn" class="btn-whatsapp-order" style="margin-top:24px">Tentar novamente</button>' +
      '</div>';
    if (footer) footer.style.display = 'none';
    const retryBtn = qs('#retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        safeTrack('payment_failed', { reason: state.drawerView });
        state.drawerView = 'checkout';
        renderDrawerBody();
      });
    }
  }

  function initCartDrawer() {
    const cartBtn     = qs('#cart-btn');
    const drawerClose = qs('#drawer-close');
    const overlay     = qs('#drawer-overlay');

    if (cartBtn)     cartBtn.addEventListener('click', openCart);
    if (drawerClose) drawerClose.addEventListener('click', closeCart);
    if (overlay)     overlay.addEventListener('click', closeCart);

    // Keyboard: Escape closes
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (state.cartOpen)    closeCart();
        if (state.captureOpen) closeCapture();
      }
    });

    // Cross-tab cart sync
    window.addEventListener('storage', function (e) {
      if (e.key === 'tocha-cart') {
        state.cart = getCart();
        updateCartUI();
      }
    });

    updateCartUI();
  }

  // ──────────────────────────────────────────────
  // EARLY CAPTURE MODAL
  // ──────────────────────────────────────────────
  function openCapture() {
    state.captureOpen = true;
    const modal = qs('#early-capture');
    if (modal) modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    const nameInput = qs('#modal-name');
    if (nameInput) setTimeout(function () { nameInput.focus(); }, 350);
  }

  function closeCapture() {
    state.captureOpen = false;
    const modal = qs('#early-capture');
    if (modal) modal.classList.remove('open');
    state.pendingItem = null;
    document.body.style.overflow = '';
    clearModalError();
  }

  function clearModalError() {
    const errEl = qs('#modal-error');
    if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
  }

  function initEarlyCaptureModal() {
    const modal      = qs('#early-capture');
    const overlay    = qs('#modal-overlay');
    const nameInput  = qs('#modal-name');
    const waInput    = qs('#modal-whatsapp');
    const errEl      = qs('#modal-error');
    const btnConfirm = qs('#btn-modal-confirm');
    const btnSkip    = qs('#btn-modal-skip');
    const btnCancel  = qs('#btn-modal-cancel');

    if (!modal) return;

    overlay.addEventListener('click', closeCapture);

    function validateWA(val) {
      if (!val.trim()) return true; // optional
      return val.replace(/\D/g, '').match(/^\d{10,11}$/) !== null;
    }

    function confirm(data) {
      state.customerInfo = data;
      closeCapture();
      if (state.pendingItem) {
        addToCart(state.pendingItem, state.pendingItem._qty || 1);
        state.pendingItem = null;
        openCart();
      }
    }

    btnConfirm.addEventListener('click', function () {
      clearModalError();
      const wa = waInput.value;
      if (!validateWA(wa)) {
        errEl.textContent = 'Formato inválido (ex: 21 99999-9999)';
        errEl.classList.add('visible');
        return;
      }
      confirm({ name: nameInput.value, whatsapp: wa });
    });

    btnSkip.addEventListener('click', function () {
      confirm({ name: '', whatsapp: '' });
    });

    btnCancel.addEventListener('click', closeCapture);

    // Enter key on inputs
    [nameInput, waInput].forEach(function (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') btnConfirm.click();
      });
    });
  }

  // ──────────────────────────────────────────────
  // HISTORIA SECTION
  // ──────────────────────────────────────────────
  function initHistoriaSection() {
    const milestonesEl = qs('#historia-milestones');
    const scrollerEl   = qs('#story-scroller');
    if (!milestonesEl && !scrollerEl) return;

    const MILESTONES = [
      { year: '2022', title: 'O começo',       desc: 'Primeiro levain ativo na cozinha de casa. Testes diários, erros e acertos — nasce a Tocha.' },
      { year: '2023', title: 'Primeiras fornadas', desc: 'Os vizinhos começam a reservar. Fornadas aos sábados viram tradição.' },
      { year: '2024', title: 'A comunidade',   desc: 'Lista de espera, novos produtos e clientes que se tornaram amigos.' },
      { year: '2025', title: 'Hoje',           desc: 'Expansão para foodservice, novos sabores e o mesmo cuidado de sempre.' },
    ];

    if (milestonesEl) {
      milestonesEl.innerHTML = MILESTONES.map(function (m) {
        return '<div class="milestone-item">' +
          '<div class="milestone-dot-row">' +
            '<div class="milestone-dot"></div>' +
            '<span class="milestone-year">' + m.year + '</span>' +
          '</div>' +
          '<h3 class="milestone-title">' + m.title + '</h3>' +
          '<p class="milestone-desc">' + m.desc + '</p>' +
        '</div>';
      }).join('');
    }

    if (!scrollerEl) return;

    const SLIDES = [
      { year: '2022', title: 'Um pote de farinha e água',    desc: 'Tudo começa com temperatura certa, paciência e o som das bolhas formando o levain.',      emoji: '🌱', bg: 'linear-gradient(160deg, oklch(14% 0.025 48), oklch(20% 0.04 45))' },
      { year: '2022', title: 'Acordar às três da manhã',     desc: 'O aroma avisa antes do temporizador. Aprender a ouvir a massa é o primeiro ofício.',        emoji: '🌙', bg: 'linear-gradient(160deg, oklch(10% 0.015 50), oklch(16% 0.03 47))' },
      { year: '2023', title: 'A vizinha bateu à porta',      desc: 'Ela queria comprar. O primeiro pedido não foi planejado — foi uma boa surpresa.',           emoji: '🚪', bg: 'linear-gradient(160deg, oklch(16% 0.03 46), oklch(22% 0.05 43))' },
      { year: '2024', title: 'O sábado ficou pequeno',       desc: 'De cinco para cinquenta clientes. A lista cresceu; a receita não mudou.',                   emoji: '📋', bg: 'linear-gradient(160deg, oklch(12% 0.02 50), oklch(18% 0.035 48))' },
      { year: '2025', title: 'O mesmo levain, mais história',desc: 'Três anos depois, o pote ainda borbulha toda manhã. E a história continua.',               emoji: '✨', bg: 'linear-gradient(160deg, oklch(15% 0.03 47), oklch(24% 0.05 44))' },
    ];
    var N = SLIDES.length;
    var STICKY_TOP = 104;

    scrollerEl.style.height = (N * 100) + 'vh';
    scrollerEl.innerHTML =
      '<div class="ss-sticky" id="ss-sticky">' +
        '<div class="ss-progress-bar"><div id="ss-fill" class="ss-fill"></div></div>' +
        '<div class="ss-counter" id="ss-counter">1 / ' + N + '</div>' +
        '<div class="ss-track" id="ss-track" style="width:' + (N * 100) + '%">' +
          SLIDES.map(function (s) {
            return '<div class="ss-slide" style="background:' + s.bg + ';flex:0 0 ' + (100 / N) + '%">' +
              '<div class="ss-slide-emoji" aria-hidden="true">' + s.emoji + '</div>' +
              '<div class="ss-overlay"></div>' +
              '<div class="ss-content">' +
                '<p class="ss-year">' + s.year + '</p>' +
                '<h3 class="ss-title">' + s.title + '</h3>' +
                '<p class="ss-desc">'  + s.desc  + '</p>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div class="ss-dots" id="ss-dots">' +
          SLIDES.map(function (s, i) {
            return '<button class="ss-dot' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '" aria-label="Slide ' + (i + 1) + '"></button>';
          }).join('') +
        '</div>' +
      '</div>';

    var track   = qs('#ss-track');
    var fill    = qs('#ss-fill');
    var counter = qs('#ss-counter');
    var dots    = qsa('.ss-dot', scrollerEl);
    var raf     = null;
    var lastIdx = 0;

    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        var rect        = scrollerEl.getBoundingClientRect();
        var totalScroll = scrollerEl.offsetHeight - (window.innerHeight - STICKY_TOP);
        var scrolled    = STICKY_TOP - rect.top;
        var progress    = Math.max(0, Math.min(1, scrolled / totalScroll));
        if (track) track.style.transform = 'translateX(-' + (progress * (N - 1) / N * 100) + '%)';
        if (fill)  fill.style.width = (progress * 100) + '%';
        var idx = Math.min(N - 1, Math.floor(progress * N));
        if (idx !== lastIdx) {
          lastIdx = idx;
          if (counter) counter.textContent = (idx + 1) + ' / ' + N;
          dots.forEach(function (d, i) {
            d.classList.toggle('active', i === idx);
            d.style.width = i === idx ? '24px' : '8px';
          });
        }
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    scrollerEl.addEventListener('click', function (e) {
      var dot = e.target.closest('.ss-dot');
      if (!dot) return;
      var i = parseInt(dot.dataset.idx, 10);
      var totalScroll = scrollerEl.offsetHeight - (window.innerHeight - STICKY_TOP);
      var elTop = scrollerEl.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elTop - STICKY_TOP + (i / (N - 1)) * totalScroll, behavior: 'smooth' });
    });
  }

  // ──────────────────────────────────────────────
  // INIT
  // ──────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    initCountdown();
    initNavbar();
    initHeroParallax();
    initManifestoStrip();
    initHowItWorks();
    initScrollReveal();
    initMenu();
    initCartDrawer();
    initEarlyCaptureModal();
  });

}());
