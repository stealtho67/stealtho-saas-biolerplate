/**
 * NextCut — Stripe Webhook Handler
 *
 * Handles real-time events from Stripe for connected barber accounts.
 * NextCut is the source of truth for all pricing, commissions, and bookings.
 * Stripe is used ONLY for barber onboarding, verification, and payout routing.
 *
 * Webhook endpoint URL (register this in Stripe Dashboard):
 *   https://nextcut.base44.app/api/functions/stripeWebhook
 *
 * Events handled:
 *   account.updated                  → syncs barber stripe_status, payouts_enabled, stripe_onboarding_complete
 *   account.application.deauthorized → barber disconnected their Stripe account; reset all stripe fields
 *   payout.failed                    → log the failure (future: notify barber)
 *   payout.paid                      → log successful payout (future: record in DB)
 *   payment_intent.succeeded         → mark booking as confirmed + paid
 *
 * Env vars required:
 *   STRIPE_SECRET_KEY         — your Stripe secret key (sk_test_...)
 *   STRIPE_WEBHOOK_SECRET     — signing secret from your Connect webhook endpoint (whsec_...)
 *   APP_URL                   — https://nextcut.base44.app
 *
 * Status values stored on Barber entity:
 *   not_connected             — no stripe_account_id yet
 *   onboarding_in_progress    — account created, onboarding not finished
 *   verification_needed       — requirements currently_due or past_due
 *   active                    — charges_enabled + payouts_enabled both true
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
    apiVersion: '2024-06-20',
  });

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const signature = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  let event;
  try {
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    } else {
      // Fallback for local testing only — never use in production without a secret
      event = JSON.parse(rawBody);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Use service role — webhooks are server-to-server, no user auth
  const base44 = createClientFromRequest(req);

  try {
    console.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {

      // ─── Account Status Changes ──────────────────────────────────────────────
      case 'account.updated': {
        const account = event.data.object;
        const stripeAccountId = account.id;

        const payoutsEnabled = account.payouts_enabled ?? false;
        const chargesEnabled = account.charges_enabled ?? false;
        const currentlyDue = account.requirements?.currently_due ?? [];
        const pastDue = account.requirements?.past_due ?? [];
        const hasRequirements = currentlyDue.length > 0 || pastDue.length > 0;

        let newStatus;
        if (payoutsEnabled && chargesEnabled) {
          newStatus = 'active';
        } else if (hasRequirements) {
          newStatus = 'verification_needed';
        } else {
          newStatus = 'onboarding_in_progress';
        }

        const barbers = await base44.asServiceRole.entities.Barber.filter({
          stripe_account_id: stripeAccountId,
        });

        if (barbers.length > 0) {
          const barber = barbers[0];
          const wasActive = barber.stripe_status === 'active';

          await base44.asServiceRole.entities.Barber.update(barber.id, {
            stripe_status: newStatus,
            payouts_enabled: payoutsEnabled,
            stripe_onboarding_complete: payoutsEnabled && chargesEnabled,
          });

          console.log(`Barber ${barber.id} (${barber.display_name}) stripe_status → ${newStatus}`);

          // Notify barber the first time they go active
          if (newStatus === 'active' && !wasActive) {
            base44.asServiceRole.integrations.Core.SendEmail({
              to: barber.user_email,
              subject: 'NextCut — Your payouts are enabled! 💸',
              body: `Hi ${barber.display_name},\n\nYour Stripe account is fully verified. Payouts are now enabled and you'll receive your earnings directly to your bank account.\n\nView your dashboard: ${Deno.env.get('APP_URL')}/dashboard\n\n— The NextCut Team`,
            }).catch(() => {});
          }
        } else {
          console.warn(`account.updated: no barber found for stripe_account_id=${stripeAccountId}`);
        }
        break;
      }

      // ─── Barber Disconnected Their Stripe Account ────────────────────────────
      case 'account.application.deauthorized': {
        const stripeAccountId = event.account; // top-level field on deauth events

        const barbers = await base44.asServiceRole.entities.Barber.filter({
          stripe_account_id: stripeAccountId,
        });

        if (barbers.length > 0) {
          await base44.asServiceRole.entities.Barber.update(barbers[0].id, {
            stripe_account_id: null,
            stripe_status: 'not_connected',
            stripe_onboarding_complete: false,
            payouts_enabled: false,
          });
          console.log(`Barber ${barbers[0].id} deauthorized Stripe account ${stripeAccountId} — reset to not_connected`);
        }
        break;
      }

      // ─── Payout Events (for barber's connected account) ──────────────────────
      case 'payout.failed': {
        const payout = event.data.object;
        const stripeAccountId = event.account; // present on connected-account events
        console.warn(`Payout failed: payout_id=${payout.id}, account=${stripeAccountId}, reason=${payout.failure_message}`);

        // Future: find barber and notify them of the failed payout
        // const barbers = await base44.asServiceRole.entities.Barber.filter({ stripe_account_id: stripeAccountId });
        // if (barbers.length > 0) notify by email...
        break;
      }

      case 'payout.paid': {
        const payout = event.data.object;
        const stripeAccountId = event.account;
        console.log(`Payout paid: payout_id=${payout.id}, account=${stripeAccountId}, amount=$${(payout.amount / 100).toFixed(2)}`);
        // Future: log payout record to a Payout entity for barber earnings reconciliation
        break;
      }

      // ─── Payment Confirmation (client pays for booking) ───────────────────────
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata?.booking_id;

        if (bookingId) {
          const existingBookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const existingStatus = existingBookings[0]?.status;
          // Don't downgrade a completed booking back to confirmed
          const newStatus = existingStatus === 'completed' ? 'completed' : 'confirmed';

          await base44.asServiceRole.entities.Booking.update(bookingId, {
            status: newStatus,
            payment_status: 'paid',
            payment_method: 'stripe',
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntent.id,
          });
          console.log(`Booking ${bookingId} → ${newStatus}, payment_status=paid`);

          const clientEmail = paymentIntent.metadata?.client_email;
          if (clientEmail) {
            base44.asServiceRole.integrations.Core.SendEmail({
              to: clientEmail,
              subject: 'NextCut — Payment Confirmed! ✅',
              body: `Your payment was successful and your booking is confirmed.\n\nView your bookings: ${Deno.env.get('APP_URL')}/my-bookings`,
            }).catch(() => {});
          }
        }
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