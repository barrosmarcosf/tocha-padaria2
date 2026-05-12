/* global React, Ic */
const {
  useState: useStC,
  useEffect: useEffC,
  useCallback: useCbC
} = React;
function PageHead2({
  title,
  subtitle,
  badge,
  right
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sub",
    style: {
      marginBottom: 6
    }
  }, "Admin"), /*#__PURE__*/React.createElement("h1", null, title, badge && /*#__PURE__*/React.createElement("span", {
    className: "page-badge"
  }, badge)), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, subtitle)), right);
}
function Toggle({
  on,
  onChange
}) {
  return /*#__PURE__*/React.createElement("button", {
    className: `toggle ${on ? 'on' : ''}`,
    onClick: () => onChange(!on),
    "aria-pressed": on
  }, /*#__PURE__*/React.createElement("span", {
    className: "toggle-knob"
  }));
}
function MethodRow({
  icon,
  title,
  desc,
  on,
  set,
  accent
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "method-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "method-row-left"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "cb-dim"
  }), /*#__PURE__*/React.createElement("div", {
    className: `method-icon ${accent || ''}`
  }, icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("small", null, desc))), /*#__PURE__*/React.createElement(Toggle, {
    on: on,
    onChange: set
  }));
}

/* ========== FORMAS DE PAGAMENTO ========== */
function PagamentoPage() {
  const [stripeCC, setStripeCC] = useStC(false);
  const [stripePix, setStripePix] = useStC(false);
  const [mpCC, setMpCC] = useStC(true);
  const [mpPix, setMpPix] = useStC(true);
  const [loading, setLoading] = useStC(true);
  const [saving, setSaving] = useStC(false);
  const [msg, setMsg] = useStC('');
  useEffC(() => {
    window.apiGet('/api/admin/config').then(d => {
      const pm = d?.siteContent?.payment_methods;
      if (pm && typeof pm === 'object') {
        setStripeCC(pm.stripe_card !== false && !!pm.stripe_card);
        setStripePix(pm.stripe_pix !== false && !!pm.stripe_pix);
        setMpCC(pm.mp_card !== false);
        setMpPix(pm.mp_pix !== false);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  const handleSave = () => {
    setSaving(true);
    setMsg('');
    const value = {
      stripe_card: stripeCC,
      stripe_pix: stripePix,
      mp_card: mpCC,
      mp_pix: mpPix
    };
    window.apiPost('/api/admin/save-content', {
      key: 'payment_methods',
      value
    }).then(() => setMsg('Configurações salvas! Aplicadas imediatamente no checkout.')).catch(e => setMsg('Erro: ' + e.message)).finally(() => setSaving(false));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PageHead2, {
    title: "Formas de Pagamento",
    subtitle: "Habilite ou desabilite os m\xE9todos oferecidos aos clientes no checkout."
  }), /*#__PURE__*/React.createElement("div", {
    className: "card gateway-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gateway-strip"
  }), /*#__PURE__*/React.createElement("div", {
    className: "gateway-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gateway-logo stripe"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M13.5 9.5c0-.7.6-1 1.5-1 1.3 0 3 .4 4.3 1.1V5.5C17.9 5 16.5 4.8 15 4.8c-3.7 0-6.2 2-6.2 5.2 0 5 6.9 4.2 6.9 6.4 0 .8-.7 1.1-1.7 1.1-1.5 0-3.4-.6-4.8-1.4v4.2c1.6.7 3.2 1 4.8 1 3.8 0 6.3-1.9 6.3-5.1 0-5.4-7-4.4-7-6.7z"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "gateway-meta"
  }, /*#__PURE__*/React.createElement("h3", null, "Stripe Business"), /*#__PURE__*/React.createElement("span", {
    className: "gw-status"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot-up"
  }), " Gateway conectado")), /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost btn-narrow"
  }, "Ajustes no Stripe")), /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "Controle de m\xE9todos"), /*#__PURE__*/React.createElement("div", {
    className: "method-list"
  }, /*#__PURE__*/React.createElement(MethodRow, {
    icon: /*#__PURE__*/React.createElement(Ic.card, null),
    title: "Cart\xF5es de Cr\xE9dito & D\xE9bito",
    desc: "Bandeiras Visa, Mastercard, Elo, etc.",
    on: stripeCC,
    set: setStripeCC
  }), /*#__PURE__*/React.createElement(MethodRow, {
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      width: "16",
      height: "16",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M12 2 22 12 12 22 2 12Z"
    })),
    title: "PIX Instant\xE2neo",
    desc: "Transfer\xEAncias diretas \xB7 Aprova\xE7\xE3o r\xE1pida",
    on: stripePix,
    set: setStripePix
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: handleSave,
    disabled: saving || loading
  }, saving ? 'Salvando…' : 'Salvar configurações'))), /*#__PURE__*/React.createElement("div", {
    className: "card gateway-card mt",
    style: {
      '--gateway-accent': 'oklch(0.72 0.13 220)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "gateway-strip",
    style: {
      background: 'var(--gateway-accent)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "gateway-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gateway-logo mp",
    style: {
      background: 'color-mix(in oklch, var(--gateway-accent) 16%, var(--panel-2))',
      color: 'var(--gateway-accent)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 4c1.4 0 2.7.5 3.7 1.4-1 .4-2.3.6-3.7.6s-2.7-.2-3.7-.6C9.3 6.5 10.6 6 12 6zm0 12c-3.3 0-6-2.7-6-6 0-1 .2-1.9.6-2.7.7.4 1.6.7 2.6.9-.1.2-.2.5-.2.8 0 1.7 1.4 3 3 3s3-1.3 3-3c0-.3-.1-.6-.2-.8 1-.2 1.9-.5 2.6-.9.4.8.6 1.7.6 2.7 0 3.3-2.7 6-6 6z"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "gateway-meta"
  }, /*#__PURE__*/React.createElement("h3", null, "Mercado Pago"), /*#__PURE__*/React.createElement("span", {
    className: "gw-status"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot-up"
  }), " Gateway conectado")), /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost btn-narrow"
  }, "Ajustes no MP")), /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "M\xE9todos Mercado Pago"), /*#__PURE__*/React.createElement("div", {
    className: "method-list"
  }, /*#__PURE__*/React.createElement(MethodRow, {
    icon: /*#__PURE__*/React.createElement(Ic.card, null),
    title: "Cart\xE3o de Cr\xE9dito/D\xE9bito",
    desc: "Checkout transparente \xB7 Desativa Stripe automaticamente",
    on: mpCC,
    set: setMpCC,
    accent: "info"
  }), /*#__PURE__*/React.createElement(MethodRow, {
    icon: /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      width: "16",
      height: "16",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M12 2 22 12 12 22 2 12Z"
    })),
    title: "PIX",
    desc: "QR Code autom\xE1tico via Mercado Pago",
    on: mpPix,
    set: setMpPix,
    accent: "info"
  })), /*#__PURE__*/React.createElement("div", {
    className: "info-box"
  }, /*#__PURE__*/React.createElement(Ic.info, null), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Cart\xE3o MP e Stripe s\xE3o mutuamente exclusivos"), " \u2014 ativar um desativa o outro automaticamente. PIX usa QR Code gerado pelo Mercado Pago.")), /*#__PURE__*/React.createElement("div", {
    className: "info-box muted mt-sm"
  }, /*#__PURE__*/React.createElement(Ic.shield, null), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Aplica\xE7\xE3o Imediata & Segura."), " O nosso backend se conecta com o Stripe e injeta os m\xE9todos na cria\xE7\xE3o da sess\xE3o. Se voc\xEA desabilitar um m\xE9todo aqui, ", /*#__PURE__*/React.createElement("b", null, "ele sequer ser\xE1 enviado para o processador de pagamento"), ", tornando qualquer inje\xE7\xE3o for\xE7ada imposs\xEDvel na camada de frontend.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: handleSave,
    disabled: saving || loading
  }, saving ? 'Salvando…' : 'Salvar configurações'))), msg && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      fontSize: 13,
      marginTop: 12,
      color: msg.startsWith('Erro') ? 'var(--down)' : 'var(--up)'
    }
  }, msg));
}

