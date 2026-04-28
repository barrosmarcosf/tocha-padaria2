/* ─────────────────────────────────────────────────────────
   cart.js  –  Sistema de Carrinho (Contexto Global & Checkout)
───────────────────────────────────────────────────────── */

const OWNER_PHONE = '5521966278965';

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
                        <button onclick="decrease('${item.id}')">−</button>
                        <span>${item.qty}</span>
                        <button onclick="increase('${item.id}')">+</button>
                    </div>
                    <button class="ci-remove" onclick="removeItem('${item.id}')">🗑</button>
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
}

/* ── Checkout Modal Logic ── */
window.openCheckoutModal = function() {
    window.closeCart();
    const modal = document.getElementById('checkoutModal');
    const overlay = document.getElementById('checkoutOverlay');
    if (modal) modal.style.display = 'flex';
    if (overlay) overlay.classList.add('active');
    
    if (globalStatus && globalStatus.batchLabel) {
        document.getElementById('dataFornada').textContent = globalStatus.batchLabel;
    }
}

window.closeCheckoutModal = function() {
    document.getElementById('checkoutModal').style.display = 'none';
    document.getElementById('checkoutOverlay').classList.remove('active');
};

window.validarFormulario = function() {
    const campos = [
        { id: 'nome', msg: 'Informe seu nome completo' },
        { id: 'whatsapp', msg: 'Informe seu WhatsApp' },
        { id: 'email', msg: 'Informe seu email' }
    ];

    let valido = true;

    campos.forEach(campo => {
        const input = document.getElementById(campo.id);
        const erro = input.nextElementSibling;

        if (!input.value.trim()) {
            input.classList.add('input-error');
            erro.innerText = campo.msg;
            erro.style.display = 'block';
            if (valido) input.focus();
            valido = false;
        } else {
            input.classList.remove('input-error');
            erro.style.display = 'none';
        }
    });

    return valido;
};

window.tentarFinalizar = function() {
    if (window.validarFormulario()) {
        window.confirmarPedido();
    }
};

window.confirmarPedido = function() {
    const name = document.getElementById('nome').value.trim();
    const whatsapp = document.getElementById('whatsapp').value.trim();
    const email = document.getElementById('email').value.trim();
    const payment = document.querySelector('input[name="payment-method"]:checked').value;

    localStorage.setItem('tocha-customer', JSON.stringify({ name, whatsapp, email }));

    if (payment === 'pix') {
        window.location.href = "/pagamento-pix";
    } else {
        window.location.href = "/pagamento-stripe";
    }
};

window.fecharModal = function() {
    document.getElementById('modalSuccess').style.display = 'none';
    document.getElementById('checkoutOverlay').classList.remove('active');
};

/* ── Injections ── */
function injectCart() {
    if (document.getElementById('cartDrawer')) return;

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
                    <input id="nome" type="text" placeholder="Ex: João Silva" class="modal-input" />
                    <div class="input-error-text"></div>
                </div>

                <div class="form-group">
                    <label>WhatsApp <span class="required">*</span></label>
                    <input id="whatsapp" type="tel" placeholder="(00) 00000-0000" class="modal-input" />
                    <div class="input-error-text"></div>
                </div>

                <div class="form-group">
                    <label>Email <span class="required">*</span></label>
                    <input id="email" type="email" placeholder="seu@email.com" class="modal-input" />
                    <div class="input-error-text"></div>
                </div>

                <div style="margin-bottom: 25px;">
                    <p style="color: #fff; font-weight: 600; margin-bottom: 12px; font-size: 0.9rem;">Forma de pagamento</p>
                    <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; cursor: pointer; color: #aaa;">
                        <input type="radio" name="payment-method" value="pix" checked style="accent-color: var(--accent);"> PIX (Mercado Pago)
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: #aaa;">
                        <input type="radio" name="payment-method" value="card" style="accent-color: var(--accent);"> Cartão de crédito (Stripe)
                    </label>
                </div>
                
                <button class="btn-primary" onclick="window.tentarFinalizar()" style="border-radius: 10px; margin-bottom: 10px; width: 100%;">CONFIRMAR PEDIDO</button>
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

document.addEventListener('DOMContentLoaded', () => {
    injectCart();
    render();
    fetchStoreStatus();

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

    // Mascara de WhatsApp
    const whatsappInput = document.getElementById('whatsapp');
    if (whatsappInput) {
        whatsappInput.addEventListener('input', (e) => {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
        });
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'success') {
        cart = []; save();
        document.getElementById('modalSuccess').style.display = 'flex';
        document.getElementById('checkoutOverlay').classList.add('active');
        window.history.replaceState({}, '', window.location.pathname);
    }
});
