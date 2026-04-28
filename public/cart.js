/* ─────────────────────────────────────────────────────────
   cart.js  –  Sistema de Carrinho (Contexto Global & Supabase)
───────────────────────────────────────────────────────── */

// WhatsApp do Proprietário (conforme .env)
const OWNER_PHONE = '5521966278965';

/* ── State & Persistence ── */
let cart = JSON.parse(localStorage.getItem('tocha-cart') || '[]');
let coupon = null;
let globalStatus = null;

// Função para salvar no localStorage (Persistência)
function save() {
    localStorage.setItem('tocha-cart', JSON.stringify(cart));
    render();
}

/* ── Global Cart Context (Functions) ── */
window.addToCart = function(product) {
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image_url || product.image,
            qty: 1
        });
    }
    save();
    window.openCart(); // Abre o modal instantaneamente
};

window.increase = function(id) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty++;
        save();
    }
};

window.decrease = function(id) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty--;
        if (item.qty <= 0) {
            window.removeItem(id);
        } else {
            save();
        }
    }
};

window.removeItem = function(id) {
    cart = cart.filter(i => i.id !== id);
    save();
};

window.clearCart = function() {
    cart = [];
    save();
    window.closeCart();
};

/* ── Supabase Integration (Data Fetching) ── */
window.fetchProductsByCategory = async function(categorySlug) {
    try {
        // Buscamos produtos da nossa API que consome o Supabase
        const resp = await fetch('/api/config');
        const { produtos } = await resp.json();
        if (categorySlug) {
            return produtos.filter(p => p.category_slug === categorySlug);
        }
        return produtos;
    } catch (e) {
        console.error('[Supabase] Erro ao buscar produtos:', e);
        return [];
    }
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

/* ── Render (High Fidelity) ── */
function render() {
    const drawer     = document.getElementById('cartDrawer');
    const itemsList  = document.getElementById('cartItemsList');
    const cartFooter = document.getElementById('cartFooter');
    const emptyState = document.getElementById('cartEmptyState');
    const countLabel = document.getElementById('cartCountLabel');
    const total_items = cart.reduce((s, i) => s + i.qty, 0);

    if (countLabel) countLabel.textContent = `(${total_items} ${total_items === 1 ? 'item' : 'itens'})`;

    // Botão flutuante do navbar (badge)
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

    // Render list
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

    // Summary
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

/* ── WhatsApp Finalization ── */
window.finalizarWhatsApp = function() {
    if (cart.length === 0) return;

    let message = '🧾 *Novo Pedido:*\n\n';
    
    cart.forEach(item => {
        message += `• ${item.name} x${item.qty} - ${fmt(item.price * item.qty)}\n`;
    });

    const sub = subtotal();
    const disc = discountAmount(sub);
    const total = sub - disc;

    if (disc > 0) {
        message += `\nSubtotal: ${fmt(sub)}`;
        message += `\nDesconto: -${fmt(disc)}`;
    }
    
    message += `\n\n*Total: ${fmt(total)}*`;

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${OWNER_PHONE}?text=${encodedMsg}`;
    
    window.open(whatsappUrl, '_blank');
};

/* ── Injections & Init ── */
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

                <button class="btn-primary" onclick="finalizarWhatsApp()">FINALIZAR VIA WHATSAPP</button>
                <button class="btn-secondary" id="continuarComprandoBtn">CONTINUAR COMPRANDO</button>
                <a class="clear-cart-link" onclick="clearCart()">Esvaziar carrinho</a>
            </div>
        </aside>
    `);

    // Bindings
    document.getElementById('closeCart').addEventListener('click', window.closeCart);
    document.getElementById('cartOverlay').addEventListener('click', window.closeCart);
    document.getElementById('verProdutosBtn').addEventListener('click', window.closeCart);
    document.getElementById('continuarComprandoBtn').addEventListener('click', window.closeCart);
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

document.addEventListener('DOMContentLoaded', () => {
    injectCart();
    render();

    // Icone do navbar
    const cartIcon = document.getElementById('cartIcon') || document.getElementById('cart-toggle');
    if (cartIcon) {
        cartIcon.addEventListener('click', window.toggleCart);
    } else {
        // Se não houver navbar, injeta botão flutuante
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
        // Atualiza badge flutuante no render
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
});
