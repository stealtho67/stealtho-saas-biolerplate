# Supabase Auth — Drop-in for Base44

Connect your Base44 React export to Supabase Auth in 5 minutes.

---

## Files included

| File | What it does |
|------|-------------|
| `auth/AuthContext.jsx` | React context — sign up, sign in, sign out, auto-loads session + profile |
| `auth/ProtectedRoute.jsx` | Wraps pages that require login (redirects to /login) |
| `pages/LoginPage.jsx` | Sign-in form |
| `pages/SignUpPage.jsx` | Sign-up form (auto-creates profile in Supabase) |
| `pages/DashboardPage.jsx` | Post-login dashboard with profile display + sign out |
| `../../lib/supabaseClient.js` | Supabase client (already exists in src/lib/) |

---

## Step-by-step

### 1. Copy files into your Base44 export

From this repo's `src/integration/`, copy into your Base44 project's `src/`:

```
your-base44-project/src/
├── integration/              ← COPY THIS FOLDER
│   ├── auth/
│   │   ├── AuthContext.jsx
│   │   └── ProtectedRoute.jsx
│   └── pages/
│       ├── LoginPage.jsx
│       ├── SignUpPage.jsx
│       └── DashboardPage.jsx
├── lib/
│   └── supabaseClient.js     ← COPY THIS TOO
└── (your Base44 files)
```

### 2. Wire up the AuthProvider

Open your `App.jsx` (or `_app.jsx` / `main.jsx` depending on what Base44 generated) and wrap everything with `AuthProvider`:

```jsx
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './integration/auth/AuthContext';
import { ProtectedRoute } from './integration/auth/ProtectedRoute';
import { LoginPage } from './integration/pages/LoginPage';
import { SignUpPage } from './integration/pages/SignUpPage';
import { DashboardPage } from './integration/pages/DashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/" element={<YourHomePage />} />
          {/* your other routes */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### 3. Add the env files

Copy `.env` and `.env.example` from this repo into your Base44 project root.

### 4. Install the Supabase client

```bash
npm install @supabase/supabase-js
```

### 5. Done

Your Base44 app now has:
- Sign up → auto-creates user + profile in Supabase
- Sign in → loads profile from `public.profiles`
- Protected routes → redirect to /login if not authenticated
- Session persists across page refreshes

---

## Using auth in your components

```jsx
import { useAuth } from './integration/auth/AuthContext';

function MyComponent() {
  const { user, profile, signOut } = useAuth();

  if (!user) return <p>Please sign in</p>;
  return <p>Welcome, {profile?.full_name || user.email}</p>;
}
```
