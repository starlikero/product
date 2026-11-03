// Pagina de mulțumire: 1) eticheta coletului (înregistrată + când pleacă/ajunge)  2) cont dintr-un pas  3) sumar
(() => {
  const one = (s) => document.querySelector(s);
  const money = (v) => { const [i, d] = (Math.round(v * 100) / 100).toFixed(2).split("."); return `${i}<sup class="dec">${d}</sup> Lei`; };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const set = (sel, html) => { const el = one(sel); if (el) el.innerHTML = html; };

  let order;
  try { order = JSON.parse(sessionStorage.getItem("epiele-demo-order")); } catch {}

  /* DEMO — ca să vezi pagina fără să plasezi o comandă: deschide confirmare.html direct.
     Variante: ?demo=azi  ?demo=maine  ?demo=easybox  ?demo=card  ?demo=fara-email  ?demo=cont (client cu cont)
     LIVE: blocul acesta se șterge; datele vin din comanda reală. */
  const demo = new URLSearchParams(location.search).get("demo");
  if (demo !== null || !order) {
    const at = (h, addDays = 0) => { const d = new Date(); d.setDate(d.getDate() + addDays); d.setHours(h, 30, 0, 0); return d.toISOString(); };
    order = {
      number: "373464", createdAt: demo === "maine" || demo === "easybox" ? at(18) : at(10),
      subtotal: 358, discount: 0, shipping: 0, total: 358, payment: "cash", delivery: "courier", locker: "", guest: demo !== "cont",
      items: [
        { title: "Sandale din piele naturală PV970", color: "Roșu", size: "38", image: "assets/pv970-gallery-1.webp", price: 179, quantity: 1 },
        { title: "Sandale din piele naturală PV970", color: "Negru", size: "39", image: "assets/similar-1.jpg", price: 179, quantity: 1 }
      ],
      customer: { firstName: "Maria", lastName: "Popescu", phone: "0722 123 456", email: demo === "fara-email" ? "" : "maria.popescu@gmail.com", county: "Cluj", city: "Cluj-Napoca", street: "Str. Memorandumului 24, ap. 3" }
    };
    if (demo === "easybox") { order.delivery = "locker"; order.payment = "locker-card"; order.locker = "easybox Kaufland Mărăști, Str. Aurel Vlaicu 3"; }
    if (demo === "card") order.payment = "card";
  }
  if (![order.subtotal, order.discount, order.shipping, order.total].every(Number.isFinite)) { one("[data-no-order]").hidden = false; return; }
  if (!order.createdAt || !Number.isFinite(Date.parse(order.createdAt))) order.createdAt = new Date().toISOString();
  const c = order.customer || {};
  /* Fără email la comandă, platforma generează automat o adresă de-a noastră (ex. ...@epielenaturala.ro).
     Pe aceea n-o arătăm și o tratăm ca „fără email”. LIVE: dacă formatul e altul, se ajustează AUTO_EMAIL. */
  const AUTO_EMAIL = /@([a-z0-9-]+\.)*epielenaturala\.ro$/i;
  const realEmail = c.email && !AUTO_EMAIL.test(String(c.email).trim()) ? String(c.email).trim() : "";
  const isLocker = order.delivery === "locker";
  const items = Array.isArray(order.items) && order.items.length ? order.items
    : [{ title: "Sandale din piele naturală PV970", color: "Roșu", size: order.size, quantity: order.quantity || 1, price: order.subtotal / (order.quantity || 1), image: "assets/pv970-gallery-1.webp" }];
  const count = items.reduce((n, it) => n + (+it.quantity || 1), 0);

  // 1. Mulțumim + eticheta coletului
  if (c.firstName) one("[data-thanks]").textContent = `Ai ales perfect, ${c.firstName}!`;
  one("[data-order-number]").textContent = order.number || "—";
  set("[data-parcel-photos]", items.slice(0, 3).map((it) => `<img src="${esc(it.image)}" alt="" />`).join(""));

  // când pleacă / ajunge — aceeași regulă ca pe pagina produsului (până la 16:00 în zi lucrătoare → azi)
  const est = getOrderDeliveryEstimate(order.createdAt);
  const WD = ["duminică", "luni", "marți", "miercuri", "joi", "vineri", "sâmbătă"], WS = ["dum", "lun", "mar", "mie", "joi", "vin", "sâm"];
  const MS = ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sep", "oct", "nov", "dec"];
  const D = (iso) => new Date(iso + "T00:00:00Z");
  const weekday = (iso) => WD[D(iso).getUTCDay()];
  const dayShort = (iso) => `${WS[D(iso).getUTCDay()]} ${D(iso).getUTCDate()} ${MS[D(iso).getUTCMonth()]}`;
  const time = new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit" }).format(new Date(order.createdAt));
  set("[data-placed-at]", `azi, ${time}`);
  const step = one("[data-step-dispatch]");
  if (est.dispatchDays === 0) {
    set("[data-dispatch-title]", "Pleacă"); set("[data-dispatch-text]", "azi"); step.classList.add("is-today");
    set("[data-route-note]", "Ai comandat înainte de ora 16:00, așa că pleacă tot azi.");
  } else {
    set("[data-dispatch-title]", "Pleacă");
    set("[data-dispatch-text]", (est.dispatchDays === 1 ? "mâine, " : "") + dayShort(est.dispatch));
    set("[data-route-note]", "Comenzile de după ora 16:00 și din weekend pleacă în prima zi lucrătoare.");
  }
  set("[data-arrive-title]", isLocker ? "Ajunge la easybox" : "Ajunge");
  set("[data-arrive-text]", D(est.first).getUTCMonth() === D(est.last).getUTCMonth() ? `${WS[D(est.first).getUTCDay()]} ${D(est.first).getUTCDate()} – ${dayShort(est.last)}` : `${dayShort(est.first)} – ${dayShort(est.last)}`);

  set("[data-email-line]", realEmail
    // fără adresa de email afișată pe pagină; cele fără email (majoritatea) află că nu au nevoie de el
    ? `Ți-am trimis confirmarea pe email<small>Dacă nu o găsești, uită-te și în Spam sau Promoții.</small>`
    : `Comanda e confirmată, nu ai nevoie de email<small>O pregătim și pleacă de la noi la timp. Curierul te anunță în ziua livrării.</small>`);
  const T = money(order.total);
  set("[data-pay-line]", order.payment === "card" ? `Plata de <b>${T}</b> e confirmată<small>Nu mai ai nimic de plătit la livrare.</small>`
    : order.payment === "locker-card" ? `Plătești <b>${T}</b> la easybox<small>Cu cardul, când ridici coletul.</small>`
    : `Plătești <b>${T}</b> la curier<small>Ramburs, când primești coletul.</small>`);

  // 3. Sumar
  set("[data-order-lead]", "Abia așteptăm să le porți și să ne spui cât de mult îți plac.");
    set("[data-order-items]", items.map((it) => `<div class="ty-item"><span class="ty-item-photo"><img src="${esc(it.image)}" alt="" /></span><div><strong>${esc(it.title)}</strong><small>${esc(it.color)}, mărimea ${esc(it.size)}${it.quantity > 1 ? `, ${it.quantity} perechi` : ""}</small></div>${Number.isFinite(it.price) ? `<span>${money(it.price * it.quantity)}</span>` : ""}</div>`).join(""));
  set("[data-order-subtotal]", money(order.subtotal));
  set("[data-order-discount]", `−${money(order.discount)}`);
  one("[data-order-discount-row]").hidden = !order.discount;
  set("[data-order-shipping]", order.shipping ? money(order.shipping) : "Gratuită");
  set("[data-order-total]", T);
  set("[data-address-title]", isLocker ? "Ridici de la" : "Livrăm la");
  set("[data-address]", [
    `<b>${esc(c.lastName)} ${esc(c.firstName)}</b>, ${esc(c.phone)}`,
    ...(isLocker ? [esc(order.locker || "Easybox")] : [esc(c.street), `${esc(c.city)}, jud. ${esc(c.county)}`])
  ].join("<br>"));

  one("[data-confirmation]").hidden = false;

  /* LIVE — Meta Pixel Purchase, o singură dată per comandă (nu la refresh):
     if (!sessionStorage.getItem("epiele-purchase-sent")) {
       fbq("track", "Purchase", { value: order.total, currency: "RON", content_ids: ["PV970"], content_type: "product", num_items: count }, { eventID: "order-" + order.number });
       sessionStorage.setItem("epiele-purchase-sent", order.number);
     }
     Același eventID se trimite și prin Conversions API, pentru deduplicare. */

  // 2. Cont dintr-un pas — doar pentru comenzi fără cont. Cu emailul din comandă, cerem doar parola.
  const box = one("[data-guest-account]");
  box.hidden = order.guest !== true;
  const form = box.querySelector("form");
  const email = form.elements.accountEmail, pass = form.elements.accountPassword;
  if (realEmail) {
    one("[data-email-known]").hidden = false;
    one("[data-email]").textContent = realEmail;
    one("[data-email-field]").hidden = true;
    email.value = realEmail;
  }
  one("[data-toggle-pass]").addEventListener("click", (e) => {
    const show = pass.type === "password";
    pass.type = show ? "text" : "password";
    e.currentTarget.setAttribute("aria-pressed", String(show));
    e.currentTarget.setAttribute("aria-label", show ? "Ascunde parola" : "Arată parola");
  });
  const mark = (el, ok) => { el.closest(".ty-field").classList.toggle("is-invalid", !ok); return ok; };
  const okEmail = () => mark(email, !!realEmail || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()));
  const okPass = () => mark(pass, pass.value.length >= 6);
  pass.addEventListener("input", () => { if (pass.closest(".ty-field").classList.contains("is-invalid")) okPass(); });
  email.addEventListener("blur", () => { if (email.value.trim()) okEmail(); });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (![okEmail(), okPass()].every(Boolean)) { form.querySelector(".is-invalid input")?.focus(); return; }
    // LIVE: aici se trimite la Avanticart crearea contului (emailul din comandă + parola)
    pass.value = "";
    one("[data-account-form-wrap]").hidden = true;
    one("[data-account-done]").hidden = false;
  });
})();
