const [customerInfo, setCustomerInfo] = useState(null);
const [pendingItem, setPendingItem] = useState(null);

function addToCart(item) {
  setCart((prev) => {
    const existing = prev.find((i) => i.id === item.id);

    if (existing) {
      return prev.map((i) =>
        i.id === item.id ? { ...i, qty: i.qty + 1 } : i
      );
    }

    return [...prev, { ...item, qty: 1 }];
  });

  if (customerInfo) {
    setCartOpen(true);
  }
}

function handleAdd(item) {
  if (!customerInfo) {
    setPendingItem(item);
    setCaptureOpen(true);
    return;
  }

  addToCart(item);
}

return html`
  <div id="app-root">
    <${GlobalStyles} />

    <${AnnouncementBar} status=${status} />

    <${Navbar}
      cartCount=${totalItems}
      onCartOpen=${() => setCartOpen(true)}
    />

    <${Hero} status=${status} scrollToMenu=${scrollToMenu} />

    <${ManifestoStrip} />

    <!-- ✅ MANTIDO -->
    <${HowItWorksSection} />

    <${MenuSection}
      cart=${cart}
      onAdd=${handleAdd}
      onUpdateQty=${handleUpdateQty}
      config=${config}
    />

    <${InstagramStrip} />
    <${FoodServiceSection} />

    <!-- ❌ REMOVIDO -->
    <!-- <${HistoriaSection} /> -->

    <${Footer} />
    <${WhatsAppFloating} />

    <${EarlyCaptureModal}
      open=${captureOpen}
      onClose=${() => {
        setCaptureOpen(false);
        setPendingItem(null);
      }}
      onConfirm=${(data) => {
        setCustomerInfo(data);
        setCaptureOpen(false);

        if (pendingItem) {
          addToCart(pendingItem);
          setPendingItem(null);
        }
      }}
    />

    <${CartDrawer}
      open=${cartOpen}
      onClose=${() => {
        setCartOpen(false);
        setCheckoutStatus('idle');
      }}
      cart=${cart}
      onUpdateQty=${handleUpdateQty}
      onRemove=${handleRemove}
      status=${checkoutStatus}
      onCheckout=${handleCheckout}
      pixData=${pixData}
      customerInfo=${customerInfo}
      onUpdateCustomer=${setCustomerInfo}
    />
  </div>
`;