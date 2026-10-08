const state = {
  gallery: 0,
  size: null,
  cart: "default",
  fit: "standard",
  width: "regular",
  color: "Roșu",
  reviews: "many",
  videos: 1,
  delivery: "paid",
  cartUpsell: false,
  cartItems: [],
  stickyOverride: null
};

const cartProductValue = 179;
const cartOldProductValue = 249;
const cartShippingCost = 20;
const freeShippingThreshold = 299;
let cartItemSequence = 0;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const allSlides = $$(".gallery-slide");
const galleryTrack = $(".gallery-track");
const current = $("#galleryCurrent");
const total = $("#galleryTotal");

const visibleSlides = () => allSlides.filter(slide => !slide.hidden);

const storyVideoSlides = $$(".story-video-slide");
const storyVideoTrack = $(".story-video-slides");
let storyVideoIndex = 0;
const isCenteredStoryCarousel = () => window.matchMedia("(max-width: 640px)").matches;

function setStoryVideo(index, shouldScroll = true) {
  storyVideoIndex = (index + storyVideoSlides.length) % storyVideoSlides.length;
  storyVideoSlides.forEach((slide, slideIndex) => {
    const active = slideIndex === storyVideoIndex;
    slide.classList.toggle("is-active", active);
    slide.setAttribute("aria-current", active ? "true" : "false");
    if (!active) {
      slide.classList.remove("is-playing");
      const playButton = $(".play-button", slide);
      const playLabel = $("span", playButton);
      if (playButton.dataset.defaultLabel) playLabel.textContent = playButton.dataset.defaultLabel;
    }
  });
  if (shouldScroll) {
    const activeSlide = storyVideoSlides[storyVideoIndex];
    let left = activeSlide.offsetLeft;
    if (isCenteredStoryCarousel()) {
      if (storyVideoIndex === 0) left = 0;
      else if (storyVideoIndex === storyVideoSlides.length - 1) left = storyVideoTrack.scrollWidth - storyVideoTrack.clientWidth;
      else left = activeSlide.offsetLeft - (storyVideoTrack.clientWidth - activeSlide.offsetWidth) / 2;
    }
    storyVideoTrack.scrollTo({ left, behavior: "smooth" });
  }
}

if (storyVideoSlides.length) {
  $(".story-video-prev").addEventListener("click", () => setStoryVideo(storyVideoIndex - 1));
  $(".story-video-next").addEventListener("click", () => setStoryVideo(storyVideoIndex + 1));
  let storyScrollFrame = null;
  storyVideoTrack.addEventListener("scroll", () => {
    if (storyScrollFrame) return;
    storyScrollFrame = requestAnimationFrame(() => {
      const nearest = storyVideoSlides.reduce((best, slide, index) => {
        const distance = isCenteredStoryCarousel()
          ? Math.abs((slide.offsetLeft + slide.offsetWidth / 2) - (storyVideoTrack.scrollLeft + storyVideoTrack.clientWidth / 2))
          : Math.abs(slide.offsetLeft - storyVideoTrack.scrollLeft);
        return distance < best.distance ? { index, distance } : best;
      }, { index: 0, distance: Infinity });
      if (nearest.index !== storyVideoIndex) setStoryVideo(nearest.index, false);
      storyScrollFrame = null;
    });
  }, { passive: true });
  setStoryVideo(0, false);
}

function setGallery(index, shouldScroll = true) {
  const slides = visibleSlides();
  state.gallery = (index + slides.length) % slides.length;
  allSlides.forEach(slide => {
    const active = slide === slides[state.gallery];
    slide.classList.toggle("is-active", active);
    slide.setAttribute("aria-current", active ? "true" : "false");
  });
  current.textContent = state.gallery + 1;
  total.textContent = slides.length;
  if (shouldScroll) {
    galleryTrack.scrollTo({ left: slides[state.gallery].offsetLeft, behavior: "smooth" });
  }
}

$(".gallery-prev").addEventListener("click", () => setGallery(state.gallery - 1));
$(".gallery-next").addEventListener("click", () => setGallery(state.gallery + 1));
let galleryScrollFrame = null;
galleryTrack.addEventListener("scroll", () => {
  if (galleryScrollFrame) return;
  galleryScrollFrame = requestAnimationFrame(() => {
    const slides = visibleSlides();
    const nearest = slides.reduce((best, slide, index) => {
      const distance = Math.abs(slide.offsetLeft - galleryTrack.scrollLeft);
      return distance < best.distance ? { index, distance } : best;
    }, { index: 0, distance: Infinity });
    if (nearest.index !== state.gallery) setGallery(nearest.index, false);
    galleryScrollFrame = null;
  });
}, { passive: true });
setGallery(0, false);

