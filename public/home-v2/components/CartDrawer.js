(function () {
  'use strict';

  const { useState, useEffect } = window.React;
  const html        = window.htm.bind(window.React.createElement);
  const T           = window.T;
  const useIsMobile = window.useIsMobile;

  function fmt(v) { return 'R$ ' + Number(v).toFixed(2).replace('.', ','); }

  // ─────────────────────────────────────────────────────────────────
  // SHARED PRIMITIVES
  // ─────────────────────────────────────────────────────────────────

  function DrawerHeader({ title, onClose, onBack }) {
    const headerStyle = {
      display:        'flex',
      alignItems:     'center',
      padding:        `${T.space[5]} ${T.space[6]}`,
      borderBottom:   `1px solid var(--border-subtle)`,
      gap:            T.space[3],
      flexShrink:     0,
    };
    const backBtnStyle = {
      background: 'none', border: 'none', cursor: 'pointer',
      color: T.color.textMuted, fontSize: T.fontSize.xl,
      padding: `0 ${T.space[2]} 0 0`, lineHeight: 1,
      transition: `color ${T.transition.fast}`,
    };
    const titleStyle = {
      fontFamily:  T.font.serif,
      fontSize:    T.fontSize['2xl'],
      fontWeight:  T.fontWeight.medium,
      color:       T.color.cream,
      flex:        1,
    };
    const closeBtnStyle = {
      background: 'none', border: `1px solid var(--border)`, cursor: 'pointer',
      color: T.color.textMuted, width: '32px', height: '32px',
      borderRadius: T.radius.pill, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: T.fontSize.base, flexShrink: 0,
      transition: `border-color ${T.transition.fast}, color ${T.transition.fast}`,
    };

    return html`
      <div style=${headerStyle}>
        ${onBack && html`
          <button style=${backBtnStyle} onClick=${onBack} aria-label="Voltar">←</button>
        `}
        <h2 style=${titleStyle}>${title}</h2>
        <button style=${closeBtnStyle} onClick=${onClose} aria-label="Fechar carrinho">✕</button>
      </div>
    `;
  }

  function PrimaryBtn({ label, onClick, disabled }) {
    const [hov, setHov] = useState(false);
    const s = {
      width:         '100%',
      padding:       `14px ${T.space[6]}`,
      borderRadius:  T.radius.pill,
      border:        'none',
      background:    disabled ? T.color.bg3 : hov ? T.color.amberBright : T.color.amber,
      color:         disabled ? T.color.textDim : T.color.bg,
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.sm,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing.xl,
      textTransform: 'uppercase',
      cursor:        disabled ? 'default' : 'pointer',
      transition:    `background ${T.transition.fast}`,
    };
    return html`
      <button
        style=${s}
        onClick=${onClick}
        disabled=${disabled}
        onMouseEnter=${() => setHov(true)}
        onMouseLeave=${() => setHov(false)}
      >${label}</button>
    `;
  }

  // ─────────────────────────────────────────────────────────────────
  // CART ITEM ROW
  // ─────────────────────────────────────────────────────────────────

  function CartItemRow({ item, onUpdateQty, onRemove }) {
    const rowStyle = {
      display:      'flex',
      alignItems:   'center',
      gap:          T.space[4],
      padding:      `${T.space[4]} 0`,
      borderBottom: `1px solid var(--border-subtle)`,
    };
    const thumbStyle = {
      width:        '52px',
      height:       '52px',
      borderRadius: T.radius.sm,
      background:   T.color.bg3,
      flexShrink:   0,
      overflow:     'hidden',
      display:      'flex',
      alignItems:   'center',
      justifyContent: 'center',
      fontSize:     '22px',
    };
    const infoStyle = { flex: 1, minWidth: 0 };
    const nameStyle = {
      fontFamily:   T.font.sans,
      fontSize:     T.fontSize.sm,
      fontWeight:   T.fontWeight.medium,
      color:        T.color.text,
      whiteSpace:   'nowrap',
      overflow:     'hidden',
      textOverflow: 'ellipsis',
    };
    const priceStyle = {
      fontFamily: T.font.sans,
      fontSize:   T.fontSize.xs,
      color:      T.color.textMuted,
      marginTop:  T.space[1],
    };
    const qtyWrapStyle = {
      display:     'flex',
      alignItems:  'center',
      gap:         T.space[2],
      flexShrink:  0,
    };
    const qtyBtnStyle = {
      width: '26px', height: '26px', borderRadius: T.radius.pill,
      border: `1px solid var(--border)`, background: 'transparent',
      color: T.color.text, cursor: 'pointer', fontSize: T.fontSize.md,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: `border-color ${T.transition.fast}`,
    };
    const qtyNumStyle = {
      fontFamily: T.font.sans, fontSize: T.fontSize.sm,
      fontWeight: T.fontWeight.semibold, color: T.color.text,
      minWidth: '20px', textAlign: 'center',
    };
    const rmBtnStyle = {
      background: 'none', border: 'none', cursor: 'pointer',
      color: T.color.textDim, fontSize: T.fontSize.sm,
      padding: T.space[1], transition: `color ${T.transition.fast}`,
      flexShrink: 0,
    };

    const remove = () => onRemove ? onRemove(item.id) : onUpdateQty(item.id, 0);

    return html`
      <div style=${rowStyle}>
        <div style=${thumbStyle}>
          ${item.image
            ? html`<img src=${item.image} alt=${item.name} style=${{ width:'100%', height:'100%', objectFit:'cover' }} />`
            : '🍞'
          }
        </div>
        <div style=${infoStyle}>
          <p style=${nameStyle}>${item.name}</p>
          <p style=${priceStyle}>${fmt(item.price)} × ${item.qty} = ${fmt(item.price * item.qty)}</p>
        </div>
        <div style=${qtyWrapStyle}>
          <button style=${qtyBtnStyle} onClick=${() => onUpdateQty(item.id, item.qty - 1)} aria-label="Diminuir">−</button>
          <span style=${qtyNumStyle}>${item.qty}</span>
          <button style=${qtyBtnStyle} onClick=${() => onUpdateQty(item.id, item.qty + 1)} aria-label="Aumentar">+</button>
        </div>
        <button style=${rmBtnStyle} onClick=${remove} aria-label="Remover item">🗑</button>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────
  // VIEW: CART
  // ─────────────────────────────────────────────────────────────────

  function ViewCart({ cart, onUpdateQty, onRemove, onClose, onNext }) {
    const items   = cart || [];
    const total   = items.reduce((s, i) => s + i.price * i.qty, 0);
    const isEmpty = items.length === 0;

    const bodyStyle = {
      flex: 1, overflowY: 'auto', padding: `0 ${T.space[6]}`,
    };
    const emptyStyle = {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: T.space[4],
    };
    const emptyIconStyle = { fontSize: '48px', opacity: 0.4 };
    const emptyTextStyle = {
      fontFamily: T.font.sans, fontSize: T.fontSize.base,
      color: T.color.textDim, textAlign: 'center',
    };
    const footerStyle = {
      padding:      T.space[6],
      borderTop:    `1px solid var(--border-subtle)`,
      display:      'flex',
      flexDirection:'column',
      gap:          T.space[4],
      flexShrink:   0,
    };
    const totalRowStyle = {
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    };
    const totalLabelStyle = {
      fontFamily: T.font.sans, fontSize: T.fontSize.sm,
      color: T.color.textMuted, letterSpacing: T.letterSpacing.base,
      textTransform: 'uppercase',
    };
    const totalAmountStyle = {
      fontFamily: T.font.serif, fontSize: T.fontSize.h4,
      fontWeight: T.fontWeight.medium, color: T.color.amber,
    };

    return html`
      <${DrawerHeader} title="Seu Pedido" onClose=${onClose} />

      <div style=${bodyStyle}>
        ${isEmpty
          ? html`
              <div style=${emptyStyle}>
                <span style=${emptyIconStyle}>🧺</span>
                <p style=${emptyTextStyle}>Seu carrinho está vazio.<br/>Adicione pães do cardápio.</p>
              </div>
            `
          : items.map(item => html`
              <${CartItemRow}
                key=${item.id}
                item=${item}
                onUpdateQty=${onUpdateQty}
                onRemove=${onRemove}
              />
            `)
        }
      </div>

      <div style=${footerStyle}>
        <div style=${totalRowStyle}>
          <span style=${totalLabelStyle}>Total</span>
          <span style=${totalAmountStyle}>${fmt(total)}</span>
        </div>
        <${PrimaryBtn} label="Finalizar pedido →" onClick=${onNext} disabled=${isEmpty} />
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────
  // VIEW: CHECKOUT
  // ─────────────────────────────────────────────────────────────────

  function ViewCheckout({ cart, onBack, onClose, onCheckout }) {
    const items = cart || [];
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);

    // Lê dados salvos (early capture)
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('tocha-customer') || 'null'); } catch {}

    const [name, setName]         = useState(saved?.name || '');
    const [whatsapp, setWhatsapp] = useState(saved?.whatsapp || '');

    const bodyStyle = {
      flex: 1, overflowY: 'auto', padding: `${T.space[6]} ${T.space[6]}`,
      display: 'flex', flexDirection: 'column', gap: T.space[6],
    };
    const blockStyle = {
      display: 'flex', flexDirection: 'column', gap: T.space[3],
    };
    const blockTitleStyle = {
      fontFamily: T.font.sans, fontSize: T.fontSize.xs,
      fontWeight: T.fontWeight.semibold, letterSpacing: T.letterSpacing['3xl'],
      textTransform: 'uppercase', color: T.color.textDim,
    };
    const summaryItemStyle = {
      display: 'flex', justifyContent: 'space-between',
      fontFamily: T.font.sans, fontSize: T.fontSize.sm,
      color: T.color.textMuted, padding: `${T.space[1]} 0`,
    };
    const inputStyle = {
      width: '100%', height: '40px', padding: `0 ${T.space[4]}`,
      borderRadius: T.radius.sm, border: `1px solid var(--border)`,
      background: T.color.bg2, color: T.color.text,
      fontFamily: T.font.sans, fontSize: T.fontSize.sm,
      boxSizing: 'border-box',
    };
    const pixBadgeStyle = {
      display: 'flex', alignItems: 'center', gap: T.space[3],
      padding: T.space[4], borderRadius: T.radius.card,
      border: `1px solid var(--border)`, background: T.color.bg2,
    };
    const pixIconStyle = { fontSize: '24px' };
    const pixLabelStyle = {
      fontFamily: T.font.sans, fontSize: T.fontSize.sm,
      color: T.color.text, fontWeight: T.fontWeight.medium,
    };
    const pixSubStyle = {
      fontFamily: T.font.sans, fontSize: T.fontSize.xs, color: T.color.textDim,
    };
    const footerStyle = {
      padding: T.space[6], borderTop: `1px solid var(--border-subtle)`,
      display: 'flex', flexDirection: 'column', gap: T.space[3], flexShrink: 0,
    };
    const totalRowStyle = {
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    };
    const totalLabelStyle = {
      fontFamily: T.font.sans, fontSize: T.fontSize.sm,
      color: T.color.textMuted, letterSpacing: T.letterSpacing.base, textTransform: 'uppercase',
    };
    const totalAmountStyle = {
      fontFamily: T.font.serif, fontSize: T.fontSize.h4,
      fontWeight: T.fontWeight.medium, color: T.color.amber,
    };

    function handlePay() {
      if (name.trim() && whatsapp.trim()) {
        try {
          localStorage.setItem('tocha-customer', JSON.stringify({ name: name.trim(), whatsapp: whatsapp.trim() }));
        } catch {}
      }
      const customer = JSON.parse(localStorage.getItem('tocha-customer') || '{}');
      onCheckout({ items: cart, customer });
    }

    const canPay = name.trim().length > 1 && whatsapp.replace(/\D/g, '').length >= 10;

    return html`
      <${DrawerHeader} title="Confirmar Pedido" onClose=${onClose} onBack=${onBack} />

      <div style=${bodyStyle}>
        <!-- Resumo -->
        <div style=${blockStyle}>
          <p style=${blockTitleStyle}>Resumo</p>
          ${items.map(i => html`
            <div key=${i.id} style=${summaryItemStyle}>
              <span>${i.qty}× ${i.name}</span>
              <span>${fmt(i.price * i.qty)}</span>
            </div>
          `)}
        </div>

        <!-- Dados -->
        <div style=${blockStyle}>
          <p style=${blockTitleStyle}>Seus dados</p>
          <input
            style=${inputStyle}
            type="text"
            placeholder="Nome"
            value=${name}
            onInput=${e => setName(e.target.value)}
          />
          <input
            style=${inputStyle}
            type="tel"
            placeholder="WhatsApp (DDD + número)"
            value=${whatsapp}
            onInput=${e => setWhatsapp(e.target.value)}
          />
        </div>

        <!-- Pagamento -->
        <div style=${blockStyle}>
          <p style=${blockTitleStyle}>Pagamento</p>
          <div style=${pixBadgeStyle}>
            <span style=${pixIconStyle}>💠</span>
            <div>
              <p style=${pixLabelStyle}>PIX</p>
              <p style=${pixSubStyle}>Transferência instantânea</p>
            </div>
          </div>
        </div>
      </div>

      <div style=${footerStyle}>
        <div style=${totalRowStyle}>
          <span style=${totalLabelStyle}>Total a pagar</span>
          <span style=${totalAmountStyle}>${fmt(total)}</span>
        </div>
        <${PrimaryBtn} label="Confirmar e pagar →" onClick=${handlePay} disabled=${!canPay} />
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────
  // VIEW: LOADING
  // ─────────────────────────────────────────────────────────────────

  function ViewLoading() {
    const centerStyle = {
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: T.space[6],
    };
    const spinnerStyle = {
      width: '44px', height: '44px',
      border: `3px solid var(--border)`,
      borderTop: `3px solid ${T.color.amber}`,
      borderRadius: T.radius.circle,
      animation: 'spin 0.9s linear infinite',
    };
    const msgStyle = {
      fontFamily: T.font.sans, fontSize: T.fontSize.base,
      color: T.color.textMuted, textAlign: 'center',
    };

    return html`
      <div style=${{ flex:1, display:'flex', flexDirection:'column' }}>
        <div style=${centerStyle}>
          <div style=${spinnerStyle}></div>
          <p style=${msgStyle}>Processando pedido…</p>
        </div>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────
  // VIEW: PIX PENDING
  // ─────────────────────────────────────────────────────────────────

  function ViewPixPending({ cart, onClose, pixData }) {
    const total = (cart || []).reduce((s, i) => s + i.price * i.qty, 0);
    const pixCode = pixData?.copia_e_cola || '';
    const qrImage = pixData?.qr_code || '';

    const bodyStyle = {
      flex: 1, overflowY: 'auto', padding: T.space[6],
      display: 'flex', flexDirection: 'column', gap: T.space[6], alignItems: 'center',
    };
    const qrBoxStyle = {
      width: '180px', height: '180px', borderRadius: T.radius.card,
      border: `2px dashed var(--border)`, background: T.color.bg2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: T.space[3],
      overflow: 'hidden',
    };
    const qrIconStyle = { fontSize: '48px', opacity: 0.5 };
    const qrLabelStyle = {
      fontFamily: T.font.sans, fontSize: T.fontSize.xs,
      color: T.color.textDim, textAlign: 'center',
    };
    const amountStyle = {
      fontFamily: T.font.serif, fontSize: T.fontSize.h4,
      fontWeight: T.fontWeight.medium, color: T.color.amber, textAlign: 'center',
    };
    const instrStyle = {
      fontFamily: T.font.sans, fontSize: T.fontSize.sm,
      color: T.color.textMuted, textAlign: 'center', lineHeight: T.lineHeight.relaxed,
      maxWidth: '280px',
    };
    const keyBoxStyle = {
      width: '100%', padding: T.space[4], borderRadius: T.radius.sm,
      border: `1px solid var(--border)`, background: T.color.bg2,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: T.space[3],
    };
    const keyTextStyle = {
      fontFamily: T.font.sans, fontSize: T.fontSize.xs,
      color: T.color.textMuted, overflow: 'hidden', textOverflow: 'ellipsis',
    };
    const copyBtnStyle = {
      background: 'none', border: `1px solid var(--border)`, borderRadius: T.radius.sm,
      color: T.color.amber, fontFamily: T.font.sans, fontSize: T.fontSize.xs,
      fontWeight: T.fontWeight.medium, padding: `${T.space[1]} ${T.space[3]}`,
      cursor: 'pointer', flexShrink: 0,
      transition: `background ${T.transition.fast}`,
    };
    const [copied, setCopied] = useState(false);
    function copyKey() {
      navigator.clipboard?.writeText(pixCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }

    return html`
      <${DrawerHeader} title="Aguardando Pagamento" onClose=${onClose} />
      <div style=${bodyStyle}>
        <div style=${qrBoxStyle}>
          ${qrImage
            ? html`<img src=${qrImage} alt="QR Code PIX" style=${{ width: '100%', height: '100%', objectFit: 'contain' }} />`
            : html`
                <span style=${qrIconStyle}>💠</span>
                <span style=${qrLabelStyle}>QR Code PIX<br/>(disponível em breve)</span>
              `
          }
        </div>
        <p style=${amountStyle}>${fmt(total)}</p>
        <p style=${instrStyle}>
          Escaneie o QR Code ou copie o código PIX abaixo.
          O pedido é confirmado após a comprovação do pagamento.
        </p>
        ${pixCode && html`
          <div style=${keyBoxStyle}>
            <span style=${keyTextStyle}>${pixCode}</span>
            <button style=${copyBtnStyle} onClick=${copyKey}>
              ${copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        `}
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────
  // VIEW: SUCCESS
  // ─────────────────────────────────────────────────────────────────

  function ViewSuccess({ onClose }) {
    const centerStyle = {
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: T.space[5], padding: T.space[6], textAlign: 'center',
    };
    const iconStyle = {
      fontSize: '56px',
      animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
    };
    const titleStyle = {
      fontFamily: T.font.serif, fontSize: T.fontSize.h4,
      fontWeight: T.fontWeight.medium, color: T.color.cream,
    };
    const msgStyle = {
      fontFamily: T.font.sans, fontSize: T.fontSize.base,
      color: T.color.textMuted, lineHeight: T.lineHeight.relaxed,
      maxWidth: '280px',
    };

    return html`
      <div style=${{ flex:1, display:'flex', flexDirection:'column' }}>
        <div style=${centerStyle}>
          <span style=${iconStyle}>✅</span>
          <h3 style=${titleStyle}>Pedido confirmado!</h3>
          <p style=${msgStyle}>
            Recebemos seu pedido. Em breve você receberá a confirmação
            no WhatsApp. Obrigado! 🍞
          </p>
          <${PrimaryBtn} label="Fechar" onClick=${onClose} />
        </div>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────
  // VIEW: ERRORS
  // ─────────────────────────────────────────────────────────────────

  function ViewError({ icon, title, message, onRetry, onClose }) {
    const centerStyle = {
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: T.space[5], padding: T.space[6], textAlign: 'center',
    };
    const iconStyle = { fontSize: '48px' };
    const titleStyle = {
      fontFamily: T.font.serif, fontSize: T.fontSize.h4,
      fontWeight: T.fontWeight.medium, color: T.color.cream,
    };
    const msgStyle = {
      fontFamily: T.font.sans, fontSize: T.fontSize.base,
      color: T.color.textMuted, lineHeight: T.lineHeight.relaxed,
      maxWidth: '280px',
    };
    const retryStyle = {
      background: 'none', border: `1px solid var(--border)`, borderRadius: T.radius.pill,
      color: T.color.textMuted, fontFamily: T.font.sans, fontSize: T.fontSize.sm,
      padding: `10px ${T.space[6]}`, cursor: 'pointer', width: '100%',
      transition: `border-color ${T.transition.fast}, color ${T.transition.fast}`,
    };

    return html`
      <div style=${{ flex:1, display:'flex', flexDirection:'column' }}>
        <div style=${centerStyle}>
          <span style=${iconStyle}>${icon}</span>
          <h3 style=${titleStyle}>${title}</h3>
          <p style=${msgStyle}>${message}</p>
          <${PrimaryBtn} label="Tentar novamente" onClick=${onRetry} />
          <button style=${retryStyle} onClick=${onClose}>Cancelar</button>
        </div>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────
  // CART DRAWER
  // ─────────────────────────────────────────────────────────────────

  function CartDrawer({ cart, open, onClose, onUpdateQty, onRemove, status, onCheckout, pixData }) {
    const isMobile  = useIsMobile();
    const [view, setView] = useState('cart');

    // Reseta para 'cart' toda vez que fecha
    useEffect(() => {
      if (!open) {
        const id = setTimeout(() => setView('cart'), 300);
        return () => clearTimeout(id);
      }
    }, [open]);

    function handleCheckout(payload) {
      setView('loading');
      onCheckout(payload);
    }

    if (!open) return null;

    const activeView = (status && status !== 'idle') ? status : view;

    const drawerW = isMobile ? '100%' : '420px';

    const backdropStyle = {
      position:   'fixed',
      inset:      0,
      background: T.color.overlayHeavy,
      zIndex:     T.z.drawerBg,
      animation:  'fadeIn 0.25s ease',
    };

    const drawerStyle = {
      position:   'fixed',
      top:        0,
      right:      0,
      bottom:     0,
      width:      drawerW,
      maxWidth:   '100vw',
      zIndex:     T.z.drawer,
      background: T.color.surface,
      borderLeft: `1px solid var(--border)`,
      display:    'flex',
      flexDirection: 'column',
      animation:  'slideIn 0.3s cubic-bezier(0.22,1,0.36,1)',
      boxShadow:  `-8px 0 32px oklch(0% 0 0 / 0.4)`,
    };

    const sharedProps = { cart, onClose, onUpdateQty, onRemove };

    const viewMap = {
      cart:          html`<${ViewCart}        ...${sharedProps} onNext=${() => setView('checkout')} />`,
      checkout:      html`<${ViewCheckout}    ...${sharedProps} onBack=${() => setView('cart')} onCheckout=${handleCheckout} />`,
      loading:       html`<${ViewLoading} />`,
      pix_pending:   html`<${ViewPixPending}  cart=${cart} onClose=${onClose} pixData=${pixData} />`,
      success:       html`<${ViewSuccess}     onClose=${onClose} />`,
      error_card:    html`<${ViewError}
                            icon="💳"
                            title="Falha no pagamento"
                            message="Não foi possível processar seu cartão. Tente outro método ou entre em contato."
                            onRetry=${() => setView('checkout')}
                            onClose=${onClose}
                          />`,
      error_generic: html`<${ViewError}
                            icon="⚠️"
                            title="Erro ao processar"
                            message="Algo deu errado. Tente novamente ou fale conosco pelo WhatsApp."
                            onRetry=${() => setView('checkout')}
                            onClose=${onClose}
                          />`,
    };

    return html`
      <div>
        <div style=${backdropStyle} onClick=${onClose} aria-hidden="true"></div>
        <div
          style=${drawerStyle}
          role="dialog"
          aria-modal="true"
          aria-label="Carrinho de compras"
        >
          ${viewMap[activeView] || viewMap.cart}
        </div>
      </div>
    `;
  }

  window.CartDrawer = CartDrawer;
}());
