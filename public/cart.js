/* ─────────────────────────────────────────────────────────
   cart.js  –  Sistema de Carrinho (Contexto Global & Checkout)
───────────────────────────────────────────────────────── */

const OWNER_PHONE = '5521966278965';

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* ── State & Persistence ── */
let cart = JSON.parse(localStorage.getItem('tocha-cart') || '[]');
let coupon = null;
let globalStatus = null;

function save() {
    localStorage.setItem('tocha-cart', JSON.stringify(cart));
    render();
}

/* ── Global Cart Context ── */
window.addToCart = function(product, qty = 1) {
    const wasEmpty = cart.length === 0;
    const productId = String(product.id);
    const existing = cart.find(i => String(i.id) === productId);

    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image_url || product.image,
            qty: qty
        });
    }
    save();
    window.openCart();

    // Abre modal de captura apenas na primeira adição de item da sessão
    if (wasEmpty && !sessionStorage.getItem('tocha-capture-shown')) {
        const alreadyHasData = (() => {
            try {
                const stored = JSON.parse(localStorage.getItem('tocha-customer') || 'null');
                return !!(stored?.name && stored?.whatsapp);
            } catch (_) { return false; }
        })();
        if (!alreadyHasData) {
            sessionStorage.setItem('tocha-capture-shown', '1');
            setTimeout(openCaptureModal, 700);
        }
    }
};

window.increase = function(id) {
    const item = cart.find(i => String(i.id) === String(id));
    if (item) { item.qty++; save(); }
};

window.decrease = function(id) {
    const item = cart.find(i => String(i.id) === String(id));
    if (item) {
        item.qty--;
        if (item.qty <= 0) window.removeItem(id);
        else save();
    }
};

window.removeItem = function(id) {
    cart = cart.filter(i => String(i.id) !== String(id));
    save();
};

window.clearCart = function() {
    cart = [];
    save();
    window.closeCart();
};

/* ── UI Logic ── */
const fmt = v => 'R$ ' + v.toFixed(2).replace('.', ',');

