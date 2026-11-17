import { getSupabaseAdmin } from '../../config/supabase.js';
import { sendBrowserPushToUser } from './webPushService.js';
import { getUserTelegramCredentials, sendTelegramMessage } from './telegramService.js';

/**
 * Checks whether a notification with the same dedupeKey was already sent to this user & channel.
 */
export async function hasAlreadyBeenSent({ userId, channel, dedupeKey, supabase = getSupabaseAdmin() }) {
  if (!dedupeKey || !supabase) return false;
  const { data } = await supabase
    .from('notification_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('channel', channel)
    .eq('dedupe_key', dedupeKey)
    .eq('status', 'sent')
    .limit(1);

  return Array.isArray(data) && data.length > 0;
}

/**
 * Records a notification attempt in notification_logs.
 */
export async function logNotification({
  userId,
  notificationType,
  referenceId = null,
  dedupeKey = null,
  channel,
  status,
  attemptCount = 1,
  payload = null,
  errorMessage = null,
  supabase = getSupabaseAdmin(),
}) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('notification_logs')
    .insert({
      user_id: userId,
      notification_type: notificationType,
      reference_id: referenceId,
      dedupe_key: dedupeKey,
      channel,
      status,
      attempt_count: attemptCount,
      payload,
      error_message: errorMessage,
      sent_at: new Date().toISOString(),
    })
    .select('id')
    .maybeSingle();

  if (error && !String(error.message).includes('duplicate key')) {
    console.error('[NotificationLog Error]', error.message);
  }
  return data;
}

/**
 * Unified notification delivery across Browser Push and/or Telegram with deduplication & logging.
 */
export async function dispatchNotification({
  userId,
  notificationType,
  referenceId = null,
  dedupeKey = null,
  channels = ['browser', 'telegram'],
  browserPayload,
  telegramHtml,
  maxRetries = 2,
  supabase = getSupabaseAdmin(),
  browserSender = sendBrowserPushToUser,
  telegramSender = sendTelegramMessage,
  telegramCredResolver = getUserTelegramCredentials,
}) {
  const results = {};

  for (const channel of channels) {
    if (dedupeKey) {
      const alreadySent = await hasAlreadyBeenSent({ userId, channel, dedupeKey, supabase });
      if (alreadySent) {
        results[channel] = { ok: true, skipped: true, reason: 'ALREADY_SENT' };
        continue;
      }
    }

    let attempt = 0;
    let lastResult = { ok: false, error: 'Unknown delivery error' };

    while (attempt < maxRetries) {
      attempt += 1;
      if (channel === 'browser') {
        lastResult = await browserSender(userId, browserPayload, { supabase });
      } else if (channel === 'telegram') {
        const creds = await telegramCredResolver(userId, { supabase });
        if (!creds.ok) {
          lastResult = creds;
          break; // Don't retry missing config
        }
        lastResult = await telegramSender({
          botToken: creds.botToken,
          chatId: creds.chatId,
          htmlText: telegramHtml,
        });
      }

      if (lastResult.ok) break;
      // Don't retry permanent configuration/subscription errors
      if (
        [
          'VAPID_NOT_CONFIGURED',
          'NO_SUBSCRIPTIONS',
          'SUBSCRIPTIONS_EXPIRED',
          'TELEGRAM_NOT_CONNECTED',
          'TELEGRAM_TOKEN_MISSING',
          'SUPABASE_NOT_CONFIGURED',
        ].includes(lastResult.code)
      ) {
        break;
      }
    }

    await logNotification({
      userId,
      notificationType,
      referenceId,
      dedupeKey,
      channel,
      status: lastResult.ok ? 'sent' : 'failed',
      attemptCount: attempt,
      payload: channel === 'browser' ? browserPayload : { preview: (telegramHtml || '').slice(0, 240) },
      errorMessage: lastResult.ok ? null : lastResult.error,
      supabase,
    });

    results[channel] = lastResult;
  }

  return results;
}
