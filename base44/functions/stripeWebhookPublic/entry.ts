/**
 * NextCut — Public Stripe Webhook Handler
 *
 * Three Stripe webhook destinations all POST to this one URL:
 *   (1) Your account · Thin         → STRIPE_WH_SECRET_ACCOUNT
 *   (2) Connected accounts · Snapshot → STRIPE_WH_SECRET_CONNECTED
 *   (3) Connected accounts · Thin    → STRIPE_WH_SECRET_CONNECTED_THIN
 *
 * Payload-style agnostic:
 *   - Snapshot events: event.data.object contains the full resource.
 *   - Thin events: event.data.object contains only {id, object}. The handler
 *     fetches the full resource from Stripe by ID before processing.
 *   - v2 thin account events (e.g. capability_status_updated) are acknowledged safely.
 *
 * Signature verification: tries all configured secrets; accepts on first match.
 * Idempotency: duplicate event IDs are skipped via the StripeEvent entity.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

// ── Helper: is this a thin payload? ──────────────────────────────────────────
// A thin object only has `id` and `object` (and maybe `deleted`). It lacks
// substantive fields like `status`, `amount`, `customer`, `metadata`, etc.
function isThinObject(obj) {
  if (!obj || typeof obj !== 'object') return false;
  const keys = Object.keys(obj).filter(k => k !== 'id' && k !== 'object' && k !== 'deleted');
  return keys.length === 0;
}

// ── Helper: fetch full resource if thin ──────────────────────────────────────
async function hydrate(stripe, eventType, rawObj, connectedAccountId) {
  if (!isThinObject(rawObj)) return rawObj; // already snapshot — use as-is

  const id = rawObj.id;
  const objectType = rawObj.object; // 'checkout.session', 'subscription', 'invoice', etc.
  const opts = connectedAccountId ? { stripeAccount: connectedAccountId } : {};

  console.log(`[webhook] Thin payload detected for ${eventType} (${objectType} id=${id}) — fetching full object`);

  try {
    if (objectType === 'checkout.session') {
      return await stripe.checkout.sessions.retrieve(id, { expand: ['customer'] }, opts);
    }
    if (objectType === 'subscription') {
      return await stripe.subscriptions.retrieve(id, { expand: ['items.data.price'] }, opts);
    }
    if (objectType === 'invoice') {
      return await stripe.invoices.retrieve(id, {}, opts);
    }
    if (objectType === 'payment_intent') {
      return await stripe.paymentIntents.retrieve(id, {}, opts);
    }
    if (objectType === 'account') {
      return await stripe.accounts.retrieve(id, {}, opts);
    }
    // Fallback: return thin object, handler will deal with missing fields gracefully
    console.warn(`[webhook] No hydration rule for object type: ${objectType}`);
    return rawObj;
  } catch (err) {
    console.error(`[webhook] Failed to hydrate ${objectType} ${id}:`, err.message);
    return rawObj; // fall through — let handler skip gracefully
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });
  const signature = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  // ── Try all 3 destination secrets — accept on first match ─────────────────
  // (1) Your account · Thin         STRIPE_WH_SECRET_ACCOUNT
  // (2) Connected accounts · Snapshot STRIPE_WH_SECRET_CONNECTED
  // (3) Connected accounts · Thin   STRIPE_WH_SECRET_CONNECTED_THIN
  // Legacy: STRIPE_WEBHOOK_SECRET   (backward compat)
  const SECRET_CANDIDATES = [
    { env: 'STRIPE_WH_SECRET_ACCOUNT',         source: 'account_thin' },
    { env: 'STRIPE_WH_SECRET_CONNECTED',       source: 'connected_snapshot' },
    { env: 'STRIPE_WH_SECRET_CONNECTED_THIN',  source: 'connected_thin' },
    { env: 'STRIPE_WEBHOOK_SECRET',            source: 'account_thin' }, // legacy
  ];

  let event = null;
  let eventSource = 'unknown';

  if (signature) {
    for (const candidate of SECRET_CANDIDATES) {
      const secret = Deno.env.get(candidate.env);
      if (!secret) continue;
      try {
        event = await stripe.webhooks.constructEventAsync(rawBody, signature, secret);
        eventSource = candidate.source;
        console.log(`[webhook] Verified with ${candidate.env} source=${eventSource}`);
        break;
      } catch {
        // wrong secret — try next
      }
    }
    if (!event) {
      console.error('[webhook] Signature verification failed with all configured secrets');
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }
  } else {
    const anySecret = SECRET_CANDIDATES.find(c => Deno.env.get(c.env));
    if (anySecret) {
      console.warn('[webhook] No stripe-signature header — rejecting');
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }
    console.warn('[webhook] No secrets configured — parsing without verification (dev only)');
    event = JSON.parse(rawBody);
  }

  console.log(`[webhook] type=${event.type} id=${event.id} source=${eventSource}`);

  const base44 = createClientFromRequest(req);

  // ── Idempotency ───────────────────────────────────────────────────────────
  try {
    const existing = await base44.asServiceRole.entities.StripeEvent.filter({ event_id: event.id });
    if (existing.length > 0) {
      console.log(`[webhook] Duplicate ${event.id} — skipping`);
      return Response.json({ received: true, duplicate: true });
    }
  } catch (err) {
    console.warn('[webhook] Idempotency check failed:', err.message);
  }

  // ── Connected account context ─────────────────────────────────────────────
  const connectedAccountId = event.account || null;

  // ── Hydrate thin payloads ─────────────────────────────────────────────────
  // For thin events, event.data.object only has {id, object}. Fetch full resource.
  const rawObj = event.data?.object || {};
  const obj = await hydrate(stripe, event.type, rawObj, connectedAccountId);

  let eventStatus = 'processed';
  let eventNotes = '';

  try {
    switch (event.type) {

      // ── CHECKOUT SESSION ───────────────────────────────────────────────────

      case 'checkout.session.completed': {
        const session = obj;

        if (session.mode === 'subscription') {
          if (session.customer) {
            const customerEmail = session.customer_details?.email || session.customer_email
              || (typeof session.customer === 'object' ? session.customer.email : null);
            if (customerEmail) {
              const subBarbers = await base44.asServiceRole.entities.Barber.filter({ user_email: customerEmail });
              if (subBarbers.length > 0) {
                if (!subBarbers[0].stripe_customer_id) {
                  const custId = typeof session.customer === 'object' ? session.customer.id : session.customer;
                  await base44.asServiceRole.entities.Barber.update(subBarbers[0].id, { stripe_customer_id: custId });
                }
                eventNotes = `subscription customer linked to barber ${subBarbers[0].id}`;
              } else {
                eventStatus = 'ignored';
                eventNotes = `no barber for email ${customerEmail}`;
              }
            }
          }
          break;
        }

        const bookingId = session.metadata?.booking_id;
        if (!bookingId) { eventStatus = 'ignored'; eventNotes = 'no booking_id in metadata'; break; }

        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
        if (!bookings.length) { eventStatus = 'ignored'; eventNotes = `booking ${bookingId} not found`; break; }

        const booking = bookings[0];
        if (booking.payment_status === 'paid') { eventStatus = 'ignored'; eventNotes = 'already paid'; break; }

        const newStatus = booking.status === 'completed' ? 'completed' : 'confirmed';
        const piId = typeof session.payment_intent === 'object' ? session.payment_intent?.id : session.payment_intent;
        await base44.asServiceRole.entities.Booking.update(bookingId, {
          status: newStatus, payment_status: 'paid', payment_method: 'stripe',
          paid_at: new Date().toISOString(), stripe_payment_intent_id: piId,
        });

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
          base44.asServiceRole.functions.invoke('forwardBooking', { booking_id: bookingId, barber_id: barberIdMeta })
            .catch((e) => console.warn('[webhook] forwardBooking failed:', e.message));
        }
        eventNotes = `booking ${bookingId} paid`;
        break;
      }

      // ── SUBSCRIPTION EVENTS ────────────────────────────────────────────────

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = obj;
        if (!sub.customer) { eventStatus = 'ignored'; eventNotes = 'no customer on subscription'; break; }

        const customerId = typeof sub.customer === 'object' ? sub.customer.id : sub.customer;
        const subStatus = sub.status;
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;

        const unitAmount = sub.items?.data?.[0]?.price?.unit_amount || 0;
        let plan = 'starter';
        if (unitAmount === 9900) plan = 'spotlight';
        else if (unitAmount === 5900) plan = 'pro';
        else if (unitAmount === 2900) plan = 'growth';
        const metaPlan = sub.metadata?.plan || sub.items?.data?.[0]?.price?.metadata?.plan;
        if (metaPlan && ['growth', 'pro', 'spotlight'].includes(metaPlan)) plan = metaPlan;

        const barbers = await base44.asServiceRole.entities.Barber.filter({ stripe_customer_id: customerId });
        if (barbers.length > 0) {
          await base44.asServiceRole.entities.Barber.update(barbers[0].id, {
            plan, subscription_status: subStatus, stripe_subscription_id: sub.id, current_period_end: periodEnd,
          });
          eventNotes = `barber ${barbers[0].id} plan=${plan} status=${subStatus}`;
        } else {
          eventStatus = 'ignored';
          eventNotes = `no barber for customer ${customerId}`;
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = obj;
        const customerId = typeof sub.customer === 'object' ? sub.customer.id : sub.customer;
        const barbers = await base44.asServiceRole.entities.Barber.filter({ stripe_customer_id: customerId });
        if (barbers.length > 0) {
          await base44.asServiceRole.entities.Barber.update(barbers[0].id, {
            plan: 'starter', subscription_status: 'canceled', stripe_subscription_id: null, current_period_end: null,
          });
          eventNotes = `barber ${barbers[0].id} → starter (canceled)`;
        } else {
          eventStatus = 'ignored';
          eventNotes = `no barber for customer ${customerId}`;
        }
        break;
      }

      // ── PAYMENT INTENT ─────────────────────────────────────────────────────

      case 'payment_intent.succeeded': {
        const pi = obj;
        const bookingId = pi.metadata?.booking_id;
        if (!bookingId) { eventStatus = 'ignored'; eventNotes = 'no booking_id in metadata'; break; }

        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
        if (!bookings.length) { eventStatus = 'ignored'; eventNotes = `booking ${bookingId} not found`; break; }
        const booking = bookings[0];
        if (booking.payment_status === 'paid') { eventStatus = 'ignored'; eventNotes = 'already paid'; break; }

        const newStatus = booking.status === 'completed' ? 'completed' : 'confirmed';
        await base44.asServiceRole.entities.Booking.update(bookingId, {
          status: newStatus, payment_status: 'paid', payment_method: 'stripe',
          paid_at: new Date().toISOString(), stripe_payment_intent_id: pi.id,
        });
        const clientEmail = pi.metadata?.client_email;
        if (clientEmail) {
          base44.asServiceRole.integrations.Core.SendEmail({
            to: clientEmail,
            subject: 'NextCut — Payment Confirmed ✅',
            body: `Your payment was successful and your booking is confirmed.\n\nView your bookings: ${Deno.env.get('APP_URL')}/my-bookings`,
          }).catch(() => {});
        }
        const barberIdMeta = pi.metadata?.barber_id;
        if (barberIdMeta) {
          base44.asServiceRole.functions.invoke('forwardBooking', { booking_id: bookingId, barber_id: barberIdMeta })
            .catch((e) => console.warn('[webhook] forwardBooking failed:', e.message));
        }
        eventNotes = `booking ${bookingId} paid`;
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = obj;
        const bookingId = pi.metadata?.booking_id;
        const reason = pi.last_payment_error?.message ?? 'unknown';
        eventNotes = `reason: ${reason}`;
        if (bookingId) {
          const failedBookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          if (failedBookings.length > 0 && failedBookings[0].status === 'pending') {
            await base44.asServiceRole.entities.Booking.update(bookingId, { status: 'cancelled' });
          }
        }
        break;
      }

      // ── ACCOUNT EVENTS ─────────────────────────────────────────────────────

      case 'account.updated': {
        const account = obj;
        const stripeAccountId = account.id;
        if (!stripeAccountId) { eventStatus = 'ignored'; eventNotes = 'no account id'; break; }

        const payoutsEnabled = account.payouts_enabled ?? false;
        const chargesEnabled = account.charges_enabled ?? false;
        const currentlyDue = account.requirements?.currently_due ?? [];
        const pastDue = account.requirements?.past_due ?? [];
        const hasRequirements = currentlyDue.length > 0 || pastDue.length > 0;

        let newStatus = 'onboarding_in_progress';
        if (payoutsEnabled && chargesEnabled) newStatus = 'active';
        else if (hasRequirements) newStatus = 'verification_needed';

        const barbers = await base44.asServiceRole.entities.Barber.filter({ stripe_account_id: stripeAccountId });
        if (barbers.length > 0) {
          const barber = barbers[0];
          if (barber.stripe_status === newStatus && barber.payouts_enabled === payoutsEnabled &&
              barber.stripe_onboarding_complete === (payoutsEnabled && chargesEnabled)) {
            eventStatus = 'ignored'; eventNotes = 'no change'; break;
          }
          const wasActive = barber.stripe_status === 'active';
          await base44.asServiceRole.entities.Barber.update(barber.id, {
            stripe_status: newStatus, payouts_enabled: payoutsEnabled,
            stripe_onboarding_complete: payoutsEnabled && chargesEnabled,
          });
          eventNotes = `barber ${barber.id} → ${newStatus}`;
          if (newStatus === 'active' && !wasActive) {
            base44.asServiceRole.integrations.Core.SendEmail({
              to: barber.user_email,
              subject: 'NextCut — Your payouts are enabled! 💸',
              body: `Hi ${barber.display_name},\n\nYour Stripe account is fully verified. Payouts are now enabled.\n\nView your dashboard: ${Deno.env.get('APP_URL')}/dashboard\n\n— The NextCut Team`,
            }).catch(() => {});
          }
        } else {
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
            stripe_account_id: null, stripe_status: 'not_connected',
            stripe_onboarding_complete: false, payouts_enabled: false,
          });
          eventNotes = `barber ${barbers[0].id} deauthorized`;
        } else {
          eventStatus = 'ignored';
          eventNotes = `no barber for account ${stripeAccountId}`;
        }
        break;
      }

      // ── INVOICE EVENTS ─────────────────────────────────────────────────────

      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const invoice = obj;
        const stripeInvoiceId = invoice.id;
        if (!stripeInvoiceId) { eventStatus = 'ignored'; eventNotes = 'no invoice id'; break; }

        const dbInvoices = await base44.asServiceRole.entities.StripeInvoice.filter({ stripe_invoice_id: stripeInvoiceId });
        if (dbInvoices.length > 0) {
          await base44.asServiceRole.entities.StripeInvoice.update(dbInvoices[0].id, {
            status: 'paid', paid_at: new Date().toISOString(),
          });
          const bookingId = dbInvoices[0].booking_id || invoice.metadata?.booking_id;
          if (bookingId) {
            const piId = typeof invoice.payment_intent === 'object' ? invoice.payment_intent?.id : invoice.payment_intent;
            await base44.asServiceRole.entities.Booking.update(bookingId, {
              payment_status: 'paid', payment_method: 'stripe',
              paid_at: new Date().toISOString(), stripe_payment_intent_id: piId || null,
            }).catch(() => {});
          }
          eventNotes = `invoice ${stripeInvoiceId} marked paid`;
        } else {
          const bookingId = invoice.metadata?.booking_id;
          if (bookingId) {
            const piId = typeof invoice.payment_intent === 'object' ? invoice.payment_intent?.id : invoice.payment_intent;
            await base44.asServiceRole.entities.Booking.update(bookingId, {
              payment_status: 'paid', payment_method: 'stripe',
              paid_at: new Date().toISOString(), stripe_payment_intent_id: piId || null,
            }).catch(() => {});
            eventNotes = `booking ${bookingId} paid via invoice`;
          } else {
            eventStatus = 'ignored';
            eventNotes = `invoice ${stripeInvoiceId} — no local record`;
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = obj;
        // Mark subscription past_due
        if (invoice.subscription) {
          const custId = typeof invoice.customer === 'object' ? invoice.customer.id : invoice.customer;
          if (custId) {
            const pdBarbers = await base44.asServiceRole.entities.Barber.filter({ stripe_customer_id: custId });
            if (pdBarbers.length > 0) {
              await base44.asServiceRole.entities.Barber.update(pdBarbers[0].id, { subscription_status: 'past_due' });
              eventNotes = `barber ${pdBarbers[0].id} → past_due`;
            }
          }
        }
        if (invoice.id) {
          const failedInvoices = await base44.asServiceRole.entities.StripeInvoice.filter({ stripe_invoice_id: invoice.id });
          if (failedInvoices.length > 0) {
            await base44.asServiceRole.entities.StripeInvoice.update(failedInvoices[0].id, { status: 'open' }).catch(() => {});
          }
          eventNotes = (eventNotes || '') + ` invoice_id=${invoice.id}`;
        }
        break;
      }

      case 'invoice.created': {
        eventStatus = 'ignored';
        eventNotes = `invoice_id=${obj.id}`;
        break;
      }

      // ── PAYOUT EVENTS ──────────────────────────────────────────────────────

      case 'payout.paid': {
        const amount = ((obj.amount || 0) / 100).toFixed(2);
        eventNotes = `amount=$${amount} account=${connectedAccountId}`;
        break;
      }

      case 'payout.failed': {
        eventNotes = `reason: ${obj.failure_message} account=${connectedAccountId}`;
        break;
      }

      // ── v2 THIN ACCOUNT EVENTS (acknowledge safely) ────────────────────────
      // e.g. capability_status_updated — rely on account.updated for actual state changes

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
        eventStatus = 'ignored';
        eventNotes = 'unhandled event type';
    }

    // ── Log event (idempotency record) ────────────────────────────────────
    base44.asServiceRole.entities.StripeEvent.create({
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
      status: eventStatus,
      source: eventSource,
      notes: eventNotes,
    }).catch((e) => console.warn('[webhook] Failed to log StripeEvent:', e.message));

    return Response.json({ received: true });

  } catch (err) {
    console.error('[webhook] Handler error:', err.message);
    base44.asServiceRole.entities.StripeEvent.create({
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
      status: 'error',
      source: eventSource,
      notes: err.message,
    }).catch(() => {});
    return Response.json({ error: err.message }, { status: 500 });
  }
});