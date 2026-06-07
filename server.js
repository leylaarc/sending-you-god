require('dotenv').config();

const express = require('express');
const path = require('path');
const Stripe = require('stripe');

const PORT = process.env.PORT || 4242;
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const STORE_NAME = process.env.STORE_NAME || 'Sending You God';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: STRIPE_SECRET_KEY is not set. Copy .env.example to .env and add your Stripe keys.');
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const app = express();

app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send('Webhook not configured');
  }

  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Order paid:', {
      sessionId: session.id,
      email: session.customer_email,
      amount: session.amount_total,
      metadata: session.metadata,
    });
  }

  res.json({ received: true });
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payments are not configured yet. Add your Stripe keys to .env' });
  }

  try {
    const {
      purchaseType,
      customerName,
      customerEmail,
      customerAddress,
      recipientName,
      recipientAddress,
      giftMessage,
      senderName,
      giftSenderEmail,
    } = req.body;

    const isGift = purchaseType === 'gift';

    if (isGift) {
      if (!recipientName?.trim() || !recipientAddress?.trim() || !giftSenderEmail?.trim()) {
        return res.status(400).json({ error: 'Recipient name, address, and your email are required for gift orders.' });
      }
    } else if (!customerName?.trim() || !customerEmail?.trim() || !customerAddress?.trim()) {
      return res.status(400).json({ error: 'Name, email, and shipping address are required.' });
    }

    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Mini Eco-Wood Cross',
            description: isGift
              ? 'Gift order — we ship directly to your loved one'
              : 'Handcrafted eco-wood cross · 2.36" × 1.34"',
            images: [`${BASE_URL}/images/cross.png`],
          },
          unit_amount: 1800,
        },
        quantity: 1,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: isGift ? giftSenderEmail.trim() : customerEmail.trim(),
      branding_settings: {
        display_name: STORE_NAME,
      },
      metadata: {
        purchase_type: purchaseType,
        customer_name: (isGift ? senderName : customerName)?.trim() || '',
        customer_email: (isGift ? giftSenderEmail : customerEmail)?.trim() || '',
        shipping_address: (isGift ? recipientAddress : customerAddress)?.trim() || '',
        recipient_name: recipientName?.trim() || '',
        gift_message: giftMessage?.trim()?.slice(0, 500) || '',
        sender_name: senderName?.trim() || '',
      },
      success_url: `${BASE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/cancel.html`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout session error:', err);
    res.status(500).json({ error: err.message || 'Unable to start checkout.' });
  }
});

app.get('/api/session/:id', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payments not configured' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    res.json({
      paid: session.payment_status === 'paid',
      email: session.customer_email,
      purchaseType: session.metadata?.purchase_type,
      recipientName: session.metadata?.recipient_name,
    });
  } catch (err) {
    res.status(404).json({ error: 'Session not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Sending You God running at ${BASE_URL}`);
  console.log(stripe ? 'Stripe: ready' : 'Stripe: NOT configured — add STRIPE_SECRET_KEY to .env and restart');
});
