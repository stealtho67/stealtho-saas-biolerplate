---
created: 2026-06-02
status: active
tags: [metrics, nextcut, north-star]
---

# NextCut — Metrics Framework

> **North Star:** _Monthly active bookings (MAB)_ — total completed bookings per month across the platform.

---

## North Star Breakdown

```
Monthly Active Bookings = (# Barbers × Avg Bookings/Barber)
```

This captures both sides of the marketplace: more barbers AND more bookings per barber.

---

## Leading Indicators (Predictive)

| Metric | Why It Leads | Target |
|--------|-------------|--------|
| New barber sign-ups | Supply drives demand | 5/week |
| Barbers with completed profiles | Quality supply | 80% of sign-ups |
| Daily active barbers | Barbers getting value | 70% of signed-up |
| App downloads | Demand being built | TBD |
| Booking search sessions | User intent | TBD |
| Stripe Connect completions | Barbers can get paid | 90% of approved |

## Lagging Indicators (Results)

| Metric | What It Measures | Initial Target |
|--------|-----------------|----------------|
| Monthly active bookings | Platform health | 100/month |
| Platform revenue (commission) | Business viability | 10% of booking value |
| Barber retention (90d) | Supply stickiness | >80% |
| Customer retention (repeat booking) | Demand stickiness | >30% |
| Average booking value | Revenue per transaction | TBD after launch |

---

## Current State (Pre-Launch)

| Metric | Value | Date |
|--------|-------|------|
| Barbers on platform | 0 (pre-launch) | 2026-06-02 |
| Bookings completed | 0 (pre-launch) | 2026-06-02 |
| Stripe Connect accounts | 0 (pre-launch) | 2026-06-02 |
| App is built | ✅ | 2026-06-02 |
| CI passing | ✅ | 2026-06-02 |
| Vault populated | 28 files | 2026-06-02 |

## Launch Targets (v1)

| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Barbers onboarded | 10 | 50 | 200 |
| Monthly bookings | 100 | 500 | 2,000 |
| Platform revenue | ~$200 | ~$1,000 | ~$4,000 |
| Barber retention (90d) | — | 80% | 85% |

## Review Cadence

- **Daily:** Check new sign-ups, bookings (via dashboard)
- **Weekly:** Review leading indicators, adjust onboarding
- **Monthly:** Full metrics review, update this file
