// ============================================================
// REVEAL WRAPPER
// ============================================================
const html = window.html;

function Reveal({ children, delay = 0, duration = 0.7, y = 32, once = true, style = {} }) {
  const [ref, visible] = window.useScrollReveal({ once });

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const baseStyle = prefersReducedMotion
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : `translateY(${y}px)`,
        transition: `opacity ${duration}s cubic-bezier(0.22,1,0.36,1) ${delay}s,
                     transform ${duration}s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
        willChange: 'opacity, transform'
      };

  return html`<div ref=${ref} style=${{ ...baseStyle, ...style }}>${children}</div>`;
}

window.Reveal = Reveal;
