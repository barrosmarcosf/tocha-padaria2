(function () {
  'use strict';

  const { useState } = window.React;
  const html = window.htm.bind(window.React.createElement);
  const T    = window.T;

  function fmt(v) {
    return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
  }

  // ── Placeholder quando não há imagem ───────────────────────────

  function ImgPlaceholder() {
    const s = {
      width:          '100%',
      aspectRatio:    '4 / 3',
      background:     T.color.bg3,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      fontSize:       '40px',
      color:          T.color.textDim,
      borderBottom:   `1px solid var(--border-subtle)`,
    };
    return html`<div style=${s} aria-hidden="true">🍞</div>`;
  }

  // ── Selector de quantidade ─────────────────────────────────────

  function QtySelector({ id, qty, onUpdateQty }) {
    const wrapStyle = {
      display:      'flex',
      alignItems:   'center',
      gap:          T.space[2],
      height:       '36px',
    };

    const btnStyle = (side) => ({
      width:        '32px',
      height:       '32px',
      borderRadius: T.radius.pill,
      border:       `1px solid var(--border)`,
      background:   side === 'minus' && qty === 1 ? T.color.bg3 : 'transparent',
      color:        T.color.text,
      fontFamily:   T.font.sans,
      fontSize:     T.fontSize.lg,
      fontWeight:   T.fontWeight.medium,
      cursor:       'pointer',
      display:      'flex',
      alignItems:   'center',
      justifyContent: 'center',
      transition:   `border-color ${T.transition.fast}, background ${T.transition.fast}`,
      lineHeight:   1,
      flexShrink:   0,
    });

    const qtyStyle = {
      fontFamily:  T.font.sans,
      fontSize:    T.fontSize.base,
      fontWeight:  T.fontWeight.semibold,
      color:       T.color.text,
      minWidth:    '24px',
      textAlign:   'center',
    };

    return html`
      <div style=${wrapStyle}>
        <button
          style=${btnStyle('minus')}
          onClick=${() => onUpdateQty(id, qty - 1)}
          aria-label="Diminuir quantidade"
        >−</button>
        <span style=${qtyStyle}>${qty}</span>
        <button
          style=${btnStyle('plus')}
          onClick=${() => onUpdateQty(id, qty + 1)}
          aria-label="Aumentar quantidade"
        >+</button>
      </div>
    `;
  }

  // ── Card principal ─────────────────────────────────────────────

  function ProductCard({ id, name, description, price, tag, image, quantity, onAdd, onUpdateQty }) {
    const [hovered, setHovered] = useState(false);
    const qty = quantity || 0;
    const tagColor = tag ? T.tag(tag) : null;

    const cardStyle = {
      background:    T.color.surface,
      border:        `1px solid ${hovered ? T.color.borderHover : T.color.border}`,
      borderRadius:  T.radius.card,
      overflow:      'hidden',
      display:       'flex',
      flexDirection: 'column',
      transition:    `border-color ${T.transition.base}, transform ${T.transition.base}, box-shadow ${T.transition.base}`,
      transform:     hovered ? 'translateY(-2px)' : 'translateY(0)',
      boxShadow:     hovered ? T.shadow.card : 'none',
      cursor:        'default',
    };

    const bodyStyle = {
      padding:       T.space.cardPad,
      display:       'flex',
      flexDirection: 'column',
      gap:           T.space[3],
      flex:          1,
    };

    const tagStyle = tagColor ? {
      display:       'inline-flex',
      alignItems:    'center',
      padding:       `2px ${T.space[3]}`,
      borderRadius:  T.radius.tag,
      background:    tagColor + '22',   // ~13% opacity hex suffix
      border:        `1px solid ${tagColor}55`,
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.tag,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing['2xl'],
      textTransform: 'uppercase',
      color:         tagColor,
      alignSelf:     'flex-start',
    } : null;

    const nameStyle = {
      fontFamily:  T.font.serif,
      fontSize:    T.fontSize['2xl'],
      fontWeight:  T.fontWeight.medium,
      color:       T.color.cream,
      lineHeight:  T.lineHeight.snug,
    };

    const descStyle = {
      fontFamily:  T.font.sans,
      fontSize:    T.fontSize.sm,
      fontWeight:  T.fontWeight.light,
      color:       T.color.textMuted,
      lineHeight:  T.lineHeight.relaxed,
      flex:        1,
    };

    const footerStyle = {
      display:     'flex',
      alignItems:  'center',
      justifyContent: 'space-between',
      marginTop:   T.space[2],
    };

    const priceStyle = {
      fontFamily:    T.font.serif,
      fontSize:      T.fontSize['3xl'],
      fontWeight:    T.fontWeight.medium,
      color:         T.color.amber,
      letterSpacing: T.letterSpacing.tight,
    };

    const addBtnStyle = (hov) => ({
      display:       'inline-flex',
      alignItems:    'center',
      gap:           T.space[2],
      padding:       `8px ${T.space[5]}`,
      borderRadius:  T.radius.pill,
      border:        `1px solid ${hov ? T.color.amber : T.color.border}`,
      background:    hov ? T.color.amber : 'transparent',
      color:         hov ? T.color.bg    : T.color.text,
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.sm,
      fontWeight:    T.fontWeight.medium,
      letterSpacing: T.letterSpacing.base,
      cursor:        'pointer',
      transition:    `background ${T.transition.fast}, border-color ${T.transition.fast}, color ${T.transition.fast}`,
      height:        '36px',
    });

    const [addHov, setAddHov] = useState(false);

    return html`
      <article
        style=${cardStyle}
        onMouseEnter=${() => setHovered(true)}
        onMouseLeave=${() => setHovered(false)}
      >
        ${image
          ? html`<img src=${image} alt=${name} style=${{
              width:       '100%',
              aspectRatio: '4 / 3',
              objectFit:   'cover',
              display:     'block',
              borderBottom:`1px solid var(--border-subtle)`,
              transition:  `transform ${T.transition.image}`,
              transform:   hovered ? 'scale(1.03)' : 'scale(1)',
            }} loading="lazy" />`
          : html`<${ImgPlaceholder} />`
        }

        <div style=${bodyStyle}>
          ${tagStyle && html`<span style=${tagStyle}>${tag}</span>`}

          <h3 style=${nameStyle}>${name}</h3>

          ${description && html`<p style=${descStyle}>${description}</p>`}

          <div style=${footerStyle}>
            <span style=${priceStyle}>${fmt(price)}</span>

            ${qty > 0
              ? html`<${QtySelector} id=${id} qty=${qty} onUpdateQty=${onUpdateQty} />`
              : html`
                  <button
                    style=${addBtnStyle(addHov)}
                    onClick=${() => onAdd && onAdd({ id, name, price, image_url: image }, 1)}
                    onMouseEnter=${() => setAddHov(true)}
                    onMouseLeave=${() => setAddHov(false)}
                  >
                    + Adicionar
                  </button>
                `
            }
          </div>
        </div>
      </article>
    `;
  }

  window.ProductCard = ProductCard;
}());
