// ============================================================
// EARLY CAPTURE MODAL — pede nome+WhatsApp no primeiro add
// ============================================================
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

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'oklch(0% 0 0 / 0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 300, animation: 'fadeIn 0.2s ease'
      }} />

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 301,
        background: 'oklch(14% 0.02 48)',
        borderTop: '1px solid oklch(28% 0.02 50)',
        borderRadius: '20px 20px 0 0',
        padding: '28px 24px 36px',
        animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        maxWidth: 480, margin: '0 auto'
      }}>

        <div style={{ width: 36, height: 4, background: 'oklch(35% 0.02 50)', borderRadius: 2, margin: '0 auto 24px' }} />

        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22 }}>Ótima escolha! 🍞</h3>

        <input
          type="text"
          placeholder="Seu nome"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          style={inp}
        />

        <input
          type="tel"
          placeholder="(21) 99999-9999"
          value={form.whatsapp}
          onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
          style={{ ...inp, marginTop: 10 }}
        />

        {errors.whatsapp && (
          <div style={{ color: 'red', fontSize: 12 }}>{errors.whatsapp}</div>
        )}

        <button
          onClick={() => { if (validate()) onConfirm(form); }}
          style={{ marginTop: 16 }}
        >
          Adicionar ao pedido →
        </button>

        <button onClick={() => onConfirm({ name: '', whatsapp: '' })}>
          Pular →
        </button>

        <button onClick={onClose}>
          Cancelar
        </button>

      </div>
    </>
  );
}

window.EarlyCaptureModal = EarlyCaptureModal;