function subtotal() {
    return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function discountAmount(sub) {
    if (!coupon) return 0;
    if (coupon.type === 'percent') return sub * (coupon.value / 100);
    return Math.min(coupon.value, sub);
}

/* ── Render ── */
function render() {
    const itemsList  = document.getElementById('cartItemsList');
    const cartFooter = document.getElementById('cartFooter');
    const emptyState = document.getElementById('cartEmptyState');
    const countLabel = document.getElementById('cartCountLabel');
    const total_items = cart.reduce((s, i) => s + i.qty, 0);

    if (countLabel) countLabel.textContent = `(${total_items} ${total_items === 1 ? 'item' : 'itens'})`;

    const badge = document.getElementById('cart-badge');
    if (badge) {
        badge.textContent = total_items;
        badge.hidden = total_items === 0;
    }

    if (total_items === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (itemsList)  itemsList.innerHTML = '';
        if (cartFooter) cartFooter.hidden = true;
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (cartFooter) cartFooter.hidden = false;

    if (!itemsList) return;
    itemsList.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="ci-left">
                <h4>${escapeHtml(item.name)}</h4>
                <span class="unit-price">${fmt(item.price)} / un</span>
            </div>
            <div class="ci-right">
                <div class="ci-price-total">${fmt(item.price * item.qty)}</div>
                <div class="ci-controls-wrapper">
                    <div class="ci-controls">
                        <button onclick="decrease('${escapeHtml(item.id)}')">−</button>
                        <span>${item.qty}</span>
                        <button onclick="increase('${escapeHtml(item.id)}')">+</button>
                    </div>
                    <button class="ci-remove" onclick="removeItem('${escapeHtml(item.id)}')">🗑</button>
                </div>
            </div>
        </div>
    `).join('');

    const sub = subtotal();
    const disc = discountAmount(sub);
    const total = sub - disc;

    const subtotalEl = document.getElementById('subtotalLabel');
    const totalEl    = document.getElementById('totalLabel');
    if (subtotalEl) subtotalEl.textContent = fmt(sub);
    if (totalEl)    totalEl.textContent    = fmt(total);

    const discRow   = document.getElementById('discountRow');
    const discLabel = document.getElementById('discountLabel');
    if (discRow) {
        if (disc > 0) {
            discRow.hidden = false;
            if (discLabel) discLabel.textContent = '− ' + fmt(disc);
        } else {
            discRow.hidden = true;
        }
    }
}

/* ── Checkout Modal Logic ── */
function fillCustomerForm(c) {
    const nameEl = document.getElementById('id-name');
    const emailEl = document.getElementById('id-email');
    const whatsappEl = document.getElementById('id-whatsapp');
    if (nameEl && !nameEl.value && c.name) nameEl.value = c.name;
    if (emailEl && !emailEl.value && c.email) emailEl.value = c.email;
    if (whatsappEl && !whatsappEl.value && c.whatsapp) whatsappEl.value = c.whatsapp;
}

function tryAutoSaveCustomer() {
    const name = document.getElementById('id-name')?.value.trim();
    const email = document.getElementById('id-email')?.value.trim();
    const whatsapp = document.getElementById('id-whatsapp')?.value.trim();
    if (!name || !email || !whatsapp) return;
    fetch('/api/customer/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, whatsapp })
    }).catch(() => {});
}

/* ── Modal de Captura Antecipada ── */
let _captureDebounce = null;

function openCaptureModal() {
    const modal = document.getElementById('captureModal');
    if (!modal) return;
    modal.style.display = 'flex';

    // Pré-preenche se houver dados parciais no localStorage
    try {
        const stored = JSON.parse(localStorage.getItem('tocha-customer') || 'null');
        if (stored?.name) {
            const nameEl = document.getElementById('capture-name');
            if (nameEl && !nameEl.value) nameEl.value = stored.name;
        }
        if (stored?.whatsapp) {
            const waEl = document.getElementById('capture-whatsapp');
            if (waEl && !waEl.value) waEl.value = stored.whatsapp;
        }
    } catch (_) {}
}

window.closeCaptureModal = function() {
    const modal = document.getElementById('captureModal');
    if (modal) modal.style.display = 'none';
};

window.saveCaptureModal = function() {
    const name = document.getElementById('capture-name')?.value.trim();
    const whatsapp = document.getElementById('capture-whatsapp')?.value.trim();
    if (!name && !whatsapp) { window.closeCaptureModal(); return; }

    const existing = (() => {
        try { return JSON.parse(localStorage.getItem('tocha-customer') || '{}'); } catch (_) { return {}; }
    })();
    const updated = { ...existing };
    if (name) updated.name = name;
    if (whatsapp) updated.whatsapp = whatsapp;
    localStorage.setItem('tocha-customer', JSON.stringify(updated));
    console.log('[CAPTURE OK] modal captura salvo localStorage');

    window.closeCaptureModal();
    // Tenta preencher campos do checkout caso já esteja aberto
    if (document.getElementById('checkoutModal')?.style.display === 'flex') {
        fillCustomerForm(updated);
    }
};

function onCaptureInput() {
    clearTimeout(_captureDebounce);
    _captureDebounce = setTimeout(() => {
        const name = document.getElementById('capture-name')?.value.trim();
        const whatsapp = document.getElementById('capture-whatsapp')?.value.trim();
        if (!name && !whatsapp) return;
        const existing = (() => {
            try { return JSON.parse(localStorage.getItem('tocha-customer') || '{}'); } catch (_) { return {}; }
        })();
        const updated = { ...existing };
        if (name) updated.name = name;
        if (whatsapp) updated.whatsapp = whatsapp;
        localStorage.setItem('tocha-customer', JSON.stringify(updated));
        console.log('[AUTO SAVE OK] capture debounce localStorage');
    }, 500);
}

function injectCaptureModal() {
    if (document.getElementById('captureModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
        <div id="captureModal" style="display:none;position:fixed;inset:0;z-index:10002;align-items:center;justify-content:center;display:none;">
            <div onclick="closeCaptureModal()" style="position:absolute;inset:0;background:rgba(0,0,0,0.72);"></div>
            <div style="position:relative;background:#141414;padding:28px 24px;border-radius:20px;width:90%;max-width:380px;border:1px solid rgba(255,255,255,0.08);z-index:1;">
                <button onclick="closeCaptureModal()" style="position:absolute;top:14px;right:16px;background:transparent;border:none;color:#888;font-size:18px;cursor:pointer;line-height:1;">✕</button>
                <h3 style="font-family:'Anton',sans-serif;font-size:1.35rem;color:#EBB43B;margin:0 0 8px;text-transform:uppercase;">Oi! Uma perguntinha rápida</h3>
                <p style="color:rgba(255,255,255,0.85);margin:0 0 6px;line-height:1.5;font-size:0.93rem;">Para organizar sua fornada e facilitar seus próximos pedidos, informe seu nome e WhatsApp.</p>
                <p style="color:rgba(255,255,255,0.4);font-size:0.8rem;margin:0 0 18px;">Assim conseguimos confirmar seu pedido e agilizar seu atendimento.</p>
                <div style="margin-bottom:12px;">
                    <input id="capture-name" type="text" placeholder="Seu nome" autocomplete="given-name"
                        style="width:100%;padding:11px 13px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:#1e1e1e;color:#fff;font-size:0.93rem;box-sizing:border-box;">
                </div>
                <div style="margin-bottom:18px;">
                    <input id="capture-whatsapp" type="tel" placeholder="(00) 00000-0000" autocomplete="tel"
                        style="width:100%;padding:11px 13px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:#1e1e1e;color:#fff;font-size:0.93rem;box-sizing:border-box;">
                </div>
                <button onclick="saveCaptureModal()" style="width:100%;padding:13px;background:#EBB43B;color:#000;border:none;border-radius:10px;font-weight:700;font-size:0.93rem;cursor:pointer;">SALVAR</button>
                <button onclick="closeCaptureModal()" style="width:100%;padding:11px;background:transparent;color:rgba(255,255,255,0.35);border:none;border-radius:10px;cursor:pointer;margin-top:7px;font-size:0.83rem;">Agora não</button>
            </div>
        </div>
    `);

    // Debounce nos inputs
    ['capture-name', 'capture-whatsapp'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', onCaptureInput);
    });

    // Máscara de WhatsApp no campo de captura
    const waCapture = document.getElementById('capture-whatsapp');
    if (waCapture) {
        waCapture.addEventListener('input', (e) => {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
        });
    }
}

