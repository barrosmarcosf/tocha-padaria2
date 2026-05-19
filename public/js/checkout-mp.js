let cardPaymentBrickController;
let orderData = null;
let isSubmitting = false;
let hasRedirected = false;
let statusTimer = null;

window.addEventListener('beforeunload', () => {
    if (statusTimer) clearTimeout(statusTimer);
});

async function init() {
    console.log("🚀 CHECKOUT VERSION 3");
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    console.log('🌐 [URL Check] order_id recebido:', orderId);
    console.log("INIT MP");

    if (!orderId) {
        console.error('❌ order_id está ausente na URL');
        showError('Erro: O ID do pedido não foi enviado para a página de pagamento.');
        return;
    }

    try {
        console.log('🔍 [Checkout] Iniciando para pedido:', orderId);
        // 1. Buscar dados do pedido
        const res = await fetch(`/api/mercadopago/order-summary/${orderId}`);
        if (!res.ok) {
            const errTxt = await res.text();
            console.error('❌ Erro no sumário:', errTxt);
            throw new Error('Não foi possível carregar os dados do pedido: ' + errTxt);
        }

        orderData = await res.json();
        console.log('📦 [Checkout] Dados do pedido carregados:', orderData);
        renderSummary(orderData);

        // 2. Buscar chave pública
        const pkRes = await fetch('/api/mercadopago/public-key');
        if (!pkRes.ok) throw new Error('Erro ao buscar chave pública do Mercado Pago.');
        const pkData = await pkRes.json();
        console.log('🔑 [Checkout] Chave pública carregada.');

        if (!pkData.publicKey) throw new Error('Chave pública não configurada no servidor.');

        window.addEventListener('error', e => {
            console.error('🔥 JS ERROR GLOBAL:', e.error);
        });
        window.addEventListener('unhandledrejection', e => {
            console.error('🔥 PROMISE ERROR:', e.reason);
        });

        // 3. Inicializar Bricks
        console.log("🔑 [MP] Inicializando com chave:", pkData.publicKey);
        const mp = new MercadoPago(pkData.publicKey, { locale: 'pt-BR' });
        const bricks = mp.bricks();

        const payerEmail = orderData.customer && orderData.customer.email
            ? String(orderData.customer.email).trim()
            : null;

        cardPaymentBrickController = await bricks.create("cardPayment", "mp-card-bricks", {
            initialization: {
                amount: Number(orderData.total),
                payer: {
                    email: payerEmail || ''
                }
            },
            customization: {
                visual: {
                    style: {
                        theme: "default"
                    }
                }
            },
            callbacks: {
                onReady: () => {
                    console.log("✅ Bricks pronto");
                    const loader = document.getElementById('loader');
                    if (loader) loader.style.opacity = '0';
                    setTimeout(() => { if(loader) loader.remove(); }, 500);
                },
                onSubmit: async (cardFormData) => {
                    console.log('🔥 ON SUBMIT DISPARADO');
                    console.log('🔥 CARD FORM DATA COMPLETO:', cardFormData);
                    console.log("📤 [MP] onSubmit disparado");
                    console.log('TOKEN MP FRONT:', cardFormData.token);

                    if (isSubmitting) return;
                    isSubmitting = true;

                    const submitBtn = document.querySelector('#mp-card-bricks button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.innerText = 'Processando...';
                    }

                    try {
                        if (!cardFormData.token) {
                            console.error('❌ TOKEN NÃO VEIO DO BRICK');
                            throw new Error('TOKEN NÃO GERADO');
                        }

                        const resolvedEmail = cardFormData.payer?.email || payerEmail;
                        if (!resolvedEmail) {
                            throw new Error('Email do pagador não disponível. Verifique seus dados e tente novamente.');
                        }

                        const payload = {
                            token: cardFormData.token,
                            payment_method_id: cardFormData.payment_method_id,
                            issuer_id: cardFormData.issuer_id,
                            installments: cardFormData.installments,
                            payer: {
                                email: resolvedEmail
                            },
                            amount: Number(orderData.total),
                            order_id: orderId,
                            attempt_id: crypto.randomUUID()
                        };

                        console.log('[CHECKOUT REQUEST]', { orderId });
                        console.log('ENVIANDO PARA BACKEND:', payload);
                        console.log('🔥 PAYLOAD FINAL:', payload);
                        console.log('🔥 VOU ENVIAR REQUEST');

                        let res;
                        try {
                            res = await fetch('/api/mercadopago/create-card-payment', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(payload)
                            });
                            console.log('🔥 RESPONSE STATUS:', res.status);
                        } catch (fetchErr) {
                            console.error('🔥 FETCH ERRO:', fetchErr);
                            throw fetchErr;
                        }

                        openPaymentInfoModal('Verificando pagamento...');

                        setTimeout(() => {
                            if (!hasRedirected) {
                                updatePaymentInfoModal('Não conseguimos confirmar o pagamento. Tente novamente.', 'error');
                            }
                        }, 10000);

                        statusTimer = setTimeout(async () => {
                            try {
                                const orderId = localStorage.getItem('order_id');
                                if (!orderId) {
                                    console.error('[ORDER ID ERROR] order_id não encontrado');
                                    throw new Error('order_id não encontrado');
                                }
                                console.log('[ORDER ID USING]', orderId);
                                const statusRes = await fetch(`/api/orders/${orderId}`);
                                const statusData = await statusRes.json();
                                console.log('[ORDER STATUS CHECK]', statusData.status);
                                if (!hasRedirected && ['approved', 'paid'].includes(statusData.status)) {
                                    hasRedirected = true;
                                    window.location.href = '/sucesso.html';
                                }
                            } catch (e) {
                                console.error('[ORDER STATUS ERROR]', e.message);
                            }
                        }, 3000);

                        if (res.status === 409) {
                            console.warn('[MP 409] Pagamento duplicado bloqueado pelo servidor.');
                            updatePaymentInfoModal('Seu pagamento já está sendo processado. Aguarde alguns segundos.');
                            return;
                        }

                        const data = await res.json();

                        if (data.reuse) {
                            console.log('[PAYMENT] tentativa duplicada detectada, aguardando resultado anterior');
                            updatePaymentInfoModal('Pagamento já em processamento. Aguarde alguns segundos.');
                            return;
                        }

                        // 🔒 BLOQUEIO ABSOLUTO
                        if (!data || data.status !== 'approved') {
                            const errMsg = data?.status_detail || data?.error || 'Pagamento não aprovado';

                            console.warn('[MP BLOCK HARD]', data);

                            if (data?.status === 'pending' || data?.status === 'in_process') {
                                updatePaymentInfoModal('Pagamento em análise', 'loading');
                                return;
                            }

                            updatePaymentInfoModal(errMsg, 'error');
                            return;
                        }

                        // ✅ ÚNICO CAMINHO POSSÍVEL
                        console.log('[MP FLOW REDIRECT OK]', data);

                        window.location.href = `/?status=success&order_id=${orderId}&payment_id=${data.payment_id}`;

                    } catch (err) {
                        console.error("❌ Erro no processamento:", err);
                        updatePaymentInfoModal(typeof err.message === 'string' ? err.message : JSON.stringify(err.message), 'error');
                    } finally {
                        isSubmitting = false;
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.innerText = 'Pagar';
                        }
                    }
                },
                onError: (error) => {
                    console.error("❌ Erro no Brick:", error);
                    showError("Erro ao carregar pagamento. Tente novamente.");
                }
            }
        });

    } catch (e) {
        console.error('💥 [Checkout Error]:', e);
        const errPanel = document.getElementById('error-panel');
        const errMsg = document.getElementById('error-msg');
        const loaderEl = document.getElementById('loader');
        if (loaderEl) loaderEl.style.display = 'none';

        if (errPanel && errMsg) {
            errMsg.innerText = e.message;
            errPanel.style.display = 'block';
        } else {
            alert('Erro Crítico: ' + e.message);
        }
    }
}

