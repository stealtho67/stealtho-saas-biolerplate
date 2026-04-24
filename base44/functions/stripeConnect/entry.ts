/**
 * NextCut — Stripe Connect
 *
 * Actions:
 *   create_account      — create a new Stripe Express account + onboarding link
 *   get_onboarding_link — resume onboarding for an existing account
 *   get_dashboard_link  — open Stripe Express dashboard for an active account
 *   sync_status         — pull live Stripe account status into our DB
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
    const { action, barber_id } = body;

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-06-20',
    });

    const appUrl = Deno.env.get('APP_URL') || 'https://app.base44.com';

    // ── CREATE ACCOUNT ─────────────────────────────────────────────────────
    if (action === 'create_account') {
      // Check if barber already has an account (idempotent)
      let barberRecord;
      try { barberRecord = await base44.asServiceRole.entities.Barber.get(barber_id); } catch (_) {}
      if (!barberRecord) return Response.json({ error: 'Barber not found' }, { status: 404 });

      // If they already have a Stripe account ID, just give them a new onboarding link
      if (barberRecord.stripe_account_id) {
        const accountLink = await stripe.accountLinks.create({
          account: barberRecord.stripe_account_id,
          refresh_url: `${appUrl}/dashboard?stripe=refresh`,
          return_url: `${appUrl}/dashboard?stripe=complete`,
          type: 'account_onboarding',
          collect: 'eventually_due',
        });
        return Response.json({ url: accountLink.url, account_id: barberRecord.stripe_account_id });
      }

      // Create a new Stripe Express account
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
          url: `${appUrl}/barber/${barber_id}`,
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

      // Persist the account ID immediately so we can resume if user abandons
      await base44.asServiceRole.entities.Barber.update(barber_id, {
        stripe_account_id: account.id,
        stripe_status: 'onboarding_in_progress',
        stripe_onboarding_complete: false,
        payouts_enabled: false,
      });

      // Generate the hosted onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${appUrl}/dashboard?stripe=refresh`,
        return_url: `${appUrl}/dashboard?stripe=complete`,
        type: 'account_onboarding',
        collect: 'eventually_due',
      });

      return Response.json({ url: accountLink.url, account_id: account.id });
    }

    // ── GET ONBOARDING LINK ────────────────────────────────────────────────
    if (action === 'get_onboarding_link') {
      let barberRecord;
      try { barberRecord = await base44.asServiceRole.entities.Barber.get(barber_id); } catch (_) {}
      if (!barberRecord?.stripe_account_id) {
        return Response.json({ error: 'No Stripe account found' }, { status: 404 });
      }

      const accountLink = await stripe.accountLinks.create({
        account: barberRecord.stripe_account_id,
        refresh_url: `${appUrl}/dashboard?stripe=refresh`,
        return_url: `${appUrl}/dashboard?stripe=complete`,
        type: 'account_onboarding',
        collect: 'eventually_due',
      });

      return Response.json({ url: accountLink.url });
    }

    // ── GET DASHBOARD LINK (active accounts only) ──────────────────────────
    if (action === 'get_dashboard_link') {
      let barberRecord;
      try { barberRecord = await base44.asServiceRole.entities.Barber.get(barber_id); } catch (_) {}
      if (!barberRecord?.stripe_account_id) {
        return Response.json({ error: 'No Stripe account found' }, { status: 404 });
      }

      const loginLink = await stripe.accounts.createLoginLink(barberRecord.stripe_account_id);
      return Response.json({ url: loginLink.url });
    }

    // ── SYNC STATUS ────────────────────────────────────────────────────────
    if (action === 'sync_status') {
      let barberRecord;
      try { barberRecord = await base44.asServiceRole.entities.Barber.get(barber_id); } catch (_) {}
      if (!barberRecord?.stripe_account_id) {
        return Response.json({ status: 'not_connected', payouts_enabled: false });
      }

      let account;
      try {
        account = await stripe.accounts.retrieve(barberRecord.stripe_account_id);
      } catch (stripeErr) {
        // Account may have been deleted on Stripe's side
        console.error('[stripeConnect] sync_status retrieve error:', stripeErr.message);
        if (stripeErr.code === 'account_invalid') {
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

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('[stripeConnect] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});