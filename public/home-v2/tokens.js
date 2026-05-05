// tokens.js — Design System · Tocha Padaria home-v2
// Expõe window.T para uso em inline styles (app.js).
// Espelha exatamente as CSS custom properties definidas em index.html.
// NUNCA altere um lado sem alterar o outro.

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // CORES
  // ─────────────────────────────────────────────────────────────
  var color = {

    // Fundos (escuros → claros)
    bgDeep:   'oklch(8%  0.015 46)',   // story scroller
    bgDark:   'oklch(9%  0.015 48)',   // footer
    bg:       'oklch(12% 0.018 50)',   // fundo principal da página
    bgMenu:   'oklch(11% 0.018 49)',   // seção cardápio (ligeiramente diferente)
    bg2:      'oklch(16% 0.02  48)',   // seções alternadas (ManifestoStrip, HowItWorks…)
    bg3:      'oklch(20% 0.022 47)',   // elevação de componentes
    surface:  'oklch(18% 0.02  48)',   // superfície de cards / inputs

    // Superfícies de card (estados)
    cardBg:      'oklch(16% 0.02  48)',
    cardBgHover: 'oklch(19% 0.022 48)',

    // Texto
    text:      'oklch(92% 0.012 70)',   // texto principal
    textMuted: 'oklch(65% 0.015 65)',   // texto secundário
    textDim:   'oklch(45% 0.012 60)',   // texto terciário / labels
    cream:     'oklch(94% 0.01  75)',   // headings / destaque em branco-quente

    // Destaque principal — âmbar
    amber:       'oklch(72% 0.12 60)',
    amberBright: 'oklch(80% 0.14 58)', // hover do amber

    // Destaque secundário — terra
    terra: 'oklch(55% 0.1  30)',

    // Bordas
    border:      'oklch(28% 0.02 50)',
    borderHover: 'oklch(36% 0.028 55)',
    borderFocus: 'oklch(72% 0.12 60)',  // = amber
    borderSubtle:'oklch(22% 0.02 50)',  // separadores internos

    // Status
    success: 'oklch(55% 0.12 140)',   // verde confirmação / pix
    error:   'oklch(60% 0.12 25)',    // vermelho erro / validação

    // Sobreposições
    overlay:       'oklch(0% 0 0 / 0.65)',
    overlayHeavy:  'oklch(0% 0 0 / 0.70)',
    overlayLight:  'oklch(0% 0 0 / 0.35)',

    // Decorativos
    glowAmber: 'oklch(72% 0.12 60 / 0.05)',  // radial glow de seção
  };

  // Tags de produto
  var tagColor = {
    'Clássico':    color.amber,
    'Favorito':    color.amber,
    'Especial':    'oklch(65% 0.1 200)',  // azul
    'Novidade':    'oklch(65% 0.1 130)',  // verde
    'Exclusivo':   color.terra,
    'Sazonal':     'oklch(65% 0.1 160)',  // teal
    'Para Servir': 'oklch(65% 0.1 280)',  // roxo
  };

  // ─────────────────────────────────────────────────────────────
  // TIPOGRAFIA
  // ─────────────────────────────────────────────────────────────
  var font = {
    serif: "'Playfair Display', Georgia, serif",
    sans:  "'DM Sans', system-ui, sans-serif",
  };

  // Escala de tamanhos (valores exatos do design original)
  var fontSize = {
    tag:     '9px',
    caption: '11px',
    xs:      '12px',
    sm:      '13px',
    base:    '14px',
    md:      '15px',
    lg:      '16px',
    xl:      '17px',
    '2xl':   '18px',
    '3xl':   '20px',
    '4xl':   '22px',
    h5:      '22px',
    h4:      '28px',
    h3:      'clamp(32px, 3.8vw, 50px)',
    h2:      'clamp(36px, 4.5vw, 56px)',
    h2story: 'clamp(32px, 4vw,   48px)',
    quote:   'clamp(28px, 4vw,   52px)',
    h1:      'clamp(52px, 7vw,   96px)',
  };

  var fontWeight = {
    light:    300,
    regular:  400,
    medium:   500,
    semibold: 600,
    bold:     700,
  };

  // Espaçamento entre letras (letter-spacing)
  var letterSpacing = {
    tight:   '0.04em',
    base:    '0.06em',
    md:      '0.08em',
    lg:      '0.10em',
    xl:      '0.12em',
    '2xl':   '0.14em',
    '3xl':   '0.16em',
    '4xl':   '0.18em',
  };

  var lineHeight = {
    tight:  1.05,
    snug:   1.25,
    normal: 1.5,
    relaxed:1.6,
    loose:  1.7,
    airy:   1.8,
  };

  // ─────────────────────────────────────────────────────────────
  // ESPAÇAMENTOS
  // ─────────────────────────────────────────────────────────────
  var space = {
    // Escala base
    '1':  '4px',
    '2':  '8px',
    '3':  '12px',
    '4':  '16px',
    '5':  '20px',
    '6':  '24px',
    '7':  '28px',
    '8':  '32px',
    '10': '40px',
    '12': '48px',
    '14': '56px',
    '16': '64px',
    '20': '80px',
    '24': '96px',
    '28': '112px',
    '30': '120px',

    // Aliases semânticos
    cardPadSm: '16px 18px 18px',
    cardPad:   '28px 24px',
    cardPadLg: '28px 32px',
    sectionPad:    '120px 0',
    sectionPadSm:  '100px 0',
    containerPad:  '0 40px',

    // Larguras máximas de container
    containerSm:  '900px',
    container:    '1100px',
    containerMd:  '1240px',
    containerLg:  '1300px',

    // Gaps de grid
    gridSm:  '12px',
    grid:    '20px',
    gridMd:  '24px',
    gridLg:  '48px',
    gridXl:  '64px',
    gridHero:'80px',
  };

  // ─────────────────────────────────────────────────────────────
  // BORDER RADIUS
  // ─────────────────────────────────────────────────────────────
  var radius = {
    none:  '0',
    sharp: '2px',     // CTAs principais
    tag:   '3px',
    sm:    '4px',
    md:    '6px',
    card:  '8px',     // cards de produto
    lg:    '10px',
    xl:    '14px',
    full:  '20px',    // bottom sheets
    pill:  '999px',   // badges / botão nav
    circle:'50%',
  };

  // ─────────────────────────────────────────────────────────────
  // Z-INDEX
  // ─────────────────────────────────────────────────────────────
  var z = {
    base:     1,
    raised:   10,
    sticky:   50,
    navbar:   100,
    whatsapp: 150,
    drawerBg: 200,
    drawer:   201,
    modalBg:  300,
    modal:    301,
    tweaks:   2147483646,
  };

  // ─────────────────────────────────────────────────────────────
  // TRANSIÇÕES & EASING
  // ─────────────────────────────────────────────────────────────
  var ease = {
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
    out:    'cubic-bezier(0.16, 1, 0.3, 1)',
    base:   'ease',
  };

  var transition = {
    instant: '0.15s ease',
    fast:    '0.2s ease',
    base:    '0.25s ease',
    medium:  '0.28s ease',
    slow:    '0.4s ease',
    reveal:  '0.7s ease',
    image:   '0.55s ease',  // zoom de imagem em hover
  };

  // ─────────────────────────────────────────────────────────────
  // SOMBRAS
  // ─────────────────────────────────────────────────────────────
  var shadow = {
    card:    '0 12px 36px oklch(0% 0 0 / 0.35)',
    whatsapp:'0 4px 14px oklch(0% 0 0 / 0.3)',
    whatsappHover: '0 8px 24px oklch(0% 0 0 / 0.4)',
  };

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  // Retorna a cor da tag pelo nome; fallback para cinza muted
  function tag(name) {
    return tagColor[name] || 'oklch(55% 0.015 65)';
  }

  // ─────────────────────────────────────────────────────────────
  // EXPORT
  // ─────────────────────────────────────────────────────────────
  window.T = {
    color,
    tagColor,
    font,
    fontSize,
    fontWeight,
    letterSpacing,
    lineHeight,
    space,
    radius,
    z,
    ease,
    transition,
    shadow,
    tag,
  };

})();
