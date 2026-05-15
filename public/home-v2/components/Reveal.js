// ============================================================
// REVEAL WRAPPER — scroll-reveal com blur premium
// ============================================================
(function () {
  var html = window.html;

  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  function Reveal(props) {
    var children = props.children;
    var delay    = props.delay    !== undefined ? props.delay    : 0;
    var duration = props.duration !== undefined ? props.duration : 0.7;
    var y        = props.y        !== undefined ? props.y        : 24;
    var once     = props.once     !== undefined ? props.once     : true;
    var style    = props.style    || {};

    var ref_vis  = window.useRevealOnView({ once: once });
    var ref      = ref_vis[0];
    var visible  = ref_vis[1];
    var skipAnim = ref_vis[2];

    var baseStyle;
    if (skipAnim) {
      baseStyle = {};
    } else {
      var d    = delay + 's';
      var dur  = duration + 's';
      var trans = [
        'opacity '   + dur + ' ' + EASE + ' ' + d,
        'transform ' + dur + ' ' + EASE + ' ' + d,
        'filter '    + dur + ' ' + EASE + ' ' + d,
      ].join(', ');

      baseStyle = {
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0px)' : 'translateY(' + y + 'px)',
        filter:     visible ? 'blur(0px)'        : 'blur(6px)',
        transition: trans,
        willChange: visible ? 'auto' : 'opacity, transform, filter',
      };
    }

    return html`<div ref=${ref} style=${{ ...baseStyle, ...style }}>${children}</div>`;
  }

  window.Reveal = Reveal;
}());
