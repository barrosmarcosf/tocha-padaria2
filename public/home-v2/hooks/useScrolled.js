// hooks/useScrolled.js
// Retorna true quando window.scrollY ultrapassa `threshold` (default 40px).
// Usado principalmente pela Navbar para ativar backdrop/borda.
(function () {
  'use strict';

  const { useState, useEffect } = window.React;

  function useScrolled(threshold) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
      const limit = threshold || 40;
      const h = () => setScrolled(window.scrollY > limit);
      window.addEventListener('scroll', h, { passive: true });
      return () => window.removeEventListener('scroll', h);
    }, [threshold]);

    return scrolled;
  }

  window.useScrolled = useScrolled;
}());
