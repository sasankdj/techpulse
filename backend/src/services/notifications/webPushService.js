import webpush from 'web-push';
import { env, getCapabilities } from '../../config/env.js';
import { getSupabaseAdmin } from '../../config/supabase.js';

let vapidInitialized = false;

export function ensureVapidConfigured() {
  const { webPushConfigured } = getCapabilities();
  if (!webPushConfigured) {
    return false;
  }
  if (!vapidInitialized) {
    webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
    vapidInitialized = true;
  }
  return true;
}

/**
 * Sends a Web Push notification to all active subscriptions of a user.
 * Automatically removes expired/revoked subscriptions (404 / 410).
 */
export async function sendBrowserPushToUser(userId, payload, { pushLib = webpush, supabase = getSupabaseAdmin() } = {}) {
  if (!ensureVapidConfigured()) {
    return {
      ok: false,
      code: 'VAPID_NOT_CONFIGURED',
      error: 'Web Push VAPID keys are not configured on the backend. Run `npm run generate:vapid` in backend/ and add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to backend/.env.',
      sentCount: 0,
      removedCount: 0,
    };
  }

  if (!supabase) {
    return {
      ok: false,
      code: 'SUPABASE_NOT_CONFIGURED',
      error: 'Supabase is not configured on the backend.',
      sentCount: 0,
      removedCount: 0,
    };
  }

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, subscription')
    .eq('user_id', userId);

  if (error) {
    return { ok: false, code: 'DB_ERROR', error: error.message, sentCount: 0, removedCount: 0 };
  }

  if (!subs || subs.length === 0) {
    return {
      ok: false,
      code: 'NO_SUBSCRIPTIONS',
      error: 'No active browser push subscriptions found for this account. Enable browser notifications on this device first.',
      sentCount: 0,
      removedCount: 0,
    };
  }

  const serializedPayload = JSON.stringify({
    title: payload.title || 'TechPulse',
    body: payload.body || '',
    icon: payload.icon || '/favicon.svg',
    badge: payload.badge || '/favicon.svg',
    tag: payload.tag || 'techpulse-notification',
    data: {
      url: payload.url || '/',
      type: payload.type || 'general',
      referenceId: payload.referenceId || null,
    },
  });

  let sentCount = 0;
  let removedCount = 0;
  const errors = [];

  for (const row of subs) {
    try {
      await pushLib.sendNotification(row.subscription, serializedPayload, { TTL: 3600 });
      sentCount += 1;
      await supabase
        .from('push_subscriptions')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', row.id);
    } catch (err) {
      const statusCode = err?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        // Subscription expired or unsubscribed — remove cleanly
        await supabase.from('push_subscriptions').delete().eq('id', row.id);
        removedCount += 1;
      } else {
        errors.push(err?.message || `Push failed (${statusCode || 'unknown'})`);
      }
    }
  }

  if (sentCount === 0) {
    return {
      ok: false,
      code: removedCount > 0 ? 'SUBSCRIPTIONS_EXPIRED' : 'PUSH_DELIVERY_FAILED',
      error:
        removedCount > 0
          ? 'All saved browser push subscriptions had expired and were cleaned up. Please re-subscribe on your browser.'
          : errors.join('; ') || 'Push delivery failed.',
      sentCount,
      removedCount,
    };
  }

  return {
    ok: true,
    sentCount,
    removedCount,
    warnings: errors,
  };
}
