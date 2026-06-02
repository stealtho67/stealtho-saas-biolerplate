import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.changelog',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

/** In-memory idempotency cache (per warm invocation). */
const processedEvents = new Set();

/**
 * Record a processed Stripe event in Supabase for durable idempotency.
 */
async function recordProcessedEvent(eventId) {
  const { error } = await supabase
    .from('processed_events')
    .insert({ stripe_event_id: eventId });

  // PGRST 23505 = unique violation — already recorded, that's fine.
  if (error && error.code !== '23505') {
    console.error('Failed to record processed event:', error);
  }

  // Also cache in-memory so subsequent calls in the same warm invocation
  // are short-circuited without a DB query.
  processedEvents.add(eventId);
}

/**
 * Check if an event has already been processed (memory → DB).
 */
async function isAlreadyProcessed(eventId) {
  if (processedEvents.has(eventId)) return true;

  const { data, error } = await supabase
    .from('processed_events')
    .select('id')
    .eq('stripe_event_id', eventId)
    .maybeSingle();

  if (error) {
    console.error('Idempotency check error:', error);
    return false;
  }
  if (data) {
    processedEvents.add(eventId);
    return true;
  }
  return false;
}

/**
 * Upsert a subscription record in Supabase.
 */
async function upsertSubscription(sub, userId) {
  const payload = {
    stripe_id: sub.id,
    stripe_price_id: sub.items?.data?.[0]?.price?.id || sub.stripe_price_id,
    stripe_customer_id: sub.customer,
    user_id: userId,
    status: sub.status,
    current_period_start: sub.current_period_start
      ? new Date(sub.current_period_start * 1000).toISOString()
      : null,
    current_period_end: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('subscriptions')
    .upsert(payload, { onConflict: 'stripe_id' });

  if (error) {
    console.error('Failed to upsert subscription:', error);
    throw error;
  }
}

/**
 * Handler for checkout.session.completed.
 */
async function handleCheckoutCompleted(session) {
  const userId = session.client_reference_id || session.metadata?.user_id;
  if (!userId) {
    console.error('No user_id in checkout session', session.id);
    return;
  }

  if (!session.subscription) {
    console.log('Session has no subscription — skipping', session.id);
    return;
  }

  // Retrieve the full subscription to get status, period, etc.
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  await upsertSubscription(subscription, userId);
}

/**
 * Handler for customer.subscription.updated and customer.subscription.deleted.
 */
async function handleSubscriptionEvent(subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.error('No user_id in subscription metadata', subscription.id);
    return;
  }
  await upsertSubscription(subscription, userId);
}

/**
 * POST /api/stripe-webhook
 *
 * Receives Stripe webhook events, verifies the signature, processes
 * the event idempotently, and syncs subscription state to Supabase.
 */
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const sig = event.headers['stripe-signature'];
  if (!sig) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing Stripe signature' }) };
  }

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error('Signature verification failed:', err.message);
    return { statusCode: 400, body: JSON.stringify({ error: `Signature verification failed: ${err.message}` }) };
  }

  // ── Idempotency ────────────────────────────────────────────────
  if (await isAlreadyProcessed(stripeEvent.id)) {
    return { statusCode: 200, body: JSON.stringify({ received: true, idempotent: true }) };
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripeEvent.data.object);
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(stripeEvent.data.object);
        break;

      default:
        console.log('Unhandled event type:', stripeEvent.type);
    }

    await recordProcessedEvent(stripeEvent.id);

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (err) {
    console.error('Webhook processing error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
