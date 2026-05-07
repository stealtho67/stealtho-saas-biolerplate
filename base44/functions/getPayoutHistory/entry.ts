/**
 * NextCut — Fetch barber's Stripe payout history
 * Returns the last N payouts from Stripe for a connected barber account.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { barber_id, limit = 20 } = await req.json();
    if (!barber_id) return Response.json({ error: 'barber_id required' }, { status: 400 });

    const barber = await base44.asServiceRole.entities.Barber.get(barber_id);
    if (!barber) return Response.json({ error: 'Barber not found' }, { status: 404 });

    // Only the barber themselves (or admin) can view their payouts
    if (barber.user_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!barber.stripe_account_id) {
      return Response.json({ payouts: [] });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });

    const payouts = await stripe.payouts.list(
      { limit },
      { stripeAccount: barber.stripe_account_id }
    );

    return Response.json({
      payouts: payouts.data.map(p => ({
        id: p.id,
        amount: p.amount / 100,
        currency: p.currency,
        status: p.status,
        arrival_date: p.arrival_date,
        created: p.created,
        description: p.description,
        failure_message: p.failure_message,
      }))
    });
  } catch (error) {
    console.error('[getPayoutHistory]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});