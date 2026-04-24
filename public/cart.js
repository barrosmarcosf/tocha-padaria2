/* ─────────────────────────────────────────────────────────
   cart.js  –  Sistema de Carrinho · Tocha Padaria
───────────────────────────────────────────────────────── */

/* ── State ── */
let cart = JSON.parse(localStorage.getItem('tocha-cart') || '[]');
let coupon = null;
let autoCloseTimer = null;
let globalStatus = null;

async function fetchStoreStatus() {
    try {
        const r = await fetch('/api/store-status');
        if (r.ok) {
            globalStatus = await r.json();
            render(); // Re-renderiza com os dados de status
        }
    } catch (e) { console.error(e); }
}

/* ── DOM refs (atribuídos no DOMContentLoaded) ── */
let panel, overlay, badge, countLabel, emptyState, itemsList, cartFooter;
let idModal, idOverlay, idForm;

function initDOMRefs() {
    panel      = document.getElementById('cart-panel');
    overlay    = document.getElementById('cart-overlay');
    badge      = document.getElementById('cart-badge');
    countLabel = document.getElementById('cart-count-label');
    emptyState = document.getElementById('cart-empty-state');
    itemsList  = document.getElementById('cart-items-list');
    cartFooter = document.getElementById('cart-footer');
    idModal    = document.getElementById('identificacao-modal');
    idOverlay  = document.getElementById('identificacao-overlay');
    idForm     = document.getElementById('id-form');
}

/* ── Inject Floating Cart Button ── */
/* ── Identification & Persistence (Abandono) ── */
let sessionId = localStorage.getItem('tocha-session-id');
if (!sessionId) {
    sessionId = 'sess-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    localStorage.setItem('tocha-session-id', sessionId);
}

