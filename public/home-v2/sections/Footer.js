(function () {
  'use strict';

  const { useState } = window.React;
  const html        = window.htm.bind(window.React.createElement);
  const T           = window.T;
  const useIsMobile = window.useIsMobile;

  // Offset dos elementos fixed (announce + navbar)
  const SCROLL_OFFSET = 40 + 64;

  function scrollToId(id) {
    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  const NAV_LINKS = [
    { label: 'Início',         id: 'hero'           },
    { label: 'Cardápio',       id: 'cardapio'        },
    { label: 'Como funciona',  id: 'como-funciona'   },
    { label: 'Nossa história', id: 'nossa-historia'  },
  ];

  const WA_LINK = 'https://wa.me/5521000000000?text=Ol%C3%A1%2C%20Tocha%20Padaria!';
  const IG_LINK = 'https://instagram.com/tocha.padaria';

  // ── Primitivos ───────────────────────────────────────────────────

  function ColTitle({ children }) {
    return html`
      <p style=${{
        fontFamily:    T.font.sans,
        fontSize:      T.fontSize.xs,
        fontWeight:    T.fontWeight.semibold,
        letterSpacing: T.letterSpacing['3xl'],
        textTransform: 'uppercase',
        color:         T.color.textDim,
        marginBottom:  T.space[5],
      }}>${children}</p>
    `;
  }

  function NavLink({ label, id }) {
    const [hov, setHov] = useState(false);
    return html`
      <button
        onClick=${() => scrollToId(id)}
        onMouseEnter=${() => setHov(true)}
        onMouseLeave=${() => setHov(false)}
        style=${{
          background:    'none',
          border:        'none',
          cursor:        'pointer',
          textAlign:     'left',
          padding:       0,
          fontFamily:    T.font.sans,
          fontSize:      T.fontSize.sm,
          fontWeight:    T.fontWeight.regular,
          letterSpacing: T.letterSpacing.base,
          color:         hov ? T.color.text : T.color.textMuted,
          transition:    `color ${T.transition.fast}`,
          lineHeight:    T.lineHeight.relaxed,
        }}
      >${label}</button>
    `;
  }

  function ExtLink({ href, children }) {
    const [hov, setHov] = useState(false);
    return html`
      <a
        href=${href}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter=${() => setHov(true)}
        onMouseLeave=${() => setHov(false)}
        style=${{
          display:       'inline-flex',
          alignItems:    'center',
          gap:           T.space[2],
          fontFamily:    T.font.sans,
          fontSize:      T.fontSize.sm,
          fontWeight:    T.fontWeight.regular,
          color:         hov ? T.color.amber : T.color.textMuted,
          textDecoration:'none',
          transition:    `color ${T.transition.fast}`,
          lineHeight:    T.lineHeight.relaxed,
        }}
      >${children}</a>
    `;
  }

  // ── Colunas ──────────────────────────────────────────────────────

  function ColBrand() {
    return html`
      <div style=${{ display:'flex', flexDirection:'column', gap: T.space[4] }}>
        <p style=${{
          fontFamily:  T.font.serif,
          fontSize:    T.fontSize['3xl'],
          fontWeight:  T.fontWeight.medium,
          color:       T.color.cream,
          lineHeight:  1,
        }}>Tocha Padaria</p>

        <p style=${{
          fontFamily:  T.font.sans,
          fontSize:    T.fontSize.sm,
          fontWeight:  T.fontWeight.light,
          color:       T.color.textMuted,
          lineHeight:  T.lineHeight.relaxed,
          maxWidth:    '280px',
        }}>
          Pães de fermentação natural feitos com cuidado.
          Fornadas aos sábados em São João de Meriti, RJ.
        </p>

        <p style=${{
          fontFamily:    T.font.sans,
          fontSize:      T.fontSize.xs,
          fontWeight:    T.fontWeight.medium,
          letterSpacing: T.letterSpacing.lg,
          color:         T.color.amber,
          opacity:       0.8,
        }}>Levain ativo desde 2022</p>
      </div>
    `;
  }

  function ColNav() {
    return html`
      <div>
        <${ColTitle}>Navegação<//>
        <div style=${{ display:'flex', flexDirection:'column', gap: T.space[3] }}>
          ${NAV_LINKS.map(l => html`<${NavLink} key=${l.id} label=${l.label} id=${l.id} />`)}
        </div>
      </div>
    `;
  }

  function ColContact() {
    return html`
      <div>
        <${ColTitle}>Contato<//>
        <div style=${{ display:'flex', flexDirection:'column', gap: T.space[3] }}>
          <${ExtLink} href=${WA_LINK}>
            <span style=${{ fontSize:'15px' }}>💬</span>
            WhatsApp
          <//>
          <${ExtLink} href=${IG_LINK}>
            <span style=${{ fontSize:'15px' }}>📸</span>
            @tocha.padaria
          <//>
          <p style=${{
            fontFamily:  T.font.sans,
            fontSize:    T.fontSize.xs,
            color:       T.color.textDim,
            lineHeight:  T.lineHeight.relaxed,
            marginTop:   T.space[1],
          }}>
            São João de Meriti, RJ<br/>
            Sábados, 8h – 13h
          </p>
        </div>
      </div>
    `;
  }

  // ── Footer ───────────────────────────────────────────────────────

  function Footer() {
    const isMobile = useIsMobile();

    const footerStyle = {
      background: T.color.bg2,
      borderTop:  `1px solid var(--border-subtle)`,
    };

    const mainStyle = {
      maxWidth: T.space.containerMd,
      margin:   '0 auto',
      padding:  `${T.space[16]} ${T.space[10]}`,
      display:  'grid',
      gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr',
      gap:      isMobile ? T.space[12] : T.space.gridLg,
      alignItems: 'flex-start',
    };

    const bottomStyle = {
      borderTop: `1px solid var(--border-subtle)`,
    };

    const bottomInnerStyle = {
      maxWidth:    T.space.containerMd,
      margin:      '0 auto',
      padding:     `${T.space[6]} ${T.space[10]}`,
      display:     'flex',
      alignItems:  'center',
      justifyContent: isMobile ? 'center' : 'space-between',
      flexWrap:    'wrap',
      gap:         T.space[3],
    };

    const copyStyle = {
      fontFamily:  T.font.sans,
      fontSize:    T.fontSize.xs,
      color:       T.color.textDim,
      letterSpacing: T.letterSpacing.base,
    };

    const madeStyle = {
      fontFamily:  T.font.sans,
      fontSize:    T.fontSize.xs,
      color:       T.color.textDim,
      opacity:     0.6,
    };

    return html`
      <footer id="contato" style=${footerStyle} role="contentinfo">

        <div style=${mainStyle}>
          <${ColBrand} />
          <${ColNav}   />
          <${ColContact} />
        </div>

        <div style=${bottomStyle}>
          <div style=${bottomInnerStyle}>
            <p style=${copyStyle}>
              © 2026 Tocha Padaria. Todos os direitos reservados.
            </p>
            <p style=${madeStyle}>Fermentado com carinho 🍞</p>
          </div>
        </div>

      </footer>
    `;
  }

  window.Footer = Footer;
}());
