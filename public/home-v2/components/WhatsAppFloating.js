// ============================================================
// FLOATING WHATSAPP BUTTON (bottom-left, discreet)
// ============================================================
function WhatsAppFloating() {
  const [hovered, setHovered] = React.useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <a
      href="https://wa.me/5521966278965"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={() => !isMobile && setHovered(false)}
      style={{
        position: 'fixed',
        left: 20,
        bottom: 20,
        zIndex: 150,
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'oklch(60% 0.16 145)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: hovered
          ? '0 8px 24px oklch(0% 0 0 / 0.4), 0 0 0 4px oklch(60% 0.16 145 / 0.18)'
          : '0 4px 14px oklch(0% 0 0 / 0.3)',
        transition: 'all 0.25s ease',
        transform: hovered ? 'scale(1.06)' : 'scale(1)',
        textDecoration: 'none'
      }}
    >
      {/* WhatsApp icon */}
      <svg
        viewBox="0 0 32 32"
        width="24"
        height="24"
        fill="#fff"
        aria-hidden="true"
      >
        <path d="M16.003 3C9.376 3 4 8.376 4 15.003c0 2.117.555 4.183 1.61 6.003L4 28l7.184-1.583a12 12 0 0 0 4.819 1.005h.004C22.633 27.422 28 22.046 28 15.42 28 8.793 22.633 3 16.003 3Zm0 22.012a9.97 9.97 0 0 1-4.882-1.27l-.35-.21-4.265.94.91-4.156-.227-.36a9.97 9.97 0 0 1-1.523-5.35c0-5.514 4.488-10 10.005-10 5.516 0 9.998 4.486 9.998 10 0 5.516-4.485 10.406-9.666 10.406Zm5.476-7.477c-.3-.15-1.776-.876-2.052-.976-.275-.1-.475-.15-.676.15-.2.3-.776.976-.951 1.176-.175.2-.35.225-.65.075-.3-.15-1.265-.466-2.41-1.486-.89-.794-1.49-1.774-1.665-2.074-.175-.3-.018-.462.131-.611.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.625-.926-2.225-.244-.585-.491-.506-.676-.515l-.575-.011a1.1 1.1 0 0 0-.8.375c-.275.3-1.05 1.025-1.05 2.5 0 1.475 1.075 2.9 1.225 3.1.15.2 2.116 3.231 5.13 4.531.717.31 1.276.495 1.71.633.717.228 1.37.196 1.886.119.575-.086 1.776-.726 2.026-1.426.25-.7.25-1.3.175-1.426-.075-.125-.275-.2-.575-.35Z"/>
      </svg>

      {/* Tooltip (somente desktop) */}
      {!isMobile && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            left: 'calc(100% + 12px)',
            top: '50%',
            transform: hovered
              ? 'translateY(-50%) translateX(0)'
              : 'translateY(-50%) translateX(-6px)',
            background: 'oklch(15% 0.02 48)',
            border: '1px solid var(--border)',
            color: 'var(--cream)',
            padding: '8px 14px',
            borderRadius: 6,
            fontSize: 12,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            opacity: hovered ? 1 : 0,
            pointerEvents: 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500
          }}
        >
          Fale com a gente
        </span>
      )}
    </a>
  );
}

window.WhatsAppFloating = WhatsAppFloating;