const favorite = $(".favorite-button");
favorite.addEventListener("click", () => {
  const next = favorite.getAttribute("aria-pressed") !== "true";
  favorite.setAttribute("aria-pressed", String(next));
  favorite.setAttribute("aria-label", next ? "Elimină de la favorite" : "Adaugă la favorite");
});

const sizeButtons = $$(".size-grid button:not([data-stock-alert])");
const stickySizeWrap = $(".sticky-size");
const stickySizeSelect = $("#stickySize");
const stickySizeTrigger = $(".sticky-size-trigger");
const stickySizeMenu = $(".sticky-size-menu");
const stickySizeValue = $(".sticky-size-value");
const stickySizeOptions = $$("[data-sticky-size]");

function closeStickySizePicker() {
  stickySizeMenu.hidden = true;
  stickySizeTrigger.setAttribute("aria-expanded", "false");
}

function openStickySizePicker(showError = false) {
  stickySizeMenu.hidden = false;
  stickySizeTrigger.setAttribute("aria-expanded", "true");
  stickySizeWrap.classList.toggle("is-missing", showError && !state.size);
}

function selectSize(size) {
  state.size = String(size);
  sizeButtons.forEach(button => {
    const selected = button.dataset.size === state.size;
    button.setAttribute("aria-checked", String(selected));
  });
  $(".size-stock-note").hidden = state.size !== "35";
  $(".buy-area").classList.remove("is-missing");
  stickySizeSelect.value = state.size;
  stickySizeValue.textContent = state.size;
  stickySizeOptions.forEach(button => button.setAttribute("aria-selected", String(button.dataset.stickySize === state.size)));
  stickySizeWrap.classList.remove("is-missing");
  closeStickySizePicker();
  setCartState("default");
}
sizeButtons.forEach(button => button.addEventListener("click", () => selectSize(button.dataset.size)));
stickySizeTrigger.addEventListener("click", () => {
  if (stickySizeMenu.hidden) openStickySizePicker();
  else closeStickySizePicker();
});
stickySizeOptions.forEach(button => button.addEventListener("click", () => selectSize(button.dataset.stickySize)));
document.addEventListener("click", event => {
  if (!stickySizeMenu.hidden && !$(".sticky-buy").contains(event.target)) closeStickySizePicker();
});

function setCartState(next) {
  state.cart = next;
  const cta = $(".add-to-cart");
  const copy = $(".cta-copy");
  const stickyCopy = $(".sticky-cta");
  cta.classList.remove("is-loading", "is-success");
  cta.disabled = false;
  if (next === "loading") {
    cta.classList.add("is-loading");
    cta.disabled = true;
    copy.textContent = "SE ADAUGĂ…";
    stickyCopy.textContent = "SE ADAUGĂ…";
  } else if (next === "success") {
    cta.classList.add("is-success");
    copy.textContent = "ADĂUGAT ÎN COȘ";
    stickyCopy.textContent = "ADĂUGAT ✓";
  } else if (next === "missing") {
    $(".buy-area").classList.add("is-missing");
    $(".size-stock-note").hidden = true;
    copy.textContent = "SELECTEAZĂ MĂRIMEA";
    stickyCopy.textContent = "SELECTEAZĂ MĂRIMEA";
  } else {
    const label = state.size ? "ADAUGĂ ÎN COȘ" : "SELECTEAZĂ MĂRIMEA";
    copy.textContent = label;
    stickyCopy.textContent = label;
  }
}

function addToCart(source = "main") {
  if (!state.size) {
    setCartState("missing");
    if (source === "sticky") {
      openStickySizePicker(true);
    } else {
      $(".buy-area").scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => sizeButtons[0].focus({ preventScroll: true }), 420);
    }
    return;
  }
  setCartState("loading");
  setTimeout(() => {
    addCurrentItemToCart();
    setCartState("success");
    updateCartDrawer();
    showToast("Produsul a fost adăugat în coș.");
    setTimeout(() => {
      openDrawer($(".cart-drawer"));
      setCartState("default");
    }, 350);
    if (source === "sticky") window.navigator.vibrate?.(30);
  }, 700);
}
$(".add-to-cart").addEventListener("click", () => addToCart("main"));
$(".sticky-cta").addEventListener("click", () => addToCart("sticky"));
stickySizeSelect.addEventListener("change", event => {
  if (event.target.value) selectSize(event.target.value);
});

