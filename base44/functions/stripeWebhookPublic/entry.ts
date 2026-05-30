/**
 * NextCut — Public Stripe Webhook Handler
 *
 * Register this URL in your Stripe Dashboard:
 *   https://nextcut.base44.app/api/functions/stripeWebhookPublic
 *
 * IMPORTANT:
 * - No authentication required (Stripe posts from its own servers)
 * - Signature is verified using STRIPE_WEBHOOK_SECRET
 * - Idempotent: duplicate event IDs are skipped (stored in StripeEvent entity)
 * - Always returns 200 for verified events (even if already processed)
 * - Never redirects, never requires login, never returns HTML
 *
 * Handled events:
 *   checkout.session.completed       — mark booking paid
 *   payment_intent.succeeded         — mark booking paid + confirmed
 *   payment_intent.payment_failed    — cancel pending booking
 *   account.updated                  — sync barber stripe_status
 *   account.application.deauthorized — reset barber stripe fields
 *   payout.paid                      — log payout
 *   payout.failed                    — log failure
 *   invoice.created                  — log (no-op)
 *   invoice.paid                     — log (no-op)
 *   invoice.payment_failed           — log (no-op)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  // ── Preflight / method guard ──────────────────────────────────────────────
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
    apiVersion: '2024-06-20',
  });

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const signature = req.headers.get('stripe-signature');

  // Read raw body BEFORE any other parsing
  const rawBody = await req.text();

  // ── Signature verification ────────────────────────────────────────────────
  let event;
  try {
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    } else {
      // No secret configured — still parse but warn (dev/test only)
      console.warn('[webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
      event = JSON.parse(rawBody);
    }
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(`[webhook] Received: type=${event.type} id=${event.id}`);

  // ── Service-role client (no user auth needed for webhooks) ────────────────
  const base44 = createClientFromRequest(req);

  // ── Idempotency check ─────────────────────────────────────────────────────
  try {
    const existing = await base44.asServiceRole.entities.StripeEvent.filter({ event_id: event.id });
    if (existing.length > 0) {
      console.log(`[webhook] Duplicate event ${event.id} (${event.type}) — already processed, returning 200`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    // If the idempotency check itself fails, log and continue processing
    // (better to risk a duplicate than to reject a valid Stripe event)
    console.warn('[webhook] Idempotency check failed:', err.message);
  }

  // ── Event dispatch ────────────────────────────────────────────────────────
  let eventStatus = 'processed';
  let eventNotes = '';

  try {
    switch (event.type) {

      // ── CHECKOUT SESSION ─────────────────────────────────────────────────

      case 'checkout.session.completed': {
        const session = event.data.object;
        const bookingId = session.metadata?.booking_id;

        if (!bookingId) {
          console.log('[webhook] checkout.session.completed: no booking_id in metadata, skipping');
          eventStatus = 'ignored';
          eventNotes = 'no booking_id in metadata';
          break;
        }

        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
        if (!bookings.length) {
          console.warn(`[webhook] checkout.session.completed: booking ${bookingId} not found`);
          eventStatus = 'ignored';
          eventNotes = `booking ${bookingId} not found`;
          break;
        }

        const booking = bookings[0];
        if (booking.payment_status === 'paid') {
          console.log(`[webhook] checkout.session.completed: booking ${bookingId} already paid`);
          eventStatus = 'ignored';
          eventNotes = 'already paid';
          break;
        }

        const newStatus = booking.status === 'completed' ? 'completed' : 'confirmed';
        await base44.asServiceRole.entities.Booking.update(bookingId, {
          status: newStatus,
          payment_status: 'paid',
          payment_method: 'stripe',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: session.payment_intent,
        });

        console.log(`[webhook] checkout.session.completed: booking ${bookingId} → paid, status=${newStatus}`);

        const clientEmail = session.metadata?.client_email || session.customer_email;
        if (clientEmail) {
          base44.asServiceRole.integrations.Core.SendEmail({
            to: clientEmail,
            subject: 'NextCut — Booking Confirmed ✅',
            body: `Your payment was successful and your booking is confirmed.\n\nView your bookings: ${Deno.env.get('APP_URL')}/my-bookings`,
          }).catch(() => {});
        }

        const barberIdMeta = session.metadata?.barber_id;
        if (barberIdMeta) {
          base44.asServiceRole.functions.invoke('forwardBooking', {
            booking_id: bookingId,
            barber_id: barberIdMeta,
          }).catch((e) => console.warn('[webhook] forwardBooking failed:', e.message));
        }
        break;
      }

      // ── PAYMENT INTENT ───────────────────────────────────────────────────

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata?.booking_id;

        if (!bookingId) {
          console.log('[webhook] payment_intent.succeeded: no booking_id in metadata, skipping');
          eventStatus = 'ignored';
          eventNotes = 'no booking_id in metadata';
          break;
        }

        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
        if (!bookings.length) {
          console.warn(`[webhook] payment_intent.succeeded: booking ${bookingId} not found`);
          eventStatus = 'ignored';
          eventNotes = `booking ${bookingId} not found`;
          break;
        }

        const booking = bookings[0];
        if (booking.payment_status === 'paid') {
          console.log(`[webhook] payment_intent.succeeded: booking ${bookingId} already paid`);
          eventStatus = 'ignored';
          eventNotes = 'already paid';
          break;
        }

        const newStatus = booking.status === 'completed' ? 'completed' : 'confirmed';
        await base44.asServiceRole.entities.Booking.update(bookingId, {
          status: newStatus,
          payment_status: 'paid',
          payment_method: 'stripe',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntent.id,
        });

        console.log(`[webhook] payment_intent.succeeded: booking ${bookingId} → paid, status=${newStatus}`);

        const clientEmail = paymentIntent.metadata?.client_email;
        if (clientEmail) {
          base44.asServiceRole.integrations.Core.SendEmail({
            to: clientEmail,
            subject: 'NextCut — Payment Confirmed ✅',
            body: `Your payment was successful and your booking is confirmed.\n\nView your bookings: ${Deno.env.get('APP_URL')}/my-bookings`,
          }).catch(() => {});
        }

        const barberIdMeta = paymentIntent.metadata?.barber_id;
        if (barberIdMeta) {
          base44.asServiceRole.functions.invoke('forwardBooking', {
            booking_id: bookingId,
            barber_id: barberIdMeta,
          }).catch((e) => console.warn('[webhook] forwardBooking failed:', e.message));
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata?.booking_id;
        const reason = paymentIntent.last_payment_error?.message ?? 'unknown';
        console.warn(`[webhook] payment_intent.payment_failed: booking_id=${bookingId} reason="${reason}"`);
        eventNotes = `reason: ${reason}`;

        if (bookingId) {
          const failedBookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          if (failedBookings.length > 0 && failedBookings[0].status === 'pending') {
            await base44.asServiceRole.entities.Booking.update(bookingId, { status: 'cancelled' });
            console.log(`[webhook] booking ${bookingId} cancelled due to payment failure`);
          }
        }
        break;
      }

      // ── STRIPE CONNECT — ACCOUNT EVENTS ─────────────────────────────────

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

          if (
            barber.stripe_status === newStatus &&
            barber.payouts_enabled === payoutsEnabled &&
            barber.stripe_onboarding_complete === (payoutsEnabled && chargesEnabled)
          ) {
            console.log(`[webhook] account.updated: no change for barber ${barber.id}, skipping`);
            eventStatus = 'ignored';
            eventNotes = 'no change';
            break;
          }

          const wasActive = barber.stripe_status === 'active';
          await base44.asServiceRole.entities.Barber.update(barber.id, {
            stripe_status: newStatus,
            payouts_enabled: payoutsEnabled,
            stripe_onboarding_complete: payoutsEnabled && chargesEnabled,
          });

          console.log(`[webhook] barber ${barber.id} stripe_status → ${newStatus}`);
          eventNotes = `barber ${barber.id} → ${newStatus}`;

          if (newStatus === 'active' && !wasActive) {
            base44.asServiceRole.integrations.Core.SendEmail({
              to: barber.user_email,
              subject: 'NextCut — Your payouts are enabled! 💸',
              body: `Hi ${barber.display_name},\n\nYour Stripe account is fully verified. Payouts are now enabled and you'll receive earnings directly to your bank.\n\nView your dashboard: ${Deno.env.get('APP_URL')}/dashboard\n\n— The NextCut Team`,
            }).catch(() => {});
          }
        } else {
          console.warn(`[webhook] account.updated: no barber found for stripe_account_id=${stripeAccountId}`);
          eventStatus = 'ignored';
          eventNotes = `no barber for account ${stripeAccountId}`;
        }
        break;
      }

      case 'account.application.deauthorized': {
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
          eventNotes = `barber ${barbers[0].id} deauthorized`;
        } else {
          console.warn(`[webhook] account.application.deauthorized: no barber for account=${stripeAccountId}`);
          eventStatus = 'ignored';
          eventNotes = `no barber for account ${stripeAccountId}`;
        }
        break;
      }

      // ── PAYOUT EVENTS ────────────────────────────────────────────────────

      case 'payout.paid': {
        const payout = event.data.object;
        const amount = (payout.amount / 100).toFixed(2);
        console.log(`[webhook] payout.paid: id=${payout.id} account=${event.account} amount=$${amount}`);
        eventNotes = `amount=$${amount} account=${event.account}`;
        break;
      }

      case 'payout.failed': {
        const payout = event.data.object;
        console.warn(`[webhook] payout.failed: id=${payout.id} account=${event.account} reason="${payout.failure_message}"`);
        eventNotes = `reason: ${payout.failure_message}`;
        break;
      }

      // ── INVOICE EVENTS ────────────────────────────────────────────────────

      case 'invoice.created': {
        const invoice = event.data.object;
        console.log(`[webhook] invoice.created: id=${invoice.id}`);
        eventStatus = 'ignored';
        eventNotes = `invoice_id=${invoice.id}`;
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const stripeInvoiceId = invoice.id;
        const connectedAccount = event.account || null;
        console.log(`[webhook] invoice.paid: id=${stripeInvoiceId} account=${connectedAccount} amount=$${((invoice.amount_paid || 0) / 100).toFixed(2)}`);

        // Update StripeInvoice record
        const dbInvoices = await base44.asServiceRole.entities.StripeInvoice.filter({ stripe_invoice_id: stripeInvoiceId });
        if (dbInvoices.length > 0) {
          await base44.asServiceRole.entities.StripeInvoice.update(dbInvoices[0].id, {
            status: 'paid',
            paid_at: new Date().toISOString(),
          });
          eventNotes = `invoice ${stripeInvoiceId} marked paid`;

          // If linked to a booking, update it too
          const bookingId = dbInvoices[0].booking_id || invoice.metadata?.booking_id;
          if (bookingId) {
            await base44.asServiceRole.entities.Booking.update(bookingId, {
              payment_status: 'paid',
              payment_method: 'stripe',
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: invoice.payment_intent || null,
            }).catch(() => {});
          }
        } else {
          // Try to find via booking metadata
          const bookingId = invoice.metadata?.booking_id;
          if (bookingId) {
            await base44.asServiceRole.entities.Booking.update(bookingId, {
              payment_status: 'paid',
              payment_method: 'stripe',
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: invoice.payment_intent || null,
            }).catch(() => {});
          }
          eventNotes = `invoice_id=${stripeInvoiceId} (no local record found)`;
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.warn(`[webhook] invoice.payment_failed: id=${invoice.id}`);
        const failedInvoices = await base44.asServiceRole.entities.StripeInvoice.filter({ stripe_invoice_id: invoice.id });
        if (failedInvoices.length > 0) {
          await base44.asServiceRole.entities.StripeInvoice.update(failedInvoices[0].id, { status: 'open' }).catch(() => {});
        }
        eventNotes = `invoice_id=${invoice.id}`;
        break;
      }

      default:
        console.log(`[webhook] Unhandled event type: ${event.type} — returning 200`);
        eventStatus = 'ignored';
        eventNotes = 'unhandled event type';
    }

    // ── Record processed event (idempotency log) ──────────────────────────
    base44.asServiceRole.entities.StripeEvent.create({
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
      status: eventStatus,
      notes: eventNotes,
    }).catch((e) => console.warn('[webhook] Failed to log StripeEvent:', e.message));

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[webhook] Handler error:', err.message);
    // Still record the failure for debugging
    base44.asServiceRole.entities.StripeEvent.create({
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
      status: 'error',
      notes: err.message,
    }).catch(() => {});

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});