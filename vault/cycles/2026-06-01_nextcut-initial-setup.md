---
created: 2026-06-01
status: complete
tags: [cycle, setup, infrastructure]
idea: "[[../ideas/nextcut|NextCut]]"
---

# Cycle: Initial Factory Setup

> **Idea:** NextCut — barber booking marketplace
> **Run by:** PRIME (initial system bootstrap)
> **Duration:** 1 session

---

## Stages

### ✅ Validate
- Model #3 validated: free for barbers, commission on new clients only, 100% tips
- Competitor gap confirmed (Booksy charges 20-30%)
- **Verdict: 8/10 — GO**

### ✅ Name + Brand
- Selected: **NextCut**
- Promise: "Your next cut is your best cut"
- Voice: Direct, masculine, barber-first

### ✅ Spec
- MVP scoped: search → book → pay/tip under 30 seconds
- Off-scope: reviews, portfolios, multi-location

### ✅ Build
- NextCut app merged into boilerplate repo: `stealtho67/stealtho-saas-biolerplate`
- Base44 entities: Barber, Barbershop, Booking, Review, Service, User
- Supabase migrations: profiles, subscriptions, processed_events
- Stripe connect + checkout functions ready
- Full admin panel + barber dashboard
- PR: `scaffold-stealtho-boilerplate` branch

### ✅ Monetize
- Pricing model defined: free for barbers, 10% commission on new
- Stripe price IDs set: Pro (`price_1TcOFb...`), Growth, Spotlight
- Checkout session function ready (staged)

### 🔄 Deploy
- Netlify config ready, functions written
- **Blocking:** Need Kendall's explicit "go live" + env vars paste

### 🔄 Grow
- Content engine: defined but not wired yet
- Daily crons: defined but not set up yet

### ✅ Measure + Compound
- Success metric: 10 barbers / 100 bookings per month
- Learnings folded into this vault

---

## Deliverables

| Artifact | Status |
|----------|--------|
| ✅ Verdict | GO — 8/10 |
| ✅ Brand | NextCut — "Your next cut is your best cut" |
| ✅ Build | [stealtho-saas-biolerplate](https://github.com/stealtho67/stealtho-saas-biolerplate) |
| ✅ Go-Live Checklist | Ready (waiting on Kendall) |
| 🔄 Content | Staged for next cycle |
| 🎯 Decision Needed | "Go live?" + env vars paste |

## Learnings

- Base44 export → Supabase wiring works clean
- Stash operations can lose uncommitted files — commit early, commit often
- Installed 8 OpenHands skills: code-review, security, frontend-design, code-simplifier, iterate, learn-from-code-review, qa-changes, release-notes
- Vault structure born: ideas, cycles, learnings, bets, metrics

## Next Steps

1. Get Kendall's go-live decision
2. Deploy to Netlify
3. Wire daily growth crons
4. Content engine: first Higgsfield assets
