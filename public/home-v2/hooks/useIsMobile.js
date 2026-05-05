// hooks/useIsMobile.js
// Retorna true quando a largura da janela está abaixo de `breakpoint` (default 768px).
// Reavalia em cada resize (passive).
(function () {
  'use strict';

  const { useState, useEffect } = window.React;

  function useIsMobile(breakpoint) {
    const bp = breakpoint || 768;
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < bp);

    useEffect(() => {
      const h = () => setIsMobile(window.innerWidth < bp);
      window.addEventListener('resize', h, { passive: true });
      return () => window.removeEventListener('resize', h);
    }, [bp]);

    return isMobile;
  }

  window.useIsMobile = useIsMobile;
}());
