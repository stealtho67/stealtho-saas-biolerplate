import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.changelog',
});

/**
 * POST /api/create-checkout
 * Body: { price_id, user_id, success_url, cancel_url }
 *
 * Creates a Stripe Checkout Session for a subscription and returns the URL.
 */
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { price_id, user_id, success_url, cancel_url } = JSON.parse(event.body);

    if (!price_id || !user_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: price_id, user_id' }) };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      client_reference_id: user_id,
      customer_email: event.headers['x-user-email'] || undefined,
      success_url: success_url || `${process.env.SITE_URL || 'http://localhost:5173'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.SITE_URL || 'http://localhost:5173'}/pricing`,
      subscription_data: {
        metadata: { user_id },
      },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url, session_id: session.id }),
    };
  } catch (err) {
    console.error('create-checkout error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
