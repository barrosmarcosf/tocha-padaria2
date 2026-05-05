// ============================================================
// UTILS
// ============================================================
(function () {
  const html = window.html;

  window.formatPrice = function formatPrice(p) {
    if (typeof p !== 'number') return 'R$ 0,00';
    return 'R$ ' + p.toFixed(2).replace('.', ',');
  };

  window.ImagePlaceholder = function ImagePlaceholder({ label = '', style = {} }) {
    return html`
      <div style=${{
        width: '100%',
        height: '100%',
        background: 'repeating-linear-gradient(45deg, oklch(20% 0.018 48), oklch(20% 0.018 48) 2px, oklch(22% 0.02 47) 2px, oklch(22% 0.02 47) 12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}>
        <span style=${{
          fontFamily: 'monospace',
          fontSize: 11,
          color: 'oklch(45% 0.012 60)',
          textAlign: 'center',
          padding: '0 16px',
          lineHeight: 1.6
        }}>
          ${label}
        </span>
      </div>
    `;
  };
}());
