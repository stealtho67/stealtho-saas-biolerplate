---
created: 2026-06-02
status: active
tags: [operations, dev, build, deploy, cicd]
---

# Operations Guide

---

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Dev server with Base44 proxy
VITE_BASE44_APP_BASE_URL=http://localhost:8888 npm run dev

# Run linter
npm run lint

# Type check
npm run typecheck
```

## Build

```bash
# Production build
npm run build

# Output: dist/
# Serves: index.html + bundled JS/CSS in assets/
```

## CI/CD Pipeline (`.github/workflows/ci.yml`)

```yaml
Jobs:
  quality:    npm run lint + npm run typecheck
  test:       npm test
  build:      npm run build (with placeholder env vars)
```

Runs on: push to `main` / `scaffold-*` and all PRs to `main`.

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `VITE_BASE44_APP_BASE_URL` | No | Base44 proxy URL (dev only) |
| `VITE_APP_URL` | No | Public app URL (for Stripe redirect) |
| `STRIPE_SECRET_KEY` | No* | Stripe secret key (server-only) |
| `STRIPE_WEBHOOK_SECRET` | No* | Stripe webhook signing secret |
| `SUPABASE_SERVICE_KEY` | No* | Supabase service role key (server-only) |

*\*Required only for Netlify functions*

## Netlify Deployment

1. Configure env vars in Netlify dashboard
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Functions directory: `netlify/functions`
5. Deploy: `git push` or Netlify CI auto-deploy from `main`

## Branch Strategy

| Branch | Purpose | Deploy |
|--------|---------|--------|
| `main` | Production | ✅ Netlify auto-deploy |
| `scaffold-*` | Active development | ❌ No deploy |
| `feature/*` | Feature branches | ❌ No deploy |

## Adding a New Page

1. Create file in `src/pages/`
2. Add route in `src/App.jsx`
3. Add link in navigation if needed
4. Add to [[../../src/pages/pages-index|pages index]]
5. Update [[../../_dashboard|dashboard]] if it's a major feature

## Adding a New Environment Variable

1. Add to `.env.example` with safe dummy
2. Add to Netlify dashboard (if needed)
3. Add to CI workflow (if needed for build)
4. Document in this file

## Client Website Delivery (StealthO Local Presence)

After a lead says yes, build their entire website in 30 seconds — **free** (Qwen3-Coder on OpenRouter):

```bash
cd /workspace/project/stealtho-saas-biolerplate
python3 gemini-tool.py build-site \
  --business "Their Business Name" \
  --niche "plumber" \
  --city "Austin" \
  --output sites/their-business-name
```

**What you get:** 5-page site (Home, Services, About, Contact, Testimonials) + `pricing.json`
- Single HTML file with embedded CSS/JS — no build step needed
- Mobile-responsive, SEO meta tags, contact form, StealthO footer
- ~39KB, production-ready

**Deploy (5 min):**
1. `cd sites/their-business-name`
2. Drag `index.html` to [Netlify Drop](https://app.netlify.com/drop)
3. Connect their domain
4. Update their Google Business Profile with the new site link

**Cost:** $0. Qwen3-Coder is free on OpenRouter with 1M token context.

