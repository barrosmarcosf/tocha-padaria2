// hooks/useParallax.js
// Retorna o offset vertical calculado por window.scrollY * speed.
// Usar em elementos com transform: translateY(${offset}px).
(function () {
  'use strict';

  const { useState, useEffect } = window.React;

  function useParallax(speed) {
    const [offset, setOffset] = useState(0);

    useEffect(() => {
      const factor = speed || 0.3;
      const handle = () => setOffset(window.scrollY * factor);
      window.addEventListener('scroll', handle, { passive: true });
      return () => window.removeEventListener('scroll', handle);
    }, [speed]);

    return offset;
  }

  window.useParallax = useParallax;
}());