$$('[data-scroll]').forEach(button => button.addEventListener("click", () => {
  if (button.classList.contains("rating-link") && state.reviews === "none") {
    $(".review-dialog").showModal();
    return;
  }
  document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth" });
}));

const sticky = $(".sticky-buy");
function showSticky(show) {
  sticky.classList.toggle("is-visible", show);
  sticky.setAttribute("aria-hidden", String(!show));
  if (!show) {
    closeStickySizePicker();
    stickySizeWrap.classList.remove("is-missing");
  }
}
const sizeObserver = new IntersectionObserver(entries => {
  if (state.stickyOverride !== null) return;
  showSticky(!entries[0].isIntersecting);
}, { threshold: 0.12 });
sizeObserver.observe($(".size-grid"));

let stickyFrame = null;
window.addEventListener("scroll", () => {
  if (state.stickyOverride !== null || stickyFrame) return;
  stickyFrame = requestAnimationFrame(() => {
    const sizeRect = $(".size-grid").getBoundingClientRect();
    const sizeVisible = sizeRect.top < window.innerHeight && sizeRect.bottom > 0;
    showSticky(!sizeVisible);
    stickyFrame = null;
  });
}, { passive: true });

$$('.color-option').forEach(option => option.addEventListener("click", () => {
  $$('.color-option').forEach(item => {
    const active = item.dataset.name === option.dataset.name;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-checked", String(active));
  });
  state.color = option.dataset.name;
  $("#titleColor").textContent = option.dataset.title;
  const galleryImages = option.dataset.galleryImages?.split("|");
  $$(".gallery-slide img").forEach((image, index) => {
    image.src = galleryImages?.[index] || option.dataset.image;
    image.alt = `Sandale PV970, culoare ${option.dataset.name}`;
  });
  setGallery(0);
}));

$$('.accordion-trigger').forEach(trigger => trigger.addEventListener("click", () => {
  const accordion = trigger.closest(".accordion");
  const panel = $(".accordion-panel", accordion);
  const open = !accordion.classList.contains("is-open");
  accordion.classList.toggle("is-open", open);
  trigger.setAttribute("aria-expanded", String(open));
  panel.hidden = !open;
}));

$(".exchange-more").addEventListener("click", event => {
  event.preventDefault();
  showToast("Pagina cu detaliile complete despre schimb va fi conectată în producție.");
});

$(".return-more").addEventListener("click", event => {
  event.preventDefault();
  showToast("Pagina cu politica completă de retur și garanție va fi conectată în producție.");
});

const modal = $(".size-guide-modal");
const backdrop = $(".modal-backdrop");
function openSizeGuide() {
  backdrop.hidden = false;
  modal.showModal();
  document.body.style.overflow = "hidden";
}
function closeSizeGuide() {
  modal.close();
  backdrop.hidden = true;
  document.body.style.overflow = "";
}
$$('.open-size-guide').forEach(button => button.addEventListener("click", openSizeGuide));
$(".modal-close").addEventListener("click", closeSizeGuide);
backdrop.addEventListener("click", closeSizeGuide);
modal.addEventListener("cancel", event => { event.preventDefault(); closeSizeGuide(); });

function setFit(value) {
  state.fit = value;
  const block = $(".fit-guidance");
  const modalBlock = $(".modal-fit-repeat div");
  const copy = {
    unknown: ["Consultă ghidul de mărimi", "Recomandarea specifică nu este disponibilă."],
    standard: ["Alege mărimea pe care o porți de obicei", ""],
    small: ["Acest model vine mai mic", "Alege o mărime mai mare decât porți de obicei."],
    large: ["Acest model vine mai mare", "Dacă ești între mărimi, alege mărimea mai mică."]
  }[value];
  block.dataset.fit = value;
  const badge = $("em", block);
  badge.hidden = true;
  $("use", block).setAttribute("href", value === "unknown" ? "#i-info" : "#i-check");
  $("use", modalBlock.parentElement).setAttribute("href", value === "standard" ? "#i-check" : value === "unknown" ? "#i-info" : "#i-ruler");
  $("strong", block).textContent = copy[0];
  let detail = $("span", block);
  if (copy[1] && !detail) {
    detail = document.createElement("span");
    $("div", block).append(detail);
  }
  if (detail) {
    detail.textContent = copy[1];
    detail.hidden = !copy[1];
  }
  $("strong", modalBlock).textContent = copy[0] + ".";
  $("span", modalBlock).textContent = copy[1] || "Potrivire pe lungime: standard.";
}

