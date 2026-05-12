// ============================================================
// MOBILE.JS — Tocha Padaria home-v2
// Purely additive mobile UX enhancements.
// No business logic is modified; only navigation & CTA helpers.
// ============================================================
(function () {
  'use strict';

  // ──────────────────────────────────────────────────────────
  // HAMBURGER / OFF-CANVAS NAV
  // ──────────────────────────────────────────────────────────
  function initMobileNav() {
    var hamburger  = document.getElementById('nav-hamburger');
    var mobileNav  = document.getElementById('mobile-nav');
    if (!hamburger || !mobileNav) return;

    var overlay   = mobileNav.querySelector('.mobile-nav-overlay');
    var closeBtn  = document.getElementById('mobile-nav-close');
    var cartBtn   = document.getElementById('mobile-nav-cart-btn');
    var links     = mobileNav.querySelectorAll('.mobile-nav-link');

    function isOpen() {
      return mobileNav.classList.contains('open');
    }

    var cartBtn = document.getElementById('cart-btn');

    function openNav() {
      hamburger.classList.add('open');
      hamburger.style.visibility = 'hidden';
      if (cartBtn) cartBtn.style.display = 'none';
      mobileNav.classList.add('open');
      mobileNav.setAttribute('aria-hidden', 'false');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeNav() {
      hamburger.classList.remove('open');
      hamburger.style.visibility = '';
      if (cartBtn) cartBtn.style.display = '';
      mobileNav.classList.remove('open');
      mobileNav.setAttribute('aria-hidden', 'true');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', function () {
      isOpen() ? closeNav() : openNav();
    });

    if (overlay) overlay.addEventListener('click', closeNav);
    if (closeBtn) closeBtn.addEventListener('click', closeNav);

    links.forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    // Cart button in mobile nav: close nav then open main cart drawer
    if (cartBtn) {
      cartBtn.addEventListener('click', function () {
        closeNav();
        var mainCartBtn = document.getElementById('cart-btn');
        if (mainCartBtn) mainCartBtn.click();
      });
    }

    // ESC to close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) closeNav();
    });

    // Keep mobile badge in sync with main cart badge
    var mainBadge   = document.getElementById('cart-badge');
    var mobileBadge = document.getElementById('mobile-nav-badge');
    if (mainBadge && mobileBadge) {
      function syncBadge() {
        var count = mainBadge.dataset.count || '0';
        mobileBadge.textContent = count;
        mobileBadge.dataset.count = count;
      }
      syncBadge();
      new MutationObserver(syncBadge).observe(mainBadge, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }

  // ──────────────────────────────────────────────────────────
  // STICKY CTA BAR
  // Shows after hero scrolls off-screen; hides when back on hero
  // ──────────────────────────────────────────────────────────
  function initStickyCta() {
    var stickyCta    = document.getElementById('mobile-sticky-cta');
    var hero         = document.getElementById('hero');
    var menuSection  = document.getElementById('menu');
    var stickyCart   = document.getElementById('sticky-cart-btn');
    var stickyCount  = document.getElementById('sticky-cart-count');
    var stickyMenu   = stickyCta && stickyCta.querySelector('.sticky-cta-menu');
    var mainBadge    = document.getElementById('cart-badge');

    if (!stickyCta || !hero) return;

    var heroGone   = false;
    var inMenu     = false;
    var cartCount  = 0;

    function syncVisible() {
      // "Ver Cardápio" only makes sense when hero is gone and user is NOT already in menu
      if (stickyMenu) stickyMenu.style.display = (heroGone && !inMenu) ? '' : 'none';
      // Bar shows when hero gone AND (menu link is visible OR cart has items)
      var showBar = heroGone && (!inMenu || cartCount > 0);
      stickyCta.classList.toggle('visible', showBar);
      stickyCta.setAttribute('aria-hidden', showBar ? 'false' : 'true');
    }

    new IntersectionObserver(function (entries) {
      heroGone = !entries[0].isIntersecting;
      syncVisible();
    }, { threshold: 0.15 }).observe(hero);

    if (menuSection) {
      new IntersectionObserver(function (entries) {
        inMenu = entries[0].isIntersecting;
        syncVisible();
      }, { threshold: 0.1 }).observe(menuSection);
    }

    // Cart button in sticky bar opens main cart drawer
    if (stickyCart) {
      stickyCart.addEventListener('click', function () {
        var mainCartBtn = document.getElementById('cart-btn');
        if (mainCartBtn) mainCartBtn.click();
      });
    }

    // Sync cart count badge in sticky bar
    if (mainBadge && stickyCart && stickyCount) {
      function syncCart() {
        cartCount = parseInt(mainBadge.dataset.count || '0', 10);
        stickyCount.textContent = cartCount;
        stickyCart.style.display = cartCount > 0 ? 'flex' : 'none';
        syncVisible();
      }
      syncCart();
      new MutationObserver(syncCart).observe(mainBadge, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }

  // ──────────────────────────────────────────────────────────
  // INIT
  // ──────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initStickyCta();
  });

}());
