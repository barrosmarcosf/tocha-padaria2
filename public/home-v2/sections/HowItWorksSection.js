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

  function HowItWorksSection() {
    const sectionRef = React.useRef(null);
    const [visibleSteps, setVisibleSteps] = React.useState([false, false, false, false]);

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

    return html`
      <section id="como-funciona" ref=${sectionRef} style=${{
        padding: '120px 0 100px',
        background: 'var(--bg2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style=${{ maxWidth: 1500, margin: '0 auto', padding: '0 56px' }}>

          <div style=${{ marginBottom: 64, maxWidth: 720 }}>
            <div style=${{
              fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--amber)', marginBottom: 16, fontWeight: 600
            }}>
              Como funciona
            </div>
            <h2 style=${{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(36px, 4.5vw, 56px)',
              fontWeight: 500, color: 'var(--cream)', lineHeight: 1.1, marginBottom: 24
            }}>
              Quatro passos<br />
              <em style=${{ color: 'var(--amber)' }}>até a sua mesa</em>
            </h2>
            <p style=${{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, fontWeight: 300 }}>
              Trabalhamos por encomenda — nossa fornada é única, semanal e sob demanda.
            </p>
          </div>

          <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
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
                  padding: 24
                }}>
                  <div style=${{ color: 'var(--amber)', marginBottom: 8, fontWeight: 700, fontSize: 13 }}>
                    ${step.n}
                  </div>
                  <h3 style=${{ color: 'var(--cream)', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                    ${step.title}
                  </h3>
                  <p style=${{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
                    ${step.desc}
                  </p>
                  <div style=${{ color: 'var(--amber)', fontSize: 12, letterSpacing: '0.06em' }}>
                    ${step.meta}
                  </div>
                </div>
              </div>
            `)}
          </div>

        </div>
      </section>
    `;
  }

  window.HowItWorksSection = HowItWorksSection;
}());
