(function () {
  'use strict';

  const { useState } = window.React;
  const html        = window.htm.bind(window.React.createElement);
  const T           = window.T;
  const useIsMobile = window.useIsMobile;

  const BULLETS = [
    { icon: '📦', text: 'Produção consistente — volume garantido a cada fornada' },
    { icon: '✋', text: 'Qualidade artesanal — fermentação natural em cada lote'   },
    { icon: '🗓', text: 'Entrega programada — combine o calendário do seu negócio' },
  ];

  const IMAGES = [
    { id: 1, emoji: '🍞', gradient: `linear-gradient(135deg, oklch(18% 0.03 50), oklch(26% 0.05 45))` },
    { id: 2, emoji: '☕', gradient: `linear-gradient(135deg, oklch(16% 0.025 48), oklch(22% 0.04 52))` },
    { id: 3, emoji: '🌾', gradient: `linear-gradient(135deg, oklch(20% 0.03 46), oklch(14% 0.02 50))` },
    { id: 4, emoji: '🥐', gradient: `linear-gradient(135deg, oklch(22% 0.035 49), oklch(17% 0.03 47))` },
  ];

  // ── Componentes internos ─────────────────────────────────────────

  function ImageTile({ img }) {
    const [hovered, setHovered] = useState(false);

    const tileStyle = {
      aspectRatio:  '4 / 3',
      borderRadius: T.radius.card,
      border:       `1px solid ${hovered ? T.color.borderHover : T.color.borderSubtle}`,
      overflow:     'hidden',
      position:     'relative',
      transition:   `border-color ${T.transition.base}`,
    };

    const bgStyle = {
      position:       'absolute',
      inset:          0,
      background:     img.gradient,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      fontSize:       '40px',
      transition:     `transform ${T.transition.slow}`,
      transform:      hovered ? 'scale(1.05)' : 'scale(1)',
    };

    return html`
      <div
        style=${tileStyle}
        onMouseEnter=${() => setHovered(true)}
        onMouseLeave=${() => setHovered(false)}
        aria-hidden="true"
      >
        <div style=${bgStyle}>${img.emoji}</div>
      </div>
    `;
  }

  function BulletItem({ item }) {
    const rowStyle = {
      display:    'flex',
      alignItems: 'flex-start',
      gap:        T.space[4],
    };
    const iconWrapStyle = {
      width:          '36px',
      height:         '36px',
      borderRadius:   T.radius.sm,
      background:     T.color.bg3,
      border:         `1px solid var(--border-subtle)`,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      fontSize:       '16px',
      flexShrink:     0,
      marginTop:      '2px',
    };
    const textStyle = {
      fontFamily:  T.font.sans,
      fontSize:    T.fontSize.base,
      fontWeight:  T.fontWeight.light,
      color:       T.color.textMuted,
      lineHeight:  T.lineHeight.relaxed,
    };
    return html`
      <div style=${rowStyle}>
        <div style=${iconWrapStyle}>${item.icon}</div>
        <p style=${textStyle}>${item.text}</p>
      </div>
    `;
  }

  // ── Seção principal ──────────────────────────────────────────────

  function FoodServiceSection() {
    const isMobile = useIsMobile();
    const [btnHov, setBtnHov] = useState(false);

    const sectionStyle = {
      padding:    T.space.sectionPad,
      background: T.color.bg3,
      borderTop:  `1px solid var(--border-subtle)`,
    };

    const containerStyle = {
      maxWidth: T.space.containerMd,
      margin:   '0 auto',
      padding:  T.space.containerPad,
    };

    // 2 colunas no desktop, stack no mobile
    const bodyStyle = {
      display:             'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap:                 T.space.gridLg,
      alignItems:          'center',
    };

    // Imagens (2x2)
    const imgGridStyle = {
      display:             'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap:                 T.space.grid,
    };

    // Bloco de texto
    const textBlockStyle = {
      display:       'flex',
      flexDirection: 'column',
      gap:           T.space[7],
    };

    const eyebrowStyle = {
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.xs,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing['4xl'],
      textTransform: 'uppercase',
      color:         T.color.amber,
    };

    const titleStyle = {
      fontFamily:  T.font.serif,
      fontSize:    T.fontSize.h3,
      fontWeight:  T.fontWeight.regular,
      lineHeight:  T.lineHeight.tight,
      color:       T.color.cream,
    };

    const descStyle = {
      fontFamily:  T.font.sans,
      fontSize:    T.fontSize.base,
      fontWeight:  T.fontWeight.light,
      color:       T.color.textMuted,
      lineHeight:  T.lineHeight.loose,
    };

    const bulletsStyle = {
      display:       'flex',
      flexDirection: 'column',
      gap:           T.space[5],
    };

    const btnStyle = {
      alignSelf:     'flex-start',
      display:       'inline-flex',
      alignItems:    'center',
      gap:           T.space[2],
      padding:       `14px ${T.space[8]}`,
      borderRadius:  T.radius.pill,
      border:        `1px solid ${btnHov ? T.color.amber : T.color.border}`,
      background:    btnHov ? T.color.amber : 'transparent',
      color:         btnHov ? T.color.bg    : T.color.text,
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.sm,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing.xl,
      textTransform: 'uppercase',
      cursor:        'pointer',
      textDecoration:'none',
      transition:    `background ${T.transition.fast}, border-color ${T.transition.fast}, color ${T.transition.fast}`,
    };

    const waHref = 'https://wa.me/5521000000000?text=Ol%C3%A1!%20Tenho%20interesse%20em%20fornecimento%20para%20meu%20neg%C3%B3cio.';

    // No mobile, imagens ficam abaixo do texto
    const imgBlock = html`
      <div style=${imgGridStyle}>
        ${IMAGES.map(img => html`<${ImageTile} key=${img.id} img=${img} />`)}
      </div>
    `;

    const textBlock = html`
      <div style=${textBlockStyle}>
        <p style=${eyebrowStyle}>Foodservice</p>

        <h2 style=${titleStyle}>
          Fornecimento para<br />o seu negócio
        </h2>

        <p style=${descStyle}>
          Levamos a qualidade da fermentação natural para cafés, restaurantes e
          mercados especializados. Produção sob medida, ingredientes selecionados
          e o cuidado artesanal que seu cliente merece.
        </p>

        <div style=${bulletsStyle}>
          ${BULLETS.map((b, i) => html`<${BulletItem} key=${i} item=${b} />`)}
        </div>

        <a
          href=${waHref}
          target="_blank"
          rel="noopener noreferrer"
          style=${btnStyle}
          onMouseEnter=${() => setBtnHov(true)}
          onMouseLeave=${() => setBtnHov(false)}
        >
          Fale conosco →
        </a>
      </div>
    `;

    return html`
      <section id="foodservice" style=${sectionStyle} aria-label="Fornecimento para negócios">
        <div style=${containerStyle}>
          <div style=${bodyStyle}>
            ${isMobile
              ? html`${textBlock}${imgBlock}`
              : html`${imgBlock}${textBlock}`
            }
          </div>
        </div>
      </section>
    `;
  }

  window.FoodServiceSection = FoodServiceSection;
}());
