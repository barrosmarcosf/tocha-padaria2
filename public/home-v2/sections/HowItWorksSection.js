// ============================================================
// HOW IT WORKS SECTION
// ============================================================
(function () {
  const html = window.html;

  const HOW_STEPS = [
    { n: '01', label: 'Pedido', title: 'Peça com antecedência', desc: 'Pedidos abertos de domingo a quinta-feira, até às 16h.', meta: 'Dom – Qui · até 16h' },
    { n: '02', label: 'Produção', title: 'Fornada de sábado', desc: 'Produzimos sob demanda na manhã do sábado. Cada pedido recebe seu lugar no forno.', meta: 'Sábado · sob demanda' },
    { n: '03', label: 'Aviso', title: 'Mensagem no WhatsApp', desc: 'Quando seu pedido estiver pronto, você recebe um aviso com instruções de retirada.', meta: 'Notificação por WhatsApp' },
    { n: '04', label: 'Retirada', title: 'Retire a partir das 15h', desc: 'Presencial em São João de Meriti ou via 99 / Uber Flash por sua conta.', meta: 'Sábado · a partir 15h' }
  ];

  const RETIRADA_ITEMS = [
    { title: 'Não entregamos', desc: 'Trabalhamos só com retirada — sem serviço de delivery próprio.' },
    { title: 'Por conta do cliente', desc: 'Opções 99 ou Uber Flash são coordenadas e pagas pelo cliente.' },
    { title: 'Retire após aviso', desc: 'Aguarde a confirmação por WhatsApp antes de se deslocar até nós.' }
  ];

  const POLITICA_ITEM = {
    title: 'Sem reembolso após início da produção',
    desc: 'Como produzimos sob demanda, não conseguimos reverter um pedido depois que a fornada começa.'
  };

  function HowItWorksSection() {
    const sectionRef = React.useRef(null);
    const [visibleSteps, setVisibleSteps] = React.useState([false, false, false, false]);
    const [infoVisible, setInfoVisible] = React.useState(false);
    const infoRef = React.useRef(null);

    React.useEffect(() => {
      const el = sectionRef.current;
      if (!el) return;

      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          HOW_STEPS.forEach((_, i) => {
            setTimeout(() => {
              setVisibleSteps((prev) => {
                const next = [...prev];
                next[i] = true;
                return next;
              });
            }, i * 180);
          });
          obs.disconnect();
        }
      }, { threshold: 0.15 });

      obs.observe(el);
      return () => obs.disconnect();
    }, []);

    React.useEffect(() => {
      const el = infoRef.current;
      if (!el) return;

      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setInfoVisible(true);
          obs.disconnect();
        }
      }, { threshold: 0.1 });

      obs.observe(el);
      return () => obs.disconnect();
    }, []);

    return html`
      <section id="como-funciona" ref=${sectionRef} style=${{
        padding: '88px 0 80px',
        background: 'var(--bg2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style=${{ maxWidth: 1500, margin: '0 auto', padding: '0 56px' }}>

          <div style=${{ marginBottom: 64, maxWidth: 760 }}>
            <div style=${{
              fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--amber)', marginBottom: 16, fontWeight: 600
            }}>
              Como funciona
            </div>
            <h2 style=${{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(36px, 3.8vw, 54px)',
              fontWeight: 400, color: 'var(--cream)', lineHeight: 1.08, marginBottom: 24
            }}>
              Quatro passos<br />
              <em style=${{ color: 'var(--amber)' }}>até a sua mesa</em>
            </h2>
            <p style=${{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, fontWeight: 300, maxWidth: 560 }}>
              Trabalhamos por encomenda — nossa fornada é única, semanal e sob demanda. Peça durante a semana e retire no sábado.
            </p>
          </div>

          <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 80 }}>
            ${HOW_STEPS.map((step, i) => html`
              <div key=${step.n} style=${{
                opacity: visibleSteps[i] ? 1 : 0,
                transform: visibleSteps[i] ? 'translateY(0)' : 'translateY(28px)',
                transition: 'all 0.6s ease'
              }}>
                <div style=${{
                  background: 'oklch(15% 0.02 48)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '32px 28px',
                  height: '100%',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style=${{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style=${{
                      width: 44, height: 44, borderRadius: '50%',
                      border: '1px solid var(--amber)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--amber)', fontWeight: 700, fontSize: 14, flexShrink: 0
                    }}>
                      ${step.n}
                    </div>
                    <div style=${{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>
                      ${step.label}
                    </div>
                  </div>
                  <h3 style=${{ color: 'var(--cream)', fontSize: 18, fontWeight: 600, marginBottom: 12, lineHeight: 1.3 }}>
                    ${step.title}
                  </h3>
                  <p style=${{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.65, marginBottom: 20, flexGrow: 1 }}>
                    ${step.desc}
                  </p>
                  <div style=${{ color: 'var(--amber)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                    ${step.meta}
                  </div>
                </div>
              </div>
            `)}
          </div>

          <div ref=${infoRef} style=${{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 32,
            opacity: infoVisible ? 1 : 0,
            transform: infoVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.7s ease'
          }}>

            <div style=${{
              background: 'oklch(13% 0.018 48)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '32px 28px'
            }}>
              <div style=${{
                fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase',
                color: 'var(--amber)', marginBottom: 24, fontWeight: 600
              }}>
                + Sobre a Retirada
              </div>
              <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                ${RETIRADA_ITEMS.map((item, i) => html`
                  <div key=${i}>
                    <div style=${{ color: 'var(--cream)', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                      ${item.title}
                    </div>
                    <div style=${{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
                      ${item.desc}
                    </div>
                  </div>
                `)}
              </div>
            </div>

            <div style=${{
              background: 'oklch(13% 0.018 48)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '32px 28px'
            }}>
              <div style=${{
                fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase',
                color: 'var(--amber)', marginBottom: 24, fontWeight: 600
              }}>
                Política
              </div>
              <div style=${{ color: 'var(--cream)', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                ${POLITICA_ITEM.title}
              </div>
              <div style=${{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
                ${POLITICA_ITEM.desc}
              </div>
            </div>

          </div>

        </div>
      </section>
    `;
  }

  window.HowItWorksSection = HowItWorksSection;
}());
