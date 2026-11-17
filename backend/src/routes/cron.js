import { Router } from 'express';
import { env } from '../config/env.js';
import {
  runHourlyNewsJob,
  runDailyDigestCheckJob,
  runDueRemindersJob,
  runTaskDeadlineAlertsJob,
} from '../services/scheduler/jobs.js';

const router = Router();

/**
 * Protected webhook endpoint so Supabase pg_cron, Render Cron Jobs, or GitHub Actions
 * can trigger jobs reliably in serverless / multi-instance deployments.
 */
router.post('/run', async (req, res, next) => {
  try {
    if (!env.cronSecret) {
      return res.status(503).json({
        error: 'CRON_SECRET is not configured in backend/.env',
        code: 'CRON_SECRET_NOT_CONFIGURED',
      });
    }

    const provided = req.headers['x-cron-secret'] || req.body?.secret;
    if (provided !== env.cronSecret) {
      return res.status(401).json({ error: 'Invalid cron secret', code: 'UNAUTHORIZED' });
    }

    const job = req.body?.job || req.query.job || 'all';
    const results = {};

    if (job === 'hourly_news' || job === 'all') {
      results.hourlyNews = await runHourlyNewsJob();
    }
    if (job === 'daily_digest' || job === 'all') {
      results.dailyDigest = await runDailyDigestCheckJob();
    }
    if (job === 'reminders' || job === 'all') {
      results.reminders = await runDueRemindersJob();
    }
    if (job === 'task_deadlines' || job === 'all') {
      results.taskDeadlines = await runTaskDeadlineAlertsJob();
    }

    res.json({ ok: true, job, results });
  } catch (err) {
    next(err);
  }
});

export default router;