function setWidth(value) {
  state.width = value;
  const copy = {
    narrow: ["ÎNGUST", "Modelul se potrivește pentru picior îngust."],
    regular: ["NORMAL", "Modelul se potrivește pentru picior normal."],
    wide: ["LAT", "Modelul se potrivește pentru picior lat."]
  }[value];
  $(".width-fit b").textContent = copy[0];
  let detail = $(".width-fit small");
  if (copy[1] && !detail) {
    detail = document.createElement("small");
    $(".width-fit").append(detail);
  }
  if (detail) {
    detail.textContent = copy[1];
    detail.hidden = !copy[1];
  }
}

function setReviewState(value) {
  state.reviews = value;
  const populated = $(".reviews-populated");
  const empty = $(".reviews-empty-state");
  const metrics = $(".review-metrics");
  const articles = $$(".customer-review");
  $(".compact-testimonial").hidden = value === "none";
  const topStars = $(".rating-link .stars");
  const topScore = $(".rating-link strong");
  const topCount = $(".rating-link span:last-child");
  const summary = $(".rating-summary");
  if (value === "none") {
    populated.hidden = true;
    empty.hidden = false;
    topStars.classList.add("empty");
    topScore.hidden = true;
    topCount.textContent = "Adaugă o recenzie";
    $(".rating-link").setAttribute("aria-label", "Adaugă o recenzie");
    summary.innerHTML = '<span class="stars empty">★★★★★</span><strong>Fără recenzii</strong>';
    return;
  }
  populated.hidden = false;
  empty.hidden = true;
  topStars.classList.remove("empty");
  topScore.hidden = false;
  $(".rating-link").setAttribute("aria-label", "Mergi la recenzii");
  const few = value === "few";
  topScore.textContent = few ? "4,8" : "4,9";
  topCount.textContent = few ? "din +4 recenzii verificate" : "din +127 recenzii verificate";
  summary.innerHTML = `<span class="stars">★★★★★</span><strong>${few ? "4,8" : "4,9"}/5</strong><small>+${few ? "4" : "127"} recenzii verificate</small>`;
  metrics.hidden = few;
  articles.forEach((article, index) => { article.hidden = few && index > 1; });
  $(".load-reviews").textContent = "Vezi mai multe recenzii de la cliente";
}

function setDeliveryState(value) {
  state.delivery = value;
  const row = $(".delivery-service-row");
  const free = value === "free";
  row.classList.toggle("is-free", free);
  $("aside strong", row).textContent = free ? "GRATUIT" : "20 LEI";
  $("aside small", row).textContent = free ? "Acoperim noi costul" : "Oriunde în țară";
  updateCartPricing();
}

function updateCartPricing() {
  const subtotal = state.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const originalSubtotal = state.cartItems.reduce((sum, item) => sum + item.oldPrice * item.quantity, 0);
  const totalSaving = originalSubtotal - subtotal;
  const free = state.delivery === "free" || subtotal >= freeShippingThreshold;
  const shipping = free ? 0 : cartShippingCost;
  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const progress = free ? 100 : Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const goal = $(".cart-shipping-goal-banner");
  const goalCopy = $(".cart-shipping-goal-copy p");
  const goalBar = $(".cart-shipping-goal-meter u");

  $(".cart-total-current").textContent = `${subtotal + shipping} Lei`;
  $(".cart-total-original-value").textContent = String(originalSubtotal + shipping);
  $(".cart-total-saving-value").textContent = `${totalSaving} Lei`;
  $(".cart-total-free-benefit").hidden = !free;
  const totalMeta = $(".cart-total-meta");
  totalMeta.hidden = free;
  totalMeta.textContent = free ? "" : `Include cost transport ${shipping} Lei`;
  goal.classList.toggle("is-free", free);
  goalCopy.innerHTML = free
    ? "✓ Ai <strong>LIVRARE GRATUITĂ!</strong>"
    : `Mai adaugă <strong>${remaining} Lei</strong> pentru livrare gratuită.`;
  goalBar.style.width = `${progress}%`;
}

function cartQuantity() {
  return state.cartItems.reduce((sum, item) => sum + item.quantity, 0);
}

function addCurrentItemToCart() {
  const key = `${state.color}::${state.size}`;
  const existing = state.cartItems.find(item => item.key === key);
  if (existing) {
    existing.quantity += 1;
  } else {
    const colorOption = $(`.color-option[data-name="${state.color}"]`);
    state.cartItems.push({
      id: ++cartItemSequence,
      key,
      title: "Sandale din piele naturală PV970",
      size: state.size,
      color: state.color,
      image: colorOption.dataset.image,
      price: cartProductValue,
      oldPrice: cartOldProductValue,
      quantity: 1
    });
  }
  $(".cart-count").textContent = String(cartQuantity());
}

