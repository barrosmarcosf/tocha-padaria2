(function () {
  'use strict';

  const html = window.htm.bind(window.React.createElement);
  const T    = window.T;
  const useCountdown = window.useCountdown;

  function pad(n) { return String(n).padStart(2, '0'); }

  function AnnouncementBar({ status }) {
    const targetDate = status?.next_fornada || status?.nextFornada || null;
    const { d, h, m, s } = useCountdown(targetDate);

    const done    = targetDate && d === 0 && h === 0 && m === 0 && s === 0;
    const loading = !status;

    const barStyle = {
      position:       'fixed',
      top:            0,
      left:           0,
      right:          0,
      height:         'var(--announce-h)',
      zIndex:         T.z.navbar - 1,
      background:     T.color.amber,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      overflow:       'hidden',
    };

    const textStyle = {
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.xs,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing.xl,
      textTransform: 'uppercase',
      color:         T.color.bg,
      whiteSpace:    'nowrap',
    };

    const timeStyle = {
      fontFamily:  T.font.serif,
      fontSize:    T.fontSize.sm,
      fontWeight:  T.fontWeight.medium,
      fontStyle:   'italic',
      letterSpacing: T.letterSpacing.tight,
      color:       T.color.bg,
      marginLeft:  T.space[2],
    };

    let label;
    if (loading) {
      label = html`<span style=${textStyle}>Carregando…</span>`;
    } else if (done) {
      label = html`<span style=${textStyle}>Pedidos encerrados</span>`;
    } else if (!targetDate) {
      label = html`<span style=${textStyle}>Fornadas aos sábados — pedidos via WhatsApp</span>`;
    } else {
      const parts = [];
      if (d > 0) parts.push(html`<span key="d">${pad(d)}d </span>`);
      parts.push(html`<span key="h">${pad(h)}h </span>`);
      parts.push(html`<span key="m">${pad(m)}m </span>`);
      parts.push(html`<span key="s">${pad(s)}s</span>`);

      label = html`
        <span style=${textStyle}>Próxima fornada em:</span>
        <span style=${timeStyle}>${parts}</span>
      `;
    }

    return html`<div style=${barStyle} role="status" aria-live="polite">${label}</div>`;
  }

  window.AnnouncementBar = AnnouncementBar;
}());
