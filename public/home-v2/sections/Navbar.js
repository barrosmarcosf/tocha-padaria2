(function () {
  'use strict';

  const { useState, useEffect, useRef } = window.React;
  const html = window.htm.bind(window.React.createElement);
  const T = window.T;
  const useScrolled = window.useScrolled;
  const useIsMobile = window.useIsMobile;

  function Navbar({ cart, setCartOpen, scrollToMenu }) {
    const scrolled  = useScrolled(60);
    const isMobile  = useIsMobile();
    const totalItems = (cart || []).reduce((s, i) => s + i.qty, 0);

    const navStyle = {
      position:        'fixed',
      top:             'var(--announce-h)',
      left:            0,
      right:           0,
      height:          'var(--navbar-h)',
      zIndex:          T.z.navbar,
      display:         'flex',
      alignItems:      'center',
      padding:         '0 40px',
      transition:      `background ${T.transition.base}, border-color ${T.transition.base}, backdrop-filter ${T.transition.base}`,
      background:      scrolled ? 'var(--bg-menu)' : 'transparent',
      borderBottom:    scrolled ? `1px solid var(--border-subtle)` : '1px solid transparent',
      backdropFilter:  scrolled ? 'blur(12px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
    };

    const logoStyle = {
      display:    'flex',
      alignItems: 'center',
      flexShrink: 0,
      textDecoration: 'none',
    };

    const logoImgStyle = {
      height: '32px',
      width:  'auto',
    };

    const navLinksStyle = {
      display:    isMobile ? 'none' : 'flex',
      alignItems: 'center',
      gap:        T.space[8],
      marginLeft: T.space[12],
      flex:       1,
    };

    const linkStyle = {
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.sm,
      fontWeight:    T.fontWeight.medium,
      letterSpacing: T.letterSpacing.lg,
      textTransform: 'uppercase',
      color:         'var(--text-muted)',
      textDecoration: 'none',
      transition:    `color ${T.transition.fast}`,
      cursor:        'pointer',
      background:    'none',
      border:        'none',
      padding:       0,
    };

    const spacerStyle = { flex: 1 };

    const cartBtnStyle = {
      display:        'flex',
      alignItems:     'center',
      gap:            T.space[2],
      padding:        isMobile ? `0 ${T.space[4]}` : `0 ${T.space[6]}`,
      height:         '36px',
      borderRadius:   T.radius.pill,
      border:         `1px solid var(--border)`,
      background:     'transparent',
      color:          'var(--text)',
      fontFamily:     T.font.sans,
      fontSize:       T.fontSize.sm,
      fontWeight:     T.fontWeight.medium,
      letterSpacing:  T.letterSpacing.base,
      cursor:         'pointer',
      transition:     `border-color ${T.transition.fast}, background ${T.transition.fast}, color ${T.transition.fast}`,
      flexShrink:     0,
      position:       'relative',
    };

    const cartIconStyle = {
      fontSize: '16px',
      lineHeight: 1,
    };

    const badgeStyle = {
      display:        'inline-flex',
      alignItems:     'center',
      justifyContent: 'center',
      minWidth:       '18px',
      height:         '18px',
      padding:        '0 5px',
      borderRadius:   T.radius.pill,
      background:     'var(--amber)',
      color:          'var(--bg)',
      fontSize:       T.fontSize.tag,
      fontWeight:     T.fontWeight.bold,
      lineHeight:     1,
    };

    function handleLinkHover(e, enter) {
      e.currentTarget.style.color = enter ? 'var(--text)' : 'var(--text-muted)';
    }

    function handleCartHover(e, enter) {
      e.currentTarget.style.borderColor  = enter ? 'var(--amber)'  : 'var(--border)';
      e.currentTarget.style.background   = enter ? 'var(--amber)'  : 'transparent';
      e.currentTarget.style.color        = enter ? 'var(--bg)'     : 'var(--text)';
    }

    return html`
      <nav style=${navStyle} aria-label="Navegação principal">

        <a href="/" style=${logoStyle} aria-label="Tocha Padaria — página inicial">
          <img src="/assets/logo-gold.png" alt="Tocha Padaria" style=${logoImgStyle} />
        </a>

        <div style=${navLinksStyle}>
          <button
            style=${linkStyle}
            onClick=${scrollToMenu}
            onMouseEnter=${e => handleLinkHover(e, true)}
            onMouseLeave=${e => handleLinkHover(e, false)}
          >Cardápio</button>

          <a
            href="#nossa-historia"
            style=${linkStyle}
            onMouseEnter=${e => handleLinkHover(e, true)}
            onMouseLeave=${e => handleLinkHover(e, false)}
          >Nossa História</a>

          <a
            href="#contato"
            style=${linkStyle}
            onMouseEnter=${e => handleLinkHover(e, true)}
            onMouseLeave=${e => handleLinkHover(e, false)}
          >Fale Conosco</a>
        </div>

        ${!isMobile && html`<div style=${spacerStyle}></div>`}

        <button
          style=${cartBtnStyle}
          onClick=${() => setCartOpen(true)}
          onMouseEnter=${e => handleCartHover(e, true)}
          onMouseLeave=${e => handleCartHover(e, false)}
          aria-label=${`Abrir carrinho${totalItems > 0 ? `, ${totalItems} ${totalItems === 1 ? 'item' : 'itens'}` : ''}`}
        >
          <span style=${cartIconStyle}>🧺</span>
          ${!isMobile && html`<span>Pedido</span>`}
          ${totalItems > 0 && html`<span style=${badgeStyle}>${totalItems}</span>`}
        </button>

      </nav>
    `;
  }

  window.Navbar = Navbar;
}());
