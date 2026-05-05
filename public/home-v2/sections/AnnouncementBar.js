// ============================================================
// ANNOUNCEMENT BAR (FIEL + CORRIGIDO)
// ============================================================

const { useCountdown } = window;

function AnnouncementBar() {
  const target = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 0, 0);
    return d.getTime();
  }, []);

  const { d, h, m, s } = useCountdown(target);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        zIndex: 101,
        background: 'var(--amber)',
        color: 'oklch(12% 0.018 50)',
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '0 20px',
        flexWrap: 'wrap'
      }}
    >
      <span>🔥 Fornada sábado — encerra em</span>

      <span
        style={{
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.12em'
        }}
      >
        {d}D {pad(h)}:{pad(m)}:{pad(s)}
      </span>

      <span>— garanta seu pão</span>
    </div>
  );
}

window.AnnouncementBar = AnnouncementBar;