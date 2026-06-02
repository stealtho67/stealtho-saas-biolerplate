---
created: 2026-06-02
status: active
tags: [base44, config, entities, functions]
---

# Base44 Configuration — `base44/`

Base44 is the backend SDK that handles auth, data sync, and serverless functions.

---

## Entities (`base44/entities/`)

| Entity | Fields | Purpose |
|--------|--------|---------|
| `User.jsonc` | id, email, role, metadata, created_at | Platform users (customers, barbers, admins) |
| `Barber.jsonc` | id, userId, businessName, bio, photo, services, availability, location | Barber profiles |
| `Barbershop.jsonc` | id, name, address, phone, barbers[], verified | Barbershop locations |
| `Booking.jsonc` | id, barberId, userId, service, date, time, status, paymentId | Appointment bookings |
| `Service.jsonc` | id, barberId, name, duration, price, description | Barber service offerings |
| `Review.jsonc` | id, bookingId, userId, barberId, rating, text, moderated | Customer reviews |
| `StripeEvent.jsonc` | id, eventId, type, status, data | Stripe webhook events log |
| `StripeInvoice.jsonc` | id, invoiceId, barberId, amount, status, period | Stripe invoice records |
| `PlatformSettings.jsonc` | id, commissionRate, featureFlags, defaults | Global platform configuration |

## Functions (`base44/functions/`)

| Function | Trigger | Purpose |
|----------|---------|---------|
| `createCheckoutSession` | RPC | Creates Stripe checkout for subscription |
| `createInvoice` | RPC | Generates invoice for a booking |
| `createPaymentLink` | RPC | Creates one-time payment link |
| `forwardBooking` | RPC | Forwards booking to barber's calendar |
| `getPayoutHistory` | RPC | Returns barber's payout history |
| `getStripePayouts` | RPC | Gets Stripe Connect payout data |
| `manageBarberServices` | RPC | CRUD for barber services |
| `saveWebhookSecrets` | RPC | Stores Stripe webhook secrets |
| `sendAppointmentReminders` | Cron | Sends reminders for upcoming bookings |
| `stripeConnect` | RPC | Creates Stripe Connect account link |
| `stripeWebhook` | Webhook | Handles Stripe events (subscriptions, payments) |
| `stripeWebhookPublic` | Webhook | Public webhook endpoint |

## Agents (`base44/agents/`)

| Agent | Purpose |
|-------|---------|
| `barber_auditor.jsonc` | Automated barber profile QA — checks completeness, flags issues |

## Config File (`base44/config.jsonc`)

Root configuration linking entities, functions, and agents together. Defines the data model relationships and function routing.

## Key Patterns

### Entity Relationship
```
User → Barber → Service
  ↓       ↓
Booking → Review
  ↓
StripeInvoice
```

### Function Flow
```
Client → base44Client.call("functionName", payload)
          → Supabase Edge Function
          → Stripe API / External Service
          → Response → Client
```
