// ============================================================
// MANIFESTO STRIP
// ============================================================
const html = window.html;

function ManifestoStrip() {
  const items = [
    'Levain ativo desde 2022',
    'Sem conservantes',
    'Fermentação longa',
    'Fornadas aos sábados',
    'Feito com paciência',
    'São João de Meriti'
  ];

  return html`
    <div style=${{
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      padding: '18px 0',
      overflow: 'hidden',
      background: 'var(--bg2)',
      position: 'relative'
    }}>
      <div style=${{
        display: 'flex',
        gap: 64,
        animation: 'marquee 28s linear infinite',
        whiteSpace: 'nowrap',
        width: 'max-content'
      }}>
        ${[...items, ...items, ...items].map((item, i) => html`
          <span
            key=${i}
            style=${{
              fontSize: 12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: 64
            }}
          >
            ${item}
            <span style=${{ color: 'var(--amber)', fontSize: 8 }}>✦</span>
          </span>
        `)}
      </div>
    </div>
  `;
}

window.ManifestoStrip = ManifestoStrip;
