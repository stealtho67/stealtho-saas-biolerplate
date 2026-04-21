/**
 * NextCut — Stripe Webhook Handler
 *
 * Handles real-time events from Stripe so barber Stripe status
 * updates automatically without requiring manual "Sync" clicks.
 *
 * Events handled:
 *   account.updated         → syncs barber stripe_status + payouts_enabled
 *   payment_intent.succeeded → (future) marks booking as paid
 *   payout.paid             → (future) logs payout to barber
 *
 * Setup in Stripe Dashboard:
 *   Developers → Webhooks → Add endpoint
 *   URL: {your-app-function-url}/stripeWebhook
 *   Events: account.updated, payment_intent.succeeded, payout.paid
 *   Copy "Signing secret" → add as STRIPE_WEBHOOK_SECRET in Base44 secrets
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  // Stripe sends a POST with the event payload
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
    apiVersion: '2024-06-20',
  });

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const signature = req.headers.get('stripe-signature');

  let event;

  try {
    const rawBody = await req.text();

    if (webhookSecret && signature) {
      // Verify the webhook came from Stripe (recommended for production)
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    } else {
      // No secret set yet — parse as plain JSON (ok for initial testing only)
      event = JSON.parse(rawBody);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Use service role — webhooks are not user-authenticated
  const base44 = createClientFromRequest(req);

  try {
    switch (event.type) {
      case 'account.updated': {
        /**
         * Fires when a connected barber's Stripe account changes.
         * This is the key event for tracking when a barber completes
         * onboarding and payouts become enabled.
         */
        const account = event.data.object;
        const stripeAccountId = account.id;
        const payoutsEnabled = account.payouts_enabled;
        const chargesEnabled = account.charges_enabled;
        const newStatus = (payoutsEnabled && chargesEnabled) ? 'active' : 'onboarding_in_progress';

        // Find the barber with this Stripe account ID
        const barbers = await base44.asServiceRole.entities.Barber.filter({
          stripe_account_id: stripeAccountId,
        });

        if (barbers.length > 0) {
          await base44.asServiceRole.entities.Barber.update(barbers[0].id, {
            stripe_status: newStatus,
            payouts_enabled: payoutsEnabled,
            stripe_onboarding_complete: payoutsEnabled && chargesEnabled,
          });

          console.log(`Barber ${barbers[0].id} stripe_status → ${newStatus}`);

          // Send email when barber first becomes active
          if (newStatus === 'active' && barbers[0].stripe_status !== 'active') {
            base44.asServiceRole.integrations.Core.SendEmail({
              to: barbers[0].user_email,
              subject: "NextCut — Your Stripe payouts are enabled! 💸",
              body: `Hi ${barbers[0].display_name},\n\nYour Stripe account is fully set up. Payouts are now enabled — you'll receive earnings directly to your bank account.\n\nLog in to your dashboard to see your earnings:\n${Deno.env.get('APP_URL')}/dashboard\n\n— The NextCut Team`
            }).catch(() => {});
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        /**
         * Fires when a client completes an online payment.
         * Marks booking as confirmed + paid and sends confirmation email.
         */
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata?.booking_id;

        if (bookingId) {
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            status: 'confirmed',
            payment_status: 'paid',
            payment_method: 'stripe',
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntent.id,
          });
          console.log(`Booking ${bookingId} confirmed + paid via Stripe`);

          // Send confirmation email to client
          const clientEmail = paymentIntent.metadata?.client_email;
          if (clientEmail) {
            base44.asServiceRole.integrations.Core.SendEmail({
              to: clientEmail,
              subject: 'NextCut — Payment Confirmed! ✅',
              body: `Your payment was successful and your booking is confirmed. See your upcoming appointments at ${Deno.env.get('APP_URL')}/my-bookings`,
            }).catch(() => {});
          }
        }
        break;
      }

      case 'payout.paid': {
        // Future: log payout to barber for reconciliation
        const payout = event.data.object;
        console.log(`Payout ${payout.id} paid: $${(payout.amount / 100).toFixed(2)}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});