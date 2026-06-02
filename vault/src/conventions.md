---
created: 2026-06-02
status: active
tags: [src, codebase, conventions, patterns]
---

# Codebase Conventions & Patterns

---

## File Structure Convention

```
src/
├── pages/         — Route-level components (one per route)
├── components/    — Reusable UI components
│   └── admin/     — Admin-specific components
│   └── barber/    — Barber-specific components
│   └── ui/        — shadcn/ui primitives
├── lib/           — Core libraries & utilities
├── hooks/         — Custom React hooks
├── api/           — API client configurations
└── utils/         — Pure utility functions
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Pages | PascalCase | `Home.jsx`, `BarberDashboard.jsx` |
| Components | PascalCase | `BarberCard.jsx`, `BookingModal.jsx` |
| Hooks | camelCase, `use` prefix | `useDarkMode.js`, `useMediaQuery.js` |
| Libraries | camelCase | `supabaseClient.js`, `stripeConfig.js` |
| Utilities | camelCase | `utils.js`, `commissionRules.js` |
| Config | kebab-case | `vite.config.js`, `tailwind.config.js` |

## Import Patterns

```jsx
// Absolute imports (configured in vite.config.js / jsconfig.json)
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/lib/AuthContext'

// Relative imports (siblings or close relations)
import { BarberCard } from './BarberCard'
```

## State Management

- **Server state:** TanStack Query (React Query) via `query-client.js`
- **Auth state:** React Context (`AuthContext.jsx`)
- **UI state:** Local `useState` / `useReducer`
- **Dark mode:** Local storage + context (`useDarkMode.js`)
- **No global state store** (Redux/Zustand) — not needed at current scale

## Error Handling Pattern

```jsx
// API calls
const { data, error } = await supabase.from('profiles').select('*')
if (error) {
  console.error('Failed to fetch profiles:', error)
  toast.error('Could not load profiles')
  return
}

// Form validation
if (!formData.name) {
  toast.error('Name is required')
  return
}
```

## Route Protection Pattern

```jsx
// ProtectedRoute wraps routes that need auth
<Route element={<ProtectedRoute />}>
  <Route path="dashboard" element={<BarberDashboard />} />
</Route>

// Inside ProtectedRoute:
if (!user) return <Navigate to="/login" />
if (requiredRole && user.role !== requiredRole) return <Navigate to="/" />
return <Outlet />
```
