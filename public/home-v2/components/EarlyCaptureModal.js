(function () {
  'use strict';

  const { useState, useEffect, useRef } = window.React;
  const html = window.htm.bind(window.React.createElement);
  const T    = window.T;

  function EarlyCaptureModal({ open, onClose }) {
    const [name, setName]         = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const nameRef = useRef(null);

    // Pré-preenche se já houver dados parciais
    useEffect(() => {
      if (open) {
        try {
          const stored = JSON.parse(localStorage.getItem('tocha-customer') || 'null');
          if (stored?.name)     setName(stored.name);
          if (stored?.whatsapp) setWhatsapp(stored.whatsapp);
        } catch {}
        // Foco automático no input nome
        setTimeout(() => nameRef.current?.focus(), 120);
      }
    }, [open]);

    if (!open) return null;

    function handleSubmit() {
      const trimmed = name.trim();
      if (!trimmed) return;
      try {
        localStorage.setItem('tocha-customer', JSON.stringify({
          name:     trimmed,
          whatsapp: whatsapp.trim(),
        }));
      } catch {}
      onClose();
    }

    function handleKey(e) {
      if (e.key === 'Enter') handleSubmit();
      if (e.key === 'Escape') onClose();
    }

    const canSubmit = name.trim().length >= 2;

    // ── Estilos ──────────────────────────────────────────────────

    const backdropStyle = {
      position:   'fixed',
      inset:      0,
      background: T.color.overlayHeavy,
      zIndex:     T.z.modalBg,
      animation:  'fadeIn 0.2s ease',
    };

    // Wrapper posiciona no bottom e centraliza horizontalmente
    const wrapperStyle = {
      position: 'fixed',
      bottom:   0,
      left:     0,
      right:    0,
      display:  'flex',
      justifyContent: 'center',
      zIndex:   T.z.modal,
      pointerEvents: 'none',   // deixa o backdrop clicável nas laterais
    };

    const panelStyle = {
      width:          '100%',
      maxWidth:       '480px',
      background:     T.color.surface,
      borderRadius:   `${T.radius.xl} ${T.radius.xl} 0 0`,
      borderTop:      `1px solid var(--border)`,
      borderLeft:     `1px solid var(--border-subtle)`,
      borderRight:    `1px solid var(--border-subtle)`,
      padding:        `${T.space[8]} ${T.space[8]} ${T.space[10]}`,
      display:        'flex',
      flexDirection:  'column',
      gap:            T.space[6],
      animation:      'slideUp 0.35s cubic-bezier(0.22,1,0.36,1)',
      pointerEvents:  'auto',
    };

    const handleStyle = {
      width:        '36px',
      height:       '4px',
      borderRadius: T.radius.pill,
      background:   T.color.border,
      margin:       `0 auto ${T.space[2]}`,
    };

    const titleStyle = {
      fontFamily:  T.font.serif,
      fontSize:    T.fontSize.h4,
      fontWeight:  T.fontWeight.medium,
      color:       T.color.cream,
      lineHeight:  T.lineHeight.snug,
    };

    const subStyle = {
      fontFamily:  T.font.sans,
      fontSize:    T.fontSize.sm,
      fontWeight:  T.fontWeight.light,
      color:       T.color.textMuted,
      lineHeight:  T.lineHeight.relaxed,
      marginTop:   `-${T.space[3]}`,
    };

    const labelStyle = {
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.xs,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing['2xl'],
      textTransform: 'uppercase',
      color:         T.color.textDim,
      marginBottom:  T.space[2],
      display:       'block',
    };

    const inputStyle = (focused) => ({
      width:        '100%',
      height:       '44px',
      padding:      `0 ${T.space[4]}`,
      borderRadius: T.radius.sm,
      border:       `1px solid ${focused ? T.color.borderFocus : T.color.border}`,
      background:   T.color.bg2,
      color:        T.color.text,
      fontFamily:   T.font.sans,
      fontSize:     T.fontSize.base,
      boxSizing:    'border-box',
      transition:   `border-color ${T.transition.fast}`,
    });

    const skipStyle = {
      background:    'none',
      border:        'none',
      color:         T.color.textDim,
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.xs,
      cursor:        'pointer',
      textAlign:     'center',
      letterSpacing: T.letterSpacing.base,
      padding:       `${T.space[2]} 0 0`,
      transition:    `color ${T.transition.fast}`,
    };

    const btnStyle = (disabled) => ({
      width:         '100%',
      padding:       `14px ${T.space[6]}`,
      borderRadius:  T.radius.pill,
      border:        'none',
      background:    disabled ? T.color.bg3 : T.color.amber,
      color:         disabled ? T.color.textDim : T.color.bg,
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.sm,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing.xl,
      textTransform: 'uppercase',
      cursor:        disabled ? 'default' : 'pointer',
      transition:    `background ${T.transition.fast}`,
    });

    return html`
      <div>
        <div
          style=${backdropStyle}
          onClick=${onClose}
          aria-hidden="true"
        ></div>

        <div style=${wrapperStyle}>
          <div
            style=${panelStyle}
            role="dialog"
            aria-modal="true"
            aria-label="Captura de dados"
            onKeyDown=${handleKey}
          >
            <div style=${handleStyle} aria-hidden="true"></div>

            <div>
              <h2 style=${titleStyle}>Antes de continuar…</h2>
              <p style=${subStyle}>
                Deixe seu nome para personalizarmos sua experiência.
                Prometemos: nada de spam.
              </p>
            </div>

            <${NameField}
              nameRef=${nameRef}
              value=${name}
              onChange=${setName}
              labelStyle=${labelStyle}
              inputStyle=${inputStyle}
            />

            <${WhatsappField}
              value=${whatsapp}
              onChange=${setWhatsapp}
              labelStyle=${labelStyle}
              inputStyle=${inputStyle}
            />

            <div>
              <button
                style=${btnStyle(!canSubmit)}
                onClick=${handleSubmit}
                disabled=${!canSubmit}
              >
                Continuar →
              </button>
              <button
                style=${skipStyle}
                onClick=${onClose}
                onMouseEnter=${e => { e.currentTarget.style.color = T.color.textMuted; }}
                onMouseLeave=${e => { e.currentTarget.style.color = T.color.textDim; }}
              >
                Pular por enquanto
              </button>
            </div>

          </div>
        </div>
      </div>
    `;
  }

  // Campos separados evitam re-render do painel inteiro ao digitar

  function NameField({ nameRef, value, onChange, labelStyle, inputStyle }) {
    const [focused, setFocused] = useState(false);
    return html`
      <div>
        <label style=${labelStyle} htmlFor="ecm-name">Nome</label>
        <input
          id="ecm-name"
          ref=${nameRef}
          type="text"
          placeholder="Como podemos te chamar?"
          value=${value}
          onInput=${e => onChange(e.target.value)}
          onFocus=${() => setFocused(true)}
          onBlur=${()  => setFocused(false)}
          style=${inputStyle(focused)}
          autocomplete="given-name"
        />
      </div>
    `;
  }

  function WhatsappField({ value, onChange, labelStyle, inputStyle }) {
    const [focused, setFocused] = useState(false);
    return html`
      <div>
        <label style=${labelStyle} htmlFor="ecm-wa">
          WhatsApp
          <span style=${{ fontWeight: 400, letterSpacing: 0, textTransform: 'none', marginLeft: '6px', opacity: 0.6 }}>
            (opcional)
          </span>
        </label>
        <input
          id="ecm-wa"
          type="tel"
          placeholder="(21) 9 0000-0000"
          value=${value}
          onInput=${e => onChange(e.target.value)}
          onFocus=${() => setFocused(true)}
          onBlur=${()  => setFocused(false)}
          style=${inputStyle(focused)}
          autocomplete="tel"
        />
      </div>
    `;
  }

  window.EarlyCaptureModal = EarlyCaptureModal;
}());
