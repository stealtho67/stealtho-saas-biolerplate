/**
 * NextCut — Create Stripe Checkout Session
 *
 * Creates a Stripe Checkout session with:
 *   - application_fee_amount: platform commission (in cents)
 *   - transfer_data.destination: barber's Stripe Connect account
 *
 * Flow:
 *   1. Frontend calls this with booking details
 *   2. We create a pending booking in DB
 *   3. We create Stripe Checkout session
 *   4. Return the Checkout URL → frontend redirects client there
 *   5. On payment success, Stripe webhook marks booking confirmed + paid
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
    const {
      barber_id,
      barber_name,
      service_id,
      service_name,
      service_price,
      platform_fee,
      barber_earnings,
      commission_rate,
      commission_type,
      customer_source,
      is_repeat_client,
      referred_by_barber_id,
      date,
      time,
      duration_minutes,
      notes,
      success_url,
      cancel_url,
    } = body;

    // Fetch barber to get their Stripe account ID
    const barbers = await base44.asServiceRole.entities.Barber.filter({ id: barber_id });
    if (!barbers.length) {
      return Response.json({ error: 'Barber not found' }, { status: 404 });
    }
    const barber = barbers[0];

    if (!barber.stripe_account_id || !barber.payouts_enabled) {
      return Response.json({ error: 'Barber has not completed Stripe setup' }, { status: 400 });
    }

    // Create the pending booking first so we have an ID to attach to the payment
    const booking = await base44.asServiceRole.entities.Booking.create({
      client_email: user.email,
      client_name: user.full_name,
      barber_id,
      barber_name,
      service_id,
      service_name,
      price: service_price,
      service_price,
      tip_amount: 0,
      platform_fee,
      barber_earnings,
      commission_rate,
      commission_type,
      customer_source: customer_source || 'marketplace',
      is_repeat_client: is_repeat_client || false,
      referred_by_barber_id: referred_by_barber_id || undefined,
      date,
      time,
      duration_minutes,
      status: 'pending',          // stays pending until payment succeeds
      payment_status: 'unpaid',
      notes: notes || '',
    });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-06-20',
    });

    const priceInCents = Math.round(service_price * 100);
    const platformFeeInCents = Math.round(platform_fee * 100);

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: service_name,
              description: `${barber_name} — ${date} at ${time}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFeeInCents,
        transfer_data: {
          destination: barber.stripe_account_id,
        },
        metadata: {
          booking_id: booking.id,
          barber_id,
          client_email: user.email,
        },
      },
      metadata: {
        booking_id: booking.id,
      },
      success_url: success_url || `${Deno.env.get('APP_URL')}/my-bookings?payment=success`,
      cancel_url: cancel_url || `${Deno.env.get('APP_URL')}/barber/${barber_id}?payment=cancelled`,
    });

    return Response.json({ checkout_url: session.url, booking_id: booking.id, session_id: session.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});