/* ========== HORÁRIO / CICLOS DE VENDA ========== */
function fmtForInput(dateStr) {
  if (!dateStr) return '';
  const [datePart, timePart] = dateStr.split('T');
  if (!datePart) return '';
  const [y, m, d] = datePart.split('-');
  const base = `${d}/${m}/${y}`;
  if (timePart) return `${base} ${timePart.slice(0, 5)}`;
  return base;
}
function parseInputToISO(str) {
  if (!str) return '';
  const [datePart, timePart] = str.trim().split(' ');
  const parts = datePart.split('/');
  if (parts.length !== 3) return str;
  const [d, m, y] = parts;
  return timePart ? `${y}-${m}-${d}T${timePart}` : `${y}-${m}-${d}`;
}
function calcTimeLeft(endStr) {
  if (!endStr) return null;
  const end = new Date(endStr.includes('T') ? endStr : endStr + 'T23:59:59');
  const diff = end.getTime() - Date.now();
  if (diff <= 0) return 'Encerrado';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff % 86400000 / 3600000);
  const mins = Math.floor(diff % 3600000 / 60000);
  return `${days}d ${hours}h ${mins}min`;
}
function HorarioPage() {
  const [auto, setAuto] = useStC(true);
  const [loading, setLoading] = useStC(true);
  const [saving, setSaving] = useStC(false);
  const [savedMsg, setSavedMsg] = useStC('');
  const [config, setConfig] = useStC(null);
  const [curr, setCurr] = useStC({
    prodDate: '',
    winStart: '',
    winEnd: ''
  });
  const [next, setNext] = useStC({
    prodDate: '',
    winStart: '',
    winEnd: ''
  });
  const load = useCbC(() => {
    window.apiGet('/api/admin/config').then(d => {
      const oh = d?.siteContent?.opening_hours || {};
      setConfig(oh);
      setAuto(!oh.manualBlock);
      if (oh.currentBatch) {
        setCurr({
          prodDate: fmtForInput(oh.currentBatch.bakeDate),
          winStart: fmtForInput(oh.currentBatch.start),
          winEnd: fmtForInput(oh.currentBatch.end)
        });
      }
      if (oh.nextBatch) {
        setNext({
          prodDate: fmtForInput(oh.nextBatch.bakeDate),
          winStart: fmtForInput(oh.nextBatch.start),
          winEnd: fmtForInput(oh.nextBatch.end)
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffC(() => {
    load();
  }, [load]);
  const handleSave = () => {
    setSaving(true);
    setSavedMsg('');
    const updated = {
      ...(config || {}),
      manualBlock: !auto,
      currentBatch: {
        bakeDate: parseInputToISO(curr.prodDate),
        start: parseInputToISO(curr.winStart),
        end: parseInputToISO(curr.winEnd)
      },
      nextBatch: {
        bakeDate: parseInputToISO(next.prodDate),
        start: parseInputToISO(next.winStart),
        end: parseInputToISO(next.winEnd)
      }
    };
    window.apiPost('/api/admin/save-content', {
      key: 'opening_hours',
      value: updated
    }).then(() => {
      setConfig(updated);
      setSavedMsg('Configuração salva com sucesso!');
    }).catch(e => setSavedMsg('Erro: ' + e.message)).finally(() => setSaving(false));
  };
  const currentEnd = config?.currentBatch?.end;
  const timeLeft = calcTimeLeft(currentEnd);
  const currentBakeLabel = curr.prodDate || '—';
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PageHead2, {
    title: "Ciclos de Venda",
    subtitle: "Gerencia janelas de pedidos e datas de produ\xE7\xE3o."
  }), /*#__PURE__*/React.createElement("div", {
    className: "card op-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "op-auto-icon"
  }, /*#__PURE__*/React.createElement(Ic.spark, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--display)',
      fontWeight: 400,
      fontSize: 18,
      color: 'var(--ink)'
    }
  }, "Opera\xE7\xE3o autom\xE1tica"), /*#__PURE__*/React.createElement("small", {
    style: {
      color: 'var(--ink-3)',
      fontSize: 12
    }
  }, "O fechamento manual ignora as janelas abaixo.")), /*#__PURE__*/React.createElement(Toggle, {
    on: auto,
    onChange: setAuto
  })), loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state",
    style: {
      height: 160
    }
  }, /*#__PURE__*/React.createElement(Ic.clock, null), /*#__PURE__*/React.createElement("div", null, "Carregando configura\xE7\xE3o\u2026")) : /*#__PURE__*/React.createElement("div", {
    className: "grid mt",
    style: {
      gridTemplateColumns: '1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(CycleCard, {
    num: "1",
    label: "Fornada atual",
    values: curr,
    onChange: setCurr
  }), /*#__PURE__*/React.createElement(CycleCard, {
    num: "2",
    label: "Pr\xF3xima fornada",
    values: next,
    onChange: setNext
  })), !loading && /*#__PURE__*/React.createElement("div", {
    className: "card mt status-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "status-card-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "status-pill"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot-up"
  }), " Status calculado \xB7 ", /*#__PURE__*/React.createElement("b", null, "Fornada atual")), /*#__PURE__*/React.createElement("div", {
    className: "status-text"
  }, /*#__PURE__*/React.createElement(Ic.clock, null), " ", /*#__PURE__*/React.createElement("b", null, "Comunica\xE7\xE3o para o cliente:"), " Pedidos abertos para este s\xE1bado \u2014", ' ', /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--gold)'
    }
  }, currentBakeLabel), timeLeft && /*#__PURE__*/React.createElement(React.Fragment, null, " \u2014 Encerra em ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--gold)'
    }
  }, timeLeft))))), savedMsg && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      color: savedMsg.startsWith('Erro') ? 'var(--down)' : 'var(--up)',
      fontSize: 13,
      marginTop: 12
    }
  }, savedMsg), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    style: {
      flex: 'none',
      padding: '8px 16px'
    },
    onClick: load
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: handleSave,
    disabled: saving
  }, saving ? 'Salvando…' : 'Salvar')));
}
function CycleCard({
  num,
  label,
  values,
  onChange
}) {
  const set = field => e => onChange(prev => ({
    ...prev,
    [field]: e.target.value
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "card cycle-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cycle-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cycle-num"
  }, "Ciclo ", num), /*#__PURE__*/React.createElement("h3", null, label)), /*#__PURE__*/React.createElement("div", {
    className: "cycle-field"
  }, /*#__PURE__*/React.createElement("label", null, "Data da produ\xE7\xE3o ", /*#__PURE__*/React.createElement("small", null, "(exibida ao cliente)")), /*#__PURE__*/React.createElement("input", {
    className: "date-input lg",
    type: "text",
    value: values.prodDate,
    onChange: set('prodDate'),
    placeholder: "DD/MM/AAAA"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid row-2 cycle-fields"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cycle-field"
  }, /*#__PURE__*/React.createElement("label", null, "In\xEDcio da janela"), /*#__PURE__*/React.createElement("input", {
    className: "date-input lg",
    type: "text",
    value: values.winStart,
    onChange: set('winStart'),
    placeholder: "DD/MM/AAAA HH:MM"
  })), /*#__PURE__*/React.createElement("div", {
    className: "cycle-field"
  }, /*#__PURE__*/React.createElement("label", null, "Fim da janela"), /*#__PURE__*/React.createElement("input", {
    className: "date-input lg",
    type: "text",
    value: values.winEnd,
    onChange: set('winEnd'),
    placeholder: "DD/MM/AAAA HH:MM"
  }))));
}

