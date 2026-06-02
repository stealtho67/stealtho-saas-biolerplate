-- 0001_init.sql
-- StealthO SaaS Boilerplate — initial schema
-- Run this in your Supabase SQL editor.

-- ── Profiles (extends auth.users) ──────────────────────────────────────────

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── Subscriptions (synced from Stripe) ─────────────────────────────────────

CREATE TYPE subscription_status AS ENUM (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused'
);

CREATE TABLE public.subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_id           TEXT UNIQUE NOT NULL,
  stripe_price_id     TEXT,
  stripe_customer_id  TEXT,
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status              subscription_status NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Processed Events (idempotency) ──────────────────────────────────────────

CREATE TABLE public.processed_events (
  id              BIGSERIAL PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own; admins can read all
CREATE POLICY profiles_select_own
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY profiles_select_admin
  ON public.profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Subscriptions: users can read their own; admins can read all
CREATE POLICY subscriptions_select_own
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY subscriptions_select_admin
  ON public.subscriptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Service role (Netlify functions via SUPABASE_SERVICE_ROLE_KEY) bypasses RLS.
-- No insert/update/delete policies are needed — the service role handles those.
