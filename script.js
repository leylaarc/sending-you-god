const PRODUCT_PRICE = 18;
const SELF_SHIPPING = 4;
const GIFT_SHIPPING = 0;

const purchaseRadios = document.querySelectorAll('input[name="purchase-type"]');
const giftSection = document.getElementById('gift-section');
const selfSection = document.getElementById('self-section');
const selfContact = document.getElementById('self-contact');
const shippingDisplay = document.getElementById('shipping-display');
const totalDisplay = document.getElementById('total-display');
const btnTotal = document.getElementById('btn-total');
const giftMessage = document.getElementById('gift-message');
const charCount = document.getElementById('char-count');
const orderForm = document.getElementById('order-form');
const submitBtn = document.getElementById('submit-btn');
const checkoutError = document.getElementById('checkout-error');
const toast = document.getElementById('toast');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.getElementById('nav-links');
const header = document.querySelector('.site-header');

function formatPrice(amount) {
  return `$${amount.toFixed(2)}`;
}

function getPurchaseType() {
  const checked = document.querySelector('input[name="purchase-type"]:checked');
  return checked ? checked.value : 'self';
}

function updatePricing() {
  const isGift = getPurchaseType() === 'gift';
  const shipping = isGift ? GIFT_SHIPPING : SELF_SHIPPING;
  const total = PRODUCT_PRICE + shipping;

  shippingDisplay.textContent = shipping === 0 ? 'Complimentary' : formatPrice(shipping);
  totalDisplay.textContent = formatPrice(total);
  btnTotal.textContent = formatPrice(total);
}

function updateFormSections() {
  const isGift = getPurchaseType() === 'gift';

  giftSection.hidden = !isGift;
  selfSection.hidden = isGift;
  selfContact.hidden = !isGift;

  document.getElementById('customer-name').required = !isGift;
  document.getElementById('customer-email').required = !isGift;
  document.getElementById('customer-address').required = !isGift;

  document.getElementById('recipient-name').required = isGift;
  document.getElementById('recipient-address').required = isGift;
  document.getElementById('gift-sender-email').required = isGift;

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

if (orderForm) {
  updateFormSections();
}
