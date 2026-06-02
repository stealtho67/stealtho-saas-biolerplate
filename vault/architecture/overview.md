---
created: 2026-06-02
status: active
tags: [architecture, overview, stealtho]
---

# System Architecture

> High-level architecture of the StealthO SaaS platform.

## Layer Diagram

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER                           │
│         React 18 + Vite + Tailwind CSS              │
│         Base44 SDK (auth, data sync)                │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│              BASE44 SDK LAYER                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │ Auth     │  │ Entities │  │ Functions (RPC)   │ │
│  │ Context  │  │ Sync     │  │ Call              │ │
│  └──────────┘  └──────────┘  └───────────────────┘ │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│              SUPABASE (Backend)                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │ Auth     │  │ Postgres │  │ Row Level         │ │
│  │          │  │ Database │  │ Security (RLS)    │ │
│  └──────────┘  └──────────┘  └───────────────────┘ │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│           NETLIFY (Serverless)                      │
│  ┌──────────────────┐  ┌──────────────────────────┐│
│  │ Stripe Webhook   │  │ Create Checkout Session  ││
│  │ Handler          │  │                          ││
│  └──────────────────┘  └──────────────────────────┘│
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│              STRIPE (Payments)                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │ Connect  │  │ Checkout │  │ Webhooks          │ │
│  │ Accounts │  │ Sessions │  │ Events            │ │
│  └──────────┘  └──────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Tech Stack Details

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 18 + Vite | SPA frontend |
| Styling | Tailwind CSS + shadcn/ui | Component library |
| Auth | Base44 SDK / Supabase Auth | Authentication |
| Database | Supabase Postgres | Data storage |
| RLS | Supabase Row Level Security | Data access control |
| Serverless | Netlify Functions | Stripe webhook handling |
| Payments | Stripe Connect + Checkout | Payment processing |
| Config | Base44 | Entity definitions, functions, agents |
| CI/CD | GitHub Actions | Lint, typecheck, build |

## Route Structure

| Path | Page | Access |
|------|------|--------|
| `/` | Home | Public |
| `/explore` | Explore barbers | Public |
| `/barbers` | List barbershops | Public |
| `/barbers/:id` | Barber profile | Public |
| `/barbershops/:id` | Barbershop profile | Public |
| `/booking/:barberId` | Booking flow | Authenticated |
| `/my-bookings` | My bookings | Authenticated |
| `/dashboard` | Barber dashboard | Barber role |
| `/profile` | User profile | Authenticated |
| `/admin/*` | Admin panel | Admin role |
| `/pricing` | Pricing page | Public |
| `/about` | About | Public |
| `/how-it-works` | How it works | Public |
| `/faq` | FAQ | Public |

## Auth Flow

1. User signs up via Base44 Auth (email + password or magic link)
2. AuthContext provides user state globally
3. ProtectedRoute checks auth status + role
4. Admin routes check for admin claim in user metadata
5. Barber routes check for barber role in user metadata

## Data Flow

```
User Action → React Component → Base44 SDK → Supabase (RLS enforced)
                                   ↓
                            Realtime subscription
                                   ↓
                         UI updates automatically
```
