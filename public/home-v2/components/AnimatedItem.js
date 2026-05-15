// ============================================================
// ANIMATED ITEM — entrada premium com stagger automático
//
// Padrão visual:
//   opacity: 0 → 1
//   translateY: 24px → 0
//   blur: 6px → 0px
//   easing: cubic-bezier(0.22, 1, 0.36, 1)
//   duração: 0.7s
//
// Uso dentro de AnimatedContainer (herda delay/stagger):
//   <${AnimatedItem} index=${0}> conteúdo <//>
//
// Uso standalone com delay explícito:
//   <${AnimatedItem} delay=${0.3}> conteúdo <//>
//
// Props:
//   index   — posição no stagger (0, 1, 2...)
//   delay   — delay base em segundos (override do contexto)
//   stagger — intervalo em segundos (override do contexto)
//   as      — tag HTML, default 'div'
//   style   — estilos adicionais
// ============================================================
(function () {
  var html = window.html;

  // Captura o contexto criado pelo AnimatedContainer (carregado antes)
  // Se usado fora de um AnimatedContainer, usa os defaults do contexto
  var AnimContext = window._AnimContext;

  var EASE     = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var DURATION = '0.7s';

  function AnimatedItem(props) {
    var children = props.children;
    var index    = props.index   !== undefined ? props.index   : 0;
    var as       = props.as      || 'div';
    var style    = props.style   || {};

    var ctx     = React.useContext(AnimContext);
    var delay   = props.delay   !== undefined ? props.delay   : ctx.delay;
    var stagger = props.stagger !== undefined ? props.stagger : ctx.stagger;

    var totalDelay = (delay + index * stagger).toFixed(3) + 's';

    var result   = window.useRevealOnView();
    var ref      = result[0];
    var visible  = result[1];
    var skipAnim = result[2];

    var animStyle;
    if (skipAnim) {
      animStyle = {};
    } else {
      var t = DURATION + ' ' + EASE + ' ' + totalDelay;
      animStyle = {
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0px)' : 'translateY(24px)',
        filter:     visible ? 'blur(0px)' : 'blur(6px)',
        transition: 'opacity ' + t + ', transform ' + t + ', filter ' + t,
        willChange: visible ? 'auto' : 'opacity, transform, filter',
      };
    }

    return html`
      <${as} ref=${ref} style=${{ ...animStyle, ...style }}>${children}<//>
    `;
  }

  window.AnimatedItem = AnimatedItem;
}());
