(function () {
  'use strict';

  const html          = window.htm.bind(window.React.createElement);
  const T             = window.T;
  const useIsMobile   = window.useIsMobile;
  const StoryScroller = window.StoryScroller;

  const MILESTONES = [
    {
      year:  '2022',
      title: 'O começo',
      desc:  'Primeiro levain ativo na cozinha de casa. Testes diários, erros e acertos — nasce a Tocha.',
    },
    {
      year:  '2023',
      title: 'Primeiras fornadas',
      desc:  'Os vizinhos começam a reservar. Fornadas aos sábados viram tradição.',
    },
    {
      year:  '2024',
      title: 'A comunidade',
      desc:  'Lista de espera, novos produtos e clientes que se tornaram amigos.',
    },
    {
      year:  '2025',
      title: 'Hoje',
      desc:  'Expansão para foodservice, novos sabores e o mesmo cuidado de sempre.',
    },
  ];

  // ── Timeline horizontal (desktop) ───────────────────────────────

  function TimelineDesktop() {
    const wrapStyle = {
      position: 'relative',
      paddingTop: T.space[8],
    };

    // Linha horizontal
    const lineStyle = {
      position:   'absolute',
      top:        '8px',           // alinha com o centro dos pontos
      left:       0,
      right:      0,
      height:     '1px',
      background: T.color.border,
    };

    const trackStyle = {
      display:             'grid',
      gridTemplateColumns: `repeat(${MILESTONES.length}, 1fr)`,
      position:            'relative',
    };

    return html`
      <div style=${wrapStyle}>
        <div style=${lineStyle}></div>
        <div style=${trackStyle}>
          ${MILESTONES.map((m, i) => html`
            <${MilestoneDesktop} key=${m.year} milestone=${m} isLast=${i === MILESTONES.length - 1} />
          `)}
        </div>
      </div>
    `;
  }

  function MilestoneDesktop({ milestone, isLast }) {
    const colStyle = {
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'flex-start',
      paddingRight:   isLast ? 0 : T.space[6],
    };

    const dotRowStyle = {
      display:    'flex',
      alignItems: 'center',
      marginBottom: T.space[6],
    };

    const dotStyle = {
      width:        '16px',
      height:       '16px',
      borderRadius: T.radius.circle,
      background:   T.color.amber,
      border:       `3px solid ${T.color.bg}`,
      outline:      `1px solid ${T.color.amber}`,
      flexShrink:   0,
    };

    const yearStyle = {
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.xs,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing['3xl'],
      color:         T.color.amber,
      marginLeft:    T.space[3],
    };

    const titleStyle = {
      fontFamily:  T.font.serif,
      fontSize:    T.fontSize['2xl'],
      fontWeight:  T.fontWeight.medium,
      color:       T.color.cream,
      marginBottom:T.space[2],
    };

    const descStyle = {
      fontFamily:  T.font.sans,
      fontSize:    T.fontSize.sm,
      fontWeight:  T.fontWeight.light,
      color:       T.color.textMuted,
      lineHeight:  T.lineHeight.relaxed,
    };

    return html`
      <div style=${colStyle}>
        <div style=${dotRowStyle}>
          <div style=${dotStyle}></div>
          <span style=${yearStyle}>${milestone.year}</span>
        </div>
        <h3 style=${titleStyle}>${milestone.title}</h3>
        <p style=${descStyle}>${milestone.desc}</p>
      </div>
    `;
  }

  // ── Timeline vertical (mobile) ───────────────────────────────────

  function TimelineMobile() {
    const wrapStyle = {
      position: 'relative',
      paddingLeft: T.space[6],
    };

    // Linha vertical
    const lineStyle = {
      position:   'absolute',
      top:        0,
      bottom:     0,
      left:       '7px',      // centro do dot (16px / 2 - 1px)
      width:      '1px',
      background: T.color.border,
    };

    const listStyle = {
      display:       'flex',
      flexDirection: 'column',
      gap:           T.space[10],
    };

    return html`
      <div style=${wrapStyle}>
        <div style=${lineStyle}></div>
        <div style=${listStyle}>
          ${MILESTONES.map(m => html`
            <${MilestoneMobile} key=${m.year} milestone=${m} />
          `)}
        </div>
      </div>
    `;
  }

  function MilestoneMobile({ milestone }) {
    const rowStyle = {
      display:    'flex',
      alignItems: 'flex-start',
      gap:        T.space[5],
      position:   'relative',
    };

    const dotStyle = {
      width:        '16px',
      height:       '16px',
      borderRadius: T.radius.circle,
      background:   T.color.amber,
      border:       `3px solid ${T.color.bg}`,
      outline:      `1px solid ${T.color.amber}`,
      flexShrink:   0,
      marginTop:    '3px',    // alinha com a primeira linha do texto
      marginLeft:   `calc(-${T.space[6]} - 7px)`,  // puxa de volta sobre a linha
    };

    const contentStyle = { flex: 1 };

    const yearStyle = {
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.xs,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing['3xl'],
      color:         T.color.amber,
      marginBottom:  T.space[2],
    };

    const titleStyle = {
      fontFamily:  T.font.serif,
      fontSize:    T.fontSize['2xl'],
      fontWeight:  T.fontWeight.medium,
      color:       T.color.cream,
      marginBottom:T.space[2],
    };

    const descStyle = {
      fontFamily:  T.font.sans,
      fontSize:    T.fontSize.sm,
      fontWeight:  T.fontWeight.light,
      color:       T.color.textMuted,
      lineHeight:  T.lineHeight.relaxed,
    };

    return html`
      <div style=${rowStyle}>
        <div style=${dotStyle}></div>
        <div style=${contentStyle}>
          <p style=${yearStyle}>${milestone.year}</p>
          <h3 style=${titleStyle}>${milestone.title}</h3>
          <p style=${descStyle}>${milestone.desc}</p>
        </div>
      </div>
    `;
  }

  // ── Seção principal ──────────────────────────────────────────────

  function HistoriaSection() {
    const isMobile = useIsMobile();

    const sectionStyle = {
      padding:         T.space.sectionPad,
      background:      T.color.bg,
      borderTop:       `1px solid var(--border-subtle)`,
      scrollMarginTop: 'calc(var(--announce-h) + var(--navbar-h))',
    };

    const containerStyle = {
      maxWidth: T.space.containerMd,
      margin:   '0 auto',
      padding:  T.space.containerPad,
    };

    const headerStyle = {
      marginBottom: T.space[16],
    };

    const eyebrowStyle = {
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.xs,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing['4xl'],
      textTransform: 'uppercase',
      color:         T.color.amber,
      marginBottom:  T.space[4],
    };

    const titleStyle = {
      fontFamily:  T.font.serif,
      fontSize:    T.fontSize.h2,
      fontWeight:  T.fontWeight.regular,
      lineHeight:  T.lineHeight.tight,
      color:       T.color.cream,
      maxWidth:    '640px',
    };

    const leadStyle = {
      fontFamily:  T.font.sans,
      fontSize:    T.fontSize.lg,
      fontWeight:  T.fontWeight.light,
      color:       T.color.textMuted,
      lineHeight:  T.lineHeight.loose,
      maxWidth:    '560px',
      marginTop:   T.space[6],
    };

    return html`
      <section id="nossa-historia" style=${sectionStyle} aria-label="Nossa história">
        <div style=${containerStyle}>

          <header style=${headerStyle}>
            <p style=${eyebrowStyle}>Nossa história</p>
            <h2 style=${titleStyle}>Da cozinha ao seu sábado</h2>
            <p style=${leadStyle}>
              Tudo começou com um pote de farinha, água e tempo.
              Hoje o levain ativo desde 2022 ainda guia cada fornada.
            </p>
          </header>

          ${isMobile
            ? html`<${TimelineMobile} />`
            : html`<${TimelineDesktop} />`
          }

        </div>

        <!-- StoryScroller full-bleed abaixo da timeline -->
        <div style=${{ marginTop: T.space[16] }}>
          <${StoryScroller} />
        </div>

      </section>
    `;
  }

  window.HistoriaSection = HistoriaSection;
}());
