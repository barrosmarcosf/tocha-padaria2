(function () {
  'use strict';

  const html       = window.htm.bind(window.React.createElement);
  const T          = window.T;
  const useParallax = window.useParallax;

  // Offset total dos elementos fixos: AnnouncementBar (40px) + Navbar (64px)
  const FIXED_OFFSET = 'calc(var(--announce-h) + var(--navbar-h))';

  function Hero({ scrollToMenu }) {
    const parallaxOffset = useParallax(0.25);

    const sectionStyle = {
      position:       'relative',
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      overflow:       'hidden',
      // Padding top para o conteúdo não ficar atrás da Navbar
      paddingTop:     FIXED_OFFSET,
    };

    const bgStyle = {
      position:   'absolute',
      inset:      '-10% 0',          // margem extra para o parallax não expor bordas
      backgroundImage:    'url(/assets/hero-bg.jpg)',
      backgroundSize:     'cover',
      backgroundPosition: 'center',
      transform:  `translateY(${parallaxOffset}px)`,
      willChange: 'transform',
    };

    const overlayStyle = {
      position:   'absolute',
      inset:      0,
      background: T.color.overlayHeavy,
    };

    const contentStyle = {
      position:       'relative',   // acima do overlay
      zIndex:         T.z.raised,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      textAlign:      'center',
      padding:        `0 ${T.space[10]}`,
      maxWidth:       T.space.containerMd,
      width:          '100%',
    };

    const eyebrowStyle = {
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.xs,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing['4xl'],
      textTransform: 'uppercase',
      color:         T.color.amber,
      marginBottom:  T.space[6],
    };

    const headlineStyle = {
      fontFamily:    T.font.serif,
      fontSize:      T.fontSize.h1,
      fontWeight:    T.fontWeight.regular,
      lineHeight:    T.lineHeight.tight,
      color:         T.color.cream,
      marginBottom:  T.space[6],
      maxWidth:      '820px',
    };

    const subStyle = {
      fontFamily:   T.font.sans,
      fontSize:     T.fontSize.lg,
      fontWeight:   T.fontWeight.light,
      lineHeight:   T.lineHeight.relaxed,
      color:        T.color.textMuted,
      maxWidth:     '560px',
      marginBottom: T.space[12],
    };

    const actionsStyle = {
      display:    'flex',
      gap:        T.space[4],
      flexWrap:   'wrap',
      justifyContent: 'center',
    };

    const btnPrimaryStyle = {
      display:       'inline-flex',
      alignItems:    'center',
      gap:           T.space[2],
      padding:       `14px ${T.space[10]}`,
      borderRadius:  T.radius.pill,
      border:        'none',
      background:    T.color.amber,
      color:         T.color.bg,
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.sm,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing.xl,
      textTransform: 'uppercase',
      cursor:        'pointer',
      transition:    `background ${T.transition.fast}, transform ${T.transition.fast}`,
    };

    const btnSecondaryStyle = {
      display:       'inline-flex',
      alignItems:    'center',
      gap:           T.space[2],
      padding:       `14px ${T.space[10]}`,
      borderRadius:  T.radius.pill,
      border:        `1px solid var(--border)`,
      background:    'transparent',
      color:         'var(--text)',
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.sm,
      fontWeight:    T.fontWeight.medium,
      letterSpacing: T.letterSpacing.xl,
      textTransform: 'uppercase',
      cursor:        'pointer',
      transition:    `border-color ${T.transition.fast}, color ${T.transition.fast}, transform ${T.transition.fast}`,
    };

    function onPrimaryEnter(e) {
      e.currentTarget.style.background  = T.color.amberBright;
      e.currentTarget.style.transform   = 'translateY(-1px)';
    }
    function onPrimaryLeave(e) {
      e.currentTarget.style.background  = T.color.amber;
      e.currentTarget.style.transform   = 'translateY(0)';
    }
    function onSecondaryEnter(e) {
      e.currentTarget.style.borderColor = 'var(--border-hover)';
      e.currentTarget.style.color       = T.color.amber;
      e.currentTarget.style.transform   = 'translateY(-1px)';
    }
    function onSecondaryLeave(e) {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.color       = 'var(--text)';
      e.currentTarget.style.transform   = 'translateY(0)';
    }

    function scrollToHowItWorks() {
      const el = document.getElementById('como-pedir');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    return html`
      <section id="hero" style=${sectionStyle} aria-label="Hero">

        <div style=${bgStyle} aria-hidden="true"></div>
        <div style=${overlayStyle} aria-hidden="true"></div>

        <div style=${contentStyle}>
          <p style=${eyebrowStyle}>Fermentação Natural</p>

          <h1 style=${headlineStyle}>
            O pão que transforma<br />o seu dia
          </h1>

          <p style=${subStyle}>
            Pães artesanais de fermentação lenta, brioches e doces feitos com ingredientes selecionados.
            Fornadas aos sábados em São João de Meriti.
          </p>

          <div style=${actionsStyle}>
            <button
              style=${btnPrimaryStyle}
              onClick=${scrollToMenu}
              onMouseEnter=${onPrimaryEnter}
              onMouseLeave=${onPrimaryLeave}
            >
              Ver cardápio
            </button>

            <button
              style=${btnSecondaryStyle}
              onClick=${scrollToHowItWorks}
              onMouseEnter=${onSecondaryEnter}
              onMouseLeave=${onSecondaryLeave}
            >
              Como pedir
            </button>
          </div>
        </div>

      </section>
    `;
  }

  window.Hero = Hero;
}());
