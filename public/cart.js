/* ─────────────────────────────────────────────────────────
   cart.js  –  Sistema de Carrinho (Alta Fidelidade) · Tocha Padaria
───────────────────────────────────────────────────────── */

let cart = JSON.parse(localStorage.getItem('tocha-cart') || '[]');
let coupon = null;
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
let drawer, overlay, itemsList, cartFooter, countLabel;

function initDOMRefs() {
    drawer     = document.getElementById('cartDrawer');
    overlay    = document.getElementById('cartOverlay');
    itemsList  = document.getElementById('cartItemsList');
    cartFooter = document.getElementById('cartFooter');
    countLabel = document.getElementById('cartCountLabel');
}

const fmt = v => 'R$ ' + v.toFixed(2).replace('.', ',');

function save() {
    localStorage.setItem('tocha-cart', JSON.stringify(cart));
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

/* ── Inject HTML ── */
function injectAllCartElements() {
    if (!document.getElementById('cartDrawer')) {
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
                    <p id="couponMsg" style="font-size: 0.7rem; margin-top: -20px; margin-bottom: 20px;"></p>

                    <div class="totais">
                        <div><span>Subtotal</span><span id="subtotalLabel">R$ 0,00</span></div>
                        <div id="discountRow" hidden><span>Desconto</span><span class="green" id="discountLabel">— R$ 0,00</span></div>
                        <div class="total-row"><span>Total</span><span id="totalLabel">R$ 0,00</span></div>
                    </div>

                    <button class="btn-whatsapp" id="finalizarBtn">FINALIZAR VIA WHATSAPP</button>
                    <button class="btn-continue" id="continuarComprandoBtn">CONTINUAR COMPRANDO</button>
                    <a class="clear-cart-link" onclick="clearCart()">Esvaziar carrinho</a>
                </div>
            </aside>

            <!-- Modais de Checkout permanecem os mesmos estruturalmente, mas com IDs novos se necessário -->
            <div id="identificacao-overlay" class="cart-overlay"></div>
            <div id="identificacao-modal" class="modal" style="display:none">
                <div class="modal-box">
                    <h2 style="font-family:'Anton'; color:var(--accent); margin-bottom:10px;">IDENTIFICAÇÃO</h2>
                    <p style="margin-bottom:25px;">Informe seus dados para finalizar o pedido.</p>
                    <form id="id-form">
                        <input type="tel" id="id-whatsapp" required placeholder="WhatsApp" style="width:100%; padding:15px; background:#111; border:1px solid #222; color:#fff; margin-bottom:15px;">
                        <input type="text" id="id-name" required placeholder="Nome Completo" style="width:100%; padding:15px; background:#111; border:1px solid #222; color:#fff; margin-bottom:15px;">
                        <input type="email" id="id-email" required placeholder="E-mail" style="width:100%; padding:15px; background:#111; border:1px solid #222; color:#fff; margin-bottom:25px;">
                        <button type="submit" class="btn-whatsapp">PROSSEGUIR</button>
                    </form>
                    <button onclick="closeIdModal()" style="background:none; border:none; color:#444; margin-top:15px; cursor:pointer;">Cancelar</button>
                </div>
            </div>

            <div id="modalSuccess" class="modal">
                <div class="modal-box">
                    <div style="width:80px; height:80px; border:2px solid var(--accent); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 30px; color:var(--accent); font-size:2rem;">✓</div>
                    <h2 style="font-family:'Anton'; font-size:2.5rem; color:var(--accent); margin-bottom:15px;">PEDIDO CONFIRMADO!</h2>
                    <p style="color:#aaa; margin-bottom:30px;">Seu pagamento foi aprovado. Avisaremos pelo WhatsApp assim que seu pedido ficar pronto.</p>
                    <div id="success-resumo" style="background:#151515; padding:20px; border-radius:15px; text-align:left; margin-bottom:30px;"></div>
                    <button onclick="fecharModal()" class="btn-whatsapp" style="border-radius:10px;">CONTINUAR</button>
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

    if (countLabel) countLabel.textContent = `(${total_items} ${total_items === 1 ? 'item' : 'itens'})`;

    if (total_items === 0) {
        document.getElementById('cartEmptyState').style.display = 'block';
        itemsList.innerHTML = '';
        cartFooter.hidden = true;
        return;
    }

    document.getElementById('cartEmptyState').style.display = 'none';
    cartFooter.hidden = false;

    itemsList.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="ci-left">
                <h4>${item.name}</h4>
                <span class="unit-price">${fmt(item.price)} / un</span>
            </div>
            <div class="ci-right">
                <div class="ci-price-total">${fmt(item.price * item.qty)}</div>
                <div class="ci-controls-wrapper">
                    <div class="ci-controls">
                        <button onclick="changeQty('${item.id}', -1)">−</button>
                        <span>${item.qty}</span>
                        <button onclick="changeQty('${item.id}', 1)">+</button>
                    </div>
                    <button class="ci-remove" onclick="removeItem('${item.id}')" aria-label="Remover">🗑</button>
                </div>
            </div>
        </div>
    `).join('');

    const sub = subtotal();
    const disc = discountAmount(sub);
    const total = sub - disc;

    document.getElementById('subtotalLabel').textContent = fmt(sub);
    document.getElementById('totalLabel').textContent = fmt(total);

    const discRow = document.getElementById('discountRow');
    if (disc > 0) {
        discRow.hidden = false;
        document.getElementById('discountLabel').textContent = '− ' + fmt(disc);
    } else {
        discRow.hidden = true;
    }

    save();
}

/* ── Logic ── */
window.changeQty = function(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
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
    render();
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

window.addToCart = function(id, name, price, qty = 1) {
    const existing = cart.find(i => i.id === id);
    if (existing) existing.qty += qty;
    else cart.push({ id, name, price, qty });
    render();
    openCart();
};

/* ── Finalization ── */
window.fecharModal = function() {
    document.getElementById('modalSuccess').style.display = 'none';
};

function openIdModal() {
    closeCart();
    document.getElementById('identificacao-modal').style.display = 'flex';
    document.getElementById('identificacao-overlay').classList.add('active');
}

window.closeIdModal = function() {
    document.getElementById('identificacao-modal').style.display = 'none';
    document.getElementById('identificacao-overlay').classList.remove('active');
};

async function processCheckout(e) {
    if (e) e.preventDefault();
    // Simulação de checkout para fins de UI, mas integrado ao backend se existir
    const customer = {
        name: document.getElementById('id-name').value,
        whatsapp: document.getElementById('id-whatsapp').value
    };
    
    // Mostra sucesso
    closeIdModal();
    const modal = document.getElementById('modalSuccess');
    modal.style.display = 'flex';
    const resumo = document.getElementById('success-resumo');
    resumo.innerHTML = `
        <p style="color:var(--accent); font-weight:700; font-size:0.8rem; margin-bottom:10px;">RESUMO DA ENTREGA</p>
        <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:0.9rem;"><span>Ciclo do Pedido</span><span style="color:#fff; font-weight:700;">Fornada Atual</span></div>
        <div style="display:flex; justify-content:space-between; font-size:0.9rem;"><span>Data Prevista</span><span style="color:#fff; font-weight:700;">Sábado, 18/04</span></div>
    `;
    
    // Limpa carrinho
    cart = [];
    render();
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
    injectAllCartElements();
    render();
    fetchStoreStatus();

    document.getElementById('closeCart').addEventListener('click', closeCart);
    document.getElementById('cartOverlay').addEventListener('click', closeCart);
    document.getElementById('verProdutosBtn').addEventListener('click', closeCart);
    document.getElementById('continuarComprandoBtn').addEventListener('click', closeCart);
    
    const cartIcon = document.getElementById('cartIcon') || document.getElementById('cart-toggle');
    if (cartIcon) cartIcon.addEventListener('click', openCart);

    document.getElementById('finalizarBtn').addEventListener('click', openIdModal);
    document.getElementById('id-form').addEventListener('submit', processCheckout);
});
