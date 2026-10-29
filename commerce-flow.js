// Checkout — validare pe câmp, easybox, cupon, totaluri, trimitere comandă.
(() => {
  "use strict";

  const storageKey = "epiele-demo-cart";
  const basePrice = 179;
  const upsellPrice = 149;
  const freeShippingThreshold = 299;
  const SHIPPING = { courier: 20, locker: 14 };
  const COUNTIES = ["Alba","Arad","Argeș","Bacău","Bihor","Bistrița-Năsăud","Botoșani","Brașov","Brăila","București","Buzău","Caraș-Severin","Călărași","Cluj","Constanța","Covasna","Dâmbovița","Dolj","Galați","Giurgiu","Gorj","Harghita","Hunedoara","Ialomița","Iași","Ilfov","Maramureș","Mehedinți","Mureș","Neamț","Olt","Prahova","Satu Mare","Sălaj","Sibiu","Suceava","Teleorman","Timiș","Tulcea","Vaslui","Vâlcea","Vrancea"];
  let toastTimer;

  // Preț ca pe pagina de produs: 199⁰⁰ Lei
  const money = (v) => { const [i, d] = (Math.round(v * 100) / 100).toFixed(2).split("."); return `${i}<sup class="dec">${d}</sup> Lei`; };
  const one = (s, scope = document) => scope.querySelector(s);
  const all = (s, scope = document) => [...scope.querySelectorAll(s)];

  const readState = () => {
    const fallback = { quantity: 1, size: "38", coupon: false, upsell: false };
    try { return { ...fallback, ...JSON.parse(sessionStorage.getItem(storageKey) || "{}") }; } catch { return fallback; }
  };
  const writeState = (state) => { try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch {} };

  const showToast = (message) => {
    const toast = one(".flow-toast");
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message; toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2600);
  };

  const state = readState();
  const form = one("[data-checkout-form]");
  if (!form) return;

  // Sumar: deschis pe desktop, închis pe mobil (ca înainte)
  const summary = one(".checkout-summary", form);
  const desktopQuery = matchMedia("(min-width: 901px)");
  const syncSummary = (d) => { if (summary) summary.open = d; };
  syncSummary(desktopQuery.matches);
  desktopQuery.addEventListener?.("change", (e) => syncSummary(e.matches));

  // Toate județele
  const county = one("[data-county]");
  COUNTIES.forEach((c) => county.add(new Option(c, c)));

  // Data estimată de livrare
  if (typeof getOrderDeliveryEstimate === "function") {
    const est = getOrderDeliveryEstimate(new Date().toISOString());
    const fmt = new Intl.DateTimeFormat("ro-RO", { timeZone: "UTC", weekday: "long", day: "numeric", month: "short" });
    const d = (iso) => fmt.format(new Date(iso + "T00:00:00Z"));
    all("[data-delivery-range]").forEach((n) => { n.textContent = `${d(est.first)} – ${d(est.last)}`; });
  }

  const shipping = () => one('input[name="shipping"]:checked', form)?.value || "courier";
  const payment = () => one('input[name="payment"]:checked', form)?.value || "cash";

  const totals = () => {
    const subtotal = basePrice * state.quantity + (state.upsell ? upsellPrice : 0);
    const discount = state.coupon ? Math.round(subtotal * 0.1) : 0;
    const free = subtotal >= freeShippingThreshold;
    const ship = free ? 0 : SHIPPING[shipping()];
    return { subtotal, discount, shipping: ship, free, total: subtotal - discount + ship };
  };

  const update = () => {
    const t = totals();
    const html = (sel, v) => all(sel).forEach((n) => { n.innerHTML = v; });
    html("[data-checkout-size]", state.size);
    html("[data-checkout-qty]", state.quantity);
    html("[data-checkout-product-total]", money(basePrice * state.quantity));
    html("[data-checkout-upsell] > strong", money(upsellPrice));
    all("[data-checkout-upsell]").forEach((n) => { n.hidden = !state.upsell; });
    html("[data-subtotal]", money(t.subtotal));
    html("[data-discount]", `−${money(t.discount)}`);
    all("[data-discount-row]").forEach((n) => { n.hidden = !state.coupon; });
    html("[data-shipping-cost]", t.free ? "GRATUIT" : money(t.shipping));
    html("[data-grand-total], [data-mobile-total]", money(t.total));
    html("[data-price-courier]", t.free ? "Gratuit" : money(SHIPPING.courier));
    html("[data-price-locker]", t.free ? "Gratuit" : money(SHIPPING.locker));

    // Text buton după metoda de plată
    const isCard = payment() === "card";
    all("[data-place-order-copy]").forEach((n) => { n.innerHTML = isCard ? `PLĂTEȘTE ${money(t.total).replace("Lei", "LEI")}` : `TRIMITE COMANDA`; });

    // Easybox: selectorul apare doar când e ales
    if (shipping() !== "locker") one("[data-locker-error]").hidden = true;

    all(".choice-card", form).forEach((card) => card.classList.toggle("is-selected", Boolean(one('input[type="radio"]', card)?.checked)));
    writeState(state);
  };
  all('input[name="shipping"], input[name="payment"]', form).forEach((i) => i.addEventListener("change", update));

  // Cupon (demo: PIELE10)
  const okMsg = "Cod aplicat: ai 10% reducere la produse.";
  const markApplied = () => all(".coupon-box").forEach((box) => {
    one("[data-coupon-input]", box).value = "PIELE10";
    const fb = one("[data-coupon-feedback]", box); fb.textContent = okMsg; fb.classList.add("is-success");
  });
  all(".coupon-box").forEach((box) => {
    const input = one("[data-coupon-input]", box), fb = one("[data-coupon-feedback]", box);
    const apply = () => {
      if (input.value.trim().toUpperCase() === "PIELE10") { state.coupon = true; markApplied(); update(); showToast("Reducerea a fost aplicată."); }
      else { fb.textContent = "Codul nu este valid."; fb.classList.remove("is-success"); }
    };
    one("[data-apply-coupon]", box).addEventListener("click", apply);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } });
  });
  all("[data-coupon-toggle]").forEach((btn) => btn.addEventListener("click", () => {
    const row = btn.nextElementSibling; row.hidden = !row.hidden;
    btn.setAttribute("aria-expanded", String(!row.hidden));
    if (!row.hidden) one("[data-coupon-input]", row).focus();
  }));
  if (state.coupon) { markApplied(); all(".coupon-row").forEach((r) => { r.hidden = false; }); }
  all("[data-upsell-note]").forEach((n) => { n.hidden = !state.upsell; });

  // Validare cu mesaj sub fiecare câmp
  const normPhone = (v) => v.replace(/[^\d+]/g, "").replace(/^(\+40|0040|40)(?=7)/, "0");
  const rules = {
    phone: (v) => /^0[237]\d{8}$/.test(normPhone(v)),
    email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
  };
  const fields = () => all("input, select", form).filter((el) => el.type !== "radio" && el.type !== "checkbox" && el.closest(".field") && !el.closest("[hidden]") && !el.closest(".coupon-box"));
  const check = (el) => {
    const v = el.value.trim();
    let ok = el.required ? v.length > 0 : true;
    if (ok && rules[el.name]) ok = rules[el.name](v);
    el.closest(".field").classList.toggle("is-invalid", !ok);
    el.closest(".field").classList.toggle("is-valid", ok && v.length > 0);
    return ok;
  };
  fields().forEach((el) => {
    el.addEventListener("blur", () => { if (el.value.trim()) check(el); });
    el.addEventListener("input", () => { if (el.closest(".field").classList.contains("is-invalid")) check(el); });
    el.addEventListener("change", () => check(el));
  });
  const phoneInput = form.elements.phone;
  phoneInput.addEventListener("blur", () => { const n = normPhone(phoneInput.value); if (/^0\d{9}$/.test(n)) phoneInput.value = `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`; });

  const submit = (e) => {
    e?.preventDefault();
    const invalid = fields().filter((el) => !check(el));
    if (shipping() === "locker" && !lockerChosen) {
      one("[data-locker-error]").hidden = false;
      if (!invalid.length) { one("[data-locker-error]").scrollIntoView({ behavior: "smooth", block: "center" }); openLocker(); return; }
    }
    const error = one("[data-form-error]");
    if (invalid.length) {
      error.hidden = false;
      invalid[0].scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => invalid[0].focus({ preventScroll: true }), 350);
      return;
    }
    error.hidden = true;
    const t = totals(), f = form.elements;
    // Demo: în live, numărul comenzii vine din Avanticart
    const order = {
      number: String(Math.floor(100000 + Math.random() * 900000)),
      ...t, quantity: state.quantity, size: state.size, upsell: state.upsell,
      payment: payment(), delivery: shipping(), locker: lockerChosen ? `${lockerChosen.name}, ${lockerChosen.address}` : "", guest: true,
      customer: { firstName: f.firstName.value.trim(), lastName: f.lastName.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim(), county: f.county.value, city: f.city.value.trim(), street: f.address.value.trim() },
      createdAt: new Date().toISOString()
    };
    try {
      sessionStorage.setItem("epiele-demo-order", JSON.stringify(order));
      sessionStorage.removeItem("epiele-purchase-sent");
      location.assign("confirmare.html");
    } catch {
      error.textContent = "Nu am putut trimite comanda. Încearcă din nou.";
      error.hidden = false;
    }
  };
  form.addEventListener("submit", submit);


  // ---- Popup easybox (demo; în live: widget-ul oficial Sameday) ----
  const LOCKERS = [
    { name: "easybox Mega Image Exemplu", address: "Str. Exemplu nr. 1, Sector 6, București", dist: "350 m" },
    { name: "easybox Kaufland Exemplu", address: "Bd. Exemplu nr. 20, Sector 6, București", dist: "600 m" },
    { name: "easybox OMV Exemplu", address: "Calea Exemplu nr. 112, Sector 6, București", dist: "900 m" },
    { name: "easybox Lidl Exemplu", address: "Str. Model nr. 8, Sector 6, București", dist: "1,2 km" },
    { name: "easybox Profi Exemplu", address: "Str. Demo nr. 45, Sector 5, București", dist: "1,6 km" }
  ];
  let lockerChosen = null, lockerPending = null;
  const sheet = one("[data-locker-sheet]"), backdrop = one("[data-locker-backdrop]");
  const list = one("[data-locker-list]"), search = one("[data-locker-search]"), confirmBtn = one("[data-confirm-locker]");
  const renderLockers = () => {
    const q = search.value.trim().toLowerCase();
    const items = LOCKERS.filter((l) => !q || `${l.name} ${l.address}`.toLowerCase().includes(q));
    list.innerHTML = items.map((l) => `<li><button type="button" class="locker-item${lockerPending === l ? " is-selected" : ""}" data-name="${l.name}"><span class="choice-dot"></span><span class="locker-item-copy"><strong>${l.name}</strong><small>${l.address}</small></span><em>${l.dist}</em></button></li>`).join("");
    one("[data-locker-empty]").hidden = items.length > 0;
    all(".locker-item", list).forEach((btn) => btn.addEventListener("click", () => {
      lockerPending = LOCKERS.find((l) => l.name === btn.dataset.name);
      renderLockers();
      confirmBtn.disabled = false;
      confirmBtn.textContent = "ALEGE ACEST EASYBOX";
    }));
  };
  const openLocker = () => {
    lockerPending = lockerChosen;
    confirmBtn.disabled = !lockerPending;
    confirmBtn.textContent = lockerPending ? "ALEGE ACEST EASYBOX" : "Alege un easybox";
    renderLockers();
    backdrop.hidden = false;
    sheet.classList.add("is-open"); sheet.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    one("[data-close-locker]").focus();
  };
  const closeLocker = () => {
    sheet.classList.remove("is-open"); sheet.setAttribute("aria-hidden", "true");
    backdrop.hidden = true; document.body.style.overflow = "";
  };
  confirmBtn.addEventListener("click", () => {
    lockerChosen = lockerPending;
    one("[data-locker-value]").value = `${lockerChosen.name}, ${lockerChosen.address}`;
    one("[data-locker-label]").innerHTML = `<b>${lockerChosen.name}</b><br>${lockerChosen.address}`;
    one("[data-open-locker]").textContent = "Schimbă easybox-ul";
    one("[data-locker-error]").hidden = true;
    const radio = one('input[name="shipping"][value="locker"]', form);
    if (!radio.checked) { radio.checked = true; update(); }
    closeLocker();
  });
  one("[data-open-locker]").addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); openLocker(); });
  one('input[name="shipping"][value="locker"]', form).addEventListener("change", (e) => { if (e.target.checked && !lockerChosen) openLocker(); });
  one("[data-close-locker]").addEventListener("click", closeLocker);
  backdrop.addEventListener("click", closeLocker);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && sheet.classList.contains("is-open")) closeLocker(); });
  search.addEventListener("input", renderLockers);

  update();
})();
