/* ─────────────────────────────────────────────────────────
   cart.js  –  Sistema de Carrinho Profissional · Tocha Padaria
───────────────────────────────────────────────────────── */

/* ── State ── */
let cart = JSON.parse(localStorage.getItem('tocha-cart') || '[]');
let coupon = null;
let autoCloseTimer = null;
let globalStatus = null;
let currentPaymentMethod = 'stripe';
let pixPollingInterval = null;

async function fetchStoreStatus() {
    try {
        const r = await fetch('/api/store-status');
        if (r.ok) {
            globalStatus = await r.json();
            render(); 
        }
    } catch (e) { console.error(e); }
}

/* ── DOM refs ── */
let drawer, overlay, emptyState, itemsList, cartFooter, countLabel;
let idModal, idOverlay, idForm;

function initDOMRefs() {
    drawer     = document.getElementById('cartDrawer');
    overlay    = document.getElementById('cartOverlay');
    emptyState = document.querySelector('.empty-cart');
    itemsList  = document.getElementById('cartItemsList');
    cartFooter = document.querySelector('.cart-footer');
    countLabel = document.querySelector('.cart-header h2 span');
    
    idModal    = document.getElementById('identificacao-modal');
    idOverlay  = document.getElementById('identificacao-overlay');
    idForm     = document.getElementById('id-form');
}

/* ── Persistence ── */
let sessionId = localStorage.getItem('tocha-session-id');
if (!sessionId) {
    sessionId = 'sess-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    localStorage.setItem('tocha-session-id', sessionId);
}

async function syncCartWithBackend() {
    const customer = JSON.parse(localStorage.getItem('tocha-customer') || 'null');
    try {
        await fetch('/api/cart/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sessionId, 
                customer, 
                cart,
                totalAmount: subtotal() - discountAmount(subtotal())
            })
        });
    } catch (e) { console.warn('[Abandono] Erro na sincronização:', e); }
}

const fmt = v => 'R$ ' + v.toFixed(2).replace('.', ',');

function save() {
    localStorage.setItem('tocha-cart', JSON.stringify(cart));
    if (cart.length > 0) syncCartWithBackend();
}

function totalItems() {
    return cart.reduce((s, i) => s + i.qty, 0);
}

