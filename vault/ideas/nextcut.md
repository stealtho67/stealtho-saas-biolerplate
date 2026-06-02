---
created: 2026-06-01
status: active
tags: [idea, nextcut, marketplace, barber]
aliases: [NextCut, Barber Booking Marketplace]
---

# NextCut — Barber Booking Marketplace

> *"Tinder for barbers — book, pay, tip, repeat."*

## One-Line Idea

Barber booking marketplace: free for barbers, 10% commission on new clients, 100% tips.

## Validation

| Dimension | Assessment |
|-----------|-----------|
| Who is it for | Barbers (supply) + Men who need haircuts (demand) |
| What pain | Barbers waste time on scheduling/payment; clients can't easily discover/book barbers |
| How it earns | 10% commission on new-client bookings; barbers keep 100% of own clients 0% |
| Free-stack feasible | ✅ Base44 + Supabase + Stripe + Netlify — all free tiers |
| Competitors | Booksy, The Cut, StyleSeat — all take 20-30%, barbers hate them |
| **Viability (1-10)** | **8** — proven model, better pricing, barber-friendly |
| **Real reason** | Barbers are actively looking for alternatives to Booksy's high fees |

## Verdict

**GO** — build in public, launch locally, grow by referral.

## Brand

- **Name:** NextCut
- **One-line promise:** "Your next cut is your best cut"
- **Voice:** Direct, masculine, no-nonsense. Speaks to barbers as partners, not users.
- **Visual:** Dark, premium, gold accents. Think barbershop meets fintech.

## Spec (v1)

- **Core feature:** Search barbers → see availability → book instantly → pay/tip in app
- **Must nail:** Booking flow under 30 seconds on mobile
- **Success metric:** 10 barbers on platform, 100 bookings/month
- **Out of scope:** Ratings/reviews (v2), barber profiles with portfolio (v2), multi-location (v3)

## Links

- [[cycles/2026-06-01_nextcut-initial-setup|Initial factory setup run]]
- PR: https://github.com/stealtho67/stealtho-saas-biolerplate/pull/1
- Stack: React + Base44 + Supabase + Stripe
