// ============================================================
// USE REVEAL ON VIEW — IntersectionObserver com prefers-reduced-motion
// Retorna: [ref, visible, skipAnim]
// ============================================================
function useRevealOnView(options) {
  var opts       = options || {};
  var threshold  = opts.threshold  !== undefined ? opts.threshold  : 0.1;
  var rootMargin = opts.rootMargin !== undefined ? opts.rootMargin : '0px 0px -8% 0px';
  var once       = opts.once       !== undefined ? opts.once       : true;

  var prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var noIO     = typeof IntersectionObserver === 'undefined';
  var skipAnim = prefersReduced || noIO;

  var ref = React.useRef(null);

  // Se skipAnim, começa visível para não flash
  var stateInit = React.useState(skipAnim ? true : false);
  var visible   = stateInit[0];
  var setVisible = stateInit[1];

  React.useEffect(function () {
    if (skipAnim) return;

    var el = ref.current;
    if (!el) return;

    var observer = new IntersectionObserver(function (entries) {
      var entry = entries[0];
      if (entry.isIntersecting) {
        setVisible(true);
        if (once) observer.unobserve(el);
      } else if (!once) {
        setVisible(false);
      }
    }, { threshold: threshold, rootMargin: rootMargin });

    observer.observe(el);
    return function () { observer.disconnect(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return [ref, visible, skipAnim];
}

window.useRevealOnView = useRevealOnView;
