import { Router } from 'express';
import { z } from 'zod';
import { env, getCapabilities } from '../config/env.js';
import { requireSupabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { dispatchNotification } from '../services/notifications/notificationDispatcher.js';

const router = Router();

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    expirationTime: z.number().nullable().optional(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  userAgent: z.string().max(400).optional(),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

router.get('/vapid-public-key', (_req, res) => {
  const { webPushConfigured } = getCapabilities();
  if (!webPushConfigured) {
    return res.status(503).json({
      configured: false,
      code: 'VAPID_NOT_CONFIGURED',
      message: 'Web Push VAPID keys are not configured on the backend. Run `npm run generate:vapid` in backend/ and add VAPID_PUBLIC_KEY & VAPID_PRIVATE_KEY to backend/.env.',
    });
  }
  res.json({ configured: true, publicKey: env.vapidPublicKey });
});

router.use(requireAuth);

router.get('/status', async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const capabilities = getCapabilities();

    const [{ data: prefs }, { count: subCount }, { data: telegram }, { data: recentLogs }] =
      await Promise.all([
        supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', req.user.id)
          .maybeSingle(),
        supabase
          .from('push_subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', req.user.id),
        supabase
          .from('user_telegram_configs')
          .select('chat_id, bot_username, is_verified, updated_at')
          .eq('user_id', req.user.id)
          .maybeSingle(),
        supabase
          .from('notification_logs')
          .select('*')
          .eq('user_id', req.user.id)
          .order('sent_at', { ascending: false })
          .limit(20),
      ]);

    res.json({
      capabilities,
      preferences: prefs || null,
      browserSubscriptionCount: subCount || 0,
      telegram: telegram
        ? {
            connected: Boolean(telegram.chat_id),
            chatId: telegram.chat_id,
            botUsername: telegram.bot_username,
            isVerified: telegram.is_verified,
            updatedAt: telegram.updated_at,
          }
        : { connected: false },
      recentLogs: recentLogs || [],
    });
  } catch (err) {
    next(err);
  }
});

router.get('/logs', async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const { data, error } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json({ logs: data || [] });
  } catch (err) {
    next(err);
  }
});

router.post('/subscribe', validateBody(subscribeSchema), async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const { subscription, userAgent } = req.body;

    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: req.user.id,
          endpoint: subscription.endpoint,
          subscription,
          user_agent: userAgent || req.headers['user-agent'] || null,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,endpoint' }
      )
      .select('id, endpoint, created_at')
      .single();

    if (error) throw error;

    await supabase
      .from('notification_preferences')
      .upsert({ user_id: req.user.id, browser_enabled: true }, { onConflict: 'user_id' });

    res.status(201).json({ subscribed: true, subscription: data });
  } catch (err) {
    next(err);
  }
});

router.post('/unsubscribe', validateBody(unsubscribeSchema), async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', req.user.id)
      .eq('endpoint', req.body.endpoint);

    const { count } = await supabase
      .from('push_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    if (!count) {
      await supabase
        .from('notification_preferences')
        .update({ browser_enabled: false })
        .eq('user_id', req.user.id);
    }

    res.json({ unsubscribed: true, remainingSubscriptions: count || 0 });
  } catch (err) {
    next(err);
  }
});

router.post('/test', async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const results = await dispatchNotification({
      userId: req.user.id,
      notificationType: 'test',
      channels: ['browser'],
      browserPayload: {
        title: 'TechPulse Browser Push Test',
        body: 'Web Push is working! Clicking this notification opens your TechPulse dashboard.',
        url: '/notifications',
        type: 'test',
        tag: `techpulse-test-${Date.now()}`,
      },
      supabase,
      maxRetries: 1,
    });

    const browserResult = results.browser;
    if (!browserResult?.ok) {
      return res.status(400).json({
        delivered: false,
        code: browserResult?.code || 'PUSH_FAILED',
        error: browserResult?.error || 'Failed to deliver browser push notification.',
      });
    }

    res.json({
      delivered: true,
      sentCount: browserResult.sentCount,
      removedCount: browserResult.removedCount,
      message: `Test push notification sent to ${browserResult.sentCount} device(s).`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
