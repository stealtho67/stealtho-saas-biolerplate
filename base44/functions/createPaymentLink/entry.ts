/**
 * NextCut — Barber-Initiated Payment Collection
 *
 * Called by the barber after an appointment to collect payment.
 * Generates a Stripe Checkout URL that the client opens on their phone to pay.
 * Price is confirmed by barber, stored in DB — client cannot alter it.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { booking_id, final_price, tip_amount = 0 } = body;

    // Fetch the booking
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    if (!bookings.length) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }
    const booking = bookings[0];

    // Verify the caller is the barber for this booking
    const barbers = await base44.asServiceRole.entities.Barber.filter({ user_email: user.email });
    if (!barbers.length || barbers[0].id !== booking.barber_id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const barber = barbers[0];

    if (!barber.stripe_account_id || !barber.payouts_enabled) {
      return Response.json({ error: 'Barber has not completed Stripe payout setup' }, { status: 400 });
    }

    // Commission rates
    const COMMISSION_RATES = {
      new_nextcut_lead: 0.20,
      repeat_client: 0.15,
      barber_direct_client: 0.10,
    };
    const commissionRate = COMMISSION_RATES[booking.commission_type] ?? booking.commission_rate ?? 0.20;

    const servicePrice = final_price;
    const platformFee = Math.round(servicePrice * commissionRate * 100) / 100;
    const barberEarnings = Math.round((servicePrice - platformFee + tip_amount) * 100) / 100;

    const servicePriceInCents = Math.round(servicePrice * 100);
    const tipInCents = Math.round(tip_amount * 100);
    const platformFeeInCents = Math.round(platformFee * 100);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-06-20',
    });

    const appUrl = Deno.env.get('APP_URL') || 'https://app.base44.com';

    // Build line items
    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: booking.service_name,
            description: `${barber.display_name} — ${booking.date} at ${booking.time}`,
          },
          unit_amount: servicePriceInCents,
        },
        quantity: 1,
      },
    ];

    if (tipInCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Tip (100% to barber)' },
          unit_amount: tipInCents,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      payment_intent_data: {
        application_fee_amount: platformFeeInCents,
        transfer_data: { destination: barber.stripe_account_id },
        metadata: {
          booking_id: booking.id,
          barber_id: barber.id,
          client_email: booking.client_email,
          commission_type: booking.commission_type || 'new_nextcut_lead',
          commission_rate: String(commissionRate),
          initiated_by: 'barber',
        },
      },
      metadata: { booking_id: booking.id },
      success_url: `${appUrl}/my-bookings?payment=success`,
      cancel_url: `${appUrl}/my-bookings`,
      // Allow 30 minutes to complete payment
      expires_at: Math.floor(Date.now() / 1000) + 1800,
    });

    // Update booking with the confirmed final amounts (pending payment)
    await base44.asServiceRole.entities.Booking.update(booking_id, {
      service_price: servicePrice,
      price: servicePrice,
      tip_amount: tip_amount,
      platform_fee: platformFee,
      barber_earnings: barberEarnings,
      commission_rate: commissionRate,
      stripe_payment_intent_id: session.payment_intent,
      payment_status: 'unpaid',
    });

    return Response.json({ checkout_url: session.url, session_id: session.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});