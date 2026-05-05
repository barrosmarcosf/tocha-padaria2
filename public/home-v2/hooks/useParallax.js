// ============================================================
// PARALLAX HOOK (performático)
// ============================================================
function useParallax(speed = 0.3) {
  const [offset, setOffset] = React.useState(0);
  const ticking = React.useRef(false);

  React.useEffect(() => {
    function update() {
      setOffset(window.scrollY * speed);
      ticking.current = false;
    }

    function onScroll() {
      if (!ticking.current) {
        requestAnimationFrame(update);
        ticking.current = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [speed]);

  return offset;
}

window.useParallax = useParallax;