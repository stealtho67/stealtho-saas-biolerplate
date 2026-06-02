# StealthO SaaS Boilerplate

Reusable SaaS factory: Base44 frontend export → Supabase (Auth / Postgres / RLS) + Stripe (subscriptions) + Netlify (serverless).

## Stack

| Layer        | Technology                              |
| ------------ | --------------------------------------- |
| Frontend     | React 19 + Vite + React Router v7       |
| Backend      | Netlify Functions (serverless Node 22)  |
| Database     | Supabase (PostgreSQL + Row Level Security) |
| Auth         | Supabase Auth                           |
| Payments     | Stripe (subscriptions, test mode)       |
| Infra        | Netlify (hosting + functions)           |

## Getting Started

### 1. Clone & install

```bash
git clone <repo-url> stealtho-saas
cd stealtho-saas
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required secrets:

| Variable                       | Source                        |
| ------------------------------ | ----------------------------- |
| `VITE_SUPABASE_URL`            | Supabase project settings     |
| `VITE_SUPABASE_ANON_KEY`       | Supabase API settings         |
| `SUPABASE_SERVICE_ROLE_KEY`    | Supabase Service Role (secret)|
| `VITE_STRIPE_PUBLISHABLE_KEY`  | Stripe Publishable Key (`pk_live_...`) |
| `STRIPE_SECRET_KEY`            | Stripe Secret Key (`sk_live_...`)       |
| `STRIPE_WEBHOOK_SECRET`        | Stripe webhook signing secret           |
| `NEXT_PUBLIC_STRIPE_PRICE_ID`  | Stripe Price ID for your subscription   |

> **Never commit `.env` to version control.**

### 3. Database

Run the migration in your Supabase SQL editor:

```
supabase/migrations/0001_init.sql
```

This creates:
- `public.profiles` table (extends `auth.users`)
- `public.subscriptions` table (syncs from Stripe)
- Trigger to auto-create a profile on signup
- Row Level Security policies

### 4. Stripe webhook

Start the Stripe CLI to forward events to your local functions:

```bash
stripe listen --forward-to http://localhost:8888/.netlify/functions/stripe-webhook
```

Then copy the signing secret (`whsec_...`) to your `.env` as `STRIPE_WEBHOOK_SECRET`.

### 5. Run locally

```bash
npm run dev          # Vite dev server on :5173
npx netlify dev      # Netlify dev server (functions on :8888)
```

## Project Structure

```
├── .openhands/
│   ├── StealthO_Directives.md
│   └── StealthO_Context.md
├── src/
│   ├── base44_export/        # Drop zone for Base44 frontend export
│   ├── lib/
│   │   ├── supabaseClient.js
│   │   └── stripeClient.js
│   └── ...                   # React app (Base44 export)
├── netlify/
│   └── functions/
│       ├── create-checkout.js      # POST  /api/create-checkout
│       ├── stripe-webhook.js       # POST  /api/stripe-webhook
│       └── stripe-webhook.test.js  # Vitest tests
├── supabase/
│   └── migrations/
│       └── 0001_init.sql
├── package.json
├── netlify.toml
├── .env.example
└── README.md
```

## Tests

```bash
npm test
```

Runs Vitest on the serverless functions.

## Manual Setup Checklist

- [ ] Fill in `.env` with your production Supabase + Stripe keys
- [ ] Run `supabase/migrations/0001_init.sql` in Supabase SQL editor
- [ ] Set Stripe webhook secret (`STRIPE_WEBHOOK_SECRET`) from Stripe dashboard
- [ ] Configure Stripe webhook endpoint to point at `/.netlify/functions/stripe-webhook`
- [ ] Deploy via Netlify (CI/CD from GitHub)
