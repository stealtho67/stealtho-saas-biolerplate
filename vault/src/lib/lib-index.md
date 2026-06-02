---
created: 2026-06-02
status: active
tags: [src, lib, utilities]
---

# Library Directory — `src/lib/`

## Core Files

| File | Purpose |
|------|---------|
| `AuthContext.jsx` | Global auth state via Base44 SDK — provides `user`, `session`, `signIn`, `signOut` |
| `supabaseClient.js` | Supabase client singleton — reads `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` from env |
| `stripeClient.js` | Stripe frontend client — loads Stripe.js with publishable key |
| `stripeConfig.js` | Stripe configuration (price IDs, product IDs, test mode flag) |
| `utils.js` | General utility functions (formatting, validation, helpers) |
| `query-client.js` | TanStack Query client configuration |
| `app-params.js` | Application-wide parameters and constants |
| `commissionRules.js` | Commission calculation rules (7% new, 4% repeat, 3% direct) |
| `platformSettings.js` | Platform-wide settings (feature flags, defaults) |
| `PageNotFound.jsx` | 404 page component |

## Key Patterns

### AuthContext Pattern
```jsx
const { user, session, loading, signIn, signOut } = useAuth()
```
- Wraps entire app in `AuthProvider`
- Persists session via localStorage
- Auto-refreshes token on expiry
- Provides `user` object with `user_metadata` for role checking

### SupabaseClient Pattern
```jsx
import { supabase } from '../lib/supabaseClient'
const { data, error } = await supabase.from('profiles').select('*')
```
- Single shared instance
- Row Level Security enforced server-side
- Real-time subscriptions available

### StripeClient Pattern
```jsx
import { getStripe } from '../lib/stripeClient'
const stripe = await getStripe()
const { error } = await stripe.redirectToCheckout({ sessionId })
```
- Lazy-loads Stripe.js
- Returns singleton promise (prevents multiple loads)
