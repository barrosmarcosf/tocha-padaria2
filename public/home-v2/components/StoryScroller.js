(function () {
  'use strict';

  const { useState, useEffect, useRef, useCallback } = window.React;
  const html = window.htm.bind(window.React.createElement);
  const T    = window.T;

  const N = 5;

  // Offset dos elementos fixed
  const STICKY_TOP = 40 + 64;   // announce-h + navbar-h (px)
  const STICKY_H   = `calc(100vh - ${STICKY_TOP}px)`;

  const SLIDES = [
    {
      id:    1,
      year:  '2022',
      title: 'Um pote de farinha e água',
      desc:  'Tudo começa com temperatura certa, paciência e o som das bolhas formando o levain.',
      emoji: '🌱',
      bg:    `linear-gradient(160deg, oklch(14% 0.025 48), oklch(20% 0.04 45))`,
    },
    {
      id:    2,
      year:  '2022',
      title: 'Acordar às três da manhã',
      desc:  'O aroma avisa antes do temporizador. Aprender a ouvir a massa é o primeiro ofício.',
      emoji: '🌙',
      bg:    `linear-gradient(160deg, oklch(10% 0.015 50), oklch(16% 0.03 47))`,
    },
    {
      id:    3,
      year:  '2023',
      title: 'A vizinha bateu à porta',
      desc:  'Ela queria comprar. O primeiro pedido não foi planejado — foi uma boa surpresa.',
      emoji: '🚪',
      bg:    `linear-gradient(160deg, oklch(16% 0.03 46), oklch(22% 0.05 43))`,
    },
    {
      id:    4,
      year:  '2024',
      title: 'O sábado ficou pequeno',
      desc:  'De cinco para cinquenta clientes. A lista cresceu; a receita não mudou.',
      emoji: '📋',
      bg:    `linear-gradient(160deg, oklch(12% 0.02 50), oklch(18% 0.035 48))`,
    },
    {
      id:    5,
      year:  '2025',
      title: 'O mesmo levain, mais história',
      desc:  'Três anos depois, o pote ainda borbulha toda manhã. E a história continua.',
      emoji: '✨',
      bg:    `linear-gradient(160deg, oklch(15% 0.03 47), oklch(24% 0.05 44))`,
    },
  ];

  // ── Slide individual ─────────────────────────────────────────────

  function Slide({ slide }) {
    const outerStyle = {
      flex:     '0 0 20%',    // 1/N of track
      height:   '100%',
      position: 'relative',
      overflow: 'hidden',
    };

    const bgStyle = {
      position:       'absolute',
      inset:          0,
      background:     slide.bg,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
    };

    const emojiStyle = {
      fontSize:  'clamp(80px, 12vw, 140px)',
      opacity:   0.18,
      userSelect:'none',
      pointerEvents: 'none',
    };

    const overlayStyle = {
      position:   'absolute',
      inset:      0,
      background: `linear-gradient(to top, oklch(0% 0 0 / 0.75) 0%, oklch(0% 0 0 / 0.2) 60%, transparent 100%)`,
    };

    const contentStyle = {
      position:      'absolute',
      bottom:        0,
      left:          0,
      right:         0,
      padding:       `0 clamp(${T.space[8]}, 5vw, ${T.space[16]}) clamp(${T.space[12]}, 6vh, ${T.space[16]})`,
    };

    const yearStyle = {
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.xs,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing['4xl'],
      textTransform: 'uppercase',
      color:         T.color.amber,
      marginBottom:  T.space[3],
    };

    const titleStyle = {
      fontFamily:   T.font.serif,
      fontSize:     `clamp(${T.fontSize.h4}, 3.5vw, ${T.fontSize.h3})`,
      fontWeight:   T.fontWeight.regular,
      lineHeight:   T.lineHeight.tight,
      color:        T.color.cream,
      marginBottom: T.space[4],
      maxWidth:     '640px',
    };

    const descStyle = {
      fontFamily:  T.font.sans,
      fontSize:    `clamp(${T.fontSize.base}, 1.2vw, ${T.fontSize.xl})`,
      fontWeight:  T.fontWeight.light,
      color:       T.color.textMuted,
      lineHeight:  T.lineHeight.relaxed,
      maxWidth:    '540px',
    };

    return html`
      <div style=${outerStyle} aria-label=${slide.title}>
        <div style=${bgStyle} aria-hidden="true">
          <span style=${emojiStyle}>${slide.emoji}</span>
        </div>
        <div style=${overlayStyle} aria-hidden="true"></div>
        <div style=${contentStyle}>
          <p style=${yearStyle}>${slide.year}</p>
          <h3 style=${titleStyle}>${slide.title}</h3>
          <p style=${descStyle}>${slide.desc}</p>
        </div>
      </div>
    `;
  }

  // ── Dots de navegação ────────────────────────────────────────────

  function Dots({ active, onGo }) {
    const wrapStyle = {
      position:       'absolute',
      bottom:         T.space[8],
      left:           0,
      right:          0,
      display:        'flex',
      justifyContent: 'center',
      gap:            T.space[3],
      zIndex:         T.z.raised,
      pointerEvents:  'none',
    };

    return html`
      <div style=${wrapStyle} aria-hidden="true">
        ${SLIDES.map((s, i) => html`
          <button
            key=${s.id}
            onClick=${() => onGo(i)}
            style=${{
              width:        i === active ? '24px' : '8px',
              height:       '8px',
              borderRadius: T.radius.pill,
              border:       'none',
              background:   i === active ? T.color.amber : T.color.border,
              cursor:       'pointer',
              padding:      0,
              transition:   `width ${T.transition.base}, background ${T.transition.base}`,
              pointerEvents:'auto',
            }}
          ></button>
        `)}
      </div>
    `;
  }

  // ── StoryScroller ────────────────────────────────────────────────

  function StoryScroller() {
    const containerRef  = useRef(null);
    const trackRef      = useRef(null);
    const progressRef   = useRef(null);
    const rafRef        = useRef(null);
    const [activeSlide, setActiveSlide] = useState(0);

    // Calcula progresso e anima directamente no DOM (sem re-render)
    const onScroll = useCallback(() => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const el    = containerRef.current;
        const track = trackRef.current;
        const bar   = progressRef.current;
        if (!el || !track || !bar) return;

        const rect       = el.getBoundingClientRect();
        const totalScroll = el.offsetHeight - (window.innerHeight - STICKY_TOP);
        const scrolled   = STICKY_TOP - rect.top;
        const progress   = Math.max(0, Math.min(1, scrolled / totalScroll));

        // Deslocamento horizontal: de 0% a -(N-1)/N * 100% da track
        track.style.transform = `translateX(${-(progress * (N - 1) / N) * 100}%)`;

        // Barra de progresso
        bar.style.width = `${progress * 100}%`;

        // Dot ativo (leve throttle via estado)
        const idx = Math.min(N - 1, Math.floor(progress * N));
        setActiveSlide(prev => prev !== idx ? idx : prev);
      });
    }, []);

    useEffect(() => {
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return () => {
        window.removeEventListener('scroll', onScroll);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [onScroll]);

    // Clique em dot → scroll até o slide correspondente
    function goToSlide(i) {
      const el = containerRef.current;
      if (!el) return;
      const totalScroll = el.offsetHeight - (window.innerHeight - STICKY_TOP);
      const targetProgress = i / (N - 1);
      const elTop = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top:      elTop - STICKY_TOP + targetProgress * totalScroll,
        behavior: 'smooth',
      });
    }

    // ── Estilos ──────────────────────────────────────────────────

    const containerStyle = {
      // Altura total que gera o "espaço" de scroll para N slides
      height:   `${N * 100}vh`,
      position: 'relative',
    };

    const stickyStyle = {
      position:   'sticky',
      top:        `${STICKY_TOP}px`,
      height:     STICKY_H,
      overflow:   'hidden',
      background: T.color.bgDeep,
    };

    // Barra de progresso
    const barTrackStyle = {
      position:   'absolute',
      top:        0,
      left:       0,
      right:      0,
      height:     '2px',
      background: T.color.bg2,
      zIndex:     T.z.raised + 1,
    };

    const barFillStyle = {
      height:     '100%',
      width:      '0%',                  // atualizado via DOM
      background: T.color.amber,
      transition: 'width 0.05s linear',
    };

    // Contador de slide (top-right)
    const counterStyle = {
      position:      'absolute',
      top:           T.space[6],
      right:         T.space[6],
      zIndex:        T.z.raised,
      fontFamily:    T.font.serif,
      fontSize:      T.fontSize.sm,
      color:         T.color.textDim,
      fontStyle:     'italic',
      pointerEvents: 'none',
    };

    // Track horizontal
    const trackStyle = {
      display:    'flex',
      width:      `${N * 100}%`,
      height:     '100%',
      willChange: 'transform',
      // transform atualizado via DOM
    };

    return html`
      <div ref=${containerRef} style=${containerStyle} aria-label="Linha do tempo — história da Tocha">

        <div style=${stickyStyle}>

          <!-- Progresso -->
          <div style=${barTrackStyle} aria-hidden="true">
            <div ref=${progressRef} style=${barFillStyle}></div>
          </div>

          <!-- Contador -->
          <div style=${counterStyle} aria-hidden="true">
            ${activeSlide + 1} / ${N}
          </div>

          <!-- Track de slides -->
          <div ref=${trackRef} style=${trackStyle} aria-live="polite">
            ${SLIDES.map(s => html`<${Slide} key=${s.id} slide=${s} />`)}
          </div>

          <!-- Dots -->
          <${Dots} active=${activeSlide} onGo=${goToSlide} />

        </div>

      </div>
    `;
  }

  window.StoryScroller = StoryScroller;
}());
