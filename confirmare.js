(() => {
  const one = (selector) => document.querySelector(selector);
  let order;
  try { order = JSON.parse(sessionStorage.getItem("epiele-demo-order")); } catch {}
  if (!order || ![order.subtotal, order.discount, order.shipping, order.total].every(Number.isFinite)) {
    one("[data-no-order]").hidden = false;
    return;
  }
  const money = (amount) => `${Math.round(amount)} Lei`;
  one("[data-summary-total]").textContent = money(order.total);
  if (!order.createdAt || !Number.isFinite(Date.parse(order.createdAt))) {
    order.createdAt = new Date().toISOString();
    try { sessionStorage.setItem("epiele-demo-order", JSON.stringify(order)); } catch {}
  }
  const estimate = getOrderDeliveryEstimate(order.createdAt);
  one("[data-delivery-estimate]").textContent = estimate.title;
  one("[data-delivery-explanation]").textContent = estimate.explanation;
  const fields = {
    product: `Mărime: ${order.size} · Culoare: Roșu · Cantitate: ${order.quantity}`,
    subtotal: money(order.subtotal), discount: `−${money(order.discount)}`,
    shipping: order.shipping ? money(order.shipping) : "GRATUITĂ",
    delivery: order.delivery === "locker" ? "Easybox" : "Curier rapid",
    payment: order.payment === "cash" ? "Ramburs" : "Online cu cardul",
    total: money(order.total)
  };
  Object.entries(fields).forEach(([name, value]) => { one(`[data-order-${name}]`).textContent = value; });
  one("[data-order-discount-row]").hidden = !order.discount;
  one("[data-order-upsell]").hidden = !order.upsell;
  one("[data-confirmation]").hidden = false;
  const accountSection = one("[data-guest-account]");
  accountSection.hidden = order.guest !== true;
  const accountForm = one("#create-account-form");
  const toggle = one(".account-toggle");
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(expanded));
    accountForm.hidden = !expanded;
    toggle.textContent = expanded ? "ÎNCHIDE FORMULARUL" : "CREEAZĂ CONT GRATUIT →";
    if (expanded) accountForm.elements.accountEmail.focus();
  });
  const password = accountForm.elements.accountPassword;
  const confirm = accountForm.elements.accountPasswordConfirm;
  const validatePassword = () => confirm.setCustomValidity(confirm.value && password.value !== confirm.value ? "Parolele nu coincid." : "");
  password.addEventListener("input", validatePassword);
  confirm.addEventListener("input", validatePassword);
  accountForm.addEventListener("submit", (event) => {
    event.preventDefault();
    validatePassword();
    if (!accountForm.reportValidity()) return;
    password.value = "";
    confirm.value = "";
    const feedback = one("[data-account-feedback]");
    feedback.textContent = "Datele au fost validate. În versiunea conectată la magazin, aici va fi creat contul. În acest demo nu s-a creat niciun cont.";
    feedback.hidden = false;
  });
})();
