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

    function openNav() {
      hamburger.classList.add('open');
      mobileNav.classList.add('open');
      mobileNav.setAttribute('aria-hidden', 'false');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeNav() {
      hamburger.classList.remove('open');
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
    var stickyCta   = document.getElementById('mobile-sticky-cta');
    var hero        = document.getElementById('hero');
    var stickyCart  = document.getElementById('sticky-cart-btn');
    var stickyCount = document.getElementById('sticky-cart-count');
    var mainBadge   = document.getElementById('cart-badge');

    if (!stickyCta || !hero) return;

    // Show/hide CTA based on hero visibility
    var heroObserver = new IntersectionObserver(function (entries) {
      stickyCta.classList.toggle('visible', !entries[0].isIntersecting);
      stickyCta.setAttribute('aria-hidden',
        entries[0].isIntersecting ? 'true' : 'false');
    }, { threshold: 0.15 });

    heroObserver.observe(hero);

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
        var count = parseInt(mainBadge.dataset.count || '0', 10);
        stickyCount.textContent = count;
        stickyCart.style.display = count > 0 ? 'flex' : 'none';
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