function renderCartItems() {
  const container = $(".cart-products");
  container.innerHTML = state.cartItems.map(item => {
    const currentTotal = item.price * item.quantity;
    const oldTotal = item.oldPrice * item.quantity;
    const saving = oldTotal - currentTotal;
    return `<article class="cart-product" data-cart-item="${item.id}">
      <img src="${item.image}" alt="${item.title}" />
      <div><strong>${item.title}</strong><span>Mărime: <b>${item.size}</b> • Culoare: <b>${item.color}</b></span><p class="cart-product-price-line"><em>${currentTotal} Lei</em><del>${oldTotal} Lei</del><small>Economisești <b>${saving} Lei</b></small></p><div class="cart-quantity-selector"><span>Cantitate</span><div><button type="button" data-cart-decrease="${item.id}" aria-label="Scade cantitatea pentru ${item.title}" ${item.quantity === 1 ? "disabled" : ""}>−</button><output aria-label="Cantitate">${item.quantity}</output><button type="button" data-cart-increase="${item.id}" aria-label="Mărește cantitatea pentru ${item.title}">+</button></div></div></div>
      <button class="cart-item-delete" type="button" data-cart-delete="${item.id}" aria-label="Șterge ${item.title} din coș"><svg aria-hidden="true"><use href="#i-x"/></svg><span>Șterge</span></button>
    </article>`;
  }).join("");
  container.hidden = state.cartItems.length === 0;

  $$("[data-cart-delete]", container).forEach(button => button.addEventListener("click", () => {
    const id = Number(button.dataset.cartDelete);
    state.cartItems = state.cartItems.filter(item => item.id !== id);
    $(".cart-count").textContent = String(cartQuantity());
    if (!state.cartItems.length) {
      updateCartDrawer();
      showToast("Produsul a fost șters din coș.");
      return;
    }
    updateCartDrawer();
    showToast("Produsul a fost șters din coș.");
  }));

  $$('[data-cart-decrease]', container).forEach(button => button.addEventListener("click", () => {
    const item = state.cartItems.find(entry => entry.id === Number(button.dataset.cartDecrease));
    if (!item || item.quantity <= 1) return;
    item.quantity -= 1;
    $(".cart-count").textContent = String(cartQuantity());
    $(".cart-title").textContent = cartQuantity() > 1 ? "Produse adăugate în coș" : "Produs adăugat în coș";
    renderCartItems();
    updateCartPricing();
  }));

  $$('[data-cart-increase]', container).forEach(button => button.addEventListener("click", () => {
    const item = state.cartItems.find(entry => entry.id === Number(button.dataset.cartIncrease));
    if (!item) return;
    item.quantity += 1;
    $(".cart-count").textContent = String(cartQuantity());
    $(".cart-title").textContent = "Produse adăugate în coș";
    renderCartItems();
    updateCartPricing();
  }));
}

