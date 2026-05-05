(function () {
  'use strict';

  const { useState } = window.React;
  const html        = window.htm.bind(window.React.createElement);
  const T           = window.T;
  const useIsMobile = window.useIsMobile;

  const IG_URL = 'https://instagram.com/tocha.padaria';

  // Mock: substituir por URLs reais quando disponíveis
  const POSTS = [
    { id: 1, emoji: '🍞', label: 'Fornada de pães de fermentação natural'   },
    { id: 2, emoji: '🥐', label: 'Brioche recém saído do forno'              },
    { id: 3, emoji: '🌾', label: 'Detalhe do miolo aberto'                  },
    { id: 4, emoji: '✨', label: 'Mesa de pães artesanais do sábado'         },
  ];

  // Gradientes placeholder que simulam tonalidades de foto
  const GRADIENTS = [
    `linear-gradient(135deg, oklch(18% 0.03 50), oklch(24% 0.04 45))`,
    `linear-gradient(135deg, oklch(16% 0.025 48), oklch(22% 0.035 52))`,
    `linear-gradient(135deg, oklch(20% 0.03 46), oklch(14% 0.02  50))`,
    `linear-gradient(135deg, oklch(22% 0.035 49), oklch(17% 0.03  47))`,
  ];

  function PostTile({ post, gradient }) {
    const [hovered, setHovered] = useState(false);

    const linkStyle = {
      display:  'block',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: T.radius.card,
      aspectRatio:  '1 / 1',
      border:       `1px solid ${hovered ? T.color.borderHover : T.color.borderSubtle}`,
      transition:   `border-color ${T.transition.base}`,
      textDecoration: 'none',
    };

    const bgStyle = {
      position:   'absolute',
      inset:      0,
      background: gradient,
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize:   '52px',
      transition: `transform ${T.transition.slow}`,
      transform:  hovered ? 'scale(1.06)' : 'scale(1)',
    };

    // Overlay de hover com ícone do Instagram
    const overlayStyle = {
      position:   'absolute',
      inset:      0,
      background: T.color.overlayLight,
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity:    hovered ? 1 : 0,
      transition: `opacity ${T.transition.base}`,
    };

    const igIconStyle = {
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.xs,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing.lg,
      textTransform: 'uppercase',
      color:         T.color.cream,
    };

    return html`
      <a
        href=${IG_URL}
        target="_blank"
        rel="noopener noreferrer"
        style=${linkStyle}
        aria-label=${post.label}
        onMouseEnter=${() => setHovered(true)}
        onMouseLeave=${() => setHovered(false)}
      >
        <div style=${bgStyle} aria-hidden="true">${post.emoji}</div>
        <div style=${overlayStyle} aria-hidden="true">
          <span style=${igIconStyle}>Ver no Instagram</span>
        </div>
      </a>
    `;
  }

  function InstagramStrip() {
    const isMobile = useIsMobile();

    const sectionStyle = {
      padding:    T.space.sectionPad,
      background: T.color.bg2,
      borderTop:  `1px solid var(--border-subtle)`,
    };

    const containerStyle = {
      maxWidth: T.space.containerMd,
      margin:   '0 auto',
      padding:  T.space.containerPad,
    };

    const headerStyle = {
      display:        'flex',
      alignItems:     'flex-end',
      justifyContent: 'space-between',
      flexWrap:       'wrap',
      gap:            T.space[4],
      marginBottom:   T.space[10],
    };

    const titleBlockStyle = {
      display:       'flex',
      flexDirection: 'column',
      gap:           T.space[3],
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

    const igLinkStyle = {
      display:       'inline-flex',
      alignItems:    'center',
      gap:           T.space[2],
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.sm,
      fontWeight:    T.fontWeight.medium,
      letterSpacing: T.letterSpacing.base,
      color:         T.color.textMuted,
      textDecoration:'none',
      transition:    `color ${T.transition.fast}`,
      flexShrink:    0,
    };

    const gridStyle = {
      display:             'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap:                 T.space.gridMd,
    };

    return html`
      <section id="instagram" style=${sectionStyle} aria-label="Instagram">
        <div style=${containerStyle}>

          <div style=${headerStyle}>
            <div style=${titleBlockStyle}>
              <p style=${eyebrowStyle}>Instagram</p>
              <h2 style=${titleStyle}>Acompanhe nossa rotina</h2>
            </div>

            <a
              href=${IG_URL}
              target="_blank"
              rel="noopener noreferrer"
              style=${igLinkStyle}
              onMouseEnter=${e => { e.currentTarget.style.color = T.color.amber; }}
              onMouseLeave=${e => { e.currentTarget.style.color = T.color.textMuted; }}
            >
              @tocha.padaria ↗
            </a>
          </div>

          <div style=${gridStyle}>
            ${POSTS.map((post, i) => html`
              <${PostTile} key=${post.id} post=${post} gradient=${GRADIENTS[i]} />
            `)}
          </div>

        </div>
      </section>
    `;
  }

  window.InstagramStrip = InstagramStrip;
}());
