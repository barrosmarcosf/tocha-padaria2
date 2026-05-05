(function () {
  'use strict';

  const html = window.htm.bind(window.React.createElement);
  const T    = window.T;

  const PHRASES = [
    'Levain ativo desde 2022',
    'Fermentação natural',
    'Assado no dia',
    'Sem conservantes',
    'Produção limitada',
    'Ingredientes selecionados',
  ];

  // Separador visual entre frases
  function Dot() {
    return html`
      <span aria-hidden="true" style=${{
        display:    'inline-block',
        width:      '4px',
        height:     '4px',
        borderRadius: T.radius.circle,
        background: T.color.amber,
        margin:     `0 ${T.space[8]}`,
        flexShrink: 0,
        verticalAlign: 'middle',
        opacity:    0.7,
      }}></span>
    `;
  }

  // Uma cópia do track (1/3 do total)
  function TrackSlice() {
    return html`
      ${PHRASES.map((phrase, i) => html`
        <span key=${i} style=${{
          fontFamily:    T.font.sans,
          fontSize:      T.fontSize.xs,
          fontWeight:    T.fontWeight.semibold,
          letterSpacing: T.letterSpacing['3xl'],
          textTransform: 'uppercase',
          color:         T.color.textMuted,
          whiteSpace:    'nowrap',
          flexShrink:    0,
        }}>${phrase}</span>
        <${Dot} key=${'d' + i} />
      `)}
    `;
  }

  function ManifestoStrip() {
    const stripStyle = {
      background:  T.color.bg2,
      borderTop:   `1px solid var(--border-subtle)`,
      borderBottom:`1px solid var(--border-subtle)`,
      height:      '56px',
      overflow:    'hidden',
      display:     'flex',
      alignItems:  'center',
    };

    // O track tem 3× o conteúdo; a animação desloca -33.333% (= 1 cópia),
    // criando um loop contínuo sem quebra visível.
    const trackStyle = {
      display:   'flex',
      alignItems:'center',
      // 3 cópias = largura total do track
      width:     'max-content',
      animation: 'marquee 28s linear infinite',
      willChange:'transform',
    };

    return html`
      <div style=${stripStyle} aria-hidden="true">
        <div style=${trackStyle}>
          <${TrackSlice} />
          <${TrackSlice} />
          <${TrackSlice} />
        </div>
      </div>
    `;
  }

  window.ManifestoStrip = ManifestoStrip;
}());
