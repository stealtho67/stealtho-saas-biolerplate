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
    const { action, barber_id } = body;

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-06-20',
    });

    const appUrl = Deno.env.get('APP_URL') || 'https://app.base44.com';

    if (action === 'create_account') {
      // Create a Stripe Express account for the barber
      const account = await stripe.accounts.create({
        type: 'express',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          barber_id,
          user_email: user.email,
        },
      });

      // Save the Stripe account ID to the barber record
      await base44.asServiceRole.entities.Barber.update(barber_id, {
        stripe_account_id: account.id,
        stripe_status: 'onboarding_in_progress',
      });

      // Create an onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${appUrl}/dashboard?stripe=refresh`,
        return_url: `${appUrl}/dashboard?stripe=complete`,
        type: 'account_onboarding',
      });

      return Response.json({ url: accountLink.url, account_id: account.id });
    }

    if (action === 'get_onboarding_link') {
      // Resume onboarding for a barber who already has an account
      let barbers;
      try {
        barbers = await base44.asServiceRole.entities.Barber.filter({ id: barber_id });
      } catch {
        return Response.json({ error: 'Barber not found' }, { status: 404 });
      }
      if (!barbers.length || !barbers[0].stripe_account_id) {
        return Response.json({ error: 'No Stripe account found' }, { status: 404 });
      }

      const accountLink = await stripe.accountLinks.create({
        account: barbers[0].stripe_account_id,
        refresh_url: `${appUrl}/dashboard?stripe=refresh`,
        return_url: `${appUrl}/dashboard?stripe=complete`,
        type: 'account_onboarding',
      });

      return Response.json({ url: accountLink.url });
    }

    if (action === 'sync_status') {
      // Sync Stripe account status back to our DB
      let barbers;
      try {
        barbers = await base44.asServiceRole.entities.Barber.filter({ id: barber_id });
      } catch {
        return Response.json({ status: 'not_connected' });
      }
      if (!barbers.length || !barbers[0].stripe_account_id) {
        return Response.json({ status: 'not_connected' });
      }

      const account = await stripe.accounts.retrieve(barbers[0].stripe_account_id);
      const payoutsEnabled = account.payouts_enabled;
      const chargesEnabled = account.charges_enabled;
      const hasRequirements = account.requirements?.currently_due?.length > 0 || account.requirements?.past_due?.length > 0;
      let newStatus;
      if (payoutsEnabled && chargesEnabled) {
        newStatus = 'active';
      } else if (hasRequirements) {
        newStatus = 'verification_needed';
      } else {
        newStatus = 'onboarding_in_progress';
      }

      await base44.asServiceRole.entities.Barber.update(barber_id, {
        stripe_status: newStatus,
        payouts_enabled: payoutsEnabled,
        stripe_onboarding_complete: payoutsEnabled && chargesEnabled,
      });

      return Response.json({ status: newStatus, payouts_enabled: payoutsEnabled });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});