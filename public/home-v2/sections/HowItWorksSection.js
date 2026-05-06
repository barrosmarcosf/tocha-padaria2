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
        padding: '120px 0',
        background: 'var(--bg2)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style=${{ maxWidth: 1200, margin: '0 auto', padding: '0 56px' }}>

          <div style=${{ marginBottom: 64 }}>
            <div style=${{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              textTransform: 'uppercase',
              color: 'oklch(0.72 0.12 60)',
              marginBottom: 16,
            }}>
              Como funciona
            </div>
            <h2 style=${{
              fontFamily: 'var(--font-serif)',
              fontSize: 56,
              fontWeight: 400,
              lineHeight: 1.1,
              marginBottom: 24,
            }}>
              <span style=${{ color: 'oklch(0.94 0.01 75)', display: 'block' }}>Quatro passos</span>
              <em style=${{ color: 'oklch(0.72 0.12 60)', fontStyle: 'italic' }}>até a sua mesa</em>
            </h2>
            <p style=${{
              fontFamily: 'var(--font-sans)',
              fontSize: 16,
              color: 'oklch(0.65 0.015 65)',
              lineHeight: 1.7,
              fontWeight: 300,
              maxWidth: 512,
              margin: 0,
            }}>
              Trabalhamos por encomenda — nossa fornada é única, semanal e sob demanda. Peça durante a semana e retire no sábado.
            </p>
          </div>

          <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            ${HOW_STEPS.map((step, i) => html`
              <div key=${step.n} style=${{
                opacity: visibleSteps[i] ? 1 : 0,
                transform: visibleSteps[i] ? 'translateY(0)' : 'translateY(28px)',
                transition: 'all 0.6s ease',
              }}>
                <div style=${{
                  background: 'oklch(0.15 0.02 48)',
                  borderRadius: 12,
                  padding: '28px 24px',
                  height: 268,
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <div style=${{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style=${{
                      width: 44, height: 44, borderRadius: '50%',
                      border: '1px solid oklch(0.72 0.12 60)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'oklch(0.72 0.12 60)', fontWeight: 700, fontSize: 14, flexShrink: 0,
                    }}>
                      ${step.n}
                    </div>
                    <div style=${{
                      fontSize: 11,
                      color: 'oklch(0.45 0.012 60)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}>
                      ${step.label}
                    </div>
                  </div>
                  <h3 style=${{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 20,
                    fontWeight: 500,
                    color: 'oklch(0.94 0.01 75)',
                    marginTop: 6,
                    marginBottom: 0,
                    lineHeight: 1.3,
                  }}>
                    ${step.title}
                  </h3>
                  <p style=${{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13.5,
                    color: 'oklch(0.65 0.015 65)',
                    lineHeight: 1.65,
                    flexGrow: 1,
                    marginTop: 8,
                    marginBottom: 0,
                  }}>
                    ${step.desc}
                  </p>
                  <div style=${{
                    fontSize: 11,
                    color: 'oklch(0.72 0.12 60)',
                    marginTop: 'auto',
                  }}>
                    ${step.meta}
                  </div>
                </div>
              </div>
            `)}
          </div>

          <div ref=${infoRef} style=${{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 24,
            opacity: infoVisible ? 1 : 0,
            transform: infoVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.7s ease',
          }}>

            <div style=${{
              background: 'oklch(0.15 0.02 48)',
              borderRadius: 12,
              padding: '28px 32px',
            }}>
              <div style=${{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                textTransform: 'uppercase',
                color: 'oklch(0.72 0.12 60)',
                marginBottom: 24,
              }}>
                + Sobre a Retirada
              </div>
              <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                ${RETIRADA_ITEMS.map((item, i) => html`
                  <div key=${i}>
                    <div style=${{
                      fontFamily: 'var(--font-sans)',
                      color: 'oklch(0.94 0.01 75)',
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}>
                      ${item.title}
                    </div>
                    <div style=${{
                      fontFamily: 'var(--font-sans)',
                      color: 'oklch(0.65 0.015 65)',
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}>
                      ${item.desc}
                    </div>
                  </div>
                `)}
              </div>
            </div>

            <div style=${{
              background: 'oklch(0.15 0.02 48)',
              borderRadius: 12,
              padding: '28px 32px',
            }}>
              <div style=${{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                textTransform: 'uppercase',
                color: 'oklch(0.72 0.12 60)',
                marginBottom: 24,
              }}>
                Política
              </div>
              <div style=${{
                fontFamily: 'var(--font-sans)',
                color: 'oklch(0.94 0.01 75)',
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 8,
              }}>
                ${POLITICA_ITEM.title}
              </div>
              <div style=${{
                fontFamily: 'var(--font-sans)',
                color: 'oklch(0.65 0.015 65)',
                fontSize: 13,
                lineHeight: 1.6,
              }}>
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