function showError(msg) {
    const errPanel = document.getElementById('error-panel');
    const errMsg = document.getElementById('error-msg');
    if (errPanel && errMsg) {
        errMsg.innerText = msg;
        errPanel.style.display = 'block';
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
    } else {
        alert(msg);
    }
}

function renderSummary(data) {
    document.getElementById('order-id-label').innerText = `#${data.id}`;
    document.getElementById('total-amount').innerText = `R$ ${data.total.toFixed(2).replace('.', ',')}`;

    // Formatar data da fornada
    let batchLabel = 'A confirmar';
    if (data.batch_date) {
        const raw = data.batch_date;
        const dateObj = raw.match(/^\d{4}-\d{2}-\d{2}$/)
            ? new Date(raw + 'T12:00:00')
            : null;
        if (dateObj) {
            const days = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
            const d = String(dateObj.getDate()).padStart(2,'0');
            const m = String(dateObj.getMonth()+1).padStart(2,'0');
            const y = dateObj.getFullYear();
            batchLabel = `${days[dateObj.getDay()]} ${d}/${m}/${y}`;
        } else {
            batchLabel = String(raw).replace(/\bdia\s+/gi, '').replace(/,\s*/g, ' ').trim();
        }
    }
    document.getElementById('batch-date-label').innerText = `Fornada: ${batchLabel}`;

    const container = document.getElementById('item-list-container');
    container.innerHTML = '';

    data.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'product-row';
        div.innerHTML = `
            <div class="product-info">
                <span class="name">${item.name}</span>
                <span class="qty">${item.qty}x</span>
            </div>
            <span class="product-price">R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}</span>
        `;
        container.appendChild(div);
    });
}

