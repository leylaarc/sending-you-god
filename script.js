const PRODUCT_PRICE = 20;

const purchaseRadios = document.querySelectorAll('input[name="purchase-type"]');
const giftSection = document.getElementById('gift-section');
const selfSection = document.getElementById('self-section');
const totalDisplay = document.getElementById('total-display');
const btnTotal = document.getElementById('btn-total');
const stickyTotal = document.getElementById('sticky-total');
const giftMessage = document.getElementById('gift-message');
const charCount = document.getElementById('char-count');
const orderForm = document.getElementById('order-form');
const submitBtn = document.getElementById('submit-btn');
const checkoutError = document.getElementById('checkout-error');
const toast = document.getElementById('toast');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.getElementById('nav-links');
const header = document.querySelector('.site-header');
const stickyBuy = document.getElementById('sticky-buy');
const shopSection = document.getElementById('shop');
const shopImageMain = document.getElementById('shop-image-main');

function formatPrice(amount) {
  return `$${amount.toFixed(2)}`;
}

function getPurchaseType() {
  const checked = document.querySelector('input[name="purchase-type"]:checked');
  return checked ? checked.value : 'self';
}

function updatePricing() {
  const total = formatPrice(PRODUCT_PRICE);
  if (totalDisplay) totalDisplay.textContent = total;
  if (btnTotal) btnTotal.textContent = total;
  if (stickyTotal) stickyTotal.textContent = total;
}

function updateFormSections() {
  const isGift = getPurchaseType() === 'gift';

  if (giftSection) giftSection.hidden = !isGift;
  if (selfSection) selfSection.hidden = isGift;

  const customerName = document.getElementById('customer-name');
  const customerEmail = document.getElementById('customer-email');
  const customerAddress = document.getElementById('customer-address');
  const recipientName = document.getElementById('recipient-name');
  const recipientAddress = document.getElementById('recipient-address');
  const giftSenderEmail = document.getElementById('gift-sender-email');

  if (customerName) customerName.required = !isGift;
  if (customerEmail) customerEmail.required = !isGift;
  if (customerAddress) customerAddress.required = !isGift;
  if (recipientName) recipientName.required = isGift;
  if (recipientAddress) recipientAddress.required = isGift;
  if (giftSenderEmail) giftSenderEmail.required = isGift;

  updatePricing();
}

function setPurchaseType(type) {
  const radio = document.querySelector(`input[name="purchase-type"][value="${type}"]`);
  if (radio) {
    radio.checked = true;
    updateFormSections();
  }
}

function showCheckoutError(message) {
  if (checkoutError) {
    checkoutError.textContent = message;
    checkoutError.hidden = false;
    checkoutError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  showToast(message);
}

function clearCheckoutError() {
  if (checkoutError) {
    checkoutError.textContent = '';
    checkoutError.hidden = true;
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => {
      toast.hidden = true;
    }, 500);
  }, 4000);
}

function getFormData() {
  return {
    purchaseType: getPurchaseType(),
    customerName: document.getElementById('customer-name').value.trim(),
    customerEmail: document.getElementById('customer-email').value.trim(),
    customerAddress: document.getElementById('customer-address').value.trim(),
    recipientName: document.getElementById('recipient-name').value.trim(),
    recipientAddress: document.getElementById('recipient-address').value.trim(),
    giftMessage: document.getElementById('gift-message').value.trim(),
    senderName: document.getElementById('sender-name').value.trim(),
    giftSenderEmail: document.getElementById('gift-sender-email').value.trim(),
  };
}

function initGallery() {
  document.querySelectorAll('.shop-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const src = thumb.dataset.src;
      if (!src || !shopImageMain) return;

      shopImageMain.src = src;
      document.querySelectorAll('.shop-thumb').forEach((t) => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
    });
  });
}

function initStickyBuy() {
  if (!stickyBuy || !shopSection) return;

  stickyBuy.hidden = false;

  const observer = new IntersectionObserver(
    ([entry]) => {
      stickyBuy.classList.toggle('is-visible', !entry.isIntersecting);
    },
    { threshold: 0, rootMargin: '0px 0px -80px 0px' }
  );

  observer.observe(shopSection);
}

purchaseRadios.forEach((radio) => {
  radio.addEventListener('change', updateFormSections);
});

document.querySelectorAll('[data-option]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const option = link.dataset.option;
    if (option) {
      setPurchaseType(option);
    }
  });
});

if (giftMessage && charCount) {
  giftMessage.addEventListener('input', () => {
    charCount.textContent = giftMessage.value.length;
  });
}

if (orderForm) {
  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!orderForm.checkValidity()) {
      orderForm.reportValidity();
      return;
    }

    const data = getFormData();
    const originalLabel = submitBtn.innerHTML;

    clearCheckoutError();
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Redirecting to checkout…';

    try {
      const response = await fetch('/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to start checkout.');
      }

      if (!result.url) {
        throw new Error('Checkout did not return a payment link. Please try again.');
      }

      window.location.href = result.url;
    } catch (err) {
      showCheckoutError(err.message || 'Something went wrong. Please try again.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
    }
  });
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navToggle.setAttribute('aria-label', expanded ? 'Open menu' : 'Close menu');
    navLinks.classList.toggle('open', !expanded);
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
      navLinks.classList.remove('open');
    });
  });
}

if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => {
  revealObserver.observe(el);
});

initGallery();
initStickyBuy();

if (orderForm) {
  updateFormSections();
}
