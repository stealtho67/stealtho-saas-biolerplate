/**
 * NextCut — Forward Booking Notification
 *
 * Called after a booking is created to forward booking/client details
 * to the barber's configured delivery destination.
 *
 * Supported methods:
 *   - nextcut_only: no-op, booking is already in NextCut DB
 *   - email: send booking details to barber's custom notification email
 *   - webhook: HTTP POST booking data as JSON to barber's configured URL
 *   - website: no-op automation (URL is stored for reference only)
 *
 * This is fire-and-forget — a failed delivery NEVER breaks the booking.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { booking_id, barber_id } = await req.json();

    if (!booking_id || !barber_id) {
      return Response.json({ error: 'booking_id and barber_id are required' }, { status: 400 });
    }

    // Fetch barber and booking records
    let barber, booking;
    try { barber = await base44.asServiceRole.entities.Barber.get(barber_id); } catch (_) {}
    try { booking = await base44.asServiceRole.entities.Booking.get(booking_id); } catch (_) {}

    if (!barber) return Response.json({ error: 'Barber not found' }, { status: 404 });
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const method = barber.booking_delivery_method || 'nextcut_only';

    console.log(`[forwardBooking] barber=${barber_id} method=${method} booking=${booking_id}`);

    // Build a clean summary of the booking for forwarding
    const bookingSummary = {
      booking_id: booking.id,
      client_name: booking.client_name,
      client_email: booking.client_email,
      service_name: booking.service_name,
      date: booking.date,
      time: booking.time,
      duration_minutes: booking.duration_minutes,
      price: booking.service_price || booking.price,
      payment_status: booking.payment_status,
      payment_method: booking.payment_method,
      notes: booking.notes || '',
      barber_name: barber.display_name,
      booked_at: new Date().toISOString(),
    };

    if (method === 'nextcut_only' || method === 'website') {
      // Nothing to forward — booking lives in NextCut. Website URL is informational only.
      return Response.json({ forwarded: false, method, reason: 'no_action_required' });
    }

    if (method === 'email') {
      const dest = barber.booking_delivery_email;
      if (!dest || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dest)) {
        console.warn(`[forwardBooking] invalid or missing delivery email for barber ${barber_id}`);
        return Response.json({ forwarded: false, method, reason: 'invalid_email' });
      }

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: dest,
        subject: `New Booking — ${booking.client_name} · ${booking.service_name} on ${booking.date}`,
        body: [
          `New booking received via NextCut!`,
          ``,
          `Client: ${booking.client_name} (${booking.client_email})`,
          `Service: ${booking.service_name}`,
          `Date: ${booking.date} at ${booking.time}`,
          `Duration: ${booking.duration_minutes || '—'} min`,
          `Price: $${booking.service_price || booking.price}`,
          `Payment: ${booking.payment_status === 'paid' ? 'Paid online via Stripe' : 'Pay in person'}`,
          booking.notes ? `Notes: ${booking.notes}` : '',
          ``,
          `Manage this booking: ${Deno.env.get('APP_URL')}/my-bookings`,
        ].filter(line => line !== null).join('\n'),
      });

      console.log(`[forwardBooking] email sent to ${dest} for booking ${booking_id}`);
      return Response.json({ forwarded: true, method, destination: dest });
    }

    if (method === 'webhook') {
      const url = barber.booking_delivery_webhook_url;
      if (!url || !url.startsWith('http')) {
        console.warn(`[forwardBooking] invalid or missing webhook URL for barber ${barber_id}`);
        return Response.json({ forwarded: false, method, reason: 'invalid_url' });
      }

      const webhookResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-NextCut-Event': 'booking.created',
          'X-NextCut-Barber-Id': barber_id,
        },
        body: JSON.stringify(bookingSummary),
      });

      if (!webhookResponse.ok) {
        console.warn(`[forwardBooking] webhook POST to ${url} returned ${webhookResponse.status}`);
        return Response.json({ forwarded: false, method, reason: 'webhook_failed', status: webhookResponse.status });
      }

      console.log(`[forwardBooking] webhook POSTed to ${url} → ${webhookResponse.status}`);
      return Response.json({ forwarded: true, method, destination: url, webhook_status: webhookResponse.status });
    }

    return Response.json({ forwarded: false, method, reason: 'unknown_method' });

  } catch (error) {
    // Errors here should never surface to clients — this is fire-and-forget
    console.error('[forwardBooking] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});