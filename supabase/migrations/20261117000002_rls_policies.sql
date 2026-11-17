-- TechPulse Row Level Security (RLS) Policies
-- Migration: 20261117000002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_telegram_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduler_runs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PUBLIC SHARED NEWS TABLES (Read-only for authenticated & anon; writes via service_role)
-- ============================================================
DROP POLICY IF EXISTS "Public read sources" ON public.sources;
CREATE POLICY "Public read sources"
  ON public.sources FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories"
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read articles" ON public.articles;
CREATE POLICY "Public read articles"
  ON public.articles FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read article_categories" ON public.article_categories;
CREATE POLICY "Public read article_categories"
  ON public.article_categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================
-- PROFILES (Private per user)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- USER_ARTICLES (Private per user)
-- ============================================================
DROP POLICY IF EXISTS "Users manage own article states" ON public.user_articles;
CREATE POLICY "Users manage own article states"
  ON public.user_articles FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TASKS (Private per user)
-- ============================================================
DROP POLICY IF EXISTS "Users manage own tasks" ON public.tasks;
CREATE POLICY "Users manage own tasks"
  ON public.tasks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- REMINDERS (Private per user)
-- ============================================================
DROP POLICY IF EXISTS "Users manage own reminders" ON public.reminders;
CREATE POLICY "Users manage own reminders"
  ON public.reminders FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATION_PREFERENCES (Private per user)
-- ============================================================
DROP POLICY IF EXISTS "Users manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users manage own notification preferences"
  ON public.notification_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PUSH_SUBSCRIPTIONS (Private per user)
-- ============================================================
DROP POLICY IF EXISTS "Users manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATION_LOGS (Users can only read their own logs; backend inserts via service_role)
-- ============================================================
DROP POLICY IF EXISTS "Users view own notification logs" ON public.notification_logs;
CREATE POLICY "Users view own notification logs"
  ON public.notification_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- USER_TELEGRAM_CONFIGS (No direct client access — backend service_role handles encryption/decryption)
-- ============================================================
-- Intentionally no anon/authenticated policies so encrypted bot tokens are never directly readable from the browser.

-- ============================================================
-- SCHEDULER_RUNS (Backend service_role only)
-- ============================================================
-- Intentionally no anon/authenticated policies.
