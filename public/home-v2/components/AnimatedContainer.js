// ============================================================
// ANIMATED CONTAINER — fornece contexto de stagger para AnimatedItem
//
// Uso:
//   <${AnimatedContainer} stagger=${0.08} delay=${0.1}>
//     <${AnimatedItem} index=${0}> conteúdo <//>
//     <${AnimatedItem} index=${1}> conteúdo <//>
//   <//>
//
// Props:
//   delay   — delay base do primeiro item (s), default 0.1
//   stagger — intervalo entre itens (s), default 0.08
//   as      — tag HTML do wrapper, default 'div'
//   style   — estilos inline do wrapper
// ============================================================
(function () {
  var html = window.html;

  // Contexto criado uma única vez no carregamento do módulo
  var AnimContext = React.createContext({ delay: 0.1, stagger: 0.08 });

  // Expõe o contexto para AnimatedItem (carregado depois)
  window._AnimContext = AnimContext;

  function AnimatedContainer(props) {
    var children = props.children;
    var delay    = props.delay   !== undefined ? props.delay   : 0.1;
    var stagger  = props.stagger !== undefined ? props.stagger : 0.08;
    var as       = props.as      || 'div';
    var style    = props.style   || {};

    var ctx = React.useMemo(
      function () { return { delay: delay, stagger: stagger }; },
      [delay, stagger]
    );

    return html`
      <${AnimContext.Provider} value=${ctx}>
        <${as} style=${style}>${children}<//>
      <//>
    `;
  }

  window.AnimatedContainer = AnimatedContainer;
}());
