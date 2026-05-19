/* ── Validação: marca campo inválido ao sair do foco ── */
document.querySelectorAll('.fale-input[required]').forEach(input => {
    input.addEventListener('blur', () => {
        if (!input.value.trim() || !input.checkValidity()) {
            input.classList.add('input-erro');
        } else {
            input.classList.remove('input-erro');
        }
    });
    input.addEventListener('input', () => {
        if (input.value.trim() && input.checkValidity()) {
            input.classList.remove('input-erro');
        }
    });
});

/* ── Form Submit ── */
document.querySelector('.fale-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const camposObrigatorios = this.querySelectorAll('.fale-input[required]');
    let valido = true;
    let primeiroErro = null;

    camposObrigatorios.forEach(input => {
        if (!input.value.trim() || !input.checkValidity()) {
            input.classList.add('input-erro');
            valido = false;
            if (!primeiroErro) primeiroErro = input;
        } else {
            input.classList.remove('input-erro');
        }
    });

    if (!valido) {
        primeiroErro.focus();
        return;
    }

    const submitBtn = this.querySelector('.botao-contato');
    const originalText = submitBtn.textContent;

    const formData = {
        name:    nomeInput.value.trim(),
        email:   emailInput.value.trim(),
        phone:   this.querySelector('input[type="tel"]').value.trim(),
        message: this.querySelector('textarea').value.trim()
    };

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'ENVIANDO...';

        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Falha no envio');

        const overlay = document.getElementById('notification-overlay');
        const modal   = document.getElementById('notification-modal');

        document.getElementById('notification-icon').innerHTML =
            '<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        document.getElementById('notification-title').textContent   = 'Mensagem Enviada!';
        document.getElementById('notification-message').textContent = 'Sua mensagem foi entregue com sucesso. Obrigado pelo contato!';

        overlay.classList.add('visible');
        modal.classList.add('open');

        const closeFn = () => {
            overlay.classList.remove('visible');
            modal.classList.remove('open');
            this.reset();
        };
        document.getElementById('notification-close-btn').onclick = closeFn;
        overlay.onclick = closeFn;

    } catch (err) {
        console.error(err);
        alert('Desculpe, ocorreu um erro ao enviar sua mensagem. Tente novamente.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});