function setCartUpsellState(value) {
  state.cartUpsell = value === "show";
  $(".cart-upsell").hidden = !state.cartUpsell;
  $$("[data-cart-upsell]").forEach(button => {
    const active = button.dataset.cartUpsell === value;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function setVideoState(value) {
  state.videos = Number(value);
  $$('[data-video-slot]').forEach(element => {
    element.hidden = Number(element.dataset.videoSlot) > state.videos;
  });
  setGallery(0);
}

const panel = $(".prototype-panel");
function togglePanel(open) {
  panel.classList.toggle("is-open", open);
  panel.setAttribute("aria-hidden", String(!open));
}
$(".prototype-trigger").addEventListener("click", () => togglePanel(true));
$(".prototype-close").addEventListener("click", () => togglePanel(false));
$("#fitState").addEventListener("change", event => {
  setFit(event.target.value);
  if (window.location.protocol !== "file:") {
    const url = new URL(window.location.href);
    url.searchParams.set("fit", event.target.value);
    window.history.replaceState({}, "", url);
  }
});
$("#widthState").addEventListener("change", event => setWidth(event.target.value));
$("#reviewState").addEventListener("change", event => setReviewState(event.target.value));
$("#videoState").addEventListener("change", event => setVideoState(event.target.value));
$("#colorState").addEventListener("change", event => {
  $$(".colors-block").forEach(block => { block.hidden = event.target.value === "hide"; });
});
$("#deliveryState").addEventListener("change", event => setDeliveryState(event.target.value));
$$("[data-cart-upsell]").forEach(button => button.addEventListener("click", () => setCartUpsellState(button.dataset.cartUpsell)));
$$('[data-cta]').forEach(button => button.addEventListener("click", () => {
  const value = button.dataset.cta;
  if (value === "missing") state.size = null;
  setCartState(value);
}));
$$('[data-sticky]').forEach(button => button.addEventListener("click", () => {
  const show = button.dataset.sticky === "show";
  state.stickyOverride = show;
  showSticky(show);
}));

$$('.play-button').forEach(button => button.addEventListener("click", () => {
  const slide = button.closest(".gallery-video, .video-frame");
  const playing = !slide.classList.contains("is-playing");
  const label = $("span", button);
  button.dataset.defaultLabel ||= label.textContent;
  slide.classList.toggle("is-playing", playing);
  label.textContent = playing ? "Pauză" : button.dataset.defaultLabel;
  showToast(playing ? "Redare video demonstrativă" : "Video întrerupt");
}));

function showToast(message, tone = "success") {
  const toast = $(".toast");
  toast.textContent = message;
  toast.classList.toggle("is-error", tone === "error");
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

const drawerBackdrop = $(".drawer-backdrop");
function openDrawer(drawer) {
  $$(".ui-drawer.is-open").forEach(item => {
    item.classList.remove("is-open");
    item.setAttribute("aria-hidden", "true");
  });
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  drawerBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
  $(".drawer-close", drawer)?.focus();
}

function closeDrawers() {
  $$(".ui-drawer.is-open").forEach(drawer => {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  });
  drawerBackdrop.hidden = true;
  document.body.style.overflow = "";
  if (state.cart === "success") setCartState("default");
}

function updateCartDrawer() {
  const empty = state.cartItems.length === 0;
  const drawer = $(".cart-drawer");
  renderCartItems();
  drawer.classList.toggle("is-empty", empty);
  $(".cart-empty-state").hidden = !empty;
  $(".cart-shipping-goal-banner").hidden = empty;
  $(".cart-total").hidden = empty;
  $(".cart-urgency").hidden = empty;
  $(".checkout-button").hidden = empty;
  $(".cart-continue").hidden = empty;
  $(".cart-upsell").hidden = empty ? false : !state.cartUpsell;
  $(".cart-upsell-head > strong").textContent = empty ? "Recomandări pentru tine" : "S-ar putea să-ți placă și";
  $(".cart-title").textContent = empty ? "Coșul meu" : (cartQuantity() > 1 ? "Produse adăugate în coș" : "Produs adăugat în coș");
  if (!empty) updateCartPricing();
  $(".cart-upsell-track").scrollLeft = 0;
}

$(".js-open-menu").addEventListener("click", () => openDrawer($(".nav-drawer")));
$(".js-open-search").addEventListener("click", () => openDrawer($(".search-drawer")));
$(".js-open-cart").addEventListener("click", () => {
  updateCartDrawer();
  openDrawer($(".cart-drawer"));
});
$$('.drawer-close').forEach(button => button.addEventListener("click", closeDrawers));
drawerBackdrop.addEventListener("click", closeDrawers);

$(".search-form").addEventListener("submit", event => {
  event.preventDefault();
  const query = $("#siteSearch").value.trim();
  if (!query) {
    $("#siteSearch").focus();
    return;
  }
  closeDrawers();
  showToast(`Căutare demo: „${query}”`);
});
$$('.search-suggestions button').forEach(button => button.addEventListener("click", () => {
  $("#siteSearch").value = button.textContent;
  $("#siteSearch").focus();
}));
$$('.nav-drawer nav a').forEach(link => link.addEventListener("click", event => {
  event.preventDefault();
  closeDrawers();
  showToast(`Categorie demo: ${link.textContent}`);
}));
$(".checkout-button").addEventListener("click", () => {
  const firstItem = state.cartItems[0];
  const selectedSize = firstItem?.size || $(".size-grid button.is-selected")?.dataset.size || "38";
  try {
    sessionStorage.setItem("epiele-demo-cart", JSON.stringify({ quantity: Math.max(1, cartQuantity()), size: selectedSize, coupon: false, upsell: false }));
  } catch (_) {
    // Navigarea funcționează și dacă stocarea locală nu este disponibilă.
  }
  window.location.href = "checkout.html";
});
$(".cart-continue").addEventListener("click", closeDrawers);
$$('[data-upsell-action]').forEach(button => button.addEventListener("click", () => showToast("Produsul recomandat va fi deschis în producție.")));
const cartUpsellTrack = $(".cart-upsell-track");
$(".cart-carousel-prev").addEventListener("click", () => cartUpsellTrack.scrollBy({ left: -170, behavior: "smooth" }));
$(".cart-carousel-next").addEventListener("click", () => cartUpsellTrack.scrollBy({ left: 170, behavior: "smooth" }));

if (new URLSearchParams(window.location.search).get("cart") === "open") {
  let restoredCart = false;
  try {
    const savedCart = JSON.parse(sessionStorage.getItem("epiele-demo-cart") || "null");
    if (savedCart?.size) {
      selectSize(savedCart.size);
      addCurrentItemToCart();
      restoredCart = true;
    }
  } catch (_) {
    // Coșul poate fi deschis și dacă stocarea sesiunii nu este disponibilă.
  }
  if (!restoredCart) state.cartItems = [];
  updateCartDrawer();
  openDrawer($(".cart-drawer"));
}
$(".load-reviews").addEventListener("click", () => showToast("În producție se vor încărca următoarele recenzii."));

const reviewDialog = $(".review-dialog");
$$('.js-write-review').forEach(button => button.addEventListener("click", () => reviewDialog.showModal()));
$(".js-close-review").addEventListener("click", () => reviewDialog.close());
$(".js-submit-review").addEventListener("click", () => {
  reviewDialog.close();
  showToast("Mulțumim — formularul demonstrativ a fost închis.");
});

const starButtons = $$(".star-rating button");
function setReviewStars(value) {
  starButtons.forEach((button, index) => button.classList.toggle("is-selected", index < value));
  $(".star-rating small").textContent = `${value} din 5 stele`;
}
starButtons.forEach(button => button.addEventListener("click", () => setReviewStars(Number(button.dataset.stars))));
setReviewStars(5);

const reviewPhotosInput = $("#reviewPhotos");
const reviewUploadPreview = $(".review-upload-preview");
let reviewPhotoUrls = [];
reviewPhotosInput.addEventListener("change", () => {
  reviewPhotoUrls.forEach(url => URL.revokeObjectURL(url));
  reviewPhotoUrls = [];
  reviewUploadPreview.replaceChildren();
  Array.from(reviewPhotosInput.files).slice(0, 5).forEach(file => {
    const url = URL.createObjectURL(file);
    reviewPhotoUrls.push(url);
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    image.src = url;
    image.alt = `Previzualizare ${file.name}`;
    figure.append(image);
    reviewUploadPreview.append(figure);
  });
  if (reviewPhotosInput.files.length > 5) showToast("Poți adăuga maximum 5 fotografii.");
});

const reviewPhotoDialog = $(".review-photo-dialog");
const enlargedReviewPhoto = $(".review-photo-stage > img", reviewPhotoDialog);
const customerPhotoReviews = [
  { src: "assets/pv970-gallery-1.webp", alt: "Sandalele roșii purtate de Doina", stars: "★★★★★", text: "Sandalele sunt foarte comode, pielea este moale și mărimea mi s-a potrivit perfect.", author: "Doina D.", date: "14 iul.", ordered: "38", usual: "38", fit: "Exactă" },
  { src: "assets/pv970-gallery-2.webp", alt: "Sandalele roșii fotografiate de Mariana", stars: "★★★★★", text: "Foarte ușoare și frumoase. Le-am purtat o zi întreagă fără să mă jeneze.", author: "Mariana C.", date: "8 iul.", ordered: "37", usual: "37", fit: "Exactă" },
  { src: "assets/pv970-gallery-3.webp", alt: "Detaliu cu sandalele roșii purtate de Elena", stars: "★★★★☆", text: "Culoarea este exact ca în poze, iar schimbul de mărime a fost foarte simplu.", author: "Elena P.", date: "2 iul.", ordered: "39", usual: "38–39", fit: "Exactă" },
  { src: "assets/product-2.jpg", alt: "Fotografie trimisă de Andreea", stars: "★★★★★", text: "În realitate sunt și mai frumoase. Le-am comandat pentru concediu și sunt moi, ușoare și foarte comode.", author: "Andreea M.", date: "28 iun.", ordered: "38", usual: "38", fit: "Exactă" },
  { src: "assets/product-4.jpg", alt: "Sandalele purtate, fotografie de Ioana", stars: "★★★★★", text: "Pielea este moale, iar bareta se reglează ușor. Le-aș cumpăra din nou.", author: "Ioana R.", date: "21 iun.", ordered: "36", usual: "36", fit: "Exactă" }
];
let activeCustomerPhoto = 0;

function renderCustomerPhoto(index) {
  activeCustomerPhoto = (index + customerPhotoReviews.length) % customerPhotoReviews.length;
  const review = customerPhotoReviews[activeCustomerPhoto];
  enlargedReviewPhoto.src = review.src;
  enlargedReviewPhoto.alt = review.alt;
  $(".review-photo-copy .stars").textContent = review.stars;
  $(".review-photo-counter").textContent = `${activeCustomerPhoto + 1} / ${customerPhotoReviews.length}`;
  $(".review-photo-text").textContent = `„${review.text}”`;
  $(".review-photo-author").textContent = review.author;
  $(".review-photo-date").textContent = review.date;
  $(".review-photo-ordered").textContent = review.ordered;
  $(".review-photo-usual").textContent = review.usual;
  $(".review-photo-fit").textContent = review.fit;
  $$('[data-review-photo-index]').forEach((button, buttonIndex) => {
    const isActive = buttonIndex === activeCustomerPhoto;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "true" : "false");
    if (isActive) button.scrollIntoView({ block: "nearest" });
  });
}

function openCustomerPhoto(index) {
  renderCustomerPhoto(index);
  if (!reviewPhotoDialog.open) reviewPhotoDialog.showModal();
}

$$('[data-customer-photo]').forEach(button => button.addEventListener("click", () => openCustomerPhoto(Number(button.dataset.customerPhoto))));
$$('.review-photo-thumb').forEach(button => button.addEventListener("click", () => {
  const matchedIndex = customerPhotoReviews.findIndex(review => review.src === button.dataset.full);
  openCustomerPhoto(matchedIndex >= 0 ? matchedIndex : 0);
}));
$$('[data-review-photo-index]').forEach(button => button.addEventListener("click", () => renderCustomerPhoto(Number(button.dataset.reviewPhotoIndex))));
$(".review-photo-prev").addEventListener("click", () => renderCustomerPhoto(activeCustomerPhoto - 1));
$(".review-photo-next").addEventListener("click", () => renderCustomerPhoto(activeCustomerPhoto + 1));
reviewPhotoDialog.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") renderCustomerPhoto(activeCustomerPhoto - 1);
  if (event.key === "ArrowRight") renderCustomerPhoto(activeCustomerPhoto + 1);
});
let reviewPhotoTouchStart = 0;
reviewPhotoDialog.addEventListener("touchstart", event => { reviewPhotoTouchStart = event.changedTouches[0].clientX; }, { passive: true });
reviewPhotoDialog.addEventListener("touchend", event => {
  const distance = event.changedTouches[0].clientX - reviewPhotoTouchStart;
  if (Math.abs(distance) < 45) return;
  renderCustomerPhoto(activeCustomerPhoto + (distance < 0 ? 1 : -1));
}, { passive: true });
$(".js-close-review-photo").addEventListener("click", () => reviewPhotoDialog.close());
reviewPhotoDialog.addEventListener("click", event => {
  if (event.target === reviewPhotoDialog) reviewPhotoDialog.close();
});

const stockAlertDialog = $(".stock-alert-dialog");
const stockAlertForm = $(".stock-alert-form");
const stockAlertEmail = $("#stockAlertEmail");
const stockAlertSuccess = $(".stock-alert-success");

function openStockAlert(size) {
  closeStickySizePicker();
  stickySizeWrap.classList.remove("is-missing");
  $$(".stock-alert-size").forEach(element => { element.textContent = size; });
  $(".stock-alert-success span").textContent = size;
  stockAlertForm.reset();
  stockAlertForm.hidden = false;
  stockAlertSuccess.hidden = true;
  stockAlertDialog.showModal();
  setTimeout(() => stockAlertEmail.focus(), 80);
}

$$('[data-stock-alert]').forEach(button => button.addEventListener("click", () => openStockAlert(button.dataset.sizeLabel)));
$(".js-close-stock-alert").addEventListener("click", () => stockAlertDialog.close());
$(".stock-alert-done").addEventListener("click", () => stockAlertDialog.close());
stockAlertDialog.addEventListener("click", event => {
  if (event.target === stockAlertDialog) stockAlertDialog.close();
});
stockAlertForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!stockAlertEmail.checkValidity()) {
    stockAlertEmail.reportValidity();
    return;
  }
  stockAlertForm.hidden = true;
  stockAlertSuccess.hidden = false;
});

const requestedFit = new URLSearchParams(window.location.search).get("fit");
if (["standard", "small", "large", "unknown"].includes(requestedFit)) {
  $("#fitState").value = requestedFit;
  setFit(requestedFit);
}

window.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeDrawers();
    closeStickySizePicker();
  }
  if (event.key === "ArrowLeft" && document.activeElement.closest?.(".gallery")) setGallery(state.gallery - 1);
  if (event.key === "ArrowRight" && document.activeElement.closest?.(".gallery")) setGallery(state.gallery + 1);
});
