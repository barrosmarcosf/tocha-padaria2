(function () {
  'use strict';

  const { useState } = window.React;
  const html = window.htm.bind(window.React.createElement);
  const T    = window.T;

  // Largura da sidebar — fora do token set mas nomeada para clareza
  const NAV_W = '220px';

  // Offset dos elementos fixed: AnnouncementBar + Navbar + folga
  const STICKY_TOP = 'calc(var(--announce-h) + var(--navbar-h) + 24px)';

  function CategoryNav({ categories, active, onSelect }) {
    const items = categories || [];

    const navStyle = {
      width:      NAV_W,
      flexShrink: 0,
      position:   'sticky',
      top:        STICKY_TOP,
      alignSelf:  'flex-start',
      display:    'flex',
      flexDirection: 'column',
      gap:        T.space[2],
    };

    const headingStyle = {
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.tag,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing['3xl'],
      textTransform: 'uppercase',
      color:         T.color.textDim,
      padding:       `0 ${T.space[4]}`,
      marginBottom:  T.space[2],
    };

    return html`
      <nav style=${navStyle} aria-label="Categorias do cardápio">
        <p style=${headingStyle}>Categorias</p>
        ${items.map(cat => html`
          <${CategoryItem}
            key=${cat.id}
            cat=${cat}
            isActive=${active === cat.id}
            onSelect=${onSelect}
          />
        `)}
      </nav>
    `;
  }

  function CategoryItem({ cat, isActive, onSelect }) {
    const [hovered, setHovered] = useState(false);

    const btnStyle = {
      width:         '100%',
      display:       'flex',
      alignItems:    'center',
      gap:           T.space[3],
      padding:       `10px ${T.space[4]}`,
      borderRadius:  T.radius.pill,
      border:        'none',
      cursor:        'pointer',
      textAlign:     'left',
      transition:    `background ${T.transition.fast}, color ${T.transition.fast}`,
      background:    isActive
                       ? T.color.amber
                       : hovered
                         ? T.color.bg3
                         : 'transparent',
      color:         isActive ? T.color.bg : T.color.textMuted,
    };

    const labelStyle = {
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.sm,
      fontWeight:    isActive ? T.fontWeight.semibold : T.fontWeight.regular,
      letterSpacing: T.letterSpacing.base,
      lineHeight:    T.lineHeight.snug,
      flex:          1,
      transition:    `font-weight ${T.transition.fast}`,
    };

    const countStyle = {
      fontFamily:  T.font.sans,
      fontSize:    T.fontSize.tag,
      fontWeight:  T.fontWeight.medium,
      color:       isActive ? T.color.bg : T.color.textDim,
      opacity:     isActive ? 0.8 : 1,
      transition:  `color ${T.transition.fast}`,
    };

    function handleClick() {
      if (onSelect) onSelect(cat.id);
      // Scroll para a seção da categoria (id="cat-{id}")
      const el = document.getElementById('cat-' + cat.id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    return html`
      <button
        style=${btnStyle}
        onClick=${handleClick}
        onMouseEnter=${() => setHovered(true)}
        onMouseLeave=${() => setHovered(false)}
        aria-current=${isActive ? 'true' : undefined}
      >
        <span style=${labelStyle}>${cat.label}</span>
        ${cat.count != null && html`
          <span style=${countStyle}>${cat.count}</span>
        `}
      </button>
    `;
  }

  window.CategoryNav = CategoryNav;
}());
