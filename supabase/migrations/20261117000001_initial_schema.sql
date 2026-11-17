-- TechPulse Initial Database Schema
-- Migration: 20261117000001_initial_schema.sql
-- PostgreSQL / Supabase

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  preferred_categories TEXT[] NOT NULL DEFAULT '{}',
  preferred_sources UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. SOURCES (Shared public tech news RSS/Atom feeds)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  feed_url TEXT NOT NULL UNIQUE,
  website_url TEXT NOT NULL,
  favicon_url TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  reliability_score SMALLINT NOT NULL DEFAULT 75 CHECK (reliability_score BETWEEN 0 AND 100),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_fetched_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sources_enabled ON public.sources (enabled);

-- ============================================================
-- 3. CATEGORIES (28 core tech categories)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  group_name TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);

-- ============================================================
-- 4. ARTICLES (Shared ingested tech articles)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL UNIQUE,
  description TEXT,
  content_excerpt TEXT,
  summary_source TEXT NOT NULL DEFAULT 'rss_excerpt', -- 'rss_excerpt' | 'extractive' | 'ollama'
  image_url TEXT,
  source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  importance_score NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (importance_score BETWEEN 0 AND 100),
  importance_label TEXT NOT NULL DEFAULT 'General' CHECK (importance_label IN ('Breaking', 'Important', 'Trending', 'General')),
  cluster_id TEXT,
  corroboration_count SMALLINT NOT NULL DEFAULT 1,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_importance_score ON public.articles (importance_score DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_importance_label ON public.articles (importance_label);
CREATE INDEX IF NOT EXISTS idx_articles_source_id ON public.articles (source_id);
CREATE INDEX IF NOT EXISTS idx_articles_cluster_id ON public.articles (cluster_id) WHERE cluster_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_fetched_at ON public.articles (fetched_at DESC);

-- ============================================================
-- 5. ARTICLE_CATEGORIES (Many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.article_categories (
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_article_categories_category_id ON public.article_categories (category_id);

-- ============================================================
-- 6. USER_ARTICLES (Per-user read/bookmark state - never overwritten by ingestion)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_articles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  bookmarked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_user_articles_user_bookmarked ON public.user_articles (user_id, is_bookmarked) WHERE is_bookmarked = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_articles_user_read ON public.user_articles (user_id, is_read);

-- ============================================================
-- 7. TASKS (Per-user personal tasks)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'overdue')),
  category TEXT NOT NULL DEFAULT 'General',
  subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  recurrence_rule TEXT, -- NULL | 'daily' | 'weekly' | 'monthly' | 'custom:N:days'
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deadline_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks (user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_at ON public.tasks (user_id, due_at);

-- ============================================================
-- 8. REMINDERS (Per-user one-time & recurring reminders)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  remind_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  recurrence_rule TEXT NOT NULL DEFAULT 'once', -- 'once' | 'daily' | 'weekly' | 'monthly' | 'custom:N:days' | 'custom:weekdays:0,3,5'
  notification_channel TEXT NOT NULL DEFAULT 'both' CHECK (notification_channel IN ('both', 'browser', 'telegram')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  snoozed_until TIMESTAMPTZ,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user_active ON public.reminders (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_reminders_due_lookup ON public.reminders (is_active, is_completed, remind_at) WHERE is_active = TRUE AND is_completed = FALSE;

-- ============================================================
-- 9. NOTIFICATION_PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  browser_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  telegram_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  hourly_news_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  daily_digest_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  digest_time TEXT NOT NULL DEFAULT '08:00', -- HH:MM in user's timezone
  importance_threshold SMALLINT NOT NULL DEFAULT 60 CHECK (importance_threshold BETWEEN 0 AND 100),
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 10. USER_TELEGRAM_CONFIGS (Server-encrypted Telegram credentials)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_telegram_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_bot_token TEXT, -- AES-256-GCM encrypted; NULL means use server default TELEGRAM_BOT_TOKEN if configured
  chat_id TEXT NOT NULL,
  bot_username TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 11. PUSH_SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  subscription JSONB NOT NULL,
  user_agent TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions (user_id);

-- ============================================================
-- 12. NOTIFICATION_LOGS (Deduplication, retries & audit history)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (
    notification_type IN ('daily_digest', 'hourly_news', 'reminder', 'task_deadline', 'test')
  ),
  reference_id TEXT,
  dedupe_key TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('browser', 'telegram')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
  attempt_count SMALLINT NOT NULL DEFAULT 1,
  payload JSONB,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_sent ON public.notification_logs (user_id, sent_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_logs_dedupe_sent
  ON public.notification_logs (user_id, channel, dedupe_key)
  WHERE dedupe_key IS NOT NULL AND status = 'sent';

-- ============================================================
-- 13. SCHEDULER_RUNS (Persistent job tracking across restarts)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scheduler_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  bucket_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  details JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  UNIQUE (job_name, bucket_key)
);

-- ============================================================
-- TRIGGERS: Auto-update updated_at & auto-create profile/preferences
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_articles_updated_at ON public.user_articles;
CREATE TRIGGER trg_user_articles_updated_at BEFORE UPDATE ON public.user_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_reminders_updated_at ON public.reminders;
CREATE TRIGGER trg_reminders_updated_at BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER trg_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_telegram_configs_updated_at ON public.user_telegram_configs;
CREATE TRIGGER trg_user_telegram_configs_updated_at BEFORE UPDATE ON public.user_telegram_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, 'user'), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'Asia/Kolkata')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.notification_preferences (user_id, timezone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'timezone', 'Asia/Kolkata'))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
