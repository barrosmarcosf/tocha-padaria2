// ============================================================
// COUNTDOWN (robusto)
// ============================================================
function useCountdown(target) {
  const [time, setTime] = React.useState(() => getTime(target));

  React.useEffect(() => {
    if (!target) return;

    const interval = setInterval(() => {
      const next = getTime(target);

      setTime((prev) => {
        // evita re-render desnecessário
        if (
          prev.d === next.d &&
          prev.h === next.h &&
          prev.m === next.m &&
          prev.s === next.s
        ) {
          return prev;
        }
        return next;
      });

      // para o timer quando chegar em zero
      if (next.total <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [target]);

  return {
    days: time.d,
    hours: time.h,
    minutes: time.m,
    seconds: time.s,
    isFinished: time.total <= 0
  };
}

// helper isolado (melhor legibilidade + testável)
function getTime(target) {
  const now = Date.now();
  const diff = Math.max(0, target - now);

  return {
    total: diff,
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000)
  };
}

window.useCountdown = useCountdown;