init();

function updatePaymentInfoModal(text, type = 'loading') {
    const existing = document.getElementById('payment-info-modal');
    if (existing) {
        const p = existing.querySelector('p');
        if (p) p.textContent = text;
        const icon = existing.querySelector('#info-modal-icon');
        if (icon) icon.textContent = type === 'error' ? '❌' : '⏳';
        return;
    }
    openPaymentInfoModal(text);
}

function openPaymentInfoModal(message) {
    const existing = document.getElementById('payment-info-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'payment-info-modal';

    modal.innerHTML = `
        <div style="
            position:fixed;
            inset:0;
            background:rgba(0,0,0,0.75);
            display:flex;
            align-items:center;
            justify-content:center;
            z-index:9999;
        ">
            <div style="
                background:#141414;
                padding:30px;
                border-radius:16px;
                width:90%;
                max-width:420px;
                text-align:center;
                box-shadow:0 20px 60px rgba(0,0,0,0.6);
                border:1px solid rgba(255,255,255,0.08);
            ">
                <div id="info-modal-icon" style="font-size:32px; margin-bottom:10px;">⏳</div>
                <h2 style="margin-bottom:10px;">Pagamento em processamento</h2>
                <p style="color:rgba(255,255,255,0.7); margin-bottom:20px;">
                    ${message}
                </p>
                <button id="info-modal-close-btn" style="
                    background:#EBB43B;
                    color:#000;
                    border:none;
                    padding:12px 20px;
                    border-radius:10px;
                    cursor:pointer;
                    font-weight:600;
                ">
                    Entendido
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('info-modal-close-btn').onclick = () => {
        modal.remove();
    };
}

function openPaymentErrorModal(message) {
    const existing = document.getElementById('payment-error-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'payment-error-modal';

    modal.innerHTML = `
        <div style="
            position:fixed;
            inset:0;
            background:rgba(0,0,0,0.75);
            display:flex;
            align-items:center;
            justify-content:center;
            z-index:9999;
        ">
            <div style="
                background:#141414;
                padding:30px;
                border-radius:16px;
                width:90%;
                max-width:420px;
                text-align:center;
                box-shadow:0 20px 60px rgba(0,0,0,0.6);
                border:1px solid rgba(255,255,255,0.08);
            ">
                <div style="font-size:32px; margin-bottom:10px;">❌</div>
                <h2 style="margin-bottom:10px;">Pagamento não aprovado</h2>
                <p style="color:rgba(255,255,255,0.7); margin-bottom:20px;">
                    ${message}
                </p>
                <button id="retry-payment-btn" style="
                    background:#EBB43B;
                    color:#000;
                    border:none;
                    padding:12px 20px;
                    border-radius:10px;
                    cursor:pointer;
                    font-weight:600;
                ">
                    Tentar novamente
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('retry-payment-btn').onclick = () => {
        modal.remove();
    };
}
