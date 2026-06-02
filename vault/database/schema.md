---
created: 2026-06-02
status: active
tags: [database, supabase, schema, rls, migration]
---

# Database — Supabase

## Migration: `supabase/migrations/0001_init.sql`

The initial migration sets up the entire database schema.

---

## Tables

### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | References auth.users |
| email | text | User email |
| full_name | text | Display name |
| avatar_url | text | Profile photo |
| role | text | 'customer', 'barber', 'admin' |
| phone | text | Contact number |
| created_at | timestamptz | Auto-generated |
| updated_at | timestamptz | Auto-generated |

### `subscriptions`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| user_id | uuid FK → profiles | Subscriber |
| stripe_subscription_id | text | Stripe reference |
| stripe_price_id | text | Price tier |
| status | text | 'active', 'past_due', 'canceled', 'incomplete' |
| current_period_start | timestamptz | Billing period start |
| current_period_end | timestamptz | Billing period end |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `processed_events`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| event_id | text UNIQUE | Stripe event ID (idempotency) |
| type | text | Event type (e.g., 'checkout.session.completed') |
| status | text | 'processed', 'failed' |
| created_at | timestamptz | |

---

## Row Level Security (RLS)

All tables have RLS enforced. Policies follow the principle of least privilege.

### Profile Policies
- **SELECT**: Users can read their own profile; admins can read all
- **INSERT**: Users can insert their own profile
- **UPDATE**: Users can update their own profile; admins can update any

### Subscription Policies
- **SELECT**: Users can view their own subscriptions; admins can view all
- **INSERT/UPDATE**: Only service role or webhook functions

### Processed Events Policies
- **SELECT/INSERT**: Service role only (idempotency key for webhooks)

---

## Enums & Types

Defined in migration:
- `user_role` — 'customer', 'barber', 'admin'
- `subscription_status` — 'active', 'past_due', 'canceled', 'incomplete'
- `event_status` — 'processed', 'failed'

---

## Indexes

- `profiles_email_idx` — Unique index on email
- `subscriptions_user_id_idx` — Fast lookup by user
- `subscriptions_stripe_id_idx` — Fast lookup by Stripe subscription
- `processed_events_event_id_idx` — Unique index for idempotency

---

## Key Query Patterns

```sql
-- Get user with subscription
SELECT p.*, s.status as subscription_status
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id
WHERE p.id = auth.uid();

-- Check admin role
SELECT role FROM profiles WHERE id = auth.uid() AND role = 'admin';

-- Count active subscriptions
SELECT COUNT(*) FROM subscriptions WHERE status = 'active';
```
