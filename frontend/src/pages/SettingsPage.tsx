import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, LogOut, Monitor, Moon, Newspaper, Sun, User } from 'lucide-react';
import { api } from '../lib/api';
import { useTheme, type ThemeMode } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { COMMON_TIMEZONES } from '../lib/utils';
import { Button, Card, Skeleton, Toggle } from '../components/ui/Primitives';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, isPreviewMode, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const { data: sourcesData } = useQuery({
    queryKey: ['sources'],
    queryFn: () => api.getSources(),
  });

  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [preferredSources, setPreferredSources] = useState<string[]>([]);
  const [importanceThreshold, setImportanceThreshold] = useState(60);
  const [digestTime, setDigestTime] = useState('08:00');
  const [hourlyEnabled, setHourlyEnabled] = useState(true);
  const [dailyEnabled, setDailyEnabled] = useState(true);

  useEffect(() => {
    if (settings?.profile) {
      setDisplayName(settings.profile.display_name || '');
      setTimezone(settings.profile.timezone || 'Asia/Kolkata');
      setPreferredCategories(settings.profile.preferred_categories || []);
      setPreferredSources(settings.profile.preferred_sources || []);
    }
    if (settings?.notificationPreferences) {
      setImportanceThreshold(settings.notificationPreferences.importance_threshold ?? 60);
      setDigestTime(settings.notificationPreferences.digest_time || '08:00');
      setHourlyEnabled(Boolean(settings.notificationPreferences.hourly_news_enabled));
      setDailyEnabled(Boolean(settings.notificationPreferences.daily_digest_enabled));
    }
  }, [settings]);

  const saveProfileMutation = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({ title: 'Profile & news preferences saved', variant: 'success' });
    },
    onError: (err: Error) => toast({ title: 'Save failed', description: err.message, variant: 'error' }),
  });

  const saveNotifMutation = useMutation({
    mutationFn: api.updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['notification-status'] });
      toast({ title: 'Notification schedule saved', variant: 'success' });
    },
    onError: (err: Error) => toast({ title: 'Save failed', description: err.message, variant: 'error' }),
  });

  const toggleCategory = (slug: string) => {
    setPreferredCategories((prev) =>
      prev.includes(slug) ? prev.filter((x) => x !== slug) : [...prev, slug]
    );
  };

  const toggleSource = (id: string) => {
    setPreferredSources((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Customize appearance, preferred tech beats, notification thresholds, and account timezone.
        </p>
      </div>

      {/* 1. Appearance */}
      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-semibold">Appearance</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {(
            [
              { id: 'dark', label: 'Dark (Default)', icon: Moon },
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'system', label: 'System', icon: Monitor },
            ] as Array<{ id: ThemeMode; label: string; icon: typeof Moon }>
          ).map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-colors ${
                  active
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-[#17171d]'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 2. News Preferences */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-semibold">News Intelligence Preferences</h2>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Preferred Categories ({preferredCategories.length} selected)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(categoriesData?.categories || []).map((cat) => {
              const selected = preferredCategories.includes(cat.slug);
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => toggleCategory(cat.slug)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                    selected
                      ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Preferred Sources ({preferredSources.length === 0 ? 'All active' : `${preferredSources.length} prioritized`})
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
            {(sourcesData?.sources || []).map((src) => {
              const selected = preferredSources.includes(src.id);
              return (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => toggleSource(src.id)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                    selected
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {src.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              saveProfileMutation.mutate({
                display_name: displayName || undefined,
                timezone,
                preferred_categories: preferredCategories,
                preferred_sources: preferredSources,
              })
            }
            disabled={saveProfileMutation.isPending}
          >
            Save News Preferences
          </Button>
        </div>
      </Card>

      {/* 3. Notifications & Schedule */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-semibold">Notification Schedule & Thresholds</h2>
          </div>
          <Link to="/notifications" className="text-xs font-medium text-indigo-500 hover:underline">
            Push & Telegram Setup →
          </Link>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Daily Morning Digest</p>
              <p className="text-[11px] text-zinc-500">Top stories from the last 24 hours without duplicates.</p>
            </div>
            <Toggle checked={dailyEnabled} onChange={setDailyEnabled} label="Daily digest" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Hourly Important News Alerts</p>
              <p className="text-[11px] text-zinc-500">Notify only for newly discovered high-importance stories.</p>
            </div>
            <Toggle checked={hourlyEnabled} onChange={setHourlyEnabled} label="Hourly updates" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium mb-1">
                Importance Threshold: <span className="font-mono text-indigo-500">{importanceThreshold}</span> / 100
              </label>
              <input
                type="range"
                min={30}
                max={90}
                step={5}
                value={importanceThreshold}
                onChange={(e) => setImportanceThreshold(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <p className="text-[11px] text-zinc-500">
                Higher threshold = fewer, higher-signal alerts (60 recommended).
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Daily Digest Time</label>
              <input
                type="time"
                value={digestTime}
                onChange={(e) => setDigestTime(e.target.value)}
                className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-3 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                saveNotifMutation.mutate({
                  daily_digest_enabled: dailyEnabled,
                  hourly_news_enabled: hourlyEnabled,
                  importance_threshold: importanceThreshold,
                  digest_time: digestTime,
                  timezone,
                })
              }
              disabled={saveNotifMutation.isPending}
            >
              Save Schedule
            </Button>
          </div>
        </div>
      </Card>

      {/* 4. Account */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-semibold">Account & Timezone</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-3 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#141418] px-3 text-xs text-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-2.5 text-xs"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {!isPreviewMode ? (
            <Button variant="danger" size="sm" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </Button>
          ) : (
            <Link to="/setup" className="text-xs text-amber-500 hover:underline">
              Configure Supabase Auth to enable personal accounts →
            </Link>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => saveProfileMutation.mutate({ display_name: displayName, timezone })}
          >
            Update Profile
          </Button>
        </div>
      </Card>
    </div>
  );
}
