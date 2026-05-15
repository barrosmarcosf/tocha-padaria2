// ============================================================
// GLOBAL STYLES
// ============================================================
(function () {
  const html = window.html;

  // Todos os @keyframes e estilos globais já estão em /styles.css (carregado antes do JS).
  // Redefini-los aqui causava restart das animações toda vez que App re-renderizava.
  const GlobalStyles = () => null;

  window.GlobalStyles = GlobalStyles;
}());
