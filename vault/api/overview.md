---
created: 2026-06-02
status: active
tags: [api, netlify, stripe, serverless]
---

# API Layer — Netlify Functions + Stripe

---

## Netlify Functions (`netlify/functions/`)

### `stripe-webhook.js`
**Purpose:** Handles incoming Stripe webhook events.

**Events handled:**
- `checkout.session.completed` — Subscription created, update DB
- `invoice.paid` — Payment successful
- `invoice.payment_failed` — Payment failed, flag account
- `customer.subscription.updated` — Subscription changed
- `customer.subscription.deleted` — Subscription canceled

**Architecture:**
```js
Stripe → Webhook POST → Netlify Function → Verify signature
         → Process event (idempotent via processed_events table)
         → Update subscriptions / profiles
         → Return 200
```

**Env vars required:** `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_KEY`

### `stripe-webhook.test.js`
Test suite for the webhook handler using Stripe test events.

### `create-checkout.js`
**Purpose:** Creates a Stripe Checkout Session for subscription purchases.

**Flow:**
```js
Client → POST /create-checkout → Create Stripe session
         → Return sessionId → Client calls stripe.redirectToCheckout()
```

**Env vars required:** `STRIPE_SECRET_KEY`, `VITE_APP_URL`

---

## Stripe Integration

### Products & Prices (Test Mode)

| Product | Price ID | Interval | Amount |
|---------|----------|----------|--------|
| Pro | `price_1TcOFbK4FkMLO7fVXFSKJbIi` | Monthly | $29.99 |
| Growth | `price_1TcOI7K4FkMLO7fV1J90Q6z7` | Monthly | $49.99 |
| Spotlight | `price_1TcOIrK4FkMLO7fVhgkUAXMR` | Monthly | $99.99 |

### Stripe Connect
- Barbers create Stripe Connect accounts for payouts
- Platform charges commission via `application_fee_amount`
- Payouts handled via Stripe Connect dashboard

### Webhook Endpoints

| Endpoint | Purpose | Env Var |
|----------|---------|---------|
| `/stripe-webhook` | Main webhook receiver | `STRIPE_WEBHOOK_SECRET` |
| `/stripe-webhook-public` | Public endpoint for non-sensitive events | None |

---

## Frontend API Pattern

```jsx
// Base44 function call
import { base44Client } from '../api/base44Client'
const { data, error } = await base44Client.call('createCheckoutSession', {
  priceId: 'price_xxx',
  userId: user.id
})

// Direct Supabase query
import { supabase } from '../lib/supabaseClient'
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'barber')
```
