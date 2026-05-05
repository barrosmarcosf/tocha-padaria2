// hooks/useCountdown.js
// Conta regressivamente até `target` (Date, ISO string ou timestamp ms).
// Retorna { d, h, m, s } — todos zerados quando o tempo acaba.
(function () {
  'use strict';

  const { useState, useEffect } = window.React;

  function useCountdown(target) {
    const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });

    useEffect(() => {
      if (!target) return;

      function tick() {
        const diff = new Date(target) - Date.now();
        if (diff <= 0) { setTime({ d: 0, h: 0, m: 0, s: 0 }); return; }
        setTime({
          d: Math.floor(diff / 86400000),
          h: Math.floor((diff % 86400000) / 3600000),
          m: Math.floor((diff % 3600000) / 60000),
          s: Math.floor((diff % 60000) / 1000),
        });
      }

      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }, [target]);

    return time;
  }

  window.useCountdown = useCountdown;
}());