function subtotal() {
    return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function discountAmount(sub) {
    if (!coupon) return 0;
    if (coupon.type === 'percent') return sub * (coupon.value / 100);
    return Math.min(coupon.value, sub);
}

/* ── Inject Elements ── */
function injectAllCartElements() {
    // 1. Drawer & Overlay
    if (!document.getElementById('cartDrawer')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="cartOverlay" class="cart-overlay"></div>
            <aside id="cartDrawer" class="cart-drawer">
                <div class="cart-header">
                    <h2>Meu Pedido <span>(0 itens)</span></h2>
                    <button id="closeCart">✕</button>
                </div>

                <div class="cart-content">
                    <div class="empty-cart">
                        <p>Nenhum item ainda.</p>
                        <span>Explore nossos pães e doces!</span>
                        <button id="verProdutosBtn">VER PRODUTOS</button>
                    </div>
                    <div id="cartItemsList"></div>
                </div>

                <div class="cart-footer" hidden>
                    <div class="cupom">
                        <input id="couponInput" placeholder="CUPOM DE DESCONTO">
                        <button id="applyCouponBtn">Aplicar</button>
                    </div>
                    <p id="couponMsg" style="font-size: 0.75rem; margin-top: -15px; margin-bottom: 15px;"></p>

                    <div class="totais">
                        <div><span>Subtotal</span><span id="subtotalLabel">R$ 0,00</span></div>
                        <div id="discountRow" hidden><span>Desconto</span><span class="green" id="discountLabel">— R$ 0,00</span></div>
                        <div class="total"><span>Total</span><span id="totalLabel">R$ 0,00</span></div>
                    </div>

                    <button class="btn-primary" id="finalizarBtn">FINALIZAR PEDIDO</button>
                    <button class="btn-secondary" id="continuarComprandoBtn">CONTINUAR COMPRANDO</button>
                    <a class="clear-cart" onclick="clearCart()">Esvaziar carrinho</a>
                </div>
            </aside>
        `);
    }

    // 2. Modais (Sucesso e Identificacao)
    if (!document.getElementById('modalSuccess')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="modalSuccess" class="modal">
                <div class="modal-box">
                    <div class="success-check">✓</div>
                    <h2>PEDIDO CONFIRMADO!</h2>
                    <p>Seu pagamento foi aprovado. Avisaremos pelo WhatsApp assim que seu pedido ficar pronto para retirada.</p>

                    <div id="success-resumo" class="resumo-entrega">
                        <!-- Preenchido via JS -->
                    </div>

                    <button id="successContinueBtn">CONTINUAR</button>
                </div>
            </div>
        `);
    }

    if (!document.getElementById('identificacao-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="identificacao-overlay" class="identificacao-overlay"></div>
            <div id="identificacao-modal" class="id-modal" role="dialog" aria-modal="true">
                <div class="id-modal-body">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem; font-family: 'Anton', sans-serif; color: var(--accent);">IDENTIFICAÇÃO</h2>
                        <p style="color: #888; line-height: 1.6; font-size: 0.9rem; margin: 0;">Precisamos de alguns dados para processar seu pedido.</p>
                    </div>
                    <form id="id-form">
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; font-size: 0.8rem; color: #888; margin-bottom: 8px;">WhatsApp (com DDD)</label>
                            <input type="tel" id="id-whatsapp" required placeholder="Ex: 21999999999" style="width: 100%; padding: 12px; background: #1a1a1a; border: 1px solid #333; color: #fff;">
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; font-size: 0.8rem; color: #888; margin-bottom: 8px;">Nome Completo</label>
                            <input type="text" id="id-name" required placeholder="Seu nome" style="width: 100%; padding: 12px; background: #1a1a1a; border: 1px solid #333; color: #fff;">
                        </div>
                        <div style="margin-bottom: 2rem;">
                            <label style="display: block; font-size: 0.8rem; color: #888; margin-bottom: 8px;">E-mail</label>
                            <input type="email" id="id-email" required placeholder="seu@email.com" style="width: 100%; padding: 12px; background: #1a1a1a; border: 1px solid #333; color: #fff;">
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-bottom: 2rem;">
                             <button type="button" class="btn-payment-method active" data-method="stripe" style="flex:1;">Cartão/Stripe</button>
                             <button type="button" class="btn-payment-method" data-method="pix" style="flex:1;">Pix</button>
                        </div>

                        <button type="submit" class="btn-primary" id="id-submit-btn" style="border-radius: 8px;">SEGUIR PARA PAGAMENTO</button>
                    </form>
                    <button onclick="closeIdModal()" style="background:none; border:none; color:#555; width:100%; margin-top:10px; cursor:pointer;">Cancelar</button>
                </div>
            </div>

            <div id="pix-overlay" class="identificacao-overlay"></div>
            <div id="pix-modal" class="id-modal" style="text-align: center;">
                 <div class="id-modal-body">
                    <h2 style="font-family:'Anton'; color:var(--accent);">PAGAMENTO PIX</h2>
                    <div class="pix-qr-container">
                        <img id="pix-qr-img" src="" alt="QR Code Pix">
                    </div>
                    <p style="font-size:0.8rem; color:#888;">Copie o código abaixo para pagar no seu banco:</p>
                    <div class="pix-code-area">
                        <input id="pix-code-input" readonly>
                        <button id="btn-copy-pix" style="background:var(--accent); border:none; padding:10px;">Copiar</button>
                    </div>
                    <p id="pix-status-text" style="margin-top:20px; font-weight:700;">Aguardando pagamento...</p>
                    <button id="pix-cancel-btn" style="margin-top:20px; background:none; border:1px solid #333; color:#fff; padding:10px 20px;">Cancelar</button>
                 </div>
            </div>
        `);
    }

    initDOMRefs();
}

/* ── Render ── */
function render() {
    const total_items = totalItems();
    if (!drawer) initDOMRefs();

    // Update labels
    if (countLabel) countLabel.textContent = `(${total_items} ${total_items === 1 ? 'item' : 'itens'})`;
    
    const badge = document.getElementById('cart-badge');
    if (badge) {
        badge.textContent = total_items;
        badge.hidden = total_items === 0;
    }

    if (total_items === 0) {
        if (emptyState) emptyState.hidden = false;
        if (itemsList)  itemsList.innerHTML = '';
        if (cartFooter) cartFooter.hidden = true;
        save();
        return;
    }

    if (emptyState) emptyState.hidden = true;
    if (cartFooter) cartFooter.hidden = false;

    // Render Items
    let batchHtml = '';
    if (globalStatus) {
        const isNext = globalStatus.statusMode === 'next_batch';
        batchHtml = `
            <div style="background: rgba(212,166,74,0.1); border-left: 3px solid var(--accent); padding: 15px; margin-bottom: 20px; font-size: 0.85rem;">
                <p style="margin:0; font-weight:700; color:var(--accent); text-transform:uppercase; margin-bottom:5px;">
                    ${isNext ? 'PRÉ-VENDA ATIVA' : 'FORNADA ATUAL'}
                </p>
                <p style="margin:0; color:#ccc;">Preparação para: <strong>${globalStatus.batchLabel}</strong></p>
            </div>
        `;
    }

    itemsList.innerHTML = batchHtml + cart.map(item => `
        <div class="cart-item">
            <div class="item-main">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <span class="price-un">${fmt(item.price)} / un</span>
                </div>
                <div class="item-price">${fmt(item.price * item.qty)}</div>
            </div>
            <div class="item-footer">
                <div class="cart-actions">
                    <button onclick="changeQty('${item.id}', -1)">−</button>
                    <span>${item.qty}</span>
                    <button onclick="changeQty('${item.id}', 1)">+</button>
                </div>
                <button class="remove-item" onclick="removeItem('${item.id}')">🗑 Remover</button>
            </div>
        </div>
    `).join('');

    // Totais
    const sub   = subtotal();
    const disc  = discountAmount(sub);
    const total = sub - disc;

    document.getElementById('subtotalLabel').textContent = fmt(sub);
    document.getElementById('totalLabel').textContent    = fmt(total);

    const discRow = document.getElementById('discountRow');
    if (disc > 0) {
        discRow.hidden = false;
        document.getElementById('discountLabel').textContent = '− ' + fmt(disc);
    } else {
        discRow.hidden = true;
    }

    save();
}

/* ── Actions ── */
window.changeQty = function(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    if (delta > 0 && item.qty >= (item.disponivel_agora ?? 999)) {
        alert('Limite de estoque atingido.');
        return;
    }

    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    render();
};

window.removeItem = function(id) {
    cart = cart.filter(i => i.id !== id);
    render();
};

window.clearCart = function() {
    cart = [];
    coupon = null;
    render();
    closeCart();
};

window.addToCart = function(id, name, price, qty = 1, disponivel = 999) {
    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ id, name, price, qty, disponivel_agora: disponivel });
    }
    render();
    openCart();
};

/* ── UI Toggle ── */
window.toggleCart = function() {
    drawer.classList.toggle('open');
    overlay.classList.toggle('active');
    document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
};

window.openCart = function() {
    if (!drawer) initDOMRefs();
    drawer.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeCart = function() {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
};

/* ── Checkout Flow ── */
async function processCheckout(e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('id-submit-btn');
    const customer = {
        name:     document.getElementById('id-name').value.trim(),
        email:    document.getElementById('id-email').value.trim(),
        whatsapp: document.getElementById('id-whatsapp').value.trim()
    };

    localStorage.setItem('tocha-customer', JSON.stringify(customer));
    if (btn) { btn.disabled = true; btn.textContent = 'PROCESSANDO...'; }

    const sub = subtotal();
    const total = sub - discountAmount(sub);

    // Pix
    if (currentPaymentMethod === 'pix') {
        try {
            const resp = await fetch('/api/create-pix-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customer, cart, totalAmount: total })
            });
            const data = await resp.json();
            showPixModal(data);
        } catch (err) { alert('Erro ao gerar Pix.'); btn.disabled = false; btn.textContent = 'TENTAR NOVAMENTE'; }
        return;
    }

    // Stripe
    try {
        const resp = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, customer, cart, totalAmount: total })
        });
        const data = await resp.json();
        if (data.url) window.location.href = data.url;
    } catch (err) { alert('Erro ao iniciar pagamento.'); btn.disabled = false; btn.textContent = 'TENTAR NOVAMENTE'; }
}

/* ── Modal Sucesso ── */
function showSuccessModal() {
    const modal = document.getElementById('modalSuccess');
    if (!modal) return;

    modal.classList.add('active');
    const resumo = document.getElementById('success-resumo');
    if (resumo && globalStatus) {
        resumo.innerHTML = `
            <h3>RESUMO DA ENTREGA</h3>
            <div class="resumo-row"><span>Ciclo do Pedido</span><span>${globalStatus.cycleType || 'Fornada Atual'}</span></div>
            <div class="resumo-row"><span>Data Prevista</span><span>${globalStatus.batchLabel}</span></div>
        `;
    }
}

window.fecharModal = function() {
    const m = document.getElementById('modalSuccess');
    if (m) m.classList.remove('active');
};

/* ── Pix Helpers ── */
function showPixModal(data) {
    closeIdModal();
    const modal = document.getElementById('pix-modal');
    const overlay = document.getElementById('pix-overlay');
    document.getElementById('pix-qr-img').src = data.qr_code_base64;
    document.getElementById('pix-code-input').value = data.qr_code;
    modal.classList.add('open');
    overlay.classList.add('visible');
    
    startPixPolling(data.payment_id);
}

function startPixPolling(paymentId) {
    if (pixPollingInterval) clearInterval(pixPollingInterval);
    pixPollingInterval = setInterval(async () => {
        const r = await fetch(`/api/check-payment/${paymentId}`);
        const d = await r.json();
        if (d.status === 'approved') {
            clearInterval(pixPollingInterval);
            cart = []; save(); render();
            document.getElementById('pix-modal').classList.remove('open');
            document.getElementById('pix-overlay').classList.remove('visible');
            showSuccessModal();
        }
    }, 3000);
}

/* ── Identification ── */
function openIdModal() {
    closeCart();
    document.getElementById('identificacao-modal').classList.add('open');
    document.getElementById('identificacao-overlay').classList.add('visible');
}
function closeIdModal() {
    document.getElementById('identificacao-modal').classList.remove('open');
    document.getElementById('identificacao-overlay').classList.remove('visible');
}

/* ── Dom Events ── */
document.addEventListener('DOMContentLoaded', () => {
    injectAllCartElements();
    render();
    fetchStoreStatus();

    // Toggle events
    document.getElementById('closeCart').addEventListener('click', closeCart);
    document.getElementById('cartOverlay').addEventListener('click', closeCart);
    document.getElementById('verProdutosBtn').addEventListener('click', closeCart);
    document.getElementById('continuarComprandoBtn').addEventListener('click', closeCart);
    
    const cartIcon = document.getElementById('cartIcon') || document.getElementById('cart-toggle');
    if (cartIcon) cartIcon.addEventListener('click', toggleCart);

    // Checkout
    document.getElementById('finalizarBtn').addEventListener('click', openIdModal);
    document.getElementById('id-form').addEventListener('submit', processCheckout);
    document.getElementById('successContinueBtn').addEventListener('click', fecharModal);

    // Payment methods
    document.querySelectorAll('.btn-payment-method').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-payment-method').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPaymentMethod = btn.dataset.method;
        });
    });

    // Check success from URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'success') {
        cart = []; save(); render();
        showSuccessModal();
        window.history.replaceState({}, '', window.location.pathname);
    }
});
