(function () {
  fetch('/api/site-config')
    .then(function (r) { return r.json(); })
    .then(function (cfg) {
      if (!cfg.phone) return;
      document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
        a.href = a.href.replace(/wa\.me\/\d+/, 'wa.me/' + cfg.phone);
        var txt = a.textContent.trim();
        if (/^\(\d/.test(txt) && cfg.phone.length >= 10) {
          var p = cfg.phone.replace(/\D/g, '');
          var ddd = p.slice(0, 2);
          var num = p.slice(2);
          a.textContent = '(' + ddd + ') ' + num.slice(0, 5) + '-' + num.slice(5);
        }
      });
    })
    .catch(function () {});
}());