window.openCheckoutModal = function() {
    window.closeCart();
    const modal = document.getElementById('checkoutModal');
    const overlay = document.getElementById('checkoutOverlay');
    if (modal) modal.style.display = 'flex';
    if (overlay) overlay.classList.add('active');

    if (globalStatus && globalStatus.batchLabel) {
        const dataFornada = document.getElementById('dataFornada');
        if (dataFornada) dataFornada.textContent = globalStatus.batchLabel;
    }

    // Auto-preenchimento: tenta localStorage primeiro, depois sessão do servidor
    const stored = JSON.parse(localStorage.getItem('tocha-customer') || 'null');
    if (stored?.email) {
        fillCustomerForm(stored);
    } else {
        fetch('/api/customer/me')
            .then(r => r.ok ? r.json() : null)
            .then(c => {
                if (c?.email) {
                    fillCustomerForm(c);
                    localStorage.setItem('tocha-customer', JSON.stringify(c));
                }
            })
            .catch(() => {});
    }
}

window.closeCheckoutModal = function() {
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.style.display = 'none';
    const overlay = document.getElementById('checkoutOverlay');
    if (overlay) overlay.classList.remove('active');
};


window.syncCart = async function() {
    const cartToSync = JSON.parse(localStorage.getItem('tocha-cart') || '[]');
    const customer = JSON.parse(localStorage.getItem('tocha-customer') || 'null');
    const totalAmount = cartToSync.reduce((total, item) => total + (item.price * item.qty), 0);
    const orderId = localStorage.getItem('tocha-order-id') || null;

    if (cartToSync.length === 0) return;

    try {
        await fetch('/api/cart/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer, cart: cartToSync, totalAmount, order_id: orderId })
        });
    } catch (e) {
        console.warn("[SYNC] Falha ao sincronizar carrinho:", e.message);
    }
};

