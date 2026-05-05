// ============================================================
// CART DRAWER
// ============================================================
(function () {
  const html = window.html;

  function CartDrawer({ open, cart, onClose, onUpdateQty, onRemove, customerInfo, onUpdateCustomer }) {
    if (!open) return null;

    const total = (cart || []).reduce((s, i) => s + i.price * i.qty, 0);

    function fmt(v) {
      return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
    }

    const drawerStyle = {
      position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end'
    };

    const overlayStyle = {
      position: 'absolute', inset: 0, background: 'oklch(0% 0 0 / 0.65)'
    };

    const panelStyle = {
      position: 'relative', width: '100%', maxWidth: 420,
      background: 'oklch(13% 0.02 48)',
      display: 'flex', flexDirection: 'column',
      boxShadow: '-8px 0 32px oklch(0% 0 0 / 0.5)',
      animation: 'slideIn 0.3s ease'
    };

    const headerStyle = {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 24px',
      borderBottom: '1px solid oklch(26% 0.02 50)'
    };

    return html`
      <div style=${drawerStyle}>
        <div style=${overlayStyle} onClick=${onClose}></div>
        <div style=${panelStyle}>

          <div style=${headerStyle}>
            <h2 style=${{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--cream)', fontWeight: 500 }}>
              Meu Pedido
            </h2>
            <button
              onClick=${onClose}
              style=${{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 24, lineHeight: 1,
                padding: 4
              }}
            >×</button>
          </div>

          <div style=${{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
            ${cart && cart.length > 0
              ? cart.map((item) => html`
                  <div key=${item.id} style=${{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 0',
                    borderBottom: '1px solid oklch(22% 0.02 50)'
                  }}>
                    <div style=${{ flex: 1 }}>
                      <div style=${{ color: 'var(--cream)', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                        ${item.name}
                      </div>
                      <div style=${{ color: 'var(--amber)', fontSize: 13, fontWeight: 600 }}>
                        ${fmt(item.price * item.qty)}
                      </div>
                    </div>
                    <div style=${{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick=${() => onUpdateQty(item.id, item.qty - 1)}
                        style=${{
                          width: 28, height: 28, border: '1px solid oklch(30% 0.02 50)',
                          background: 'none', color: 'var(--text)', cursor: 'pointer',
                          borderRadius: 4, fontSize: 16, display: 'flex',
                          alignItems: 'center', justifyContent: 'center'
                        }}
                      >−</button>
                      <span style=${{ color: 'var(--text)', minWidth: 20, textAlign: 'center' }}>
                        ${item.qty}
                      </span>
                      <button
                        onClick=${() => onUpdateQty(item.id, item.qty + 1)}
                        style=${{
                          width: 28, height: 28, border: '1px solid oklch(30% 0.02 50)',
                          background: 'none', color: 'var(--text)', cursor: 'pointer',
                          borderRadius: 4, fontSize: 16, display: 'flex',
                          alignItems: 'center', justifyContent: 'center'
                        }}
                      >+</button>
                      <button
                        onClick=${() => onRemove(item.id)}
                        style=${{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-dim)', fontSize: 16, padding: '0 4px'
                        }}
                      >✕</button>
                    </div>
                  </div>
                `)
              : html`
                  <div style=${{
                    textAlign: 'center', padding: '48px 0',
                    color: 'var(--text-muted)'
                  }}>
                    <div style=${{ fontSize: 40, marginBottom: 16 }}>🧺</div>
                    <p>Seu pedido está vazio.</p>
                  </div>
                `
            }
          </div>

          ${cart && cart.length > 0 && html`
            <div style=${{ padding: '16px 24px', borderTop: '1px solid oklch(26% 0.02 50)' }}>
              <div style=${{
                display: 'flex', justifyContent: 'space-between',
                marginBottom: 16, fontSize: 16
              }}>
                <span style=${{ color: 'var(--text-muted)' }}>Total</span>
                <strong style=${{ color: 'var(--amber)' }}>${fmt(total)}</strong>
              </div>
              <a
                href=${'https://wa.me/5521966278965?text=' + encodeURIComponent(
                  'Olá! Quero fazer um pedido:\n' +
                  (cart || []).map(i => '• ' + i.name + ' x' + i.qty + ' — R$ ' + (i.price * i.qty).toFixed(2).replace('.', ',')).join('\n') +
                  '\n\nTotal: ' + fmt(total)
                )}
                target="_blank"
                rel="noopener noreferrer"
                style=${{
                  display: 'block', width: '100%', padding: '15px',
                  background: 'oklch(60% 0.16 145)', color: '#fff',
                  textDecoration: 'none', textAlign: 'center',
                  borderRadius: 6, fontWeight: 700, fontSize: 15,
                  fontFamily: 'var(--font-sans)', letterSpacing: '0.04em'
                }}
              >
                Pedir via WhatsApp
              </a>
            </div>
          `}

        </div>
      </div>
    `;
  }

  window.CartDrawer = CartDrawer;
}());
