import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  tz: process.env.TZ || 'Asia/Kolkata',
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),

  supabaseUrl: (process.env.SUPABASE_URL || '').trim(),
  supabaseServiceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),

  telegramBotToken: (process.env.TELEGRAM_BOT_TOKEN || '').trim(),
  credentialsEncryptionKey: (process.env.CREDENTIALS_ENCRYPTION_KEY || '').trim(),

  vapidPublicKey: (process.env.VAPID_PUBLIC_KEY || '').trim(),
  vapidPrivateKey: (process.env.VAPID_PRIVATE_KEY || '').trim(),
  vapidSubject: (process.env.VAPID_SUBJECT || 'mailto:admin@techpulse.local').trim(),

  enableScheduler: process.env.ENABLE_SCHEDULER !== 'false',
  cronSecret: (process.env.CRON_SECRET || '').trim(),

  ollamaBaseUrl: (process.env.OLLAMA_BASE_URL || '').trim(),
  ollamaModel: (process.env.OLLAMA_MODEL || 'llama3.2').trim(),
};

export function getCapabilities() {
  const supabaseConfigured = Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
  const webPushConfigured = Boolean(env.vapidPublicKey && env.vapidPrivateKey);
  const defaultTelegramConfigured = Boolean(env.telegramBotToken);
  const encryptionConfigured = Boolean(env.credentialsEncryptionKey && env.credentialsEncryptionKey.length >= 32);
  const ollamaConfigured = Boolean(env.ollamaBaseUrl);

  return {
    supabaseConfigured,
    webPushConfigured,
    defaultTelegramConfigured,
    encryptionConfigured,
    ollamaConfigured,
    timezone: env.tz,
  };
}
