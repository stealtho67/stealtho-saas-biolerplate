/**
 * NextCut — Stripe Connect
 *
 * Actions:
 *   connect          — unified: create account if needed, then return onboarding link (idempotent)
 *   get_dashboard_link — open Stripe Express dashboard for an active account
 *   sync_status      — pull live Stripe account status into our DB
 *
 * Legacy actions still supported (map to connect):
 *   create_account, get_onboarding_link
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

/** Force the APP_URL to HTTPS — Stripe Live mode rejects HTTP return/refresh URLs */
function httpsUrl(base, path) {
  let url = (base || '').trim().replace(/\/$/, '');
  // Force HTTPS — Stripe live mode requires it
  if (url.startsWith('http://')) {
    url = 'https://' + url.slice(7);
  }
  // If no protocol at all, prepend https://
  if (!url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url + path;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, barber_id } = body;

    if (!barber_id) {
      return Response.json({ error: 'barber_id is required' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-06-20',
    });

    const rawAppUrl = Deno.env.get('APP_URL') || '';
    const returnUrl = httpsUrl(rawAppUrl, '/dashboard?stripe=complete');
    const refreshUrl = httpsUrl(rawAppUrl, '/dashboard?stripe=refresh');

    console.log(`[stripeConnect] action=${action} barber_id=${barber_id} return_url=${returnUrl}`);

    // ── CONNECT (unified — create if needed, then onboarding link) ─────────
    // Also handles legacy action names: create_account, get_onboarding_link
    if (action === 'connect' || action === 'create_account' || action === 'get_onboarding_link') {
      let barberRecord;
      try {
        barberRecord = await base44.asServiceRole.entities.Barber.get(barber_id);
      } catch (_) {}
      if (!barberRecord) {
        return Response.json({ error: 'Barber not found' }, { status: 404 });
      }

      let stripeAccountId = barberRecord.stripe_account_id;

      // If no account yet, create one
      if (!stripeAccountId) {
        console.log(`[stripeConnect] creating new Stripe Express account for barber ${barber_id}`);
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: 'individual',
          business_profile: {
            mcc: '7230', // Beauty shops
            url: httpsUrl(rawAppUrl, `/barber/${barber_id}`),
            product_description: 'Barber services via NextCut marketplace',
          },
          settings: {
            payouts: {
              schedule: { interval: 'daily' },
            },
          },
          metadata: {
            barber_id,
            user_email: user.email,
            platform: 'nextcut',
          },
        });

        stripeAccountId = account.id;
        console.log(`[stripeConnect] created Stripe account ${stripeAccountId}`);

        // Persist immediately so we can resume if barber abandons
        await base44.asServiceRole.entities.Barber.update(barber_id, {
          stripe_account_id: stripeAccountId,
          stripe_status: 'onboarding_in_progress',
          stripe_onboarding_complete: false,
          payouts_enabled: false,
        });
      } else {
        console.log(`[stripeConnect] resuming onboarding for existing account ${stripeAccountId}`);
        // Verify the account still exists on Stripe's side before generating a link
        try {
          await stripe.accounts.retrieve(stripeAccountId);
        } catch (err) {
          if (err.code === 'account_invalid' || err.statusCode === 404) {
            // Account was deleted on Stripe — reset and create fresh
            console.warn(`[stripeConnect] account ${stripeAccountId} invalid, resetting`);
            await base44.asServiceRole.entities.Barber.update(barber_id, {
              stripe_account_id: null,
              stripe_status: 'not_connected',
              stripe_onboarding_complete: false,
              payouts_enabled: false,
            });
            return Response.json({ error: 'Stripe account was reset. Please try connecting again.' }, { status: 409 });
          }
          throw err;
        }
      }

      // Generate the hosted onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
        collect: 'eventually_due',
      });

      console.log(`[stripeConnect] onboarding link created for ${stripeAccountId}`);
      return Response.json({ url: accountLink.url, account_id: stripeAccountId });
    }

    // ── GET DASHBOARD LINK (active accounts only) ──────────────────────────
    if (action === 'get_dashboard_link') {
      let barberRecord;
      try {
        barberRecord = await base44.asServiceRole.entities.Barber.get(barber_id);
      } catch (_) {}
      if (!barberRecord?.stripe_account_id) {
        return Response.json({ error: 'No Stripe account found' }, { status: 404 });
      }

      const loginLink = await stripe.accounts.createLoginLink(barberRecord.stripe_account_id);
      return Response.json({ url: loginLink.url });
    }

    // ── SYNC STATUS ────────────────────────────────────────────────────────
    if (action === 'sync_status') {
      let barberRecord;
      try {
        barberRecord = await base44.asServiceRole.entities.Barber.get(barber_id);
      } catch (_) {}
      if (!barberRecord?.stripe_account_id) {
        return Response.json({ status: 'not_connected', payouts_enabled: false });
      }

      let account;
      try {
        account = await stripe.accounts.retrieve(barberRecord.stripe_account_id);
      } catch (stripeErr) {
        console.error('[stripeConnect] sync_status retrieve error:', stripeErr.message);
        if (stripeErr.code === 'account_invalid' || stripeErr.statusCode === 404) {
          await base44.asServiceRole.entities.Barber.update(barber_id, {
            stripe_account_id: null,
            stripe_status: 'not_connected',
            stripe_onboarding_complete: false,
            payouts_enabled: false,
          });
          return Response.json({ status: 'not_connected', payouts_enabled: false });
        }
        throw stripeErr;
      }

      const payoutsEnabled = account.payouts_enabled ?? false;
      const chargesEnabled = account.charges_enabled ?? false;
      const currentlyDue = account.requirements?.currently_due ?? [];
      const pastDue = account.requirements?.past_due ?? [];
      const eventuallyDue = account.requirements?.eventually_due ?? [];
      const hasBlockingRequirements = currentlyDue.length > 0 || pastDue.length > 0;

      let newStatus;
      if (payoutsEnabled && chargesEnabled) {
        newStatus = 'active';
      } else if (hasBlockingRequirements) {
        newStatus = 'verification_needed';
      } else if (barberRecord.stripe_account_id) {
        newStatus = 'onboarding_in_progress';
      } else {
        newStatus = 'not_connected';
      }

      await base44.asServiceRole.entities.Barber.update(barber_id, {
        stripe_status: newStatus,
        payouts_enabled: payoutsEnabled,
        stripe_onboarding_complete: payoutsEnabled && chargesEnabled,
      });

      console.log(`[stripeConnect] sync_status barber=${barber_id} → ${newStatus} payouts=${payoutsEnabled}`);

      return Response.json({
        status: newStatus,
        payouts_enabled: payoutsEnabled,
        charges_enabled: chargesEnabled,
        requirements: {
          currently_due: currentlyDue,
          past_due: pastDue,
          eventually_due: eventuallyDue,
        },
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    console.error('[stripeConnect] error:', error.message, error.type || '');
    return Response.json({ error: error.message }, { status: 500 });
  }
});