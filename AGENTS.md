# NextCut — Agent Memory

## Project
Barber booking marketplace (Model #3: free for barbers, 10% commission, 100% tips).
Built on Base44 + Supabase + Stripe.

## Stack
- Frontend: React 18 + Vite + Tailwind CSS (Base44 export)
- Auth: Base44 SDK (src/lib/AuthContext.jsx)
- Database: Supabase (src/lib/supabaseClient.js)
- Payments: Stripe (src/lib/stripeClient.js)
- Functions: Base44 functions (base44/functions/) + Netlify (staged)
- CI: GitHub Actions (.github/workflows/ci.yml)

## Key files
- src/App.jsx — Routes
- src/lib/AuthContext.jsx — Auth via Base44
- src/lib/supabaseClient.js — Supabase client
- src/lib/stripeClient.js — Stripe helpers
- supabase/migrations/0001_init.sql — DB schema
- netlify/functions/ — Serverless functions (staged)
- .openhands/StealthO_Directives.md — Engineering rules
- .openhands/StealthO_Context.md — Business model

## Repo
- Remote: github.com/stealtho67/stealtho-saas-biolerplate
- Primary branch: main
- Active branch: scaffold-stealtho-boilerplate
- Base44 linked to this repo for auto-sync

## Installed skills (.agents/skills/)
- code-review — Rigorous code review process
- security — Secure coding practices
- frontend-design — Production-grade UI design
- code-simplifier — Code cleanup and refinement
- iterate — CI/code review loop management
- learn-from-code-review — Extract lessons from PR feedback
- qa-changes — Functional testing of changes
- release-notes — Changelog generation
