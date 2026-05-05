// ============================================================
// ANNOUNCEMENT BAR
// ============================================================
(function () {
  const html = window.html;

  function AnnouncementBar() {
    const [visible, setVisible] = React.useState(true);

    const target = React.useMemo(() => {
      const now = new Date();
      const day = now.getDay(); // 0=dom, 6=sab
      const daysUntilSat = (6 - day + 7) % 7 || 7;
      const sat = new Date(now);
      sat.setDate(now.getDate() + daysUntilSat);
      sat.setHours(11, 0, 0, 0);
      return sat.getTime();
    }, []);

    const { hours, minutes, seconds } = window.useCountdown(target);

    React.useEffect(() => {
      const handle = () => setVisible(window.scrollY < 80);
      window.addEventListener('scroll', handle, { passive: true });
      return () => window.removeEventListener('scroll', handle);
    }, []);

    const pad = (n) => String(n || 0).padStart(2, '0');

    return html`
      <div style=${{
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
        flexWrap: 'wrap',
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.35s ease'
      }}>
        <span>🔥 Fornada sábado — encerra em</span>
        <span style=${{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.12em' }}>
          ${pad(hours)}:${pad(minutes)}:${pad(seconds)}
        </span>
        <span>— garanta seu pão</span>
      </div>
    `;
  }

  window.AnnouncementBar = AnnouncementBar;
}());
