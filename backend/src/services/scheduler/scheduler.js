import cron from 'node-cron';
import { env, getCapabilities } from '../../config/env.js';
import {
  runHourlyNewsJob,
  runDailyDigestCheckJob,
  runDueRemindersJob,
  runTaskDeadlineAlertsJob,
} from './jobs.js';

const activeLocks = new Set();
const scheduledTasks = [];

async function runWithLock(name, fn) {
  if (activeLocks.has(name)) {
    return;
  }
  activeLocks.add(name);
  try {
    const result = await fn();
    if (!result?.skipped) {
      console.log(`[Scheduler:${name}]`, JSON.stringify(result));
    }
  } catch (err) {
    console.error(`[Scheduler:${name}] Failed:`, err?.message || err);
  } finally {
    activeLocks.delete(name);
  }
}

export function startScheduler() {
  const { supabaseConfigured } = getCapabilities();
  if (!env.enableScheduler) {
    console.log('[Scheduler] Disabled via ENABLE_SCHEDULER=false');
    return [];
  }

  if (!supabaseConfigured) {
    console.log('[Scheduler] Waiting for Supabase credentials (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) — background jobs will remain idle until configured.');
    return [];
  }

  const options = { timezone: env.tz || 'Asia/Kolkata' };

  // Every minute: check due reminders
  scheduledTasks.push(
    cron.schedule('* * * * *', () => runWithLock('reminders', runDueRemindersJob), options)
  );

  // Every 5 minutes: check daily digest window (per-user timezone & time) + task deadlines
  scheduledTasks.push(
    cron.schedule(
      '*/5 * * * *',
      async () => {
        await runWithLock('daily_digest', runDailyDigestCheckJob);
        await runWithLock('task_deadlines', runTaskDeadlineAlertsJob);
      },
      options
    )
  );

  // Top of every hour: ingest RSS feeds & send hourly important news alerts
  scheduledTasks.push(
    cron.schedule('0 * * * *', () => runWithLock('hourly_news', runHourlyNewsJob), options)
  );

  console.log(`[Scheduler] Started persistent cron jobs (timezone: ${options.timezone})`);
  return scheduledTasks;
}

export function stopScheduler() {
  for (const task of scheduledTasks) {
    task.stop();
  }
  scheduledTasks.length = 0;
}