/* ── Inject All Cart Elements (Autonomia) ── */
function injectAllCartElements() {
    // 1. Botão Flutuante
    if (!document.getElementById('floating-cart')) {
        document.body.insertAdjacentHTML('beforeend', `
            <button id="floating-cart" class="floating-cart-btn" aria-label="Ver carrinho" onclick="openCart(false)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="20" r="1.5"></circle>
                    <circle cx="18" cy="20" r="1.5"></circle>
                    <path d="M1 1h3.5l2.68 12.39a2 2 0 0 0 2 1.61h8.72a2 2 0 0 0 2-1.61L22 5H5.5"></path>
                </svg>
                <span id="floating-cart-badge" class="cart-badge">0</span>
            </button>
        `);
    }

    // 2. Overlay e Painel do Carrinho
    if (!document.getElementById('cart-panel')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="cart-overlay" class="cart-overlay"></div>
            <aside id="cart-panel" class="cart-panel" role="dialog" aria-modal="true" aria-label="Carrinho de compras">
                <div class="cart-panel-header">
                    <h2>Meu Pedido <span class="cart-count-label" id="cart-count-label"></span></h2>
                    <button id="cart-close" class="cart-close-btn" aria-label="Fechar carrinho">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div id="cart-empty-state" class="cart-empty-state">
                    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M10 12h4l6 28h24l4-20H18" />
                        <circle cx="26" cy="46" r="2.5" />
                        <circle cx="38" cy="46" r="2.5" />
                    </svg>
                    <p>Nenhum item ainda.</p>
                    <span>Explore o Cardápio!</span>
                    <button class="cart-continue-btn" id="cart-empty-continue">Ver Produtos</button>
                </div>
                <div id="cart-items-list" class="cart-items-list"></div>
                <div id="cart-footer" class="cart-footer" hidden>
                    <div class="coupon-row">
                        <input type="text" id="coupon-input" class="coupon-input" placeholder="Cupom de desconto" autocomplete="off">
                        <button id="coupon-apply-btn" class="coupon-apply-btn">Aplicar</button>
                    </div>
                    <p id="coupon-msg" class="coupon-msg"></p>
                    <div class="cart-summary">
                        <div class="summary-row"><span>Subtotal</span><span id="summary-subtotal">R$ 0,00</span></div>
                        <div class="summary-row discount-row" id="discount-row" hidden><span id="discount-label">Desconto</span><span id="summary-discount" class="discount-val">— R$ 0,00</span></div>
                        <div class="summary-row total-row"><span>Total</span><span id="summary-total">R$ 0,00</span></div>
                    </div>
                    <div class="cart-actions">
                        <button id="cart-checkout-btn" class="btn-checkout">Finalizar Compra</button>
                        <button id="cart-continue-btn" class="btn-continue">Continuar comprando</button>
                        <button id="cart-clear-btn" class="btn-clear">Esvaziar carrinho</button>
                    </div>
                </div>
            </aside>
        `);
    }

    // 3. Modais de Sucesso e Identificação
    if (!document.getElementById('success-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="success-overlay" class="cart-overlay"></div>
            <div id="success-modal" class="id-modal success-modal-premium" role="dialog" aria-modal="true">
                <div class="id-modal-body" style="padding: 4rem 2.5rem 3.5rem;">
                    <div class="success-icon-container">
                        <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="27" cy="27" r="25.5" stroke="var(--accent)" stroke-width="2"/>
                            <path d="M17 27.5L24 34.5L38 20.5" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h2 class="success-title">PEDIDO CONFIRMADO!</h2>
                    <p class="success-description">Seu pagamento foi aprovado. Avisaremos pelo WhatsApp assim que seu pedido ficar pronto para retirada.</p>
                    <div id="success-delivery-info" class="success-delivery-summary"></div>
                    <button id="success-continue-btn" class="btn-checkout success-btn-main">CONTINUAR</button>
                </div>
            </div>
        `);
    }

    if (!document.getElementById('identificacao-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="identificacao-overlay" class="cart-overlay"></div>
            <div id="identificacao-modal" class="id-modal" role="dialog" aria-modal="true">
                <button id="id-close" class="modal-close-float" aria-label="Fechar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
                <div class="id-modal-body" style="padding: 3.5rem 2.5rem 2.5rem;">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem;">Identificação</h2>
                        <p style="color: var(--text-dim); line-height: 1.6; font-size: 0.9rem; margin: 0;">Para garantir a segurança do seu pedido, precisamos de alguns dados rápidos.</p>
                    </div>
                    <form id="id-form">
                        <div class="form-group">
                            <label for="id-whatsapp">WhatsApp (com DDD)</label>
                            <input type="tel" id="id-whatsapp" required placeholder="Ex: 21999999999">
                        </div>
                        <div class="form-group">
                            <label for="id-name">Nome Completo</label>
                            <input type="text" id="id-name" required placeholder="Seu nome completo">
                        </div>
                        <div class="form-group">
                            <label for="id-email">E-mail</label>
                            <input type="email" id="id-email" required placeholder="seu@email.com">
                        </div>
                        <button type="submit" class="btn-checkout" id="id-submit-btn" style="width: 100%; margin-top: 1rem;">Seguir para Pagamento</button>
                        <div id="id-payment-methods-display" style="margin-top: 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; border-top: 1px dashed #cbd5e1; padding-top: 1rem;"></div>
                    </form>
                </div>
            </div>
        `);
    }

    // Re-bind DOM references após injeção
    initDOMRefs();
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

/* ── Render ── */
function render() {
    const total_items = totalItems();

    document.body.classList.toggle('cart-has-items', total_items > 0);
    if (window.updateNavigationUI) window.updateNavigationUI();

    if (!panel) initDOMRefs();

    const floatingBtn   = document.getElementById('floating-cart');
    const floatingBadge = document.getElementById('floating-cart-badge');

    if (total_items > 0) {
        if (badge)        { badge.textContent = total_items; badge.hidden = false; }
        if (floatingBadge) floatingBadge.textContent = total_items;
        if (floatingBtn) {
            floatingBtn.classList.add('visible');
            // Garantir posição correta antes de aparecer
            if (typeof window.syncFloatingCartPosition === 'function') {
                window.syncFloatingCartPosition();
            }
        }
    } else {
        if (badge)       badge.hidden = true;
        if (floatingBtn) floatingBtn.classList.remove('visible');
    }

    if (countLabel) {
        countLabel.textContent = total_items > 0
            ? `(${total_items} ${total_items === 1 ? 'item' : 'itens'})`
            : '';
    }

    if (cart.length === 0) {
        if (emptyState) emptyState.hidden = false;
        if (itemsList)  itemsList.hidden  = true;
        if (cartFooter) cartFooter.hidden = true;
        save();
        return;
    }

    if (emptyState) emptyState.hidden = true;
    if (itemsList)  {
        itemsList.hidden  = false;
        let batchHtml = ''; // Inicialização segura para evitar erro de referência
        
        if (globalStatus) {
            const isNext = globalStatus.statusMode === 'next_batch';
            const cycleName = globalStatus.cycleType || (isNext ? 'próxima fornada' : 'fornada atual');
            batchHtml = `
                <div class="cart-batch-notice ${isNext ? 'highlight' : ''}">
                    <div class="title">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2v20M2 12h20"/></svg>
                        ${isNext ? 'PRÉ-VENDA ATIVA' : 'FORNADA ATUAL'}
                    </div>
                    <div class="text">
                        Seu pedido será preparado para: <strong>${globalStatus.batchLabel}</strong>.
                        <br>Tipo de ciclo: <span style="text-transform: capitalize; font-weight:700;">${cycleName}</span>
                        ${isNext ? '<br><span style="color:#fbbf24; font-size:0.75rem;">Nota: A produção deste ciclo inicia após o encerramento da fornada anterior.</span>' : ''}
                    </div>
                </div>
            `;
        }

        itemsList.innerHTML = batchHtml + cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <div class="ci-info">
                    <h4>${item.name}</h4>
                    <span class="ci-unit-price">${fmt(item.price)} / un</span>
                </div>
                <div class="ci-controls">
                    <button class="ci-btn" onclick="changeQty('${item.id}', -1)">−</button>
                    <span class="ci-qty">${item.qty}</span>
                    <button class="ci-btn" onclick="changeQty('${item.id}', 1)">+</button>
                </div>
                <div class="ci-right">
                    <span class="ci-total">${fmt(item.price * item.qty)}</span>
                    <button class="ci-remove" onclick="removeItem('${item.id}')" aria-label="Remover">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }
    if (cartFooter) cartFooter.hidden = false;

    const sub   = subtotal();
    const disc  = discountAmount(sub);
    const total = sub - disc;

    const subtotalEl  = document.getElementById('summary-subtotal');
    const totalEl     = document.getElementById('summary-total');
    const discRow     = document.getElementById('discount-row');
    const discountEl  = document.getElementById('summary-discount');
    const discLabelEl = document.getElementById('discount-label');

    if (subtotalEl) subtotalEl.textContent = fmt(sub);
    if (totalEl)    totalEl.textContent    = fmt(total);

    if (discRow) {
        if (disc > 0) {
            discRow.hidden = false;
            if (discountEl)  discountEl.textContent  = '− ' + fmt(disc);
            if (discLabelEl) discLabelEl.textContent = coupon.label;
        } else {
            discRow.hidden = true;
        }
    }

    save();
}

/* ── Cart Actions ── */
function addToCart(el) {
    const pi    = el.closest('.product-item');
    const id    = pi.dataset.id;
    const name  = pi.dataset.name;
    const price = parseFloat(pi.dataset.price);

    const existing = cart.find(i => i.id === id);
    if (existing) { existing.qty++; }
    else          { cart.push({ id, name, price, qty: 1 }); }

    el.textContent = '✓';
    el.classList.add('added');
    setTimeout(() => { el.textContent = '+'; el.classList.remove('added'); }, 900);

    render();
}

window.addDirectToCart = function(id, name, price, qty = 1, disponivel = 0) {
    const existing = cart.find(i => i.id === id);
    if (existing) { 
        if (existing.qty + qty > disponivel) {
            existing.qty = disponivel;
            alert(`Atenção: Limite de estoque atingido para ${name}.`);
        } else {
            existing.qty += qty; 
        }
    }
    else { cart.push({ id, name, price, qty, disponivel_agora: disponivel }); }
    render();
};

window.changeQty = function(id, delta) {
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
    const item = cart.find(i => i.id === id);
    if (!item) return;

    if (delta > 0 && item.qty >= (item.disponivel_agora ?? 0)) {
        alert('Desculpe, limite de estoque atingido para este produto.');
        return;
    }

    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== id);
        // FECHAR AUTOMATICAMENTE SE FICOU VAZIO
        if (cart.length === 0) closeCart();
    }
    render();
};

window.removeItem = function(id) {
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
    cart = cart.filter(i => i.id !== id);
    // FECHAR AUTOMATICAMENTE SE FICOU VAZIO
    if (cart.length === 0) closeCart();
    render();
};

/* ── Success Handling ── */
async function checkPaymentSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const sessionIdStripe = urlParams.get('session_id');

    if (status === 'success' && sessionIdStripe) {
        console.log('[Checkout] Sucesso detectado. Confirmando sessão:', sessionIdStripe);
        
        try {
            const resp = await fetch('/api/confirm-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: sessionIdStripe })
            });
            const data = await resp.json();

            if (data.success) {
                // Limpa o carrinho local
                cart = [];
                localStorage.removeItem('tocha-cart');
                render();
                
                // Mostra o modal de sucesso
                showSuccessModal();

                // Limpa a URL para evitar reprocessamento
                window.history.replaceState({}, document.title, window.location.pathname);
            } else {
                console.error('[Checkout] Falha ao confirmar sessão no servidor:', data.error);
            }
        } catch (e) {
            console.error('[Checkout] Erro de conexão ao confirmar sessão:', e);
        }
    }
}

function showSuccessModal() {
    const overlay = document.getElementById('success-overlay');
    const modal = document.getElementById('success-modal');

    if (!overlay || !modal) return;

    overlay.classList.add('visible');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Injetar informações de entrega (Etapa 4)
    const infoDiv = document.getElementById('success-delivery-info');
    if (infoDiv && globalStatus) {
        const isNext = globalStatus.statusMode === 'next_batch';
        const cycleName = globalStatus.cycleType || (isNext ? 'próxima fornada' : 'fornada atual');
        infoDiv.innerHTML = `
            <h4>RESUMO DA ENTREGA</h4>
            <div class="info-row">
                <span class="label">Ciclo do Pedido:</span>
                <span class="val" style="text-transform: capitalize;">${cycleName}</span>
            </div>
            <div class="info-row">
                <span class="label">Data Prevista:</span>
                <span class="val">${globalStatus.batchLabel}</span>
            </div>
            <p style="font-size: 0.75rem; color: var(--text-dim); margin-top: 1rem; line-height: 1.5; font-weight: 500;">
                Seu pedido foi vinculado a este ciclo de produção. Você receberá atualizações sobre o preparo via WhatsApp.
            </p>
        `;
    }

    // Ao fechar, limpa também os metadados do último pedido
    const closeActions = () => {
        overlay.classList.remove('visible');
        modal.classList.remove('open');
        document.body.style.overflow = '';
        localStorage.removeItem('tocha-last-order-summary');
        localStorage.removeItem('tocha-last-order-total');
    };

    document.getElementById('success-continue-btn')?.addEventListener('click', closeActions);
}

function clearCart() {
    cart   = [];
    coupon = null;
    const ci = document.getElementById('coupon-input');
    const cm = document.getElementById('coupon-msg');
    if (ci) ci.value = '';
    if (cm) cm.textContent = '';
    
    closeCart();
    render();
    save();
}
window.clearCart = clearCart;

/* ── Coupon (validação server-side) ── */
async function applyCoupon() {
    const code = document.getElementById('coupon-input').value.trim().toUpperCase();
    const msg  = document.getElementById('coupon-msg');

    try {
        const resp = await fetch('/api/admin/validate-coupon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        const data = await resp.json();

        if (data.valid) {
            coupon = { type: data.type, value: data.value, label: data.label };
            msg.textContent = '✓ Cupom aplicado: ' + coupon.label;
            msg.className   = 'coupon-msg success';
        } else {
            coupon = null;
            msg.textContent = '✗ Cupom inválido.';
            msg.className   = 'coupon-msg error';
        }
    } catch (e) {
        coupon = null;
        msg.textContent = '✗ Erro ao validar cupom.';
        msg.className   = 'coupon-msg error';
    }
    render();
}

/* ── Identification Modal ── */
function openIdModal() {
    if (cart.length === 0) return;
    closeCart();
    if (!idModal) return;
    idModal.classList.add('open');
    idOverlay.classList.add('visible');

    const last = JSON.parse(localStorage.getItem('tocha-customer') || '{}');
    const waEl    = document.getElementById('id-whatsapp');
    const nameEl  = document.getElementById('id-name');
    const emailEl = document.getElementById('id-email');
    if (waEl    && last.whatsapp) waEl.value    = last.whatsapp;
    if (nameEl  && last.name)     nameEl.value  = last.name;
    if (emailEl && last.email)    emailEl.value = last.email;
}

function closeIdModal() {
    if (!idModal) return;
    idModal.classList.remove('open');
    idOverlay.classList.remove('visible');
}

/* ── Smart Lookup por WhatsApp ── */
function setupSmartLookup() {
    const waInput    = document.getElementById('id-whatsapp');
    const nameInput  = document.getElementById('id-name');
    const emailInput = document.getElementById('id-email');
    if (!waInput || !nameInput || !emailInput) return;

    waInput.addEventListener('input', () => {
        const val = waInput.value.trim().replace(/\D/g, '');
        if (val.length >= 10) {
            const registry = JSON.parse(localStorage.getItem('tocha-customer-registry') || '{}');
            const found = registry[val];
            if (found) {
                nameInput.value  = found.name;
                emailInput.value = found.email;
                nameInput.style.boxShadow  = '0 0 10px rgba(229, 181, 96, 0.2)';
                emailInput.style.boxShadow = '0 0 10px rgba(229, 181, 96, 0.2)';
                setTimeout(() => {
                    nameInput.style.boxShadow  = '';
                    emailInput.style.boxShadow = '';
                }, 1500);
            }
        }
    });
}

/* ── Checkout ── */
async function processCheckout(e) {
    if (e) e.preventDefault();

    const btn = document.getElementById('id-submit-btn');
    const customer = {
        name:     document.getElementById('id-name').value.trim(),
        email:    document.getElementById('id-email').value.trim(),
        whatsapp: document.getElementById('id-whatsapp').value.trim()
    };

    // Salva histórico local
    const registry = JSON.parse(localStorage.getItem('tocha-customer-registry') || '{}');
    const waKey = customer.whatsapp.replace(/\D/g, '');
    registry[waKey] = { name: customer.name, email: customer.email };
    localStorage.setItem('tocha-customer-registry', JSON.stringify(registry));
    localStorage.setItem('tocha-customer', JSON.stringify(customer));

    if (btn) { btn.classList.add('checkout-loading'); btn.textContent = 'Processando'; }

    const sub      = subtotal();
    const total    = sub - discountAmount(sub);

    localStorage.setItem('tocha-last-order-summary', JSON.stringify(cart));
    localStorage.setItem('tocha-last-order-total', total.toFixed(2).replace('.', ','));

    const performCheckout = async (attempt = 1) => {
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, customer, cart, totalAmount: total })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro do servidor (${response.status})`);
            }

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'URL de pagamento não recebida.');
            }
        } catch (error) {
            console.error(`[Checkout] Falha na tentativa ${attempt}:`, error);
            
            if (attempt < 2) {
                console.log('[Checkout] Tentando novamente em 2 segundos...');
                setTimeout(() => performCheckout(attempt + 1), 2000);
            } else {
                alert('Não conseguimos conectar com o servidor para gerar seu pagamento. Por favor, verifique sua internet e tente novamente.');
                if (btn) { 
                    btn.classList.remove('checkout-loading'); 
                    btn.textContent = 'Seguir para Pagamento'; 
                }
            }
        }
    };

    performCheckout();
}

