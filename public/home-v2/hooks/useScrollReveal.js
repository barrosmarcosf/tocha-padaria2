// hooks/useScrollReveal.js
// Observa um elemento via IntersectionObserver e dispara uma única vez
// quando ele entra na viewport. Retorna [ref, visible].
(function () {
  'use strict';

  const { useRef, useState, useEffect } = window.React;

  function useScrollReveal(threshold) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
      }, { threshold: threshold || 0.08 });
      obs.observe(el);
      return () => obs.disconnect();
    }, []);

    return [ref, visible];
  }

  window.useScrollReveal = useScrollReveal;
}());
