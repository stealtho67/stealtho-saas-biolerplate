/**
 * NextCut — Create Stripe Checkout Session
 *
 * PRICING IS SERVER-SIDE ONLY:
 *   - Service name, price, and duration are fetched from the NextCut DB (not from client payload)
 *   - Commission is calculated here on the server using the stored commission rules
 *   - Client-supplied price values are IGNORED for security
 *
 * Flow:
 *   1. Frontend sends booking intent (barber_id, service_id, date, time, commission context)
 *   2. Server fetches authoritative service price from DB
 *   3. Server calculates platform fee and barber earnings
 *   4. Server creates a pending Booking record
 *   5. Server creates Stripe Checkout session with price_data (no Stripe Products needed)
 *   6. Stripe routes full charge through NextCut, deducts application_fee, transfers rest to barber
 *   7. Webhook marks booking confirmed + paid on success
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
      service_id,
      date,
      time,
      notes,
      // Commission context — these come from the frontend booking flow
      commission_type,
      commission_rate,
      customer_source,
      is_repeat_client,
      referred_by_barber_id,
      success_url,
      cancel_url,
    } = body;

    // ── 1. Fetch authoritative data from DB (never trust client-sent prices) ──
    let barber, service;
    try { barber = await base44.asServiceRole.entities.Barber.get(barber_id); } catch (_) {}
    try { service = await base44.asServiceRole.entities.Service.get(service_id); } catch (_) {}

    if (!barber) return Response.json({ error: 'Barber not found' }, { status: 404 });
    if (!service) return Response.json({ error: 'Service not found' }, { status: 404 });
    if (service.active === false) return Response.json({ error: 'Service is no longer available' }, { status: 400 });

    if (!barber.stripe_account_id || !barber.payouts_enabled) {
      return Response.json({ error: 'Barber has not completed Stripe setup' }, { status: 400 });
    }

    // ── 2. Calculate commission server-side ──
    // Commission rates are loaded from database (PlatformSettings)
    // Falls back to defaults if not set
    const settings = await base44.asServiceRole.entities.PlatformSettings.list();
    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.setting_key] = parseFloat(s.setting_value); });
    const COMMISSION_RATES = {
      new_nextcut_lead: settingsMap["rate_new_nextcut_lead"] ?? 0.20,
      repeat_client: settingsMap["rate_repeat_client"] ?? 0.15,
      barber_direct_client: settingsMap["rate_barber_direct_client"] ?? 0.10,
    };
    const resolvedRate = COMMISSION_RATES[commission_type] ?? commission_rate ?? COMMISSION_RATES.new_nextcut_lead;
    const servicePrice = service.price;
    const platformFee = Math.round(servicePrice * resolvedRate * 100) / 100;
    const barberEarnings = Math.round((servicePrice - platformFee) * 100) / 100;

    const priceInCents = Math.round(servicePrice * 100);
    const platformFeeInCents = Math.round(platformFee * 100);

    // ── 3. Create a pending booking in DB ──
    const booking = await base44.asServiceRole.entities.Booking.create({
      client_email: user.email,
      client_name: user.full_name,
      barber_id,
      barber_name: barber.display_name,
      service_id,
      service_name: service.service_name,
      price: servicePrice,
      service_price: servicePrice,
      tip_amount: 0,
      platform_fee: platformFee,
      barber_earnings: barberEarnings,
      commission_rate: resolvedRate,
      commission_type: commission_type || 'new_nextcut_lead',
      customer_source: customer_source || 'marketplace',
      is_repeat_client: is_repeat_client || false,
      referred_by_barber_id: referred_by_barber_id || undefined,
      date,
      time,
      duration_minutes: service.duration_minutes,
      status: 'pending',
      payment_status: 'unpaid',
      notes: notes || '',
    });

    // ── 4. Create Stripe Checkout session using price_data (no Stripe Products) ──
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-06-20',
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            // price_data with product_data = no Stripe Product required
            // Price is sourced from NextCut DB, not barber's Stripe dashboard
            product_data: {
              name: service.service_name,
              description: `${barber.display_name} — ${date} at ${time}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        // Platform collects its fee; remainder is transferred to barber's connected account
        application_fee_amount: platformFeeInCents,
        transfer_data: {
          destination: barber.stripe_account_id,
        },
        metadata: {
          booking_id: booking.id,
          barber_id,
          client_email: user.email,
          commission_type: commission_type || 'new_nextcut_lead',
          commission_rate: String(resolvedRate),
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