/* ── Panel Open / Close ── */
window.openCart = function(autoClose = false) {
    if (!panel) initDOMRefs();
    
    // REFORÇO DE PERSISTÊNCIA: Recarregar do localStorage ao abrir
    try {
        const stored = localStorage.getItem('tocha-cart');
        if (stored) cart = JSON.parse(stored);
        render(); 
    } catch (e) { console.warn('[Carrinho] Erro ao sincronizar abertura:', e); }

    // Toggle: Se já estiver aberto e NÃO for um auto-close (ex: ao adicionar item), fecha.
    if (panel && panel.classList.contains('open') && !autoClose) {
        closeCart();
        return;
    }

    panel.classList.add('open');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';

    if (autoCloseTimer) { clearTimeout(autoCloseTimer); autoCloseTimer = null; }
    if (autoClose) {
        autoCloseTimer = setTimeout(closeCart, 2000);
    }
};

function closeCart() {
    if (!panel) return;
    panel.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
    if (autoCloseTimer) { clearTimeout(autoCloseTimer); autoCloseTimer = null; }
}
window.closeCart = closeCart;

/* ── DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {
    injectAllCartElements();

    // Sincroniza o estado do carrinho imediatamente (sem precisar de refresh)
    render();

    // Navbar cart toggle (com navegação inteligente)
    const toggleBtn = document.getElementById('cart-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            openCart(false);
        });
    }

    // Close button & overlay
    const closeBtn = document.getElementById('cart-close');
    if (closeBtn) closeBtn.addEventListener('click', closeCart);
    if (overlay)  overlay.addEventListener('click', closeCart);

    // Pause auto-close on hover
    if (panel) {
        panel.addEventListener('mouseenter', () => {
            if (autoCloseTimer) { clearTimeout(autoCloseTimer); autoCloseTimer = null; }
        });
    }

    // Delegation for legacy .pi-add buttons
    document.addEventListener('click', e => {
        if (e.target.classList.contains('pi-add')) addToCart(e.target);
    });

    // Coupon
    const couponApplyBtn = document.getElementById('coupon-apply-btn');
    const couponInputEl  = document.getElementById('coupon-input');
    if (couponApplyBtn) couponApplyBtn.addEventListener('click', applyCoupon);
    if (couponInputEl)  couponInputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter') applyCoupon();
    });

    // Clear cart
    const clearBtn = document.getElementById('cart-clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', clearCart);

    // Checkout → ID Modal
    const checkoutBtn = document.getElementById('cart-checkout-btn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', openIdModal);

    // ID Modal close
    const idCloseBtn   = document.getElementById('id-close');
    const idOverlayEl  = document.getElementById('identificacao-overlay');
    if (idCloseBtn)  idCloseBtn.addEventListener('click', closeIdModal);
    if (idOverlayEl) idOverlayEl.addEventListener('click', closeIdModal);
    if (idForm)      idForm.addEventListener('submit', processCheckout);

    // Continue shopping
    const continueBtn      = document.getElementById('cart-continue-btn');
    const emptyContinueBtn = document.getElementById('cart-empty-continue');
    if (continueBtn) continueBtn.addEventListener('click', closeCart);
    if (emptyContinueBtn) {
        emptyContinueBtn.addEventListener('click', () => {
            closeCart();
            const menuEl = document.getElementById('menu');
            if (menuEl) menuEl.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ESC fecha carrinho
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeCart();
    });

    // Se tiver parametro no URL (ex: ao vir de outra pagina), abre o carrinho
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openCart') === '1') {
        setTimeout(() => openCart(false), 500);
    }

    // --- RECUPERAÇÃO DE ABANDONO (Token) ---
    const recoveryToken = urlParams.get('token');
    if (recoveryToken) {
        console.log('[Abandono] Token detectado. Recuperando carrinho...');
        fetch(`/api/recover/${recoveryToken}`)
            .then(res => res.json())
            .then(data => {
                if (data.cart && data.cart.length > 0) {
                    cart = data.cart;
                    if (data.customer) localStorage.setItem('tocha-customer', JSON.stringify(data.customer));
                    render();
                    openCart(false);
                    // Limpa a URL para não reprocessar o token
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            })
            .catch(e => console.error('[Abandono] Falha na recuperação:', e));
    }

    // Render inicial
    render();
    fetchStoreStatus();
    setupSmartLookup();
    checkPaymentSuccess();
});
