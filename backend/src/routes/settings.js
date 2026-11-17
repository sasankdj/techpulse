import { Router } from 'express';
import { z } from 'zod';
import { requireSupabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { getSafeTimezone } from '../services/scheduler/recurrence.js';

const router = Router();

const updateProfileSchema = z.object({
  display_name: z.string().trim().min(1).max(80).optional(),
  timezone: z.string().max(64).optional(),
  preferred_categories: z.array(z.string()).optional(),
  preferred_sources: z.array(z.string().uuid()).optional(),
});

const updateNotificationPrefsSchema = z.object({
  browser_enabled: z.boolean().optional(),
  telegram_enabled: z.boolean().optional(),
  hourly_news_enabled: z.boolean().optional(),
  daily_digest_enabled: z.boolean().optional(),
  digest_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Digest time must be in HH:MM 24-hour format')
    .optional(),
  importance_threshold: z.number().int().min(0).max(100).optional(),
  timezone: z.string().max(64).optional(),
});

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const [{ data: profile }, { data: notificationPreferences }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', req.user.id).maybeSingle(),
      supabase.from('notification_preferences').select('*').eq('user_id', req.user.id).maybeSingle(),
    ]);

    res.json({
      profile: profile || {
        id: req.user.id,
        email: req.user.email,
        display_name: req.user.email?.split('@')[0] || 'User',
        timezone: 'Asia/Kolkata',
        preferred_categories: [],
        preferred_sources: [],
      },
      notificationPreferences: notificationPreferences || {
        user_id: req.user.id,
        browser_enabled: false,
        telegram_enabled: false,
        hourly_news_enabled: true,
        daily_digest_enabled: true,
        digest_time: '08:00',
        importance_threshold: 60,
        timezone: 'Asia/Kolkata',
      },
    });
  } catch (err) {
    next(err);
  }
});

router.put('/profile', validateBody(updateProfileSchema), async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const updates = { ...req.body };
    if (updates.timezone) {
      updates.timezone = getSafeTimezone(updates.timezone);
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: req.user.id,
          email: req.user.email || '',
          ...updates,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (error) throw error;
    res.json({ profile: data });
  } catch (err) {
    next(err);
  }
});

router.put('/notifications', validateBody(updateNotificationPrefsSchema), async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const updates = { ...req.body };
    if (updates.timezone) {
      updates.timezone = getSafeTimezone(updates.timezone);
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: req.user.id,
          ...updates,
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (error) throw error;
    res.json({ notificationPreferences: data });
  } catch (err) {
    next(err);
  }
});

export default router;
