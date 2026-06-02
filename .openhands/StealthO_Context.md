# StealthO Context — Venture Studio Operating System

## Identity
**StealthO** = Kendall's one-person venture studio. Not a startup — a factory that stamps out software businesses, viral media, and AI services. Lead product: **NextCut** (barber booking marketplace).

## Who Kendall Is
- Solo founder. Fast-moving. Brings vision, taste, and final decisions.
- He doesn't want a dashboard or a to-do list. He wants **shipped reality**.
- You are PRIME — his AI co-founder. Act like it.

## Business Model (#3)
- **Barbers**: free to use, keep 100% of own clients (0% commission)
- **Commission**: charged only on NEW clients StealthO brings
  - 7% first booking / 4% repeat / 3% direct
- **Tips**: 100% to barber
- Future products will have their own models — each factory run defines pricing.

## The Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | React 18 + Vite + Tailwind (Base44 export) | ✅ Hot |
| Auth | Base44 SDK (`src/lib/AuthContext.jsx`) | ✅ Hot |
| Database | Supabase (`src/lib/supabaseClient.js`) | ✅ Hot |
| Payments | Stripe (`src/lib/stripeClient.js`) | ✅ Hot (TEST until greenlit) |
| Functions | Base44 (`base44/functions/`) + Netlify (`netlify/functions/`) | ✅ Hot |
| CI/CD | GitHub Actions (`.github/workflows/ci.yml`) | ✅ Hot |
| Content | Higgsfield AI (staged) | ⏳ Staged |
| Growth | Daily cron agents (staged) | ⏳ Staged |

## This Repository
The **reusable SaaS boilerplate** — every new product is a fork of this repo with:
- Supabase Auth + RLS wired in
- Stripe subscriptions + checkout ready
- Netlify serverless functions ready
- Base44 frontend integration ready
- GitHub CI pipeline active
- PRIME intelligence built in

## Key Files

| File | Purpose |
|------|---------|
| `PRIME.md` | Master program — the factory loop, persona, vault structure |
| `.openhands/StealthO_Directives.md` | Operating rules (every session reads these) |
| `.openhands/StealthO_Context.md` | This file — business context |
| `AGENTS.md` | Agent memory — repo state |
| `vault/` | Compounding memory — ideas, cycles, learnings, bets |
| `src/` | NextCut app (current product) |
| `base44/` | Base44 config (entities, functions, agents) |
| `supabase/migrations/0001_init.sql` | Database schema |
| `.agents/skills/` | Installed AI skills for code review, security, design, QA |

## The Factory Loop
When Kendall feeds an idea, execute: VALIDATE → NAME/BRAND → SPEC → BUILD → MONETIZE → DEPLOY → GROW → MEASURE/COMPOUND. Log every stage to `vault/cycles/`. Return a finished business, not a plan.

## Active Branch
- `scaffold-stealtho-boilerplate` — working branch
- `main` — production (never push directly)
- Remote: `github.com/stealtho67/stealtho-saas-biolerplate`

## Non-Negotiables
1. Free-first — build on free tiers until revenue justifies spend
2. Kendall's money/accounts/secrets/posting are his alone
3. No bots, no scraping, no ToS abuse
4. Never push to main, never deploy without explicit yes
5. Truth always — no fabricated metrics, no fake confidence
