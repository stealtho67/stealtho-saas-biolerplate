import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function is intended to be called by a scheduled automation (no user auth needed)
    // Use service role for all DB operations
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

    // Fetch all confirmed bookings for tomorrow
    const bookings = await base44.asServiceRole.entities.Booking.filter({
      date: tomorrowStr,
      status: "confirmed",
    });

    if (bookings.length === 0) {
      return Response.json({ sent: 0, message: "No confirmed bookings tomorrow." });
    }

    const appUrl = Deno.env.get("APP_URL") || "https://app.nextcut.com";
    const manageUrl = `${appUrl}/my-bookings`;

    let sent = 0;
    const errors = [];

    for (const booking of bookings) {
      if (!booking.client_email) continue;

      const clientName = booking.client_name || "there";
      const barberName = booking.barber_name || "your barber";
      const serviceName = booking.service_name || "your appointment";
      const time = booking.time || "";
      const price = booking.service_price || booking.price || 0;
      const paymentStatus = booking.payment_status;

      const subject = `Reminder: Your appointment tomorrow at ${time}`;

      const paymentNote = paymentStatus === "paid"
        ? "✅ Payment already received — nothing to do on arrival."
        : `💰 Payment of $${price} is due in person at your appointment.`;

      const body = `Hi ${clientName},

Just a friendly reminder that you have an appointment tomorrow!

📅 Date: Tomorrow (${tomorrowStr})
🕐 Time: ${time}
✂️  Service: ${serviceName}
💇 Barber: ${barberName}
${paymentNote}

Need to make changes? You can view or cancel your booking here:
${manageUrl}

See you soon!
— The NextCut Team`;

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: booking.client_email,
          subject,
          body,
        });
        sent++;
      } catch (emailErr) {
        errors.push({ booking_id: booking.id, error: emailErr.message });
      }
    }

    return Response.json({
      sent,
      total: bookings.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});