function openPaymentErrorModal(message) {
    const existing = document.getElementById('cart-error-modal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'cart-error-modal';
    modal.innerHTML = `
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:10000;">
            <div style="background:#141414;padding:30px;border-radius:16px;width:90%;max-width:400px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.08);">
                <div style="font-size:28px;margin-bottom:10px;">⚠️</div>
                <p style="color:rgba(255,255,255,0.85);margin-bottom:20px;">${escapeHtml(String(message))}</p>
                <button onclick="document.getElementById('cart-error-modal').remove()" style="background:#EBB43B;color:#000;border:none;padding:12px 24px;border-radius:10px;cursor:pointer;font-weight:600;">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

window.confirmarPedido = async function() {
    if (window.__checkoutLock) return;
    window.__checkoutLock = true;
    
    console.log('🚀 [CHECKOUT] Confirmar Pedido iniciado');
    const nameEl = document.getElementById('id-name');
    const whatsappEl = document.getElementById('id-whatsapp');
    const emailEl = document.getElementById('id-email');
    const name = nameEl ? nameEl.value.trim() : '';
    const whatsapp = whatsappEl ? whatsappEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const paymentEl = document.querySelector('input[name="payment-method"]:checked');
    const payment = paymentEl ? paymentEl.value : 'pix';
    const cartToCheckout = JSON.parse(localStorage.getItem('tocha-cart') || '[]');

    if (!name || !whatsapp || !email) {
        openPaymentErrorModal("Preencha todos os campos obrigatórios.");
        window.__checkoutLock = false;
        return;
    }

    const customer = { name, whatsapp, email };
    localStorage.setItem('tocha-customer', JSON.stringify(customer));
    fetch('/api/customer/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
    }).catch(() => {});

    const btn = document.querySelector('#checkoutModal .btn-primary');
    const originalText = btn ? btn.innerText : 'CONFIRMAR PEDIDO';

    // GERA CHAVE DE IDEMPOTÊNCIA PARA ESTA TENTATIVA
    const idempotencyKey = self.crypto.randomUUID();

    try {
        if (btn) { btn.innerText = "PROCESSANDO..."; btn.disabled = true; }

        // BUSCA CONFIGURAÇÃO ATUAL DO BACKEND (FONTE DA VERDADE)
        let settings;
        try {
            const configRes = await fetch('/api/payment-methods');
            if (!configRes.ok) throw new Error('Erro ao buscar configurações de pagamento.');
            settings = await configRes.json();
        } catch (error) {
            console.error('Erro ao buscar configurações:', error);
            // Fallback: habilita Mercado Pago por padrão se a API falhar
            settings = { card: false, pix: false, mp_card: true, mp_pix: true };
        }

        if (payment === 'mp_card') {
            if (!settings.mp_card) throw new Error('Mercado Pago cartão desabilitado');
            console.log('💳 [MP] Preparando pedido para checkout externo...');
            const res = await fetch('/api/mercadopago/prepare-card-order', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-idempotency-key': idempotencyKey
                },
                body: JSON.stringify({ customer, cart: cartToCheckout })
            });
            
            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Servidor retornou erro.' }));
                throw new Error(errData.message || errData.error || 'Erro ao preparar pedido.');
            }

            const data = await res.json();
            if (data.order_id) localStorage.setItem('tocha-order-id', String(data.order_id));
            window.location.href = `/checkout-mp.html?order_id=${data.order_id}`;
            return;
        }

        if (payment === 'pix') {
            if (!settings.mp_pix && !settings.pix) throw new Error('PIX desabilitado');
            const res = await fetch('/api/mercadopago/create-pix-payment', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-idempotency-key': idempotencyKey
                },
                body: JSON.stringify({ customer, cart: cartToCheckout })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Erro ao gerar PIX.' }));
                throw new Error(errData.message || errData.error || 'Erro ao gerar PIX.');
            }
            const data = await res.json();
            if (data.order_id) localStorage.setItem('tocha-order-id', String(data.order_id));
            localStorage.setItem('tocha-pix-data', JSON.stringify(data));
            window.location.href = "/pagamento-pix.html";
        } else {
            // Stripe
            if (settings.mp_card || !settings.card) throw new Error('Stripe desabilitado');
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-idempotency-key': idempotencyKey
                },
                body: JSON.stringify({ customer, cart: cartToCheckout })
            });
            if (!res.ok) throw new Error('Erro ao iniciar checkout Stripe.');
            const data = await res.json();

            window.location.href = data.url;
        }
    } catch (e) {
        console.error('❌ [CHECKOUT] Erro:', e.message);
        openPaymentErrorModal(e.message);
        if (btn) { btn.innerText = originalText; btn.disabled = false; }
    } finally {
        window.__checkoutLock = false;
    }
};

window.fecharModal = function() {
    const modalSuccess = document.getElementById('modalSuccess');
    if (modalSuccess) modalSuccess.style.display = 'none';
    const overlay = document.getElementById('checkoutOverlay');
    if (overlay) overlay.classList.remove('active');
};

/* ── Injections ── */
function injectCart() {
    if (document.getElementById('cartDrawer')) return;
    injectCaptureModal();

    document.body.insertAdjacentHTML('beforeend', `
        <div id="cartOverlay" class="cart-overlay"></div>
        <aside id="cartDrawer" class="cart-drawer">
            <div class="cart-header">
                <h2>Meu Pedido <span id="cartCountLabel">(0 itens)</span></h2>
                <button id="closeCart">✕</button>
            </div>

            <div class="cart-content">
                <div id="cartEmptyState" class="empty-cart">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <p>Nenhum item ainda.</p>
                    <span>Explore nossos pães e doces!</span>
                    <button id="verProdutosBtn">VER PRODUTOS</button>
                </div>
                <div id="cartItemsList"></div>
            </div>

            <div id="cartFooter" class="cart-footer" hidden>
                <div class="cupom">
                    <input id="couponInput" placeholder="CUPOM DE DESCONTO">
                    <button id="applyCouponBtn">Aplicar</button>
                </div>
                <div class="totais">
                    <div><span>Subtotal</span><span id="subtotalLabel">R$ 0,00</span></div>
                    <div id="discountRow" hidden><span>Desconto</span><span class="green" id="discountLabel">— R$ 0,00</span></div>
                    <div class="total-row"><span>Total</span><span id="totalLabel">R$ 0,00</span></div>
                </div>

                <button class="btn-primary" onclick="openCheckoutModal()">FINALIZAR PEDIDO</button>
                <button class="btn-secondary" id="continuarComprandoBtn">CONTINUAR COMPRANDO</button>
                <a class="clear-cart-link" onclick="clearCart()">Esvaziar carrinho</a>
            </div>
        </aside>

        <div id="checkoutOverlay" class="cart-overlay"></div>
        <div id="checkoutModal" class="modal" style="display:none">
            <div class="modal-box" style="text-align: left; max-width: 450px; border-radius: 20px;">
                <h2 class="modal-title">Finalizar Pedido</h2>
                <p class="form-note">* Campos obrigatórios</p>
                <p class="modal-info-text">
                    Preencha seus dados corretamente. Entraremos em contato via WhatsApp no dia da fornada (<strong id="dataFornada">Sábado, 02/05</strong>) para confirmar quando seu pedido estiver pronto para retirada.
                </p>

                <div class="form-group">
                    <label>Nome completo <span class="required">*</span></label>
                    <input id="id-name" type="text" placeholder="Ex: João Silva" class="modal-input" />
                    <div class="input-error-text"></div>
                </div>

                <div class="form-group">
                    <label>WhatsApp <span class="required">*</span></label>
                    <input id="id-whatsapp" type="tel" placeholder="(00) 00000-0000" class="modal-input" />
                    <div class="input-error-text"></div>
                </div>

                <div class="form-group">
                    <label>Email <span class="required">*</span></label>
                    <input id="id-email" type="email" placeholder="seu@email.com" class="modal-input" />
                    <div class="input-error-text"></div>
                </div>

                <div id="payment-methods-container" style="margin-bottom: 25px;">
                    <p style="color: #fff; font-weight: 600; margin-bottom: 12px; font-size: 0.9rem;">Forma de pagamento</p>
                    <label id="label-pix" style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; cursor: pointer; color: #aaa;">
                        <input type="radio" name="payment-method" value="pix" checked style="accent-color: var(--accent);"> PIX (Mercado Pago)
                    </label>
                    <label id="label-stripe" style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: #aaa;">
                        <input type="radio" name="payment-method" value="card" style="accent-color: var(--accent);"> Cartão de crédito (Stripe)
                    </label>
                    <label id="label-mp-card" style="display: none; align-items: center; gap: 10px; margin-top: 12px; cursor: pointer; color: #aaa;">
                        <input type="radio" name="payment-method" value="mp_card" style="accent-color: var(--accent);"> Cartão (Mercado Pago)
                    </label>
                </div>
                
                <button class="btn-primary" onclick="window.confirmarPedido()" style="border-radius: 10px; margin-bottom: 10px; width: 100%;">CONFIRMAR PEDIDO</button>
                <button class="modal-cancel" onclick="closeCheckoutModal()">Cancelar</button>
            </div>
        </div>

        <div id="modalSuccess" class="modal">
            <div class="modal-box" style="border-radius: 30px; text-align: center;">
                <div style="width: 80px; height: 80px; border: 2px solid var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px; color: var(--accent);">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <h2 style="font-family: 'Anton', sans-serif; font-size: 2.2rem; color: var(--accent); margin-bottom: 10px; text-transform: uppercase;">PEDIDO CONFIRMADO!</h2>
                <p style="color: #888; font-size: 0.95rem; line-height: 1.6; margin-bottom: 30px;">
                    Seu pagamento foi aprovado. Avisaremos pelo WhatsApp assim que seu pedido ficar pronto para retirada.
                </p>
                <button onclick="fecharModal()" class="btn-primary" style="border-radius: 12px; padding: 15px; width: 100%;">CONTINUAR</button>
            </div>
        </div>
    `);
}

window.openCart = function() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeCart = function() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
};

window.toggleCart = function() {
    const drawer = document.getElementById('cartDrawer');
    if (drawer && drawer.classList.contains('open')) window.closeCart();
    else window.openCart();
};

async function fetchStoreStatus() {
    try {
        const r = await fetch('/api/store-status');
        if (r.ok) {
            globalStatus = await r.json();
            render(); 
        }
    } catch (e) { console.error(e); }
}

async function applyPaymentMethodSettings() {
    try {
        const r = await fetch('/api/payment-methods');
        if (!r.ok) return;
        const s = await r.json();

        const labelPix    = document.getElementById('label-pix');
        const labelStripe = document.getElementById('label-stripe');
        const labelMPCard = document.getElementById('label-mp-card');

        // PIX: Prioriza mp_pix
        const pixEnabled = s.mp_pix !== undefined ? s.mp_pix : s.pix;
        if (labelPix) labelPix.style.display = (pixEnabled !== false) ? 'flex' : 'none';

        // LÓGICA DE CARTÃO (Mercado Pago vs Stripe)
        if (s.mp_card === true) {
            // Se MP Card ativo, mostra MP e ESCONDE Stripe obrigatoriamente
            if (labelMPCard) labelMPCard.style.display = 'flex';
            if (labelStripe) labelStripe.style.display = 'none';
        } else if (s.card === true) {
            // Se MP inativo e Stripe ativo, mostra Stripe
            if (labelMPCard) labelMPCard.style.display = 'none';
            if (labelStripe) labelStripe.style.display = 'flex';
        } else {
            // Ambos inativos
            if (labelMPCard) labelMPCard.style.display = 'none';
            if (labelStripe) labelStripe.style.display = 'none';
        }

        // Auto-seleção da primeira opção visível
        const visibleOptions = Array.from(document.querySelectorAll('input[name="payment-method"]'))
            .filter(opt => opt.closest('label')?.style.display !== 'none');
        
        if (visibleOptions.length > 0) {
            document.querySelectorAll('input[name="payment-method"]').forEach(opt => opt.checked = false);
            visibleOptions[0].checked = true;
        }
    } catch(e) {
        console.warn("[PAYMENT] Erro ao aplicar configurações:", e.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    injectCart();
    render();
    fetchStoreStatus();

    // ── REIDRATAÇÃO: token de recovery na URL ──────────────────────────
    const _params = new URLSearchParams(window.location.search);
    const _recoveryToken = _params.get('token');
    if (_recoveryToken) {
        fetch(`/api/recover/${encodeURIComponent(_recoveryToken)}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.cart?.length > 0 && cart.length === 0) {
                    cart = data.cart;
                    save();
                    console.log('[CAPTURE OK] carrinho reidratado via recovery token');
                    if (data.customer) {
                        const existing = (() => { try { return JSON.parse(localStorage.getItem('tocha-customer') || '{}'); } catch (_) { return {}; } })();
                        localStorage.setItem('tocha-customer', JSON.stringify({ ...existing, ...data.customer }));
                        console.log('[CAPTURE OK] cliente reidratado via recovery token');
                    }
                    window.history.replaceState({}, '', window.location.pathname);
                    setTimeout(window.openCart, 400);
                }
            })
            .catch(() => {});
    }

    // ── REIDRATAÇÃO: cliente via sessão do servidor (se localStorage vazio) ──
    if (!localStorage.getItem('tocha-customer')) {
        fetch('/api/customer/me')
            .then(r => r.ok ? r.json() : null)
            .then(c => {
                if (c?.email) {
                    localStorage.setItem('tocha-customer', JSON.stringify(c));
                    console.log('[CAPTURE OK] cliente reidratado via /api/customer/me');
                }
            })
            .catch(() => {});
    }

    // Sincronização periódica para Abandono
    window.syncCart();
    setInterval(() => window.syncCart(), 30000);

    // Detectar sucesso de pagamento (Stripe ou Mercado Pago cartão)
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'success') {
        const mpPaymentId = params.get('payment_id');
        const stripeSessionId = params.get('session_id');

        const mostrarConfirmacao = () => {
            cart = [];
            localStorage.removeItem('tocha-order-id');
            save();
            const ms = document.getElementById('modalSuccess');
            const co = document.getElementById('checkoutOverlay');
            if (ms) ms.style.display = 'flex';
            if (co) co.classList.add('active');
            window.history.replaceState({}, '', window.location.pathname);
        };

        // Fallback Stripe: confirma caso o webhook não tenha chegado
        if (stripeSessionId) {
            fetch('/api/confirm-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: stripeSessionId })
            }).catch(e => console.warn('[CONFIRM] Fallback confirm-session falhou:', e.message));
        }

        if (mpPaymentId) {
            // MP cartão: verificar status real e vínculo com o pedido antes de exibir confirmação
            const mpOrderId = params.get('order_id');
            fetch(`/api/mercadopago/check-payment/${mpPaymentId}?order_id=${mpOrderId}`)
                .then(r => r.json())
                .then(d => {
                    if (!d.valid) {
                        console.warn('[MP BLOCK MODAL]', d);
                        window.history.replaceState({}, '', window.location.pathname);
                        return;
                    }
                    mostrarConfirmacao();
                })
                .catch(e => {
                    console.warn('[MP BLOCK] Falha ao verificar status do pagamento:', e.message);
                    window.history.replaceState({}, '', window.location.pathname);
                });
        } else {
            // Stripe ou outro método sem payment_id: comportamento original
            mostrarConfirmacao();
        }
    }

    applyPaymentMethodSettings();

    const closeBtn = document.getElementById('closeCart');
    if (closeBtn) closeBtn.addEventListener('click', window.closeCart);
    
    const overlay = document.getElementById('cartOverlay');
    if (overlay) overlay.addEventListener('click', window.closeCart);
    
    const verProdutosBtn = document.getElementById('verProdutosBtn');
    if (verProdutosBtn) verProdutosBtn.addEventListener('click', window.closeCart);
    
    const continuarBtn = document.getElementById('continuarComprandoBtn');
    if (continuarBtn) continuarBtn.addEventListener('click', window.closeCart);
    
    const cartIcon = document.getElementById('cartIcon') || document.getElementById('cart-toggle');
    if (cartIcon) {
        cartIcon.addEventListener('click', window.toggleCart);
    } else {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="floatingCart" onclick="window.toggleCart()" style="position:fixed; bottom:30px; right:30px; background:var(--accent); color:#000; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 10px 30px rgba(0,0,0,0.5); z-index:9999;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span id="cart-badge-float" style="position:absolute; top:0; right:0; background:#000; color:#fff; font-size:10px; padding:2px 6px; border-radius:10px; font-weight:700;">0</span>
            </div>
        `);
        const originalRender = render;
        render = function() {
            originalRender();
            const badgeFloat = document.getElementById('cart-badge-float');
            if (badgeFloat) {
                const total = cart.reduce((s, i) => s + i.qty, 0);
                badgeFloat.textContent = total;
                badgeFloat.parentElement.style.display = total === 0 ? 'none' : 'flex';
            }
        };
        render();
    }

    // Salvar cliente no blur quando todos os 3 campos estiverem preenchidos
    ['id-name', 'id-email', 'id-whatsapp'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('blur', tryAutoSaveCustomer);
    });

    // Mascara de WhatsApp (id correto do modal: id-whatsapp)
    const whatsappInput = document.getElementById('id-whatsapp');
    if (whatsappInput) {
        whatsappInput.addEventListener('input', (e) => {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
        });
    }
});
