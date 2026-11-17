/**
 * Standalone Persistent Scheduler Worker for TechPulse.
 * Run separately from the web server on Render/Railway (`npm run worker`)
 * to keep RSS ingestion, daily digests, and reminder checks isolated and reliable.
 */
import { env, getCapabilities } from './config/env.js';
import { startScheduler, stopScheduler } from './services/scheduler/scheduler.js';
import { runIngestionCycle } from './services/news/rssIngestor.js';

console.log(`[TechPulse Worker] Starting persistent scheduler worker (TZ: ${env.tz})`);
console.log('[TechPulse Worker] Capabilities:', JSON.stringify(getCapabilities()));

const jobs = startScheduler();

// Optionally perform an initial ingestion check on startup if Supabase is configured
if (getCapabilities().supabaseConfigured && process.env.INGEST_ON_BOOT === 'true') {
  runIngestionCycle()
    .then((res) => console.log('[TechPulse Worker] Initial ingestion complete:', JSON.stringify(res)))
    .catch((err) => console.error('[TechPulse Worker] Initial ingestion error:', err?.message));
}

function shutdown(signal) {
  console.log(`[TechPulse Worker] Received ${signal}. Stopping ${jobs.length} cron jobs...`);
  stopScheduler();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
