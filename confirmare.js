// Thank you — număr comandă, adresă, suma de plată, cont opțional.
(() => {
  const one = (s) => document.querySelector(s);
  const money = (v) => { const [i, d] = (Math.round(v * 100) / 100).toFixed(2).split("."); return `${i}<sup class="dec">${d}</sup> Lei`; };
  const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let order;
  try { order = JSON.parse(sessionStorage.getItem("epiele-demo-order")); } catch {}
  if (!order || ![order.subtotal, order.discount, order.shipping, order.total].every(Number.isFinite)) {
    one("[data-no-order]").hidden = false;
    return;
  }
  if (!order.createdAt || !Number.isFinite(Date.parse(order.createdAt))) order.createdAt = new Date().toISOString();
  const c = order.customer || {};
  const isCash = order.payment !== "card";

  if (c.firstName) one("[data-thanks]").textContent = `Mulțumim, ${c.firstName}!`;
  one("[data-order-number]").textContent = order.number || "—";
  one("[data-summary-total]").innerHTML = money(order.total);

  const estimate = getOrderDeliveryEstimate(order.createdAt);
  one("[data-delivery-estimate]").textContent = estimate.title;
  one("[data-delivery-explanation]").textContent = estimate.explanation;

  const pay = one("[data-pay-note]");
  const isLocker = order.delivery === "locker";
  pay.innerHTML = isCash
    ? (isLocker ? `Plătești <b>${money(order.total)}</b> cu cardul la easybox, când ridici coletul.` : `Pregătește <b>${money(order.total)}</b> pentru curier. Plătești la livrare.`)
    : `Plata de <b>${money(order.total)}</b> a fost confirmată. Nu mai ai nimic de plătit la livrare.`;
  pay.classList.toggle("is-paid", !isCash);

  one("[data-address]").innerHTML = [
    `<b>${esc(c.lastName)} ${esc(c.firstName)}</b> · ${esc(c.phone)}`,
    ...(isLocker
      ? [esc(order.locker || "Easybox")]
      : [esc([c.street, c.streetNumber].filter(Boolean).join(" ")), `${esc(c.city)}, jud. ${esc(c.county)}`])
  ].join("<br>");

  const fields = {
    subtotal: money(order.subtotal), discount: `−${money(order.discount)}`,
    shipping: order.shipping ? money(order.shipping) : "GRATUITĂ",
    delivery: order.delivery === "locker" ? "Easybox" : "Curier rapid",
    payment: order.payment === "locker-card" ? "Card la easybox" : isCash ? "Plată la curier (ramburs)" : "Online cu cardul",
    total: money(order.total)
  };
  const items = Array.isArray(order.items) && order.items.length ? order.items
    : [{ title: "Sandale din piele naturală PV970", color: "Roșu", size: order.size, quantity: order.quantity, image: "assets/pv970-gallery-1.webp" }];
  one("[data-order-items]").innerHTML = items.map((it) => `<div class="confirmation-product"><img src="${esc(it.image)}" alt="" /><div><strong>${esc(it.title)}</strong><p>Mărime: ${esc(it.size)} · Culoare: ${esc(it.color)} · Cantitate: ${it.quantity}</p></div></div>`).join("");
  Object.entries(fields).forEach(([name, value]) => { one(`[data-order-${name}]`).innerHTML = value; });
  one("[data-order-discount-row]").hidden = !order.discount;
  one("[data-order-upsell]").hidden = !order.upsell;
  one("[data-confirmation]").hidden = false;

  /* LIVE — Meta Pixel Purchase, o singură dată per comandă (nu la refresh):
     if (!sessionStorage.getItem("epiele-purchase-sent")) {
       fbq("track", "Purchase", { value: order.total, currency: "RON", content_ids: ["PV970"], content_type: "product", num_items: order.quantity }, { eventID: "order-" + order.number });
       sessionStorage.setItem("epiele-purchase-sent", order.number);
     }
     Același eventID se trimite și prin Conversions API, pentru deduplicare. */

  // Cont opțional: dacă avem emailul din checkout, cerem doar parola
  const accountSection = one("[data-guest-account]");
  accountSection.hidden = order.guest !== true;
  const accountForm = one("#create-account-form");
  const toggle = one(".account-toggle");
  const emailInput = accountForm.elements.accountEmail;
  if (c.email) {
    one("[data-email-known]").hidden = false;
    one("[data-email]").textContent = c.email;
    one("[data-email-field]").hidden = true;
    emailInput.required = false;
    emailInput.value = c.email;
  }
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(expanded));
    accountForm.hidden = !expanded;
    toggle.textContent = expanded ? "ÎNCHIDE FORMULARUL" : "CREEAZĂ CONT GRATUIT →";
    if (expanded) (c.email ? accountForm.elements.accountPassword : emailInput).focus();
  });
  accountForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!accountForm.reportValidity()) return;
    accountForm.elements.accountPassword.value = "";
    const feedback = one("[data-account-feedback]");
    feedback.textContent = "Gata! (demo: contul nu a fost creat)";
    feedback.hidden = false;
  });
})();
