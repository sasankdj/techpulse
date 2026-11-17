import { Router } from 'express';
import { z } from 'zod';
import { env, getCapabilities } from '../config/env.js';
import { requireSupabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { encryptSecret } from '../services/notifications/crypto.js';
import { verifyTelegramBot, escapeHtml } from '../services/notifications/telegramService.js';
import { dispatchNotification } from '../services/notifications/notificationDispatcher.js';

const router = Router();

const connectTelegramSchema = z.object({
  botToken: z.string().trim().min(10).max(200).optional(),
  chatId: z.string().trim().min(1, 'Telegram Chat ID is required').max(64),
  enabled: z.boolean().default(true),
});

router.use(requireAuth);

router.get('/status', async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const capabilities = getCapabilities();

    const [{ data: config }, { data: prefs }] = await Promise.all([
      supabase
        .from('user_telegram_configs')
        .select('chat_id, bot_username, is_verified, encrypted_bot_token, updated_at')
        .eq('user_id', req.user.id)
        .maybeSingle(),
      supabase
        .from('notification_preferences')
        .select('telegram_enabled')
        .eq('user_id', req.user.id)
        .maybeSingle(),
    ]);

    // Never return raw or encrypted bot tokens to the frontend
    res.json({
      connected: Boolean(config?.chat_id),
      enabled: Boolean(prefs?.telegram_enabled),
      chatId: config?.chat_id || null,
      botUsername: config?.bot_username || null,
      hasCustomBotToken: Boolean(config?.encrypted_bot_token),
      isVerified: Boolean(config?.is_verified),
      defaultServerBotAvailable: capabilities.defaultTelegramConfigured,
      encryptionConfigured: capabilities.encryptionConfigured,
      updatedAt: config?.updated_at || null,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/connect', validateBody(connectTelegramSchema), async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const { botToken, chatId, enabled } = req.body;

    const effectiveToken = botToken || env.telegramBotToken;
    if (!effectiveToken) {
      return res.status(400).json({
        error: 'A Telegram Bot Token is required (or configure TELEGRAM_BOT_TOKEN in backend/.env).',
        code: 'TELEGRAM_TOKEN_MISSING',
      });
    }

    // Verify bot token against Telegram API before saving
    const verify = await verifyTelegramBot(effectiveToken);
    if (!verify.ok) {
      return res.status(400).json({
        error: verify.error,
        code: 'INVALID_TELEGRAM_BOT_TOKEN',
      });
    }

    let encryptedToken = null;
    if (botToken) {
      encryptedToken = encryptSecret(botToken);
    }

    const { error: upsertErr } = await supabase
      .from('user_telegram_configs')
      .upsert(
        {
          user_id: req.user.id,
          encrypted_bot_token: encryptedToken,
          chat_id: chatId,
          bot_username: verify.bot.username,
          is_verified: true,
        },
        { onConflict: 'user_id' }
      );

    if (upsertErr) throw upsertErr;

    await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: req.user.id,
          telegram_enabled: enabled,
        },
        { onConflict: 'user_id' }
      );

    res.json({
      connected: true,
      enabled,
      chatId,
      botUsername: verify.bot.username,
      message: `Connected Telegram bot @${verify.bot.username} successfully.`,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/disconnect', async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    await supabase.from('user_telegram_configs').delete().eq('user_id', req.user.id);
    await supabase
      .from('notification_preferences')
      .update({ telegram_enabled: false })
      .eq('user_id', req.user.id);

    res.json({ disconnected: true });
  } catch (err) {
    next(err);
  }
});

router.post('/test', async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const nowIst = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const results = await dispatchNotification({
      userId: req.user.id,
      notificationType: 'test',
      channels: ['telegram'],
      telegramHtml:
        `<b>TechPulse Test Notification</b>\n` +
        `Your Telegram connection is active and verified.\n` +
        `<i>Timestamp: ${escapeHtml(nowIst)} IST</i>`,
      supabase,
      maxRetries: 1,
    });

    const tgResult = results.telegram;
    if (!tgResult?.ok) {
      return res.status(400).json({
        delivered: false,
        code: tgResult?.code || 'TELEGRAM_TEST_FAILED',
        error: tgResult?.error || 'Failed to send Telegram test message.',
      });
    }

    res.json({
      delivered: true,
      messageId: tgResult.messageId,
      message: 'Test message delivered to your Telegram chat.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
