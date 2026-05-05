(function () {
  'use strict';

  const html = window.htm.bind(window.React.createElement);
  const T    = window.T;

  // ── Dados ───────────────────────────────────────────────────────

  const STEPS = [
    {
      num:  '01',
      title: 'Escolha',
      desc:  'Navegue pelo cardápio e escolha os pães que vão fazer o seu fim de semana especial.',
    },
    {
      num:  '02',
      title: 'Agende',
      desc:  'Confirme seu pedido pelo WhatsApp até quinta-feira à noite.',
    },
    {
      num:  '03',
      title: 'Produção',
      desc:  'Seus pães são preparados frescos com fermentação lenta de 18 horas.',
    },
    {
      num:  '04',
      title: 'Retire',
      desc:  'Retire na sexta ou sábado no local combinado, ainda com aroma de forno.',
    },
  ];

  const PICKUP = [
    { icon: '📍', label: 'Endereço', value: 'São João de Meriti, RJ' },
    { icon: '🕐', label: 'Horário',  value: 'Sábados, 8h às 13h'     },
    { icon: '📱', label: 'Pedidos',  value: 'WhatsApp até quinta'     },
  ];

  const POLICY = [
    'Pedidos confirmados até quinta-feira às 22h.',
    'Pagamento via PIX antecipado — pedido confirmado após comprovante.',
    'Cancelamentos aceitos até 24h antes da fornada.',
    'Produção limitada — garanta seu pão com antecedência.',
  ];

  // ── Sub-componentes ─────────────────────────────────────────────

  function StepCard({ step }) {
    const { useState } = window.React;
    const [hovered, setHovered] = useState(false);

    const cardStyle = {
      background:   T.color.surface,
      border:       `1px solid ${hovered ? T.color.borderHover : T.color.border}`,
      borderRadius: T.radius.card,
      padding:      T.space.cardPad,
      display:      'flex',
      flexDirection:'column',
      gap:          T.space[4],
      transition:   `border-color ${T.transition.base}, transform ${T.transition.base}`,
      transform:    hovered ? 'translateY(-3px)' : 'translateY(0)',
    };

    const numStyle = {
      fontFamily:    T.font.serif,
      fontSize:      T.fontSize.h4,
      fontWeight:    T.fontWeight.regular,
      color:         T.color.amber,
      lineHeight:    1,
      opacity:       0.9,
    };

    const titleStyle = {
      fontFamily:    T.font.serif,
      fontSize:      T.fontSize['2xl'],
      fontWeight:    T.fontWeight.medium,
      color:         T.color.cream,
      lineHeight:    T.lineHeight.snug,
    };

    const descStyle = {
      fontFamily:  T.font.sans,
      fontSize:    T.fontSize.base,
      fontWeight:  T.fontWeight.light,
      color:       T.color.textMuted,
      lineHeight:  T.lineHeight.relaxed,
    };

    return html`
      <div
        style=${cardStyle}
        onMouseEnter=${() => setHovered(true)}
        onMouseLeave=${() => setHovered(false)}
      >
        <span style=${numStyle}>${step.num}</span>
        <h3 style=${titleStyle}>${step.title}</h3>
        <p style=${descStyle}>${step.desc}</p>
      </div>
    `;
  }

  function PickupItem({ item }) {
    const itemStyle = {
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      textAlign:      'center',
      gap:            T.space[3],
      padding:        T.space[8],
      background:     T.color.bg3,
      borderRadius:   T.radius.card,
      border:         `1px solid var(--border-subtle)`,
    };

    const iconStyle = {
      fontSize:   '28px',
      lineHeight: 1,
    };

    const labelStyle = {
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.tag,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing['3xl'],
      textTransform: 'uppercase',
      color:         T.color.amber,
    };

    const valueStyle = {
      fontFamily:  T.font.sans,
      fontSize:    T.fontSize.md,
      fontWeight:  T.fontWeight.medium,
      color:       T.color.text,
      lineHeight:  T.lineHeight.snug,
    };

    return html`
      <div style=${itemStyle}>
        <span style=${iconStyle} aria-hidden="true">${item.icon}</span>
        <span style=${labelStyle}>${item.label}</span>
        <span style=${valueStyle}>${item.value}</span>
      </div>
    `;
  }

  // ── Seção principal ─────────────────────────────────────────────

  function HowItWorksSection() {

    const sectionStyle = {
      padding:    T.space.sectionPad,
      background: T.color.bg,
    };

    const containerStyle = {
      maxWidth: T.space.containerMd,
      margin:   '0 auto',
      padding:  T.space.containerPad,
    };

    // ── Cabeçalho ──────────────────────────────────────────────────

    const headerStyle = {
      textAlign:    'center',
      marginBottom: T.space[16],
    };

    const eyebrowStyle = {
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.xs,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing['4xl'],
      textTransform: 'uppercase',
      color:         T.color.amber,
      marginBottom:  T.space[4],
    };

    const titleStyle = {
      fontFamily:  T.font.serif,
      fontSize:    T.fontSize.h2,
      fontWeight:  T.fontWeight.regular,
      lineHeight:  T.lineHeight.tight,
      color:       T.color.cream,
    };

    // ── Grid de passos ─────────────────────────────────────────────

    const stepsGridStyle = {
      display:             'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap:                 T.space.gridMd,
      marginBottom:        T.space[16],
    };

    // ── Bloco Retirada ─────────────────────────────────────────────

    const pickupWrapStyle = {
      marginBottom: T.space[12],
    };

    const pickupLabelStyle = {
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.xs,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing['3xl'],
      textTransform: 'uppercase',
      color:         T.color.textDim,
      marginBottom:  T.space[6],
      textAlign:     'center',
    };

    const pickupGridStyle = {
      display:             'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap:                 T.space.grid,
    };

    // ── Bloco Política ─────────────────────────────────────────────

    const policyBoxStyle = {
      border:       `1px solid var(--border)`,
      borderRadius: T.radius.card,
      padding:      `${T.space[8]} ${T.space[10]}`,
      background:   T.color.bg2,
    };

    const policyTitleStyle = {
      fontFamily:    T.font.sans,
      fontSize:      T.fontSize.xs,
      fontWeight:    T.fontWeight.semibold,
      letterSpacing: T.letterSpacing['3xl'],
      textTransform: 'uppercase',
      color:         T.color.textDim,
      marginBottom:  T.space[5],
    };

    const policyListStyle = {
      display:       'flex',
      flexDirection: 'column',
      gap:           T.space[3],
      listStyle:     'none',
    };

    const policyItemStyle = {
      fontFamily:  T.font.sans,
      fontSize:    T.fontSize.sm,
      fontWeight:  T.fontWeight.regular,
      color:       T.color.textMuted,
      lineHeight:  T.lineHeight.relaxed,
      paddingLeft: T.space[5],
      position:    'relative',
    };

    const policyDotStyle = {
      position:   'absolute',
      left:       0,
      top:        '7px',
      width:      '4px',
      height:     '4px',
      borderRadius: T.radius.circle,
      background: T.color.amber,
      opacity:    0.6,
    };

    return html`
      <section id="como-funciona" style=${sectionStyle}>
        <div style=${containerStyle}>

          <!-- Cabeçalho -->
          <header style=${headerStyle}>
            <p style=${eyebrowStyle}>Como funciona</p>
            <h2 style=${titleStyle}>Quatro passos até a sua mesa</h2>
          </header>

          <!-- Grid de passos -->
          <div style=${stepsGridStyle}>
            ${STEPS.map(step => html`<${StepCard} key=${step.num} step=${step} />`)}
          </div>

          <!-- Retirada -->
          <div style=${pickupWrapStyle}>
            <p style=${pickupLabelStyle}>Retirada</p>
            <div style=${pickupGridStyle}>
              ${PICKUP.map(item => html`<${PickupItem} key=${item.label} item=${item} />`)}
            </div>
          </div>

          <!-- Política -->
          <div style=${policyBoxStyle}>
            <p style=${policyTitleStyle}>Política de pedidos</p>
            <ul style=${policyListStyle}>
              ${POLICY.map((line, i) => html`
                <li key=${i} style=${policyItemStyle}>
                  <span style=${policyDotStyle} aria-hidden="true"></span>
                  ${line}
                </li>
              `)}
            </ul>
          </div>

        </div>
      </section>
    `;
  }

  window.HowItWorksSection = HowItWorksSection;
}());
