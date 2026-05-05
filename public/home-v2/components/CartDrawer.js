// ============================================================
// CART DRAWER — Checkout unificado (mobile-first)
// ============================================================

// ✅ FIX CRÍTICO — função que estava faltando
function formatPrice(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function CartDrawer({ cart, onClose, onRemove, onAddOne, onClear, customerInfo, onUpdateCustomer, tweaks }) {
  // step: 'cart' | 'checkout' | 'loading' | 'pix_pending' | 'success' | 'error_card' | 'error_generic'
  const [step, setStep] = React.useState('cart');
  const [payment, setPayment] = React.useState('pix'); // pix | stripe | mercadopago
  const [pixCopied, setPixCopied] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const scrollRef = React.useRef(null);

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const subtotal = total;

  // Local form state for customer info (required at checkout)
  const [custForm, setCustForm] = React.useState({
    name: customerInfo?.name || '',
    whatsapp: customerInfo?.whatsapp || ''
  });
  const [custErrors, setCustErrors] = React.useState({});

  React.useEffect(() => {
    if (customerInfo) {
      setCustForm({
        name: customerInfo.name || '',
        whatsapp: customerInfo.whatsapp || ''
      });
    }
  }, [customerInfo]);

  function validateCustomer() {
    const e = {};
    if (!custForm.name.trim() || custForm.name.trim().length < 2) {
      e.name = 'Informe seu nome completo';
    }
    if (!custForm.whatsapp.replace(/\D/g, '').match(/^\d{10,11}$/)) {
      e.whatsapp = 'Informe DDD + número (ex: 21 99999-9999)';
    }
    setCustErrors(e);
    return Object.keys(e).length === 0;
  }

  function fireEvent(name, data = {}) {
    console.log('[Tocha Event]', name, data);
  }

  function handleCheckout() {
    if (!payment) return;
    if (!validateCustomer()) return;

    if (onUpdateCustomer) onUpdateCustomer(custForm);

    fireEvent('checkout_started', { total, items: cart.length, payment });
    setStep('loading');

    setTimeout(() => {
      fireEvent('payment_attempt', { payment, total });

      if (payment === 'pix') {
        setStep('pix_pending');
      } else if (payment === 'stripe') {
        setTimeout(() => {
          fireEvent('purchase_success', { payment: 'stripe', total });
          setStep('success');
        }, 1200);
      } else if (payment === 'mercadopago') {
        setTimeout(() => {
          fireEvent('payment_failed', { reason: 'card_declined' });
          setErrorMsg('Cartão recusado pela operadora.');
          setStep('error_card');
        }, 1400);
      }
    }, 1800);
  }

  function handlePixConfirm() {
    fireEvent('purchase_success', { payment: 'pix', total });
    setStep('success');
  }

  function copyPix() {
    navigator.clipboard?.writeText('00020126360014BR.GOV.BCB.PIX0114+5521966278965520400005303986540538.005802BR5913Tocha Padaria6009SaoJoaoME62070503***6304ABCD').catch(() => {});
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2500);
  }

  const STEP_TITLES = {
    cart: 'Meu Pedido',
    checkout: 'Finalizar Pedido',
    loading: 'Processando...',
    pix_pending: 'Pagar via Pix',
    success: 'Pedido Confirmado!',
    error_card: 'Pagamento Recusado',
    error_generic: 'Algo deu errado'
  };

  const canGoBack = step === 'checkout';

  const drawerBg = 'oklch(13% 0.02 48)';
  const borderClr = 'oklch(26% 0.02 50)';

  const btnPrimary = {
    width: '100%', padding: '16px',
    background: 'oklch(72% 0.12 60)', color: 'oklch(12% 0.018 50)',
    border: 'none', borderRadius: 8, cursor: 'pointer',
    fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-sans)',
    transition: 'background 0.2s, transform 0.1s',
    letterSpacing: '0.02em'
  };

  const btnGhost = {
    background: 'none', border: 'none',
    color: 'oklch(50% 0.01 60)', cursor: 'pointer',
    fontSize: 13, fontFamily: 'var(--font-sans)',
    padding: '10px', width: '100%'
  };

  // ⚠️ RESTANTE DO SEU CÓDIGO PERMANECE EXATAMENTE IGUAL
  return (
    <>
      {/* TODO SEU JSX ORIGINAL AQUI SEM ALTERAÇÃO */}
    </>
  );
}

window.CartDrawer = CartDrawer;