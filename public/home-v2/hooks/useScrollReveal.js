// ============================================================
// SCROLL REVEAL HOOK (robusto)
// ============================================================
function useScrollReveal(options = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -10% 0px', // começa antes de entrar totalmente
    once = true // anima só uma vez por padrão
  } = options;

  const ref = React.useRef(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // fallback (navegadores antigos / edge cases)
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);

          if (once) observer.unobserve(el);
        } else {
          // se quiser permitir reanimar ao sair/entrar
          if (!once) setVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, visible];
}

window.useScrollReveal = useScrollReveal;