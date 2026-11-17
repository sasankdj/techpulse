import { Router } from 'express';
import { z } from 'zod';
import { requireSupabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { getSafeTimezone } from '../services/scheduler/recurrence.js';
import { parseNaturalLanguageReminder } from '../services/reminders/nlParser.js';

const router = Router();

const createReminderSchema = z.object({
  title: z.string().trim().min(1, 'Reminder title is required').max(200),
  description: z.string().max(1000).nullable().optional(),
  remind_at: z.string().datetime({ offset: true }),
  timezone: z.string().max(64).default('Asia/Kolkata'),
  recurrence_rule: z.string().max(64).default('once'),
  notification_channel: z.enum(['both', 'browser', 'telegram']).default('both'),
  is_active: z.boolean().default(true),
});

const updateReminderSchema = createReminderSchema.partial().extend({
  is_completed: z.boolean().optional(),
  snoozed_until: z.string().datetime({ offset: true }).nullable().optional(),
});

const snoozeSchema = z.object({
  minutes: z.number().int().min(5).max(10080).default(15),
});

const nlParseSchema = z.object({
  text: z.string().trim().min(2).max(300),
  timezone: z.string().max(64).optional(),
});

router.use(requireAuth);

router.post('/parse', validateBody(nlParseSchema), (req, res) => {
  const parsed = parseNaturalLanguageReminder(req.body.text, {
    timezone: getSafeTimezone(req.body.timezone),
  });
  res.json({ parsed });
});

router.get('/', async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const { status } = req.query;

    let query = supabase
      .from('reminders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('remind_at', { ascending: true });

    if (status === 'active') {
      query = query.eq('is_active', true).eq('is_completed', false);
    } else if (status === 'completed') {
      query = query.eq('is_completed', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ reminders: data || [] });
  } catch (err) {
    next(err);
  }
});

router.post('/', validateBody(createReminderSchema), async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const payload = {
      ...req.body,
      timezone: getSafeTimezone(req.body.timezone),
      user_id: req.user.id,
    };

    const { data, error } = await supabase.from('reminders').insert(payload).select('*').single();
    if (error) throw error;
    res.status(201).json({ reminder: data });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validateBody(updateReminderSchema), async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const updates = { ...req.body };
    if (updates.timezone) {
      updates.timezone = getSafeTimezone(updates.timezone);
    }
    if (updates.is_completed === true) {
      updates.is_active = false;
      updates.snoozed_until = null;
    }

    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Reminder not found', code: 'NOT_FOUND' });
    }
    res.json({ reminder: data });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/snooze', validateBody(snoozeSchema), async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const snoozedUntil = new Date(Date.now() + req.body.minutes * 60000).toISOString();

    const { data, error } = await supabase
      .from('reminders')
      .update({
        snoozed_until: snoozedUntil,
        is_active: true,
        is_completed: false,
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Reminder not found', code: 'NOT_FOUND' });
    }
    res.json({ reminder: data });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id');

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Reminder not found', code: 'NOT_FOUND' });
    }
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default router;
