import { env } from '../../config/env.js';
import { getSupabaseAdmin } from '../../config/supabase.js';
import { decryptSecret } from './crypto.js';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Verifies a Telegram bot token via /getMe.
 */
export async function verifyTelegramBot(botToken, { fetchFn = fetch } = {}) {
  if (!botToken || !botToken.includes(':')) {
    return { ok: false, error: 'Invalid Telegram bot token format. Expected format: 123456:ABC-DEF...' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetchFn(`${TELEGRAM_API_BASE}/bot${botToken}/getMe`, {
      method: 'GET',
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.description || 'Telegram rejected the bot token.' };
    }
    return {
      ok: true,
      bot: {
        id: data.result.id,
        username: data.result.username,
        firstName: data.result.first_name,
      },
    };
  } catch (err) {
    return { ok: false, error: err?.message || 'Unable to reach Telegram Bot API.' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sends an HTML-formatted Telegram message.
 */
export async function sendTelegramMessage({ botToken, chatId, htmlText, disablePreview = true, fetchFn = fetch }) {
  if (!botToken) {
    return { ok: false, code: 'TELEGRAM_TOKEN_MISSING', error: 'No Telegram bot token configured.' };
  }
  if (!chatId) {
    return { ok: false, code: 'TELEGRAM_CHAT_ID_MISSING', error: 'No Telegram Chat ID configured.' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetchFn(`${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText.slice(0, 4096),
        parse_mode: 'HTML',
        disable_web_page_preview: disablePreview,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data?.ok) {
      return {
        ok: false,
        code: 'TELEGRAM_API_ERROR',
        error: data?.description || `Telegram API returned HTTP ${res.status}`,
      };
    }
    return { ok: true, messageId: data.result?.message_id };
  } catch (err) {
    return { ok: false, code: 'TELEGRAM_NETWORK_ERROR', error: err?.message || 'Network error reaching Telegram.' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolves a user's Telegram credentials (encrypted user bot token or server default token).
 */
export async function getUserTelegramCredentials(userId, { supabase = getSupabaseAdmin() } = {}) {
  if (!supabase) {
    return { ok: false, code: 'SUPABASE_NOT_CONFIGURED', error: 'Supabase is not configured.' };
  }

  const { data, error } = await supabase
    .from('user_telegram_configs')
    .select('encrypted_bot_token, chat_id, bot_username, is_verified')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return { ok: false, code: 'DB_ERROR', error: error.message };
  }

  if (!data || !data.chat_id) {
    return {
      ok: false,
      code: 'TELEGRAM_NOT_CONNECTED',
      error: 'Telegram is not connected for this account. Configure your Bot Token and Chat ID in Settings.',
    };
  }

  let botToken = null;
  if (data.encrypted_bot_token) {
    try {
      botToken = decryptSecret(data.encrypted_bot_token);
    } catch (err) {
      return { ok: false, code: 'DECRYPT_ERROR', error: err.message };
    }
  } else if (env.telegramBotToken) {
    botToken = env.telegramBotToken;
  }

  if (!botToken) {
    return {
      ok: false,
      code: 'TELEGRAM_TOKEN_MISSING',
      error: 'No Telegram bot token is saved for your account or configured in server environment.',
    };
  }

  return {
    ok: true,
    botToken,
    chatId: data.chat_id,
    botUsername: data.bot_username,
  };
}

export function formatDailyDigestTelegram(articles, dateLabel) {
  const lines = [
    `<b>TechPulse Daily Tech Digest</b> — ${escapeHtml(dateLabel)}`,
    `Top ${articles.length} stories from the last 24 hours:`,
    '',
  ];

  articles.forEach((art, idx) => {
    const label = art.importance_label && art.importance_label !== 'General' ? `[${art.importance_label}] ` : '';
    const sourceName = art.source_name || art.sources?.name || 'Tech Source';
    const excerpt = (art.content_excerpt || art.description || '').slice(0, 150);
    lines.push(
      `<b>${idx + 1}. ${escapeHtml(label)}${escapeHtml(art.title)}</b>\n` +
        `<i>${escapeHtml(sourceName)}</i>${excerpt ? ` — ${escapeHtml(excerpt)}` : ''}\n` +
        `<a href="${escapeHtml(art.url)}">Read original article</a>`
    );
    lines.push('');
  });

  lines.push('<i>Excerpts are automated RSS summaries, not verified AI analysis.</i>');
  return lines.join('\n').trim();
}

export function formatHourlyNewsTelegram(articles) {
  const lines = [`<b>TechPulse Hourly Tech Alert</b>`, ''];
  for (const art of articles.slice(0, 5)) {
    const label = art.importance_label ? `[${art.importance_label}] ` : '';
    const sourceName = art.source_name || art.sources?.name || 'Tech Source';
    const excerpt = (art.content_excerpt || art.description || '').slice(0, 140);
    lines.push(
      `• <b>${escapeHtml(label)}${escapeHtml(art.title)}</b>\n` +
        `  <i>${escapeHtml(sourceName)}</i>${excerpt ? ` — ${escapeHtml(excerpt)}` : ''}\n` +
        `  <a href="${escapeHtml(art.url)}">Open article</a>`
    );
  }
  return lines.join('\n').trim();
}

export function formatReminderTelegram(reminder) {
  const parts = [
    `<b>TechPulse Reminder</b>`,
    `<b>${escapeHtml(reminder.title)}</b>`,
  ];
  if (reminder.description) {
    parts.push(escapeHtml(reminder.description));
  }
  parts.push(`<i>Timezone: ${escapeHtml(reminder.timezone || 'Asia/Kolkata')}</i>`);
  return parts.join('\n');
}

export function formatTaskDeadlineTelegram(task) {
  const parts = [
    `<b>TechPulse Task Deadline Alert</b>`,
    `<b>${escapeHtml(task.title)}</b> (Priority: ${escapeHtml((task.priority || 'medium').toUpperCase())})`,
  ];
  if (task.description) {
    parts.push(escapeHtml(task.description.slice(0, 200)));
  }
  if (task.due_at) {
    parts.push(`Due: ${escapeHtml(new Date(task.due_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))} IST`);
  }
  return parts.join('\n');
}
