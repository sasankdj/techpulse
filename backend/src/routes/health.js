import { Router } from 'express';
import { getCapabilities, env } from '../config/env.js';
import { getSupabaseAdmin } from '../config/supabase.js';

const router = Router();

router.get('/', async (_req, res) => {
  const capabilities = getCapabilities();
  let databaseStatus = capabilities.supabaseConfigured ? 'connected' : 'unconfigured';
  let databaseError = null;

  if (capabilities.supabaseConfigured) {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from('categories').select('id').limit(1);
      if (error) {
        databaseStatus = 'error';
        databaseError = error.message;
      }
    } catch (err) {
      databaseStatus = 'error';
      databaseError = err?.message || 'Database check failed';
    }
  }

  res.json({
    status: 'ok',
    service: 'techpulse-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    timezone: env.tz,
    database: {
      status: databaseStatus,
      ...(databaseError ? { error: databaseError } : {}),
    },
    capabilities,
  });
});

export default router;
