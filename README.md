# NextCut — Barber Booking Marketplace

Built with **Base44** + **Supabase** + **Stripe**.

This is the single source of truth for NextCut. Push changes here and they sync to your Base44 builder.

---

## Quick start

```bash
npm install
npm run dev
```

### Environment

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

| Variable                       | Source                        |
| ------------------------------ | ----------------------------- |
| `VITE_SUPABASE_URL`            | Supabase project settings     |
| `VITE_SUPABASE_ANON_KEY`       | Supabase API → anon public    |
| `SUPABASE_SERVICE_ROLE_KEY`    | Supabase API → service_role   |
| `VITE_STRIPE_PUBLISHABLE_KEY`  | Stripe API Keys → Publishable |
| `STRIPE_SECRET_KEY`            | Stripe API Keys → Secret      |
| `STRIPE_WEBHOOK_SECRET`        | Stripe Webhooks → signing secret |
| `NEXTCUT_PRO_PRICE_ID`         | Stripe Products → NextCut Pro |
| `NEXTCUT_GROWTH_PRICE_ID`      | Stripe Products → NextCut Growth |
| `NEXTCUT_SPOTLIGHT_PRICE_ID`   | Stripe Products → NextCut Spotlight |
| `VITE_BASE44_APP_ID`           | Base44 App Settings           |
| `VITE_BASE44_APP_BASE_URL`     | Base44 App Settings           |

> **Never commit `.env` to version control.**

### Database

Run the migration in Supabase SQL Editor:

```
supabase/migrations/0001_init.sql
```

Creates: `profiles`, `subscriptions`, `processed_events` tables + RLS policies + auth trigger.

---

## Pushing changes

1. Commit and push to the `scaffold-stealtho-boilerplate` branch (or create a new one)
2. Open a PR or merge to `main`
3. Base44 picks up changes from the linked GitHub repo

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind (Base44 export) |
| Auth | Base44 SDK |
| Database | Supabase (profiles, subscriptions, processed events) |
| Payments | Stripe via Base44 (checkout, webhooks, connect) |
| Backend logic | Base44 functions + Netlify functions (staged) |

---

## Key files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Routes and app shell |
| `src/lib/AuthContext.jsx` | Auth via Base44 SDK |
| `src/lib/supabaseClient.js` | Supabase client for DB access |
| `src/lib/stripeClient.js` | Stripe client helpers |
| `supabase/migrations/0001_init.sql` | Database schema |
| `netlify/functions/stripe-webhook.js` | Stripe webhook handler (staged) |
| `netlify/functions/create-checkout.js` | Checkout session (staged) |
| `.openhands/StealthO_Directives.md` | Engineering rules |
| `.openhands/StealthO_Context.md` | Business model & directives |

---

## Importing new skills / additions

Add new features, components, or pages to the appropriate folder under `src/`, then push to this repo.
