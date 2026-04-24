/**
 * NextCut — Stripe Webhook Handler
 *
 * Endpoint URL: https://nextcut.base44.app/api/functions/stripeWebhook
 * Payload style: Snapshot (reads event.data.object directly)
 * Signing secret env var: STRIPE_WEBHOOK_SECRET
 *
 * Handled events:
 *   account.updated                 — sync barber stripe_status + payouts_enabled
 *   account.application.deauthorized — reset barber stripe fields to not_connected
 *   payout.failed                   — log failure (future: notify barber)
 *   payout.paid                     — log success (future: record earnings)
 *   payment_intent.succeeded        — mark booking paid + confirmed
 *   payment_intent.payment_failed   — log failure (future: notify client)
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
      event = JSON.parse(rawBody);
    }
  } catch (err) {
    console.error('Signature verification failed:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Service role — webhooks are not user-authenticated
  const base44 = createClientFromRequest(req);

  console.log(`[webhook] ${event.type} id=${event.id}`);

  try {
    switch (event.type) {

      // ── BARBER ONBOARDING / PAYOUT READINESS ──────────────────────────────

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

        const barbers = await base44.asServiceRole.entities.Barber.filter({ stripe_account_id: stripeAccountId });

        if (barbers.length > 0) {
          const barber = barbers[0];

          // Idempotent: skip write if nothing changed
          if (
            barber.stripe_status === newStatus &&
            barber.payouts_enabled === payoutsEnabled &&
            barber.stripe_onboarding_complete === (payoutsEnabled && chargesEnabled)
          ) {
            console.log(`[webhook] account.updated: no change for barber ${barber.id}, skipping`);
            break;
          }

          const wasActive = barber.stripe_status === 'active';
          await base44.asServiceRole.entities.Barber.update(barber.id, {
            stripe_status: newStatus,
            payouts_enabled: payoutsEnabled,
            stripe_onboarding_complete: payoutsEnabled && chargesEnabled,
          });

          console.log(`[webhook] barber ${barber.id} stripe_status → ${newStatus}`);

          // Notify once when barber first goes active
          if (newStatus === 'active' && !wasActive) {
            base44.asServiceRole.integrations.Core.SendEmail({
              to: barber.user_email,
              subject: 'NextCut — Your payouts are enabled! 💸',
              body: `Hi ${barber.display_name},\n\nYour Stripe account is fully verified. Payouts are now enabled and you'll receive earnings directly to your bank.\n\nView your dashboard: ${Deno.env.get('APP_URL')}/dashboard\n\n— The NextCut Team`,
            }).catch(() => {});
          }
        } else {
          console.warn(`[webhook] account.updated: no barber found for stripe_account_id=${stripeAccountId}`);
        }
        break;
      }

      case 'account.application.deauthorized': {
        // event.account is the connected account ID on deauth events
        const stripeAccountId = event.account;

        const barbers = await base44.asServiceRole.entities.Barber.filter({ stripe_account_id: stripeAccountId });

        if (barbers.length > 0) {
          await base44.asServiceRole.entities.Barber.update(barbers[0].id, {
            stripe_account_id: null,
            stripe_status: 'not_connected',
            stripe_onboarding_complete: false,
            payouts_enabled: false,
          });
          console.log(`[webhook] barber ${barbers[0].id} deauthorized — reset to not_connected`);
        } else {
          console.warn(`[webhook] account.application.deauthorized: no barber found for account=${stripeAccountId}`);
        }
        break;
      }

      // ── PAYOUT EVENTS (connected-account level) ────────────────────────────

      case 'payout.failed': {
        const payout = event.data.object;
        const stripeAccountId = event.account;
        // Future: find barber by stripe_account_id and notify them
        console.warn(`[webhook] payout.failed: id=${payout.id} account=${stripeAccountId} reason="${payout.failure_message}"`);
        break;
      }

      case 'payout.paid': {
        const payout = event.data.object;
        const stripeAccountId = event.account;
        // Future: log payout to a Payout entity for earnings reconciliation
        console.log(`[webhook] payout.paid: id=${payout.id} account=${stripeAccountId} amount=$${(payout.amount / 100).toFixed(2)}`);
        break;
      }

      // ── PAYMENT INTENT EVENTS ──────────────────────────────────────────────

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata?.booking_id;

        if (!bookingId) {
          console.log('[webhook] payment_intent.succeeded: no booking_id in metadata, skipping');
          break;
        }

        const existing = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
        if (!existing.length) {
          console.warn(`[webhook] payment_intent.succeeded: booking ${bookingId} not found`);
          break;
        }

        const booking = existing[0];

        // Idempotent: skip if already marked paid
        if (booking.payment_status === 'paid') {
          console.log(`[webhook] payment_intent.succeeded: booking ${bookingId} already paid, skipping`);
          break;
        }

        // Don't downgrade a completed booking back to confirmed
        const newStatus = booking.status === 'completed' ? 'completed' : 'confirmed';

        await base44.asServiceRole.entities.Booking.update(bookingId, {
          status: newStatus,
          payment_status: 'paid',
          payment_method: 'stripe',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntent.id,
        });

        console.log(`[webhook] booking ${bookingId} → status=${newStatus} payment_status=paid`);

        const clientEmail = paymentIntent.metadata?.client_email;
        if (clientEmail) {
          base44.asServiceRole.integrations.Core.SendEmail({
            to: clientEmail,
            subject: 'NextCut — Payment Confirmed ✅',
            body: `Your payment was successful and your booking is confirmed.\n\nView your bookings: ${Deno.env.get('APP_URL')}/my-bookings`,
          }).catch(() => {});
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata?.booking_id;
        const failureMessage = paymentIntent.last_payment_error?.message ?? 'Payment failed';
        console.warn(`[webhook] payment_intent.payment_failed: booking_id=${bookingId} reason="${failureMessage}"`);

        // Cancel the pending booking so it doesn't block the slot or confuse the client
        if (bookingId) {
          try {
            const failedBookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
            if (failedBookings.length > 0 && failedBookings[0].status === 'pending') {
              await base44.asServiceRole.entities.Booking.update(bookingId, { status: 'cancelled' });
              console.log(`[webhook] booking ${bookingId} cancelled due to payment failure`);
            }
          } catch (e) {
            console.error(`[webhook] failed to cancel booking ${bookingId}:`, e.message);
          }
        }
        break;
      }

      default:
        // Safely ignore all other events — always return 200
        console.log(`[webhook] ignored event type: ${event.type}`);
    }

    return Response.json({ received: true });

  } catch (err) {
    console.error('[webhook] handler error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});