# StealthO Context

## Overview
StealthO = solo software venture studio. Lead product: **NextCut** (barber booking marketplace).

## Business Model (#3)
- **Barbers**: free to use, keep 100% of own clients (0% commission)
- **Commission**: charged only on NEW clients StealthO brings
  - 7% first booking / 4% repeat / 3% direct
- **Tips**: 100% to barber

## This Repository
The reusable SaaS factory:
- **Base44 frontend export** → wired to
- **Supabase** (Auth / Postgres / RLS) +
- **Stripe** (subscriptions, test mode in dev) +
- **Netlify** (serverless functions)

## Stack
- React / Vite
- Supabase (Auth, PostgreSQL, Row Level Security)
- Stripe (TEST keys in development)
- Netlify (serverless functions + hosting)
- Docker (local dev / CI)
- GitHub (version control + PRs)
