/**
 * NextCut — Create & Send Stripe Invoice on the barber's connected account
 *
 * The invoice is created ON THE BARBER'S STRIPE CONNECTED ACCOUNT
 * (Stripe-Account header set to barber's acct_xxx) so funds settle directly
 * to the barber. NextCut's application_fee_amount is deducted from the charge.
 *
 * Commission rates (on service_price only, tips excluded):
 *   barber_referral_link  → 0%
 *   barber_direct_client  → 3%
 *   repeat_client         → 4%
 *   new_nextcut_lead      → 7%
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const COMMISSION_DEFAULTS = {
  new_nextcut_lead: 0.07,
  repeat_client: 0.04,
  barber_direct_client: 0.03,
  barber_referral_link: 0.00,
};

const SOURCE_TO_TYPE = {
  marketplace: 'new_nextcut_lead',
  search: 'new_nextcut_lead',
  featured: 'new_nextcut_lead',
  nextcut_campaign: 'new_nextcut_lead',
  barber_referral_link: 'barber_referral_link',
  barber_direct_link: 'barber_direct_client',
  manual: 'barber_direct_client',
};

async function getCommissionRates(base44) {
  try {
    const settings = await base44.asServiceRole.entities.PlatformSettings.list();
    const map = {};
    settings.forEach(s => { map[s.setting_key] = parseFloat(s.setting_value); });
    return {
      new_nextcut_lead: map['rate_new_nextcut_lead'] ?? COMMISSION_DEFAULTS.new_nextcut_lead,
      repeat_client: map['rate_repeat_client'] ?? COMMISSION_DEFAULTS.repeat_client,
      barber_direct_client: map['rate_barber_direct_client'] ?? COMMISSION_DEFAULTS.barber_direct_client,
      barber_referral_link: 0.00,
    };
  } catch {
    return COMMISSION_DEFAULTS;
  }
}

async function resolveCommissionType(base44, clientEmail, barberId, customerSource) {
  if (customerSource === 'barber_referral_link') return 'barber_referral_link';
  if (customerSource === 'barber_direct_link' || customerSource === 'manual') return 'barber_direct_client';

  // Check for prior completed+paid booking (repeat client)
  const prior = await base44.asServiceRole.entities.Booking.filter({
    client_email: clientEmail,
    barber_id: barberId,
    status: 'completed',
    payment_status: 'paid',
  });
  if (prior.length > 0) return 'repeat_client';
  return 'new_nextcut_lead';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action = 'create', barber_id } = body;

    if (!barber_id) return Response.json({ error: 'barber_id required' }, { status: 400 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });

    // ── LIST INVOICES ────────────────────────────────────────────────────────
    if (action === 'list') {
      const invoices = await base44.asServiceRole.entities.StripeInvoice.filter(
        { barber_id },
        '-created_date',
        50
      );
      return Response.json({ invoices });
    }

    // ── CREATE & SEND INVOICE ────────────────────────────────────────────────
    if (action === 'create') {
      const {
        client_name,
        client_email,
        service_name,
        service_price,
        tip_amount = 0,
        customer_source = 'manual',
        note,
        booking_id,
      } = body;

      if (!client_email || !service_name || !service_price) {
        return Response.json({ error: 'client_email, service_name, service_price required' }, { status: 400 });
      }

      // Load barber — must have active Stripe account
      const barber = await base44.asServiceRole.entities.Barber.get(barber_id);
      if (!barber) return Response.json({ error: 'Barber not found' }, { status: 404 });
      if (!barber.stripe_account_id) {
        return Response.json({ error: 'Stripe account not connected. Set up payouts first.' }, { status: 400 });
      }
      if (!barber.payouts_enabled) {
        return Response.json({ error: 'Stripe account not fully verified. Complete Stripe onboarding first.' }, { status: 400 });
      }

      // Resolve commission
      const commType = SOURCE_TO_TYPE[customer_source] ||
        await resolveCommissionType(base44, client_email, barber_id, customer_source);
      const rates = await getCommissionRates(base44);
      const rate = rates[commType] ?? 0;

      const svcPrice = parseFloat(service_price);
      const tipAmt = parseFloat(tip_amount) || 0;
      const platformFeeAmt = parseFloat((svcPrice * rate).toFixed(2));
      const barberEarnings = parseFloat((svcPrice - platformFeeAmt + tipAmt).toFixed(2));

      // All amounts in cents
      const svcCents = Math.round(svcPrice * 100);
      const tipCents = Math.round(tipAmt * 100);
      const feeCents = Math.round(platformFeeAmt * 100);

      const stripeOpts = { stripeAccount: barber.stripe_account_id };

      // Find or create Stripe Customer on the connected account
      const existing = await stripe.customers.list(
        { email: client_email, limit: 1 },
        stripeOpts
      );
      let customer;
      if (existing.data.length > 0) {
        customer = existing.data[0];
        // Update name if provided and blank
        if (client_name && !customer.name) {
          customer = await stripe.customers.update(customer.id, { name: client_name }, stripeOpts);
        }
      } else {
        customer = await stripe.customers.create(
          { email: client_email, name: client_name || client_email },
          stripeOpts
        );
      }

      // Add invoice line item(s)
      await stripe.invoiceItems.create(
        {
          customer: customer.id,
          amount: svcCents,
          currency: 'usd',
          description: service_name,
        },
        stripeOpts
      );

      if (tipCents > 0) {
        await stripe.invoiceItems.create(
          {
            customer: customer.id,
            amount: tipCents,
            currency: 'usd',
            description: 'Tip (100% to barber)',
          },
          stripeOpts
        );
      }

      // Create the invoice
      const invoiceCreateParams = {
        customer: customer.id,
        collection_method: 'send_invoice',
        days_until_due: 7,
        metadata: {
          barber_id,
          client_email,
          commission_type: commType,
          booking_id: booking_id || '',
          platform: 'nextcut',
        },
      };

      // Only attach application_fee if there's an actual fee
      if (feeCents > 0) {
        invoiceCreateParams.application_fee_amount = feeCents;
      }

      if (note) {
        invoiceCreateParams.description = note;
      }

      const invoice = await stripe.invoices.create(invoiceCreateParams, stripeOpts);

      // Finalize and send
      const finalized = await stripe.invoices.finalizeInvoice(invoice.id, {}, stripeOpts);
      const sent = await stripe.invoices.sendInvoice(invoice.id, stripeOpts);

      console.log(`[createInvoice] Invoice ${sent.id} sent to ${client_email} on account ${barber.stripe_account_id}`);

      // Persist to DB
      const dbInvoice = await base44.asServiceRole.entities.StripeInvoice.create({
        barber_id,
        booking_id: booking_id || null,
        stripe_invoice_id: sent.id,
        stripe_customer_id: customer.id,
        client_name: client_name || client_email,
        client_email,
        service_name,
        service_price: svcPrice,
        tip_amount: tipAmt,
        platform_fee: platformFeeAmt,
        barber_earnings: barberEarnings,
        commission_type: commType,
        commission_rate: rate,
        status: sent.status,
        invoice_url: sent.hosted_invoice_url,
        invoice_pdf: sent.invoice_pdf,
        note: note || null,
      });

      // If booking_id provided, update booking with invoice data
      if (booking_id) {
        await base44.asServiceRole.entities.Booking.update(booking_id, {
          payment_status: 'unpaid',
          platform_fee: platformFeeAmt,
          barber_earnings: barberEarnings,
          commission_rate: rate,
          commission_type: commType,
          stripe_payment_intent_id: sent.payment_intent || null,
        }).catch(() => {});
      }

      return Response.json({
        invoice: dbInvoice,
        stripe_invoice: {
          id: sent.id,
          hosted_invoice_url: sent.hosted_invoice_url,
          invoice_pdf: sent.invoice_pdf,
          status: sent.status,
        },
        breakdown: { service_price: svcPrice, tip_amount: tipAmt, platform_fee: platformFeeAmt, barber_earnings: barberEarnings, commission_type: commType, rate_pct: Math.round(rate * 100) },
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (err) {
    console.error('[createInvoice] error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});