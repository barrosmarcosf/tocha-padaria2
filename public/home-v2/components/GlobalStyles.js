// ============================================================
// GLOBAL STYLES
// ============================================================
(function () {
  const html = window.html;

  const GlobalStyles = () => html`<style>
    @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
    @keyframes scrollLine { 0%, 100% { opacity: 0.3; transform: scaleY(0.6); } 50% { opacity: 1; transform: scaleY(1); } }
    @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    input::placeholder { color: oklch(40% 0.01 60); }
    input:focus { outline: none; }
    a { transition: color 0.2s; }
  </style>`;

  window.GlobalStyles = GlobalStyles;
}());
