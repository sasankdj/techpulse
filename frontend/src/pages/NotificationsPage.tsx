import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Info,
  Send,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  getCurrentPushSubscription,
  isIosDevice,
  isPushSupported,
  isStandalonePwa,
  subscribeBrowserPush,
  unsubscribeBrowserPush,
} from '../lib/push';
import { useToast } from '../context/ToastContext';
import { formatDateTimeInTz } from '../lib/utils';
import { Badge, Button, Card, Skeleton, Toggle } from '../components/ui/Primitives';

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [browserSubscribedLocally, setBrowserSubscribedLocally] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(true);

  const { data: status, isLoading } = useQuery({
    queryKey: ['notification-status'],
    queryFn: () => api.getNotificationStatus(),
  });

  const { data: tgStatus } = useQuery({
    queryKey: ['telegram-status'],
    queryFn: () => api.getTelegramStatus(),
  });

  useEffect(() => {
    getCurrentPushSubscription().then((sub) => setBrowserSubscribedLocally(Boolean(sub)));
  }, []);

  useEffect(() => {
    if (tgStatus?.chatId) setChatId(tgStatus.chatId);
    if (typeof tgStatus?.enabled === 'boolean') setTelegramEnabled(tgStatus.enabled);
  }, [tgStatus]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notification-status'] });
    queryClient.invalidateQueries({ queryKey: ['telegram-status'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const handleEnableBrowserPush = async () => {
    setPushBusy(true);
    try {
      const vapid = await api.getVapidPublicKey();
      const subJson = await subscribeBrowserPush(vapid.publicKey);
      await api.subscribePush(subJson);
      setBrowserSubscribedLocally(true);
      invalidate();
      toast({
        title: 'Browser push enabled',
        description: 'This device is now registered for TechPulse Web Push notifications.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Could not enable Web Push',
        description: (err as Error).message,
        variant: 'error',
      });
    } finally {
      setPushBusy(false);
    }
  };

  const handleDisableBrowserPush = async () => {
    setPushBusy(true);
    try {
      const endpoint = await unsubscribeBrowserPush();
      if (endpoint) {
        await api.unsubscribePush(endpoint);
      }
      setBrowserSubscribedLocally(false);
      invalidate();
      toast({ title: 'Browser push disabled for this device', variant: 'info' });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'error' });
    } finally {
      setPushBusy(false);
    }
  };

  const testPushMutation = useMutation({
    mutationFn: () => api.testBrowserPush(),
    onSuccess: (res) => {
      invalidate();
      toast({ title: 'Push sent', description: res.message, variant: 'success' });
    },
    onError: (err: Error) => {
      invalidate();
      toast({ title: 'Push test failed', description: err.message, variant: 'error' });
    },
  });

  const connectTelegramMutation = useMutation({
    mutationFn: (payload: { botToken?: string; chatId: string; enabled: boolean }) =>
      api.connectTelegram(payload),
    onSuccess: (res) => {
      setBotToken('');
      invalidate();
      toast({ title: 'Telegram connected', description: res.message, variant: 'success' });
    },
    onError: (err: Error) => {
      toast({ title: 'Telegram connection failed', description: err.message, variant: 'error' });
    },
  });

  const disconnectTelegramMutation = useMutation({
    mutationFn: () => api.disconnectTelegram(),
    onSuccess: () => {
      setChatId('');
      setBotToken('');
      invalidate();
      toast({ title: 'Telegram disconnected', variant: 'info' });
    },
  });

  const testTelegramMutation = useMutation({
    mutationFn: () => api.testTelegram(),
    onSuccess: (res) => {
      invalidate();
      toast({ title: 'Telegram test delivered', description: res.message, variant: 'success' });
    },
    onError: (err: Error) => {
      invalidate();
      toast({ title: 'Telegram test failed', description: err.message, variant: 'error' });
    },
  });

  const updatePrefsMutation = useMutation({
    mutationFn: api.updateNotificationPreferences,
    onSuccess: () => {
      invalidate();
      toast({ title: 'Schedule preferences updated', variant: 'success' });
    },
  });

  const handleConnectTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId.trim()) return;
    connectTelegramMutation.mutate({
      botToken: botToken.trim() || undefined,
      chatId: chatId.trim(),
      enabled: telegramEnabled,
    });
  };

  const pushSupported = isPushSupported();
  const permissionState = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
  const iosNeedsHomeScreen = isIosDevice() && !isStandalonePwa();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Notifications & Delivery</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Configure server-triggered Web Push, Telegram Bot delivery, daily 8:00 AM IST digests, and hourly alerts.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* A. Browser Web Push */}
          <Card className="p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Bell className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">Browser Web Push (Service Worker)</h2>
                    <p className="text-xs text-zinc-500">
                      Real VAPID push notifications delivered even when the tab is closed.
                    </p>
                  </div>
                </div>
                <Badge variant={browserSubscribedLocally || (status?.browserSubscriptionCount || 0) > 0 ? 'emerald' : 'neutral'}>
                  {status?.browserSubscriptionCount || 0} device(s)
                </Badge>
              </div>

              <div className="rounded-lg bg-zinc-50 dark:bg-[#15151a] border border-zinc-200 dark:border-zinc-800 p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Browser support</span>
                  <span className="font-mono">{pushSupported ? 'Supported' : 'Unsupported'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Browser permission</span>
                  <span className="font-mono capitalize">{permissionState}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Backend VAPID keys</span>
                  <span className="font-mono">
                    {status?.capabilities?.webPushConfigured ? 'Configured' : 'Not configured'}
                  </span>
                </div>
              </div>

              {iosNeedsHomeScreen && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                  <Smartphone className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    On iOS Safari, Web Push requires iOS 16.4+ and installing TechPulse via{' '}
                    <strong>Share → Add to Home Screen</strong> before enabling notifications.
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {browserSubscribedLocally ? (
                  <Button variant="secondary" size="sm" onClick={handleDisableBrowserPush} disabled={pushBusy}>
                    Disable on This Device
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleEnableBrowserPush}
                    disabled={pushBusy || !pushSupported}
                  >
                    {pushBusy ? 'Subscribing...' : 'Enable Browser Push'}
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => testPushMutation.mutate()}
                  disabled={testPushMutation.isPending}
                >
                  {testPushMutation.isPending ? 'Sending...' : 'Send Test Push'}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800/80 p-3 text-[11px] text-zinc-500 space-y-1">
              <p className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-indigo-500" /> Browser Push Limitations
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>HTTPS is required in production (localhost works for local development).</li>
                <li>Explicit user browser permission is required; OS Focus/Do Not Disturb modes affect delivery.</li>
                <li>iOS requires adding TechPulse to your Home Screen as a Web App.</li>
              </ul>
            </div>
          </Card>

          {/* B. Telegram Bot Notifications */}
          <Card className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                  <Send className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Telegram Bot Integration</h2>
                  <p className="text-xs text-zinc-500">
                    Receive daily digests, hourly alerts, and reminders directly in Telegram.
                  </p>
                </div>
              </div>
              <Badge variant={tgStatus?.connected ? 'sky' : 'neutral'}>
                {tgStatus?.connected ? `@${tgStatus.botUsername || 'Connected'}` : 'Not Connected'}
              </Badge>
            </div>

            <form onSubmit={handleConnectTelegram} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Telegram Bot Token (from @BotFather)
                </label>
                <input
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder={
                    tgStatus?.hasCustomBotToken
                      ? '•••••••••• (encrypted on server — leave blank to keep)'
                      : '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ'
                  }
                  className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-3 text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  Encrypted server-side with AES-256-GCM. Never exposed in frontend code.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Telegram Chat ID *
                </label>
                <input
                  type="text"
                  required
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="e.g. 987654321 (send /start to @userinfobot to find yours)"
                  className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-3 text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-zinc-700 dark:text-zinc-300">Enable Telegram notifications</span>
                <Toggle checked={telegramEnabled} onChange={setTelegramEnabled} label="Enable Telegram" />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button type="submit" variant="primary" size="sm" disabled={connectTelegramMutation.isPending}>
                  {connectTelegramMutation.isPending ? 'Verifying...' : 'Save & Verify Bot'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => testTelegramMutation.mutate()}
                  disabled={testTelegramMutation.isPending}
                >
                  {testTelegramMutation.isPending ? 'Sending...' : 'Send Test Message'}
                </Button>
                {tgStatus?.connected && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => disconnectTelegramMutation.mutate()}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Disconnect
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Schedule Controls */}
      {status?.preferences && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-semibold">Digest & Hourly Alert Schedule</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium">Daily Morning Digest</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Top stories from previous 24h at {status.preferences.digest_time} ({status.preferences.timezone})
                </p>
              </div>
              <Toggle
                checked={status.preferences.daily_digest_enabled}
                onChange={(next) => updatePrefsMutation.mutate({ daily_digest_enabled: next })}
                label="Toggle daily digest"
              />
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium">Hourly Important News</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Only newly discovered articles scoring ≥ {status.preferences.importance_threshold}
                </p>
              </div>
              <Toggle
                checked={status.preferences.hourly_news_enabled}
                onChange={(next) => updatePrefsMutation.mutate({ hourly_news_enabled: next })}
                label="Toggle hourly updates"
              />
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5">
              <label className="block text-xs font-medium mb-1">Daily Digest Time (24h)</label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  defaultValue={status.preferences.digest_time || '08:00'}
                  onBlur={(e) => {
                    if (e.target.value && e.target.value !== status.preferences?.digest_time) {
                      updatePrefsMutation.mutate({ digest_time: e.target.value });
                    }
                  }}
                  className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-2.5 text-xs font-mono"
                />
                <span className="text-[11px] text-zinc-500">{status.preferences.timezone}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Notification Delivery History */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-3">Recent Delivery Log</h2>
        {(status?.recentLogs || []).length === 0 ? (
          <p className="text-xs text-zinc-500 py-4">
            No notification deliveries recorded yet. Send a test notification once credentials are configured.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Channel</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                {(status?.recentLogs || []).map((log) => (
                  <tr key={log.id}>
                    <td className="py-2.5 pr-4 font-mono">{log.notification_type}</td>
                    <td className="py-2.5 pr-4 capitalize">{log.channel}</td>
                    <td className="py-2.5 pr-4">
                      {log.status === 'sent' ? (
                        <Badge variant="emerald">
                          <CheckCircle2 className="h-3 w-3" /> Sent
                        </Badge>
                      ) : (
                        <Badge variant="rose">
                          <AlertTriangle className="h-3 w-3" /> {log.status}
                        </Badge>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-zinc-500 whitespace-nowrap">
                      {formatDateTimeInTz(log.sent_at)}
                    </td>
                    <td className="py-2.5 text-zinc-500 max-w-xs truncate">
                      {log.error_message || 'Delivered'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
