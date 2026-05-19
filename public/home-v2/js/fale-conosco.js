(function () {
  const form = document.getElementById('contact-form');
  const wrap = document.getElementById('form-wrapper');

  function setError(id, msg) {
    const inp = document.getElementById('f-' + id);
    const err = document.getElementById('err-' + id);
    if (msg) {
      inp.classList.add('error');
      err.textContent = msg;
      err.hidden = false;
    } else {
      inp.classList.remove('error');
      err.hidden = true;
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    let valid = true;
    const name = document.getElementById('f-name').value.trim();
    const email = document.getElementById('f-email').value.trim();
    const phone = document.getElementById('f-phone').value.trim();
    const message = document.getElementById('f-message').value.trim();

    if (name.length < 2) { setError('name', 'Informe seu nome'); valid = false; } else setError('name', '');
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { setError('email', 'E-mail inválido'); valid = false; } else setError('email', '');
    if (!phone.replace(/\D/g, '').match(/^\d{10,11}$/)) { setError('phone', 'DDD + número (ex: 21 99999-9999)'); valid = false; } else setError('phone', '');
    if (message.length < 5) { setError('message', 'Conte um pouco mais'); valid = false; } else setError('message', '');

    if (!valid) return;

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerHTML = 'Enviando...';

    setTimeout(function () {
      wrap.innerHTML = '<div class="success-state"><div class="check">✓</div><h3>Mensagem enviada!</h3><p>Recebemos sua mensagem. Vamos responder por e-mail ou WhatsApp em até 1 dia útil.<br><br>Obrigado por escrever para a gente.</p></div>';
    }, 900);
  });
})();

(function () {
  fetch('/api/site-config')
    .then(function (r) { return r.json(); })
    .then(function (cfg) {
      if (cfg.phone) {
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
      }
      if (cfg.contactEmail) {
        document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
          var old = a.href.replace('mailto:', '').split('?')[0];
          a.href = a.href.replace('mailto:' + old, 'mailto:' + cfg.contactEmail);
          if (a.textContent.trim() === old) a.textContent = cfg.contactEmail;
        });
      }
    })
    .catch(function () {});
}());
