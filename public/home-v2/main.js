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

  function normalizePhone(input) {
    if (!input) return '';
    var phone = input.replace(/\D/g, '');
    if (phone.startsWith('55')) phone = phone.slice(2);
    if (phone.startsWith('0')) phone = phone.slice(1);
    return phone.slice(0, 11);
  }

  function isValidPhone(phone) {
    return phone.length === 10 || phone.length === 11;
  }

  function getNextSaturday() {
    var today = new Date();
    var day = today.getDay();
    var diff = (6 - day + 7) % 7 || 7;
    var saturday = new Date(today);
    saturday.setDate(today.getDate() + diff);
    return saturday.toLocaleDateString('pt-BR');
  }

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

  function loadCustomerInfo() {
    try { return JSON.parse(localStorage.getItem('tocha-customer')) || null; } catch { return null; }
  }

  function saveCustomerInfo(info) {
    try { localStorage.setItem('tocha-customer', JSON.stringify(info)); } catch {}
  }

  const state = {
    cart: getCart(),
    customerInfo: loadCustomerInfo(),
    cartOpen: false,
    captureOpen: false,
    pendingItem: null,
    activeCategory: Object.keys(window.MENU_DATA)[0] || '',
    search: '',
    drawerView: 'cart',
    orderNote: '',
    checkoutPayment: 'mp_pix',
    pixData: null,
    stripeUrl: null,
    mpCardFormActive: false,
    checkoutCustomer: null,
  };

  // ── Payment runtime vars (module-level, survives re-renders) ──
  var _mpBricksCtrl = null;
  var _mpPublicKey  = null;
  var _menuRender   = null; // set by initMenu, called after API refresh
  var _pixPollTimer = null;

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

    const target   = getTarget();
    const satDate  = new Date(target);
    const satLabel = satDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    function tick() {
      const diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.textContent = `${d}D ${String(h).padStart(2,'0')}H ${String(m).padStart(2,'0')}M`;
      const mobileEl = qs('#countdown-mobile');
      if (mobileEl) {
        mobileEl.textContent = 'PEDIDOS FORNADA ' + satLabel + ' · ENCERRA EM ' + pad(h) + ':' + pad(m) + ':' + pad(s);
      }
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

    // Start animation only after content AND fonts are ready so widths are correct.
    // (Animation on empty track gives wrong translateX percentage; fallback fonts
    //  give wrong widths before web fonts load.)
    function startMarquee() {
      track.offsetWidth; // force reflow — ensures max-content width is computed
      track.classList.add('running');
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(startMarquee);
    } else {
      requestAnimationFrame(startMarquee);
    }
  }

  // ──────────────────────────────────────────────
  // HOW IT WORKS — staggered step reveal
  // ──────────────────────────────────────────────
  function initHowItWorks() {
    const HOW_STEPS = [
      { n: '01', label: 'Peça',     title: 'Peça com antecedência',   desc: 'Pedidos abertos de dom a qui, até as 16h.',                  meta: 'Dom – Qui · até 16h'  },
      { n: '02', label: 'Forno',    title: 'Fornada de sábado',       desc: 'Produzimos sob demanda. Cada pedido tem lugar no forno.',     meta: 'Sábado · sob demanda' },
      { n: '03', label: 'Aviso',    title: 'Aviso no WhatsApp',       desc: 'Quando pronto, você recebe mensagem com as instruções.',      meta: 'Notificação WhatsApp' },
      { n: '04', label: 'Retirada', title: 'Retire a partir das 15h', desc: 'Presencial em São João de Meriti.',                           meta: 'Sábado · a partir 15h' },
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
          (step.icon ? '<div class="step-icon" aria-hidden="true">' + step.icon + '</div>' : '') +
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
  // API → MENU_DATA TRANSFORM
  // ──────────────────────────────────────────────
  var _SLUG_ICONS = {
    'sourdough':'🍞','focaccia':'🫓','focaccias':'🫓','brioche':'🥖','brioches':'🥖',
    'mini-brioches':'🧆','mini':'🧆','folhados':'🥐','tortas':'🥐','folhados-tortas':'🥐',
    'pao-de-queijo':'🧀','confeitaria':'🍰','doces':'🍰','lanche':'🍔','lanches':'🍔',
  };

  function _transformConfig(config) {
    var cats  = config.categorias || [];
    var prods = config.produtos   || [];
    var result = {};
    cats.forEach(function (cat) {
      var catName = cat.name || cat.title || '';
      var icon = cat.icon || _SLUG_ICONS[cat.slug] || _SLUG_ICONS[catName.toLowerCase().split(' ')[0]] || '🍽️';
      var catProds = prods.filter(function (p) { return p.category_slug === cat.slug; });
      result[catName] = {
        slug: cat.slug,
        icon: icon,
        desc: cat.description || '',
        items: catProds.map(function (p) {
          return {
            id:    p.id,
            name:  p.name,
            price: Number(p.price) || 0,
            desc:  p.description || '',
            tag:   null,
            img:   p.image_url ? '/' + p.image_url : '',
            stock: p.disponivel_agora != null ? Number(p.disponivel_agora) : (p.stock_quantity != null ? Number(p.stock_quantity) : undefined),
          };
        }),
      };
    });
    return result;
  }

  function loadMenuFromAPI() {
    var ctrl  = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 6000);
    return fetch('/api/config', { signal: ctrl.signal })
      .then(function (r) { clearTimeout(timer); return r.json(); })
      .then(function (config) {
        var transformed = _transformConfig(config);
        var keys = Object.keys(transformed);
        var totalItems = keys.reduce(function (n, k) { return n + transformed[k].items.length; }, 0);
        if (keys.length && totalItems > 0) {
          window.MENU_DATA     = transformed;
          window.PRODUCTS_FLAT = keys.reduce(function (acc, k) { return acc.concat(transformed[k].items); }, []);
          state.activeCategory = keys[0];
          return true;
        }
        return false;
      })
      .catch(function () {
        clearTimeout(timer);
        // fallback: manter dados estáticos de menu-data.js
        if (!state.activeCategory) state.activeCategory = Object.keys(window.MENU_DATA)[0] || '';
      });
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

    // Category click (sidebar)
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

    // ── Mobile category dropdown ──
    var dropdownWrap  = qs('#cat-dropdown-wrap');
    var dropdownList  = dropdownWrap && qs('#cat-dropdown-list',  dropdownWrap);
    var dropdownBtn   = dropdownWrap && qs('#cat-dropdown-btn',   dropdownWrap);
    var dropdownLabel = dropdownWrap && qs('#cat-dropdown-label', dropdownWrap);

    if (dropdownWrap && dropdownList) {
      dropdownList.innerHTML = categories.map(function (entry) {
        var key = entry[0];
        var cat = entry[1];
        return '<button class="cat-dropdown-item' + (key === state.activeCategory ? ' active' : '') +
               '" data-cat="' + escHtml(key) + '" type="button" role="option"' +
               (key === state.activeCategory ? ' aria-selected="true"' : '') + '>' +
                 '<span class="cat-dropdown-icon" aria-hidden="true">' + cat.icon + '</span>' +
                 '<span class="cat-dropdown-name">' + escHtml(key) + '</span>' +
                 '<span class="cat-dropdown-count">' + cat.items.length + '</span>' +
               '</button>';
      }).join('');

      // Inicializa label com categoria ativa
      (function () {
        var ae = categories.find(function (e) { return e[0] === state.activeCategory; });
        if (ae && dropdownLabel) dropdownLabel.textContent = ae[1].icon + ' ' + ae[0];
      }());

      if (dropdownBtn) {
        dropdownBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          var isOpen = dropdownWrap.classList.toggle('open');
          dropdownBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
      }

      dropdownList.addEventListener('click', function (e) {
        var btn = e.target.closest('.cat-dropdown-item');
        if (!btn) return;
        state.activeCategory = btn.dataset.cat;
        state.search = '';
        searchInput.value = '';
        searchInput.classList.remove('has-value');
        searchClear.classList.remove('visible');
        menuLayout.classList.remove('search-active');
        renderProducts();
        updateCatButtons();
        dropdownWrap.classList.remove('open');
        if (dropdownBtn) dropdownBtn.setAttribute('aria-expanded', 'false');
      });

      // Fecha ao clicar fora
      document.addEventListener('click', function () {
        if (dropdownWrap.classList.contains('open')) {
          dropdownWrap.classList.remove('open');
          if (dropdownBtn) dropdownBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // ── Search + Suggestions ──
    const suggestionsEl = qs('#search-suggestions');

    // Build a flat list of { name, icon } from MENU_DATA for fast suggestion lookup
    const SUGGESTION_POOL = [];
    Object.entries(MENU_DATA).forEach(function (entry) {
      const catName = entry[0], cat = entry[1];
      cat.items.forEach(function (item) {
        SUGGESTION_POOL.push({ name: item.name, icon: cat.icon });
      });
    });

    function highlightMatch(text, q) {
      var idx = text.toLowerCase().indexOf(q.toLowerCase());
      if (idx === -1) return escHtml(text);
      return escHtml(text.slice(0, idx)) +
        '<em>' + escHtml(text.slice(idx, idx + q.length)) + '</em>' +
        escHtml(text.slice(idx + q.length));
    }

    function closeSuggestions() {
      if (suggestionsEl) {
        suggestionsEl.classList.remove('open');
        suggestionsEl.innerHTML = '';
      }
      searchInput.setAttribute('aria-expanded', 'false');
    }

    function updateSuggestions(q) {
      if (!suggestionsEl) return;
      if (!q) { closeSuggestions(); return; }
      var matches = SUGGESTION_POOL.filter(function (s) {
        return s.name.toLowerCase().includes(q.toLowerCase());
      }).slice(0, 6);
      if (!matches.length) { closeSuggestions(); return; }
      suggestionsEl.innerHTML = matches.map(function (s) {
        return '<button class="search-suggestion" type="button" role="option" data-name="' +
          escHtml(s.name) + '">' +
          '<span class="search-suggestion-icon" aria-hidden="true">' + s.icon + '</span>' +
          '<span class="search-suggestion-name">' + highlightMatch(s.name, q) + '</span>' +
          '</button>';
      }).join('');
      suggestionsEl.classList.add('open');
      searchInput.setAttribute('aria-expanded', 'true');
    }

    if (suggestionsEl) {
      suggestionsEl.addEventListener('mousedown', function (e) {
        var btn = e.target.closest('.search-suggestion');
        if (!btn) return;
        e.preventDefault(); // prevent input blur before click
        var name = btn.dataset.name;
        searchInput.value = name;
        state.search = name;
        searchInput.classList.add('has-value');
        searchClear.classList.add('visible');
        menuLayout.classList.add('search-active');
        closeSuggestions();
        renderProducts();
      });
    }

    searchInput.addEventListener('input', function () {
      state.search = searchInput.value;
      const hasValue = !!state.search.trim();
      searchInput.classList.toggle('has-value', hasValue);
      searchClear.classList.toggle('visible', hasValue);
      menuLayout.classList.toggle('search-active', hasValue);
      updateSuggestions(state.search.trim());
      renderProducts();
    });

    searchInput.addEventListener('blur', function () {
      setTimeout(closeSuggestions, 150);
    });

    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeSuggestions(); searchInput.blur(); }
    });

    searchClear.addEventListener('click', function () {
      state.search = '';
      searchInput.value = '';
      searchInput.classList.remove('has-value');
      searchClear.classList.remove('visible');
      menuLayout.classList.remove('search-active');
      closeSuggestions();
      renderProducts();
    });

    // ── Initial render ──
    renderProducts();
    _menuRender = renderProducts;

    function updateCatButtons() {
      qsa('.cat-btn', categoryNav).forEach(function (btn) {
        var isActive = btn.dataset.cat === state.activeCategory;
        btn.classList.toggle('active', isActive);
        if (isActive) {
          btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      });
      // Sincroniza dropdown mobile
      if (dropdownList) {
        qsa('.cat-dropdown-item', dropdownList).forEach(function (btn) {
          var isActive = btn.dataset.cat === state.activeCategory;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        if (dropdownLabel) {
          var ae = categories.find(function (e) { return e[0] === state.activeCategory; });
          if (ae) dropdownLabel.textContent = ae[1].icon + ' ' + ae[0];
        }
      }
    }

    function renderProducts() {
      const _MD  = window.MENU_DATA     || {};
      const _PF  = window.PRODUCTS_FLAT || [];
      const q = state.search.trim().toLowerCase();
      const isSearch = !!q;

      let items, headerHTML;

      if (isSearch) {
        items = _PF.filter(function (p) {
          return p.name.toLowerCase().includes(q) || (p.desc || '').toLowerCase().includes(q);
        });
        const label = items.length + ' resultado' + (items.length !== 1 ? 's' : '') + ' para "' + escHtml(state.search) + '"';
        headerHTML = '<div class="products-header">' +
          '<p class="products-cat-desc"><span class="search-result-label">' + label + '</span></p>' +
          '</div>';
      } else {
        const cat = _MD[state.activeCategory] || { items: [], icon: '', desc: '' };
        items = cat.items;
        headerHTML = '<div class="products-header">' +
          '<div class="products-title-row">' +
            '<h3 class="products-cat-name">' + escHtml(state.activeCategory) + '</h3>' +
          '</div>' +
          '<p class="products-cat-desc">' + escHtml(cat.desc) + '</p>' +
        '</div>';
      }

      // Esgotados vão para o final do grid
      items = items.slice().sort(function (a, b) {
        var aOut = typeof a.stock === 'number' && a.stock === 0;
        var bOut = typeof b.stock === 'number' && b.stock === 0;
        return (aOut ? 1 : 0) - (bOut ? 1 : 0);
      });

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
    var isEsgotado = typeof product.stock === 'number' && product.stock === 0;
    var isPoucas   = typeof product.stock === 'number' && product.stock > 0 && product.stock <= 2;

    var badgeHTML = '';
    if (isEsgotado) {
      badgeHTML = '<div class="card-tag card-tag-esgotado">Esgotado</div>';
    } else if (isPoucas) {
      badgeHTML = '<div class="card-tag card-tag-poucas">Poucas unidades</div>';
    }

    var imgHTML = product.img
      ? '<img class="card-img" src="' + escHtml(product.img) + '" alt="' + escHtml(product.name) + '" loading="lazy">'
      : '<div class="card-img-placeholder">' + escHtml(product.name) + '</div>';

    var actionsHTML = isEsgotado
      ? '<button class="add-btn" disabled>Esgotado</button>'
      : '<div class="qty-ctrl">' +
          '<button class="qty-btn minus" data-delta="-1" aria-label="Diminuir quantidade">−</button>' +
          '<span class="qty-value" data-qty="1">1</span>' +
          '<button class="qty-btn plus can-minus" data-delta="1" aria-label="Aumentar quantidade">+</button>' +
        '</div>' +
        '<button class="add-btn" data-product-id="' + product.id + '">Adicionar</button>';

    return '<div class="product-card" data-id="' + product.id + '">' +
      '<div class="card-img-wrap">' +
        imgHTML +
        '<div class="card-img-gradient"></div>' +
        badgeHTML +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-top-row">' +
          '<h3 class="card-name">' + escHtml(product.name) + '</h3>' +
          '<span class="card-price" data-base-price="' + product.price + '">' + fmt(product.price) + '</span>' +
        '</div>' +
        '<p class="card-desc">' + escHtml(product.desc || '') + '</p>' +
        '<div class="card-actions">' + actionsHTML + '</div>' +
      '</div>' +
    '</div>';
  }

  function initProductCard(card) {
    var productId = card.dataset.id;
    var product   = findProduct(productId);
    if (!product) return;
    if (typeof product.stock === 'number' && product.stock === 0) return;

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
    return (window.PRODUCTS_FLAT || []).find(function (p) { return String(p.id) === String(id); });
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

  function executePendingAction() {
    if (!state.pendingItem) return;
    var item = state.pendingItem;
    state.pendingItem = null;
    addToCart(item, item._qty || 1);
    openCart();
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
    if (['stripe_checkout', 'stripe_redirecting'].includes(state.drawerView)) {
      state.drawerView = 'cart';
    }
    renderDrawerBody();
  }

  // ──────────────────────────────────────────────
  // CART DRAWER — state machine
  // ──────────────────────────────────────────────
  function openCart() {
    state.cartOpen = true;
    if (['success', 'error_card', 'error_generic', 'stripe_checkout', 'stripe_redirecting'].includes(state.drawerView)) {
      state.drawerView = 'cart';
    }
    const drawer = qs('#cart-drawer');
    if (drawer) drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderDrawerBody();
  }

  function closeCart() {
    state.cartOpen = false;
    cleanupMPBricks();
    stopPixPoll();
    state.mpCardFormActive = false;
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

  function updateDrawerSummary() {
    var el = qs('#drawer-summary');
    if (!el) return;
    var shouldShow = state.drawerView === 'cart' && state.cart && state.cart.length > 0;
    if (!shouldShow) { el.style.display = 'none'; return; }
    var totalItems = state.cart.reduce(function (s, i) { return s + i.qty; }, 0);
    var totalVal   = state.cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    el.style.display = '';
    el.innerHTML =
      '<span class="dsumm-items">' + totalItems + ' ite' + (totalItems === 1 ? 'm' : 'ns') + '</span>' +
      '<span class="dsumm-sep" aria-hidden="true">·</span>' +
      '<span class="dsumm-total">Subtotal <strong>' + fmt(totalVal) + '</strong></span>' +
      '<span class="dsumm-sep" aria-hidden="true">·</span>' +
      '<span class="dsumm-delivery">🏠 Retirada · Sáb</span>';
  }

  function updateDrawerHeader() {
    const isCheckout = ['checkout', 'pix_pending', 'success', 'error_card', 'error_generic', 'stripe_checkout', 'stripe_redirecting'].includes(state.drawerView);
    const titleEl = qs('#drawer-title');
    const backBtn = qs('#drawer-back');
    if (titleEl) titleEl.textContent = isCheckout ? 'Finalizar Pedido' : 'Meu Pedido';
    if (backBtn) backBtn.classList.toggle('visible', isCheckout);
    updateDrawerGreeting();
  }

  function updateDrawerTabs() {
    const tabsEl = qs('#drawer-tabs');
    if (!tabsEl) return;
    const v = state.drawerView;
    const cartActive = v === 'cart' || v === 'loading';
    const coActive   = v === 'checkout' || v === 'pix_pending' || v === 'success' || v === 'error_card' || v === 'error_generic' || v === 'stripe_checkout' || v === 'stripe_redirecting';
    tabsEl.innerHTML =
      '<button class="drawer-tab' + (cartActive ? ' active' : '') + '" data-tab="cart">1. Resumo</button>' +
      '<button class="drawer-tab' + (coActive   ? ' active' : '') + '" data-tab="checkout">2. Pagamento</button>';
    qsa('.drawer-tab', tabsEl).forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.dataset.tab === 'cart' && coActive) {
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
    updateDrawerHeader();
    updateDrawerTabs();
    updateDrawerSummary();
    const body   = qs('#drawer-body');
    const footer = qs('#drawer-footer');
    if (!body) return;

    switch (state.drawerView) {
      case 'checkout':        renderCheckoutView(body, footer);        break;
      case 'loading':         renderLoadingView(body, footer);         break;
      case 'pix_pending':     renderPixPendingView(body, footer);      break;
      case 'success':         renderSuccessView(body, footer);         break;
      case 'stripe_checkout':     renderStripeCheckoutView(body, footer);     break;
      case 'stripe_redirecting':  renderStripeRedirectingView(body, footer);  break;
      case 'error_card':
      case 'error_generic':   renderErrorView(body, footer);           break;
      default:                renderCartView(body, footer);
    }
  }

  function renderCartView(body, footer) {
    if (!state.cart || state.cart.length === 0) {
      body.innerHTML =
        '<div class="cart-empty">' +
          '<div class="cart-empty-icon">🧺</div>' +
          '<h3 class="cart-empty-title">Carrinho vazio</h3>' +
          '<p class="cart-empty-desc">Explore o cardápio e adicione os pães que quiser!</p>' +
          '<button class="btn-ver-cardapio" id="btn-ver-cardapio">Ver Cardápio</button>' +
        '</div>';

      var btnVer = qs('#btn-ver-cardapio');
      if (btnVer) btnVer.addEventListener('click', function () {
        closeCart();
        setTimeout(function () {
          var el = qs('#menu');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 350);
      });

      if (footer) footer.style.display = 'none';
      return;
    }

    var itemsHTML = state.cart.map(function (item) {
      var imgHTML = item.img
        ? '<img class="cart-item-img" src="' + escHtml(item.img) + '" alt="' + escHtml(item.name) + '" loading="lazy">'
        : '<div class="cart-item-img-placeholder">🍞</div>';
      return '<div class="cart-item" data-id="' + item.id + '">' +
        imgHTML +
        '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + escHtml(item.name) + '</div>' +
          '<div class="cart-item-price">' + fmt(item.price) + '</div>' +
        '</div>' +
        '<div class="cart-item-controls">' +
          '<button class="ci-btn ci-minus" aria-label="Diminuir">−</button>' +
          '<span class="ci-qty">' + item.qty + '</span>' +
          '<button class="ci-btn ci-plus" aria-label="Aumentar">+</button>' +
        '</div>' +
      '</div>';
    }).join('');

    var fornadaDate = getNextSaturday();
    var fornadaHTML =
      '<div class="cart-fornada-info">' +
        '<span class="fi-icon">⏰</span>' +
        '<p>Pedidos para a <strong>fornada de sábado (' + fornadaDate + ')</strong>. Retirada em São João de Meriti. Confirmação por WhatsApp.</p>' +
      '</div>';

    body.innerHTML = itemsHTML + fornadaHTML;

    qsa('.cart-item', body).forEach(function (el) {
      var id   = el.dataset.id;
      var item = state.cart.find(function (i) { return String(i.id) === id; });
      if (!item) return;
      qs('.ci-minus', el).addEventListener('click', function () { updateQty(id, item.qty - 1); });
      qs('.ci-plus',  el).addEventListener('click', function () { updateQty(id, item.qty + 1); });
    });

    if (footer) {
      footer.style.display = '';
      var secEl0 = qs('#footer-security');
      if (secEl0) secEl0.style.display = 'none';
      var totalVal = state.cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
      var totalEl  = qs('#cart-total');
      if (totalEl) totalEl.textContent = fmt(totalVal);
      var totalLabel = qs('.cart-total-label');
      if (totalLabel) totalLabel.textContent = 'Total do pedido';
      var clearBtn = qs('#btn-clear-cart');
      if (clearBtn) clearBtn.style.display = '';
      var btn = qs('#whatsapp-order-btn');
      if (btn) {
        btn.textContent = 'Ir para pagamento →';
        btn.onclick = function () {
          state.drawerView = 'checkout';
          renderDrawerBody();
          safeTrack('checkout_started', { cart: state.cart });
        };
      }
    }
  }

  function getPaymentBtnText() {
    if (state.checkoutPayment === 'mp_pix')  return 'Gerar PIX';
    if (state.checkoutPayment === 'mp_card') return 'Continuar para cartão';
    return 'Continuar';
  }

  function renderCheckoutView(body, footer) {
    // ── Sub-view: MP Bricks card form ──────────────────────────────────────
    if (state.mpCardFormActive) {
      body.innerHTML =
        '<div class="mp-bricks-wrap">' +
          '<p class="mp-bricks-title">💳 Dados do Cartão</p>' +
          '<div id="mp-bricks-loading" class="mp-bricks-loading">' +
            '<div class="drawer-spinner"></div>' +
            '<p class="drawer-state-text" style="margin:0">Carregando formulário seguro...</p>' +
          '</div>' +
          '<div class="mp-wrapper"><div id="mp-bricks-container"></div></div>' +
        '</div>';
      if (footer) footer.style.display = 'none';
      initMPBricks(state.checkoutCustomer);
      return;
    }

    // ── Normal checkout form ───────────────────────────────────────────────
    var name  = state.customerInfo && state.customerInfo.name     ? state.customerInfo.name     : '';
    var phone = state.customerInfo && state.customerInfo.whatsapp ? state.customerInfo.whatsapp : '';
    var email = state.customerInfo && state.customerInfo.email    ? state.customerInfo.email    : '';
    var totalVal = state.cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);

    var summaryRows = state.cart.map(function (item) {
      return '<div class="checkout-summary-row">' +
        '<span>' + escHtml(item.name) + ' ×' + item.qty + '</span>' +
        '<span>' + fmt(item.price * item.qty) + '</span>' +
      '</div>';
    }).join('');

    var paymentOpts = [
      { key: 'mp_pix',  icon: '<img src="/assets/icons/pix.svg?v=2" class="pix-icon" alt="PIX">', title: 'PIX', desc: 'Via Mercado Pago · instantâneo · sem taxas' },
      { key: 'mp_card', icon: '💳', title: 'Cartão de Crédito', desc: 'Via Mercado Pago · parcelamento disponível' },
    ];

    var paymentHTML = paymentOpts.map(function (opt) {
      var isActive = state.checkoutPayment === opt.key;
      return '<button class="payment-opt' + (isActive ? ' active' : '') + '" data-payment="' + opt.key + '">' +
        '<div class="payment-opt-icon-wrap"><span class="payment-opt-icon">' + opt.icon + '</span></div>' +
        '<div style="flex:1">' +
          '<div class="payment-opt-title">' + escHtml(opt.title) + '</div>' +
          '<div class="payment-opt-desc">' + escHtml(opt.desc) + '</div>' +
        '</div>' +
        '<div class="payment-opt-radio"><div class="payment-opt-radio-dot"></div></div>' +
      '</button>';
    }).join('');

    var fornadaDate = getNextSaturday();
    body.innerHTML =
      '<div class="checkout-form">' +
        '<p class="checkout-info">Pagamento para fornada de sábado ' + fornadaDate.slice(0,6) + fornadaDate.slice(8) + '</p>' +
        '<div class="checkout-section-label">Seus Dados</div>' +
        '<input id="co-name"  class="checkout-input" type="text"  placeholder="Nome completo *"          value="' + escHtml(name)  + '" autocomplete="name">' +
        '<input id="co-phone" class="checkout-input" type="tel"   placeholder="WhatsApp (21) 99999-9999 *" value="' + escHtml(phone) + '" autocomplete="tel">' +
        '<input id="co-email" class="checkout-input" type="email" placeholder="Email para recibo *"        value="' + escHtml(email) + '" autocomplete="email">' +
        '<div id="co-error" class="modal-error"></div>' +

        '<div class="checkout-section-label" style="margin-top:20px">Resumo</div>' +
        '<div class="checkout-summary-box">' +
          summaryRows +
          '<div class="checkout-summary-total">' +
            '<span class="checkout-summary-total-label">Total</span>' +
            '<strong class="checkout-summary-total-value">' + fmt(totalVal) + '</strong>' +
          '</div>' +
        '</div>' +

        '<div class="checkout-section-label">Forma de Pagamento</div>' +
        '<div class="payment-options">' + paymentHTML + '</div>' +
      '</div>';

    var coPhoneInput = qs('#co-phone', body);
    if (coPhoneInput) {
      coPhoneInput.addEventListener('input', function (e) {
        e.target.value = normalizePhone(e.target.value);
      });
    }

    qsa('.payment-opt', body).forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.checkoutPayment = btn.dataset.payment;
        qsa('.payment-opt', body).forEach(function (b) {
          b.classList.toggle('active', b.dataset.payment === state.checkoutPayment);
        });
        var footerBtn = qs('#whatsapp-order-btn');
        if (footerBtn) footerBtn.textContent = getPaymentBtnText() + ' →';
      });
    });

    if (footer) {
      footer.style.display = '';
      var secEl = qs('#footer-security');
      if (secEl) secEl.style.display = '';
      var totalEl = qs('#cart-total');
      if (totalEl) totalEl.textContent = fmt(totalVal);
      var totalLabel = qs('.cart-total-label');
      if (totalLabel) totalLabel.textContent = 'Total';
      var clearBtn = qs('#btn-clear-cart');
      if (clearBtn) clearBtn.style.display = 'none';
      var btn = qs('#whatsapp-order-btn');
      if (btn) {
        btn.textContent = getPaymentBtnText() + ' →';
        btn.onclick = function () {
          var coName  = qs('#co-name');
          var coPhone = qs('#co-phone');
          var coEmail = qs('#co-email');
          var name2   = coName  ? coName.value.trim()           : name;
          var phone2  = coPhone ? normalizePhone(coPhone.value) : normalizePhone(phone);
          var email2  = coEmail ? coEmail.value.trim()          : email;
          var errEl   = qs('#co-error');
          if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }

          var hasError = false;
          if (!name2 || name2.length < 2) {
            if (errEl) { errEl.textContent = 'Informe seu nome completo'; errEl.classList.add('visible'); }
            hasError = true;
          } else if (!isValidPhone(phone2)) {
            if (errEl) { errEl.textContent = 'WhatsApp inválido (ex: 21 99999-9999)'; errEl.classList.add('visible'); }
            hasError = true;
          } else if (!email2 || !/^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/.test(email2)) {
            if (errEl) { errEl.textContent = 'Email inválido (necessário para recibo)'; errEl.classList.add('visible'); }
            hasError = true;
          }
          if (hasError) return;

          var customer = { name: name2, whatsapp: phone2, email: email2 };
          state.customerInfo = customer;
          safeTrack('payment_attempt', { payment: state.checkoutPayment, total: totalVal });

          if (state.checkoutPayment === 'mp_pix') {
            submitPixCheckout(customer);
          } else {
            // mp_card: show Bricks form inline
            state.checkoutCustomer = customer;
            state.mpCardFormActive = true;
            renderDrawerBody();
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
    var pix = state.pixData;
    body.innerHTML =
      '<div class="drawer-state-view pix-pending-view">' +
        (pix && pix.qr_code
          ? '<img class="pix-qr-img" src="' + pix.qr_code + '" alt="QR Code PIX">'
          : '<img src="/assets/icons/pix.svg" class="pix-icon pix-icon-pending" alt="PIX">'
        ) +
        '<h3 class="drawer-state-title">PIX gerado!</h3>' +
        '<p class="drawer-state-text">Escaneie o QR Code ou copie o código Pix abaixo.</p>' +
        '<p class="drawer-state-text" style="font-size:12px;color:var(--text-dim);margin-top:2px">Válido por 30 minutos · Não feche esta tela</p>' +
        (pix && pix.copia_e_cola
          ? '<div class="pix-copia-wrap">' +
              '<div class="pix-copia-code">' + escHtml(pix.copia_e_cola.slice(0, 44) + '…') + '</div>' +
              '<button id="btn-copy-pix" class="btn-copy-pix">Copiar código Pix</button>' +
            '</div>'
          : ''
        ) +
        '<p class="drawer-state-text" style="font-size:12px;color:var(--text-dim);margin-top:16px">Aguardando confirmação automática do pagamento…</p>' +
      '</div>';
    if (footer) footer.style.display = 'none';

    var copyBtn = qs('#btn-copy-pix');
    if (copyBtn && pix && pix.copia_e_cola) {
      copyBtn.addEventListener('click', function () {
        var code = pix.copia_e_cola;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(function () {
            copyBtn.textContent = '✓ Copiado!';
            setTimeout(function () { copyBtn.textContent = 'Copiar código Pix'; }, 2500);
          }).catch(fallbackCopy);
        } else {
          fallbackCopy();
        }
        function fallbackCopy() {
          var ta = document.createElement('textarea');
          ta.value = code; ta.style.cssText = 'position:fixed;opacity:0';
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); } catch (_) {}
          ta.remove();
          copyBtn.textContent = '✓ Copiado!';
          setTimeout(function () { copyBtn.textContent = 'Copiar código Pix'; }, 2500);
        }
      });
    }
  }

  function renderSuccessView(body, footer) {
    body.innerHTML =
      '<div class="drawer-state-view">' +
        '<div class="drawer-success-icon">✓</div>' +
        '<h3 class="drawer-state-title">Pagamento aprovado!</h3>' +
        '<p class="drawer-state-text">Enviamos as informações da sua compra pelo WhatsApp.</p>' +
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
        '<h3 class="drawer-state-title">' + (isCard ? 'Pagamento negado!' : 'Erro no pedido') + '</h3>' +
        '<p class="drawer-state-text">' +
          (isCard
            ? 'Não foi possível processar o pagamento com este cartão.'
            : 'Algo deu errado. Tente novamente.'
          ) +
        '</p>' +
        (isCard
          ? '<div class="error-actions">' +
              '<button id="retry-btn"      class="btn-error-action btn-error-retry">Tentar novamente</button>' +
              '<button id="try-pix-btn"    class="btn-error-action btn-error-pix">Pagar com Pix</button>' +
              '<button id="try-stripe-btn" class="btn-error-action btn-error-stripe">Pagar com outro cartão</button>' +
            '</div>'
          : '<button id="retry-btn" class="btn-whatsapp-order" style="margin-top:24px">Tentar novamente</button>'
        ) +
      '</div>';
    if (footer) footer.style.display = 'none';

    var retryBtn = qs('#retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        safeTrack('payment_failed', { reason: state.drawerView });
        state.mpCardFormActive = true;
        state.drawerView = 'checkout';
        renderDrawerBody();
      });
    }

    var tryStripeBtn = qs('#try-stripe-btn');
    if (tryStripeBtn) {
      tryStripeBtn.addEventListener('click', function () {
        var customer = state.checkoutCustomer || state.customerInfo;
        if (!customer || !customer.email) {
          state.mpCardFormActive = false;
          state.drawerView = 'checkout';
          renderDrawerBody();
          return;
        }
        handleStripeCheckout(customer);
      });
    }

    var tryPixBtn = qs('#try-pix-btn');
    if (tryPixBtn) {
      tryPixBtn.addEventListener('click', function () {
        state.mpCardFormActive = false;
        state.checkoutPayment = 'mp_pix';
        state.drawerView = 'checkout';
        renderDrawerBody();
      });
    }
  }

  // ──────────────────────────────────────────────
  // SECURE CHECKOUT VIEWS
  // ──────────────────────────────────────────────
  function renderStripeRedirectingView(body, footer) {
    body.innerHTML =
      '<div class="drawer-state-view">' +
        '<div class="drawer-spinner"></div>' +
        '<p class="drawer-state-text">Redirecionando para ambiente seguro de pagamento...</p>' +
      '</div>';
    if (footer) footer.style.display = 'none';
  }

  function renderStripeCheckoutView(body, footer) {
    var url = state.stripeUrl || '';
    body.innerHTML =
      '<div class="drawer-state-view">' +
        '<div style="font-size:36px;margin-bottom:16px">🔒</div>' +
        '<h3 class="drawer-state-title">Ambiente seguro aberto</h3>' +
        '<p class="drawer-state-text">Conclua o pagamento na janela que foi aberta. Após confirmar, você receberá a confirmação por e-mail.</p>' +
        '<a id="stripe-open-btn"' +
          ' href="' + escHtml(url) + '"' +
          ' target="_blank" rel="noopener noreferrer"' +
          ' class="btn-whatsapp-order"' +
          ' style="margin-top:20px;text-decoration:none;display:block;text-align:center">' +
          'Abrir novamente →' +
        '</a>' +
        '<button id="stripe-done-btn" class="btn-success-close" style="margin-top:12px">Fechar</button>' +
      '</div>';
    if (footer) footer.style.display = 'none';

    var doneBtn = qs('#stripe-done-btn');
    if (doneBtn) doneBtn.addEventListener('click', closeCart);
  }

  // ──────────────────────────────────────────────
  // PAYMENT HELPERS
  // ──────────────────────────────────────────────
  function cleanupMPBricks() {
    if (_mpBricksCtrl) {
      try { _mpBricksCtrl.unmount(); } catch (_) {}
      _mpBricksCtrl = null;
    }
  }

  function stopPixPoll() {
    if (_pixPollTimer) { clearInterval(_pixPollTimer); _pixPollTimer = null; }
  }

  function startPixPoll(paymentId) {
    stopPixPoll();
    _pixPollTimer = setInterval(async function () {
      try {
        var r = await fetch('/api/mercadopago/check-payment/' + paymentId);
        var d = await r.json();
        if (d.status === 'approved') {
          stopPixPoll();
          state.drawerView = 'success';
          renderDrawerBody();
          requestAnimationFrame(function () {
            state.cart = [];
            saveCart([]);
            var badge = qs('#cart-badge');
            if (badge) { badge.textContent = '0'; badge.dataset.count = '0'; }
          });
        }
      } catch (_) {}
    }, 5000);
  }

  function ensureMPSdkLoaded() {
    return new Promise(function (resolve, reject) {
      if (window.MercadoPago) { resolve(); return; }
      var script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.onload = resolve;
      script.onerror = function () { reject(new Error('MP SDK não carregou')); };
      document.head.appendChild(script);
    });
  }

  async function getMPPublicKey() {
    if (_mpPublicKey) return _mpPublicKey;
    var r = await fetch('/api/mercadopago/public-key');
    var d = await r.json();
    if (!d.publicKey) throw new Error('Chave pública MP não disponível.');
    _mpPublicKey = d.publicKey;
    return _mpPublicKey;
  }

  async function initMPBricks(customer) {
    cleanupMPBricks();
    var container   = qs('#mp-bricks-container');
    var loadingEl   = qs('#mp-bricks-loading');
    if (!container) return;

    try {
      await ensureMPSdkLoaded();
      var pubKey   = await getMPPublicKey();
      var totalVal = state.cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);

      var mp     = new window.MercadoPago(pubKey, { locale: 'pt-BR' });
      var bricks = mp.bricks();

      _mpBricksCtrl = await bricks.create('cardPayment', 'mp-bricks-container', {
        initialization: { amount: totalVal, payer: { email: customer.email } },
        customization: {
          visual: { style: { theme: 'dark', customVariables: {
                  baseColor: '#C47A2C',
                  borderRadius: '10px',
                  backgroundColor: '#0b0b0b',
                  formBackgroundColor: '#0f0f0f',
                  inputBackgroundColor: '#121212',
                  textPrimaryColor: '#EDEDED',
                  textSecondaryColor: '#A1A1A1'
                } } },
          paymentMethods: { maxInstallments: 1 }
        },
        callbacks: {
          onReady: function () {
            if (loadingEl) loadingEl.style.display = 'none';
          },
          onSubmit: function (cardFormData) {
            handleMPCardSubmit(cardFormData, customer);
          },
          onError: function (err) {
            console.error('[MP Bricks]', err);
            if (loadingEl) loadingEl.style.display = 'none';
            state.mpCardFormActive = false;
            state.drawerView = 'error_generic';
            renderDrawerBody();
          }
        }
      });
    } catch (e) {
      console.error('[MP Bricks Init]', e.message);
      state.mpCardFormActive = false;
      state.drawerView = 'error_generic';
      renderDrawerBody();
    }
  }

  async function handleMPCardSubmit(cardFormData, customer) {
    state.drawerView = 'loading';
    renderDrawerBody();

    try {
      var payload = {
        customer: { name: customer.name, email: customer.email, whatsapp: customer.whatsapp },
        method: 'mp_card',
        cart: state.cart,
        card_token:         cardFormData.token,
        payment_method_id:  cardFormData.payment_method_id,
        installments:       cardFormData.installments,
        issuer_id:          cardFormData.issuer_id,
        payer: { email: (cardFormData.payer && cardFormData.payer.email) || customer.email }
      };

      var r    = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      var data = await r.json();

      state.mpCardFormActive = false;

      if (data.tipo === 'success') {
        var trackedTotal = payload.cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
        state.drawerView = 'success';
        renderDrawerBody();
        requestAnimationFrame(function () {
          state.cart = [];
          saveCart([]);
          var badge = qs('#cart-badge');
          if (badge) { badge.textContent = '0'; badge.dataset.count = '0'; }
        });
        safeTrack('purchase_success', { payment: 'mp_card', total: trackedTotal });
      } else if (data.tipo === 'error_card_mp') {
        state.drawerView = 'error_card';
        renderDrawerBody();
      } else {
        state.drawerView = 'error_generic';
        renderDrawerBody();
      }
    } catch (e) {
      console.error('[MP Card Submit]', e.message);
      state.mpCardFormActive = false;
      state.drawerView = 'error_generic';
      renderDrawerBody();
    }
  }

  async function submitPixCheckout(customer) {
    state.drawerView = 'loading';
    renderDrawerBody();

    try {
      var payload = {
        customer: { name: customer.name, email: customer.email, whatsapp: customer.whatsapp },
        method: 'mp_pix',
        cart: state.cart
      };

      console.log('PIX payload:', payload);

      var r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!r.ok) {
        console.error('PIX ERROR:', await r.text());
        state.drawerView = 'error_generic';
        renderDrawerBody();
        return;
      }

      var data = await r.json();

      if (data.tipo === 'pix' && data.qr_code) {
        state.pixData = { qr_code: data.qr_code, copia_e_cola: data.copia_e_cola, payment_id: data.payment_id };
        state.drawerView = 'pix_pending';
        renderDrawerBody();
        startPixPoll(data.payment_id);
        safeTrack('pix_generated', { payment_id: data.payment_id });
      } else {
        state.drawerView = 'error_generic';
        renderDrawerBody();
      }
    } catch (e) {
      console.error('[PIX Checkout]', e.message);
      state.drawerView = 'error_generic';
      renderDrawerBody();
    }
  }

  async function handleStripeCheckout(customer) {
    var startTime = Date.now();
    state.mpCardFormActive = false;
    state.drawerView = 'stripe_redirecting';
    renderDrawerBody();

    try {
      var totalVal = state.cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
      var payload  = {
        customer: { name: customer.name, email: customer.email, whatsapp: customer.whatsapp },
        method: 'stripe_card',
        cart: state.cart,
        totalAmount: totalVal
      };

      var r    = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      var data = await r.json();

      if (data.tipo === 'stripe_redirect' && data.url) {
        state.stripeUrl = data.url;
        var elapsed   = Date.now() - startTime;
        var remaining = Math.max(0, 800 - elapsed);
        setTimeout(function () {
          window.open(data.url, '_blank', 'noopener,noreferrer');
          state.drawerView = 'stripe_checkout';
          renderDrawerBody();
          safeTrack('stripe_checkout_started', { total: totalVal });
        }, remaining);
      } else {
        state.drawerView = 'error_generic';
        renderDrawerBody();
      }
    } catch (e) {
      console.error('[Stripe Checkout]', e.message);
      state.drawerView = 'error_generic';
      renderDrawerBody();
    }
  }

  function initCartDrawer() {
    var cartBtn     = qs('#cart-btn');
    var drawerClose = qs('#drawer-close');
    var overlay     = qs('#drawer-overlay');
    var backBtn     = qs('#drawer-back');
    var clearBtn    = qs('#btn-clear-cart');

    if (cartBtn)     cartBtn.addEventListener('click', openCart);
    if (drawerClose) drawerClose.addEventListener('click', closeCart);
    if (overlay)     overlay.addEventListener('click', closeCart);
    if (backBtn)     backBtn.addEventListener('click', function () {
      cleanupMPBricks();
      stopPixPoll();
      state.mpCardFormActive = false;
      state.drawerView = 'cart';
      renderDrawerBody();
    });
    if (clearBtn)    clearBtn.addEventListener('click', function () {
      state.cart = [];
      saveCart([]);
      updateCartUI();
    });

    // Keyboard: Escape closes
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (state.cartOpen)    closeCart();
        if (state.captureOpen) { closeCapture(); executePendingAction(); }
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

    overlay.addEventListener('click', function () {
      closeCapture();
      executePendingAction();
    });

    waInput.addEventListener('input', function (e) {
      e.target.value = normalizePhone(e.target.value);
    });

    function confirm(data) {
      state.customerInfo = data;
      saveCustomerInfo(data);
      closeCapture();
      executePendingAction();
    }

    btnConfirm.addEventListener('click', function () {
      clearModalError();
      var wa = normalizePhone(waInput.value);
      if (wa && !isValidPhone(wa)) {
        errEl.textContent = 'Formato inválido (ex: 21 99999-9999)';
        errEl.classList.add('visible');
        return;
      }
      confirm({ name: nameInput.value, whatsapp: wa });
    });

    btnSkip.addEventListener('click', function () {
      confirm({ name: '', whatsapp: '' });
    });

    btnCancel.addEventListener('click', function () {
      state.pendingItem = null;
      closeCapture();
    });

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
    loadMenuFromAPI().then(function (hasApiData) {
      if (hasApiData) initMenu();
    });
    initCartDrawer();
    initEarlyCaptureModal();
  });

}());
