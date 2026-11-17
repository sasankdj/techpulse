# TechPulse — Personal Tech Intelligence, News Aggregator & Productivity Platform

TechPulse is a full-stack web application that aggregates technology news from 25+ verified official RSS/Atom feeds, ranks stories using a free rule-based intelligence engine with duplicate-event clustering, delivers scheduled **Browser Web Push** and **Telegram** notifications (daily 8:00 AM IST digest + hourly updates), and includes a complete personal **Task Manager** and **Reminder Scheduler**.

No paid news APIs and no OpenAI API key are required.

---

## Architecture Overview

```text
techpulse/
├── frontend/          # React + Vite + TypeScript + Tailwind CSS + TanStack Query + PWA Service Worker
├── backend/           # Node.js + Express REST API + RSS/Atom Ingestor + Web Push + Telegram + Scheduler
├── supabase/          # PostgreSQL SQL migrations, RLS policies, 28 categories & 25 official RSS seeds
├── render.yaml        # Render Blueprint (API Web Service + Persistent Scheduler Worker)
├── vercel.json        # Vercel frontend SPA + Service Worker headers
└── netlify.toml       # Netlify frontend SPA + Service Worker headers
```

### Core Capabilities
- **Real-Time RSS/Atom Aggregator**: 25 official sources (Hacker News, TechCrunch, The Verge, Ars Technica, MIT Tech Review, Google AI Blog, OpenAI News, Anthropic News, Microsoft DevBlogs, GitHub Blog, Cloudflare Blog, Mozilla Blog, AWS News, NVIDIA Blog, Android Developers, Apple Newsroom, WIRED, VentureBeat, Hugging Face, LWN.net, Phoronix, The Hacker News, Space.com, PC Gamer, arXiv CS.AI).
- **28 Tech Categories & Rule-Based Intelligence**: Multi-label categorization, canonical URL deduplication, event clustering across independent sources, and evidence-backed scoring (`Breaking`, `Trending`, `Important`, `General`). Modular AI-ready summarizer interface (defaults to free extractive RSS excerpts; optional local Ollama adapter via `OLLAMA_BASE_URL`).
- **Dual Notification Delivery**:
  - **Browser Web Push**: Service Worker (`/sw.js`), Push API, VAPID keys, expired subscription (`404`/`410`) auto-cleanup, click routing to articles/tasks/reminders, PWA manifest for iOS home-screen Web Push.
  - **Telegram Bot API**: User bot token encrypted server-side with AES-256-GCM (never exposed in frontend), HTML-formatted daily digests, hourly alerts, reminder & task deadline alerts.
- **Persistent Timezone-Aware Scheduling**: Default `Asia/Kolkata` (IST). Daily 8:00 AM digest, hourly RSS ingestion & alerts, due reminders, and task deadlines with database-backed deduplication in `notification_logs`.
- **Interactive Preview Mode**: Runs immediately on the frontend with realistic sample data if Supabase credentials are not yet configured, with a built-in `/setup` diagnostics page.

---

## 1. Local Installation

**Prerequisites**: Node.js 20+ and npm 10+.

```bash
# From the techpulse/ directory
npm run install:all
```

---

## 2. Supabase Setup & Migrations

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in your Supabase Dashboard (or use the Supabase CLI `supabase db push`) and execute the three migrations in order:
   1. `supabase/migrations/20261117000001_initial_schema.sql`
   2. `supabase/migrations/20261117000002_rls_policies.sql`
   3. `supabase/migrations/20261117000003_seed_categories_and_sources.sql`
3. In **Project Settings → API**, copy:
   - `Project URL`
   - `anon public` key (safe for frontend)
   - `service_role` secret key (**backend ONLY — never put in frontend**)
4. In **Authentication → Providers**, ensure **Email** provider is enabled.

---

## 3. Environment Configuration

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and fill in values:

```bash
# Generate VAPID keys for Browser Web Push
npm --prefix backend run generate:vapid

# Generate a 32-byte encryption key for encrypting user Telegram bot tokens
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Fill `backend/.env`:
```env
PORT=5000
NODE_ENV=development
TZ=Asia/Kolkata
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

CREDENTIALS_ENCRYPTION_KEY=your_64_hex_char_key
TELEGRAM_BOT_TOKEN=

VAPID_PUBLIC_KEY=your_generated_public_key
VAPID_PRIVATE_KEY=your_generated_private_key
VAPID_SUBJECT=mailto:you@example.com

ENABLE_SCHEDULER=true
CRON_SECRET=optional_secret_for_external_cron
```

### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
VITE_API_BASE_URL=http://localhost:5000
```

> **Note**: If you leave `frontend/.env` blank, TechPulse launches in **Interactive Preview Mode** so you can explore the entire dashboard immediately while you prepare your Supabase project.

---

## 4. Running Locally

Start both backend and frontend in separate terminals:

```bash
# Terminal 1 — Backend API + Scheduler
npm run dev:backend

# Terminal 2 — Frontend Vite App
npm run dev:frontend
```

Trigger an immediate RSS ingestion cycle once Supabase is connected:

```bash
npm --prefix backend run ingest
```

Run the standalone persistent scheduler worker (optional):

```bash
npm run worker
```

---

## 5. Notification Setup Guide

### Browser Web Push
1. Ensure `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are set in `backend/.env`.
2. Open **Notifications** in TechPulse and click **Enable Browser Push**.
3. **Important Browser Limitations**:
   - **HTTPS** is required in production (`localhost` works locally).
   - User browser permission must be granted.
   - **iOS Safari** requires iOS 16.4+ and adding TechPulse to your Home Screen (**Share → Add to Home Screen**).
   - Delivery depends on browser and OS Focus/Do Not Disturb settings.

### Telegram Bot Setup
1. Open Telegram and message `@BotFather`.
2. Send `/newbot`, choose a name & username, and copy the **Bot Token**.
3. Open your new bot in Telegram and tap **Start** (`/start`).
4. Message `@userinfobot` (or check `https://api.telegram.org/bot<TOKEN>/getUpdates`) to get your numeric **Chat ID**.
5. In TechPulse → **Notifications**, paste your Bot Token & Chat ID, click **Save & Verify Bot**, then click **Send Test Message**.

---

## 6. Running Tests

```bash
npm test
```

Tests cover:
- RSS & Atom XML parsing, Cheerio HTML sanitization, multi-category classification
- URL canonical normalization & cross-source duplicate-event clustering
- Rule-based importance scoring & conservative Breaking/Trending labeling
- `Asia/Kolkata` timezone scheduling, daily digest windows & reminder recurrence
- Notification delivery deduplication, Telegram HTML escaping & honest failure logging
- Express REST API routes, Supabase JWT enforcement & Zod request validation
- Frontend utilities & navigation completeness

---

## 7. Production Deployment

### Frontend (Vercel or Netlify)
- **Vercel**: Import repository; `vercel.json` is preconfigured for Vite build, SPA routing, and `/sw.js` headers. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_BASE_URL`.
- **Netlify**: Import repository; `netlify.toml` is preconfigured automatically.

### Backend & Persistent Scheduler (Render or Railway)
- **Render**: Connect your repository and deploy using `render.yaml`. It provisions:
  1. `techpulse-api` (Express REST API web service)
  2. `techpulse-scheduler-worker` (persistent Node.js worker running `npm run worker` so hourly RSS ingestion, daily 8:00 AM IST digests, and due reminders survive restarts reliably).
- **Alternative (External / Supabase Cron)**: Set `CRON_SECRET` and invoke `POST /api/cron/run` with header `X-Cron-Secret: <CRON_SECRET>` and JSON body `{"job": "all"}`.
