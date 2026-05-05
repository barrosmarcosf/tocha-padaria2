// ============================================================
// EARLY CAPTURE MODAL
// ============================================================
const html = window.html;

function EarlyCaptureModal({ open, onConfirm, onClose }) {
  const [form, setForm] = React.useState({ name: '', whatsapp: '' });
  const [errors, setErrors] = React.useState({});

  if (!open) return null;

  function validate() {
    const e = {};
    if (form.whatsapp.trim() && !form.whatsapp.replace(/\D/g, '').match(/^\d{10,11}$/)) {
      e.whatsapp = 'Formato inválido (ex: 21 99999-9999)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const inp = {
    width: '100%', padding: '13px 14px',
    background: 'oklch(18% 0.02 48)',
    border: '1px solid oklch(30% 0.02 50)',
    borderRadius: 6, color: 'oklch(92% 0.012 70)',
    fontSize: 15, fontFamily: 'var(--font-sans)',
    outline: 'none', transition: 'border-color 0.2s'
  };

  return html`
    <div>
      <div
        onClick=${onClose}
        style=${{
          position: 'fixed', inset: 0,
          background: 'oklch(0% 0 0 / 0.7)',
          backdropFilter: 'blur(6px)',
          zIndex: 300, animation: 'fadeIn 0.2s ease'
        }}
      ></div>

      <div style=${{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 301,
        background: 'oklch(14% 0.02 48)',
        borderTop: '1px solid oklch(28% 0.02 50)',
        borderRadius: '20px 20px 0 0',
        padding: '28px 24px 36px',
        animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        maxWidth: 480, margin: '0 auto'
      }}>

        <div style=${{ width: 36, height: 4, background: 'oklch(35% 0.02 50)', borderRadius: 2, margin: '0 auto 24px' }}></div>

        <h3 style=${{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 20, color: 'var(--cream)' }}>
          Ótima escolha! 🍞
        </h3>

        <input
          type="text"
          placeholder="Seu nome"
          value=${form.name}
          onInput=${(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          style=${inp}
        />

        <input
          type="tel"
          placeholder="(21) 99999-9999"
          value=${form.whatsapp}
          onInput=${(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
          style=${{ ...inp, marginTop: 10 }}
        />

        ${errors.whatsapp && html`
          <div style=${{ color: 'var(--error)', fontSize: 12, marginTop: 6 }}>
            ${errors.whatsapp}
          </div>
        `}

        <button
          onClick=${() => { if (validate()) onConfirm(form); }}
          style=${{
            marginTop: 16, width: '100%', padding: '14px',
            background: 'var(--amber)', color: 'oklch(12% 0.018 50)',
            border: 'none', borderRadius: 6, cursor: 'pointer',
            fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-sans)'
          }}
        >
          Adicionar ao pedido →
        </button>

        <button
          onClick=${() => onConfirm({ name: '', whatsapp: '' })}
          style=${{
            marginTop: 8, width: '100%', padding: '10px',
            background: 'none', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer',
            fontSize: 13, fontFamily: 'var(--font-sans)'
          }}
        >
          Pular →
        </button>

        <button
          onClick=${onClose}
          style=${{
            marginTop: 4, width: '100%', padding: '10px',
            background: 'none', border: 'none',
            color: 'var(--text-dim)', cursor: 'pointer',
            fontSize: 13, fontFamily: 'var(--font-sans)'
          }}
        >
          Cancelar
        </button>

      </div>
    </div>
  `;
}

window.EarlyCaptureModal = EarlyCaptureModal;
