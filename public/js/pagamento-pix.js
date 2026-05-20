let pixData = null;
try { pixData = JSON.parse(localStorage.getItem('tocha-pix-data')); } catch (_) {}

if (!pixData || !pixData.payment_id) {
    window.location.href = "/";
} else {
    document.getElementById('qrImage').src = pixData.qr_code_base64;
    document.getElementById('pixString').innerText = pixData.qr_code;
}

function copyPix() {
    if (!pixData) return;
    navigator.clipboard.writeText(pixData.qr_code);
    const btn = document.querySelector('.copy-btn');
    btn.innerText = "COPIADO!";
    setTimeout(() => btn.innerText = "COPIAR", 2000);
}

document.querySelector('.copy-btn').addEventListener('click', copyPix);

// Polling com limite de tentativas (max 72 = ~6 min)
let _pollAttempts = 0;
const MAX_POLL = 72;
let _pollTimer = null;

async function checkStatus() {
    if (_pollAttempts >= MAX_POLL) {
        const badge = document.querySelector('.status-badge');
        if (badge) badge.innerHTML = '⏰ Tempo esgotado. <a href="/" style="color:inherit;text-decoration:underline;">Voltar ao site</a>';
        return;
    }
    _pollAttempts++;
    try {
        // Prefere polling direto no banco (mais confiável — detecta logo que o webhook processa)
        const orderId = pixData.order_id || localStorage.getItem('tocha-order-id');
        if (orderId) {
            const r = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
            if (r.ok) {
                const d = await r.json();
                if (d.status === 'paid') { clearTimeout(_pollTimer); showSuccess(); return; }
                if (d.status === 'error') {
                    clearTimeout(_pollTimer);
                    alert("Ocorreu um erro no pagamento. Entre em contato com a loja.");
                    window.location.href = "/";
                    return;
                }
                _pollTimer = setTimeout(checkStatus, 5000);
                return;
            }
        }
        // Fallback: check-payment com order_id obrigatório
        if (!orderId) {
            console.warn("[PIX] order_id não disponível — polling indisponível.");
            _pollTimer = setTimeout(checkStatus, 10000);
            return;
        }
        const res = await fetch(`/api/mercadopago/check-payment/${pixData.payment_id}?order_id=${encodeURIComponent(orderId)}`);
        const data = await res.json();
        if (data.status === 'approved') {
            clearTimeout(_pollTimer); showSuccess();
        } else if (data.status === 'cancelled' || data.status === 'rejected') {
            clearTimeout(_pollTimer);
            alert("O pagamento foi cancelado ou expirou.");
            window.location.href = "/";
        } else {
            _pollTimer = setTimeout(checkStatus, 5000);
        }
    } catch (e) {
        console.warn("Erro ao checar status:", e.message);
        _pollTimer = setTimeout(checkStatus, 10000);
    }
}

function showSuccess() {
    // Limpa dados sensíveis
    localStorage.removeItem('tocha-cart');
    localStorage.removeItem('tocha-pix-data');

    document.getElementById('pixContent').innerHTML = `
        <div class="success-icon">✓</div>
        <h1 style="color: #2ecc71;">Pagamento Aprovado!</h1>
        <p>Seu pedido foi recebido com sucesso. Enviamos uma confirmação para seu E-mail e WhatsApp.</p>
        <a href="/" class="btn-primary" style="
            display: block;
            background: var(--accent);
            color: #000;
            padding: 18px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 800;
            margin-top: 30px;
        ">VOLTAR PARA A LOJA</a>
    `;
}

if (pixData) checkStatus();
