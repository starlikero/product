(() => {
  "use strict";

  const page = document.body.dataset.page;
  const storageKey = "epiele-demo-cart";
  const basePrice = 179;
  const oldPrice = 249;
  const upsellPrice = 149;
  const freeShippingThreshold = 299;
  let toastTimer;

  const money = (value) => `${Math.round(value)} Lei`;
  const one = (selector, scope = document) => scope.querySelector(selector);
  const all = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const readState = () => {
    const fallback = { quantity: 1, size: "38", coupon: false, upsell: false };
    try {
      return { ...fallback, ...JSON.parse(sessionStorage.getItem(storageKey) || "{}") };
    } catch {
      return fallback;
    }
  };

  const writeState = (state) => sessionStorage.setItem(storageKey, JSON.stringify(state));

  const showToast = (message) => {
    const toast = one(".flow-toast");
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2600);
  };

  const getSubtotal = (state) => (basePrice * state.quantity) + (state.upsell ? upsellPrice : 0);
  const getDiscount = (state) => state.coupon ? Math.round(getSubtotal(state) * 0.1) : 0;

  const getDeliveryRange = () => {
    const nextBusinessDay = (date) => {
      const result = new Date(date);
      do result.setDate(result.getDate() + 1); while ([0, 6].includes(result.getDay()));
      return result;
    };
    const first = nextBusinessDay(new Date());
    const second = nextBusinessDay(first);
    const format = new Intl.DateTimeFormat("ro-RO", { weekday: "long", day: "numeric", month: "short" });
    const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
    return `${capitalize(format.format(first))} – ${capitalize(format.format(second))}`;
  };

  const applyCoupon = (state, update) => {
    const input = one("[data-coupon-input]");
    const feedback = one("[data-coupon-feedback]");
    if (!input || !feedback) return;
    if (input.value.trim().toUpperCase() === "PIELE10") {
      state.coupon = true;
      input.value = "PIELE10";
      feedback.textContent = "Cod aplicat: ai 10% reducere la produse.";
      feedback.classList.add("is-success");
      writeState(state);
      update();
      showToast("Reducerea a fost aplicată.");
    } else {
      feedback.textContent = "Codul nu este valid. Pentru demo încearcă PIELE10.";
      feedback.classList.remove("is-success");
    }
  };

  const initCart = () => {
    const state = readState();
    const productContent = one("[data-cart-content]");
    const emptyCart = one("[data-empty-cart]");
    const mobileBar = one("[data-mobile-cart-bar]");
    const quantityOutput = one("[data-quantity]");
    const sizeSelect = one("[data-cart-size]");
    const upsellCard = one("[data-upsell-card]");
    const upsellButton = one("[data-add-upsell]");

    const updateCart = () => {
      const subtotal = getSubtotal(state);
      const discount = getDiscount(state);
      const shipping = subtotal >= freeShippingThreshold ? 0 : 20;
      const total = subtotal - discount + shipping;
      const itemCount = state.quantity + (state.upsell ? 1 : 0);

      if (quantityOutput) quantityOutput.textContent = state.quantity;
      if (sizeSelect) sizeSelect.value = state.size;
      all("[data-line-total]").forEach((node) => { node.textContent = money(basePrice * state.quantity); });
      all("[data-line-old-price]").forEach((node) => { node.textContent = money(oldPrice * state.quantity); });
      all("[data-item-count]").forEach((node) => { node.textContent = itemCount; });
      all("[data-subtotal]").forEach((node) => { node.textContent = money(subtotal); });
      all("[data-discount]").forEach((node) => { node.textContent = `−${money(discount)}`; });
      all("[data-discount-row]").forEach((node) => { node.hidden = !state.coupon; });
      all("[data-shipping-cost]").forEach((node) => { node.textContent = shipping ? money(shipping) : "GRATUIT"; });
      all("[data-grand-total], [data-mobile-total]").forEach((node) => { node.textContent = money(total); });

      const missing = Math.max(0, freeShippingThreshold - subtotal);
      const message = one("[data-shipping-message]");
      const progress = one("[data-shipping-progress]");
      if (message) {
        message.innerHTML = missing
          ? `Mai adaugă <strong>${money(missing)}</strong> pentru livrare gratuită.`
          : `<strong>Ai livrare gratuită!</strong> Pragul de ${money(freeShippingThreshold)} a fost atins.`;
      }
      if (progress) progress.style.width = `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`;

      if (upsellCard && upsellButton) {
        upsellCard.classList.toggle("is-added", state.upsell);
        upsellButton.textContent = state.upsell ? "✓ Adăugat · Elimină" : "+ Adaugă în coș";
      }
      writeState(state);
    };

    one("[data-qty-minus]")?.addEventListener("click", () => {
      if (state.quantity > 1) { state.quantity -= 1; updateCart(); }
    });
    one("[data-qty-plus]")?.addEventListener("click", () => {
      if (state.quantity < 3) { state.quantity += 1; updateCart(); }
      else showToast("Pentru cantități mai mari, te rugăm să ne contactezi.");
    });
    sizeSelect?.addEventListener("change", () => {
      state.size = sizeSelect.value;
      writeState(state);
      showToast(`Mărimea a fost schimbată la ${state.size}.`);
    });
    one("[data-remove-product]")?.addEventListener("click", () => {
      productContent.hidden = true;
      emptyCart.hidden = false;
      if (mobileBar) mobileBar.hidden = true;
      sessionStorage.removeItem(storageKey);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    upsellButton?.addEventListener("click", () => {
      state.upsell = !state.upsell;
      updateCart();
      showToast(state.upsell ? "Produsul recomandat a fost adăugat." : "Produsul recomandat a fost eliminat.");
    });
    one("[data-apply-coupon]")?.addEventListener("click", () => applyCoupon(state, updateCart));
    one("[data-coupon-input]")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") { event.preventDefault(); applyCoupon(state, updateCart); }
    });
    all("[data-go-checkout]").forEach((button) => button.addEventListener("click", () => {
      writeState(state);
      window.location.href = "checkout.html";
    }));

    if (state.coupon) {
      const feedback = one("[data-coupon-feedback]");
      const input = one("[data-coupon-input]");
      if (input) input.value = "PIELE10";
      if (feedback) { feedback.textContent = "Cod aplicat: ai 10% reducere la produse."; feedback.classList.add("is-success"); }
    }
    updateCart();
  };

  const initCheckout = () => {
    const state = readState();
    const form = one("[data-checkout-form]");
    if (!form) return;
    const checkoutSummary = one(".checkout-summary", form);
    const desktopSummaryQuery = window.matchMedia("(min-width: 901px)");
    const syncSummaryState = (desktop) => {
      if (checkoutSummary) checkoutSummary.open = desktop;
    };
    syncSummaryState(desktopSummaryQuery.matches);
    desktopSummaryQuery.addEventListener?.("change", (event) => syncSummaryState(event.matches));
    const setAccountPanel = (panelName) => {
      all("[data-account-panel]").forEach((panel) => { panel.hidden = panel.dataset.accountPanel !== panelName; });
      all("[data-account-tab]").forEach((tab) => {
        const active = tab.dataset.accountTab === panelName;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
      });
    };
    all("[data-account-tab]").forEach((tab) => tab.addEventListener("click", () => setAccountPanel(tab.dataset.accountTab)));
    one("[data-demo-login]")?.addEventListener("click", () => showToast("Autentificarea este demonstrativă în acest prototip."));
    const deliveryRange = getDeliveryRange();
    const selectedShipping = () => one('input[name="shipping"]:checked', form)?.value || "courier";
    const selectedPayment = () => one('input[name="payment"]:checked', form)?.value || "card";

    const updateCheckout = () => {
      const subtotal = getSubtotal(state);
      const discount = getDiscount(state);
      const shippingBase = selectedShipping() === "locker" ? 14 : 20;
      const shipping = subtotal >= freeShippingThreshold ? 0 : shippingBase;
      const total = subtotal - discount + shipping;
      const paymentVerb = selectedPayment() === "cash" ? "TRIMITE COMANDA" : "PLĂTEȘTE";

      all("[data-checkout-size]").forEach((node) => { node.textContent = state.size; });
      all("[data-checkout-qty]").forEach((node) => { node.textContent = state.quantity; });
      all("[data-checkout-product-total]").forEach((node) => { node.textContent = money(basePrice * state.quantity); });
      all("[data-checkout-upsell]").forEach((node) => { node.hidden = !state.upsell; });
      all("[data-subtotal]").forEach((node) => { node.textContent = money(subtotal); });
      all("[data-discount]").forEach((node) => { node.textContent = `−${money(discount)}`; });
      all("[data-discount-row]").forEach((node) => { node.hidden = !state.coupon; });
      all("[data-shipping-cost]").forEach((node) => { node.textContent = shipping ? money(shipping) : "GRATUIT"; });
      all("[data-grand-total], [data-mobile-total]").forEach((node) => { node.textContent = money(total); });
      all("[data-delivery-range], [data-success-delivery]").forEach((node) => { node.textContent = deliveryRange; });
      all("[data-place-order-copy]").forEach((node) => { node.textContent = `${paymentVerb} ${money(total).toUpperCase()}`; });
      const mobileSubmit = one("[data-mobile-submit]");
      if (mobileSubmit) mobileSubmit.innerHTML = `${paymentVerb === "PLĂTEȘTE" ? "PLĂTEȘTE" : "COMANDĂ"} <span>→</span>`;

      all(".choice-card", form).forEach((card) => {
        const radio = one('input[type="radio"]', card);
        card.classList.toggle("is-selected", Boolean(radio?.checked));
      });
      writeState(state);
    };

    all('input[name="shipping"], input[name="payment"]', form).forEach((input) => input.addEventListener("change", updateCheckout));
    one('input[name="invoice"]', form)?.addEventListener("change", (event) => {
      const companyFields = one("[data-company-fields]");
      companyFields.hidden = !event.currentTarget.checked;
      all("input", companyFields).forEach((input) => { input.required = event.currentTarget.checked; });
    });
    one("[data-fill-demo]")?.addEventListener("click", () => {
      const values = { email: "ana.popescu@email.ro", phone: "0722 123 456", firstName: "Ana", lastName: "Popescu", county: "București", city: "București", address: "Strada Exemplu", streetNumber: "24, apartament 8" };
      Object.entries(values).forEach(([name, value]) => {
        const field = form.elements.namedItem(name);
        if (field) field.value = value;
      });
      showToast("Date demonstrative completate.");
    });
    one("[data-apply-coupon]")?.addEventListener("click", () => applyCoupon(state, updateCheckout));
    one("[data-coupon-input]")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") { event.preventDefault(); applyCoupon(state, updateCheckout); }
    });
    one("[data-mobile-submit]")?.addEventListener("click", () => form.requestSubmit());
    const reviewTrack = one("[data-review-track]");
    one("[data-review-prev]")?.addEventListener("click", () => reviewTrack?.scrollBy({ left: -Math.max(240, reviewTrack.clientWidth * 0.82), behavior: "smooth" }));
    one("[data-review-next]")?.addEventListener("click", () => reviewTrack?.scrollBy({ left: Math.max(240, reviewTrack.clientWidth * 0.82), behavior: "smooth" }));
    form.addEventListener("submit", (event) => {
      const error = one("[data-form-error]");
      if (!form.checkValidity()) {
        event.preventDefault();
        error.hidden = false;
        form.reportValidity();
        const invalid = one(":invalid", form);
        invalid?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      error.hidden = true;
      if (!form.getAttribute("action")) {
        event.preventDefault();
        const subtotal = getSubtotal(state);
        const discount = getDiscount(state);
        const shipping = subtotal >= freeShippingThreshold ? 0 : selectedShipping() === "locker" ? 14 : 20;
        try {
          sessionStorage.setItem("epiele-demo-order", JSON.stringify({
            subtotal, discount, shipping, total: subtotal - discount + shipping,
            quantity: state.quantity, size: state.size, upsell: state.upsell,
            payment: selectedPayment(), delivery: selectedShipping(), guest: true,
            createdAt: new Date().toISOString()
          }));
          window.location.assign("confirmare.html");
        } catch {
          error.textContent = "Nu am putut deschide confirmarea. Permite stocarea în browser și încearcă din nou.";
          error.hidden = false;
        }
      }
    });

    if (state.coupon) {
      const feedback = one("[data-coupon-feedback]");
      const input = one("[data-coupon-input]");
      if (input) input.value = "PIELE10";
      if (feedback) { feedback.textContent = "Cod aplicat: ai 10% reducere la produse."; feedback.classList.add("is-success"); }
    }
    updateCheckout();
  };

  if (page === "cart") initCart();
  if (page === "checkout") initCheckout();
})();