/* ========== HOME PAGE EDITOR ========== */
function BannerEditor({
  index,
  defaults,
  active,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `card banner-card ${active ? 'on' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "banner-card-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "cycle-num"
  }, "Banner ", index), active && /*#__PURE__*/React.createElement("span", {
    className: "tag up",
    style: {
      marginLeft: 8
    }
  }, "EM USO")), /*#__PURE__*/React.createElement("button", {
    className: `btn-${active ? 'ghost' : 'primary'} btn-narrow`,
    onClick: onSelect,
    disabled: active
  }, active ? 'Selecionado' : 'Usar este banner')), /*#__PURE__*/React.createElement("div", {
    className: "grid hp-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hp-form"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "Conte\xFAdo"), /*#__PURE__*/React.createElement("div", {
    className: "form-row"
  }, /*#__PURE__*/React.createElement("label", null, "Texto curto superior", /*#__PURE__*/React.createElement("small", {
    className: "ref-tag green"
  }, "Ref. ret\xE2ngulo verde")), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    defaultValue: defaults.kicker
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-row"
  }, /*#__PURE__*/React.createElement("label", null, "T\xEDtulo principal grande", /*#__PURE__*/React.createElement("small", {
    className: "ref-tag red"
  }, "Ref. ret\xE2ngulo vermelho")), /*#__PURE__*/React.createElement("textarea", {
    className: "inp",
    rows: 3,
    defaultValue: defaults.title
  }), /*#__PURE__*/React.createElement("small", {
    className: "hint"
  }, "Use asteriscos para destacar o texto em dourado. Ex: *transforma*")), /*#__PURE__*/React.createElement("div", {
    className: "form-row"
  }, /*#__PURE__*/React.createElement("label", null, "Texto descritivo", /*#__PURE__*/React.createElement("small", {
    className: "ref-tag purple"
  }, "Ref. ret\xE2ngulo roxo")), /*#__PURE__*/React.createElement("textarea", {
    className: "inp",
    rows: 3,
    defaultValue: defaults.desc
  }))), /*#__PURE__*/React.createElement("div", {
    className: "hp-preview"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "Imagem principal"), /*#__PURE__*/React.createElement("div", {
    className: "hp-image"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hp-image-inner"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 100 100",
    width: "56",
    height: "56",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5",
    style: {
      color: 'var(--gold)'
    }
  }, /*#__PURE__*/React.createElement("ellipse", {
    cx: "50",
    cy: "55",
    rx: "32",
    ry: "20"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 55 Q 50 30 78 55"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M35 50 Q 50 60 65 50"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      display: 'block',
      fontFamily: 'var(--display)',
      fontSize: 16,
      fontWeight: 400,
      color: 'var(--ink)',
      marginBottom: 4
    }
  }, "Imagem principal"), /*#__PURE__*/React.createElement("small", {
    style: {
      color: 'var(--ink-4)',
      fontSize: 11
    }
  }, "Substitui a imagem de fundo"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost btn-narrow"
  }, "Substituir imagem"))))));
}
function HomePageCfgPage() {
  const [active, setActive] = useStC(1);
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PageHead2, {
    title: "Configura\xE7\xE3o Home Page",
    subtitle: "Configure ambos os banners e escolha qual ser\xE1 exibido na home do site."
  }), /*#__PURE__*/React.createElement("div", {
    className: "grid mt",
    style: {
      gridTemplateColumns: '1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(BannerEditor, {
    index: 1,
    active: active === 1,
    onSelect: () => setActive(1),
    defaults: {
      kicker: 'Fermentação Natural',
      title: 'O pão que\ntransforma\no seu dia',
      desc: 'Cada pão nasce de levain vivo, farinha de qualidade e tempo; não tem atalho, tem respeito.'
    }
  }), /*#__PURE__*/React.createElement(BannerEditor, {
    index: 2,
    active: active === 2,
    onSelect: () => setActive(2),
    defaults: {
      kicker: 'Fornada de Sábado',
      title: 'Reserve sua\nfornada da\nsemana',
      desc: 'Pedidos abertos até sexta-feira às 16h. Retirada sábado a partir das 9h, ainda quente da pedra.'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost btn-narrow"
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary"
  }, "Atualizar Home Page")));
}

/* ========== SOBRE A LOJA ========== */
function LojaPage() {
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(PageHead2, {
    title: "Sobre a Loja",
    subtitle: "Informa\xE7\xF5es p\xFAblicas exibidas no site da loja."
  }), /*#__PURE__*/React.createElement("div", {
    className: "card link-pill"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", {
    className: "kv-l"
  }, "Meu link"), /*#__PURE__*/React.createElement("a", {
    className: "link-id",
    style: {
      fontSize: 15
    }
  }, "https://tochapadaria.com")), /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost btn-narrow"
  }, "Editar")), /*#__PURE__*/React.createElement("div", {
    className: "card mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "Identidade"), /*#__PURE__*/React.createElement("div", {
    className: "grid row-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-row"
  }, /*#__PURE__*/React.createElement("label", null, "Nome do estabelecimento"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    defaultValue: "TOCHA PADARIA"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-row"
  }, /*#__PURE__*/React.createElement("label", null, "Estilo de culin\xE1ria"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    defaultValue: "Padaria & Conveni\xEAncia"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "form-row"
  }, /*#__PURE__*/React.createElement("label", null, "T\xEDtulo"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    placeholder: "Ex: Nossa Hist\xF3ria"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-row"
  }, /*#__PURE__*/React.createElement("label", null, "Nossa hist\xF3ria"), /*#__PURE__*/React.createElement("textarea", {
    className: "inp",
    rows: 5,
    placeholder: "Conte a hist\xF3ria da padaria\u2026"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "card mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "Localiza\xE7\xE3o"), /*#__PURE__*/React.createElement("div", {
    className: "form-row"
  }, /*#__PURE__*/React.createElement("label", null, "Endere\xE7o"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    defaultValue: "Av. Presidente Kennedy, 672 \u2014 Vila Jurandir, S\xE3o Jo\xE3o de Meriti."
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-primary"
  }, "Salvar")));
}
window.PagamentoPage = PagamentoPage;
window.HorarioPage = HorarioPage;
window.HomePageCfgPage = HomePageCfgPage;
window.LojaPage = LojaPage;