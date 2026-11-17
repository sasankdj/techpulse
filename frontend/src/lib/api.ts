import { frontendEnv, isSupabaseConfigured } from './env';
import { getSupabaseClient } from './supabase';
import { PREVIEW_CATEGORIES, PREVIEW_SOURCES, previewStore } from './mockData';
import type {
  Article,
  Category,
  DashboardStatsResponse,
  NotificationLog,
  NotificationPreferences,
  Reminder,
  Source,
  Task,
  TaskStats,
  TelegramStatus,
  UserProfile,
} from '../types';

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 500, code = 'API_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${frontendEnv.apiBaseUrl}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      'Unable to reach the TechPulse backend API. Make sure the backend server is running on ' +
        frontendEnv.apiBaseUrl,
      0,
      'NETWORK_ERROR'
    );
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      data.error || data.message || `Request failed with HTTP ${response.status}`,
      response.status,
      data.code || 'API_ERROR'
    );
  }
  return data as T;
}

export const api = {
  isPreviewMode: () => !isSupabaseConfigured,

  async getHealth() {
    try {
      return await requestJson<{
        status: string;
        timezone: string;
        database: { status: string; error?: string };
        capabilities: {
          supabaseConfigured: boolean;
          webPushConfigured: boolean;
          defaultTelegramConfigured: boolean;
          encryptionConfigured: boolean;
          ollamaConfigured: boolean;
        };
      }>('/api/health');
    } catch {
      return null;
    }
  },

  async getDashboardStats(): Promise<DashboardStatsResponse> {
    if (!isSupabaseConfigured) return previewStore.getDashboardStats();
    return requestJson<DashboardStatsResponse>('/api/dashboard/stats');
  },

  async getCategories(): Promise<{ categories: Category[] }> {
    if (!isSupabaseConfigured) return { categories: PREVIEW_CATEGORIES };
    return requestJson<{ categories: Category[] }>('/api/news/categories');
  },

  async getSources(): Promise<{ sources: Source[] }> {
    if (!isSupabaseConfigured) return { sources: PREVIEW_SOURCES };
    return requestJson<{ sources: Source[] }>('/api/news/sources');
  },

  async getNews(params: Record<string, string | undefined>): Promise<{
    articles: Article[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    if (!isSupabaseConfigured) return previewStore.getNews(params);
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== 'all') search.set(k, v);
    });
    const qs = search.toString();
    return requestJson(`/api/news${qs ? `?${qs}` : ''}`);
  },

  async getClusterArticles(clusterId: string): Promise<{ clusterId: string; articles: Article[] }> {
    if (!isSupabaseConfigured) return previewStore.getCluster(clusterId);
    return requestJson(`/api/news/clusters/${encodeURIComponent(clusterId)}`);
  },

  async updateArticleState(articleId: string, patch: { is_read?: boolean; is_bookmarked?: boolean }) {
    if (!isSupabaseConfigured) return previewStore.updateArticleState(articleId, patch);
    return requestJson(`/api/news/${articleId}/state`, {
      method: 'POST',
      body: JSON.stringify(patch),
    });
  },

  async refreshNewsFeeds() {
    if (!isSupabaseConfigured) {
      throw new ApiError(
        'Live RSS ingestion requires Supabase credentials. Configure backend/.env & frontend/.env to ingest live feeds.',
        503,
        'SUPABASE_NOT_CONFIGURED'
      );
    }
    return requestJson<{ message: string; result: { articlesInserted: number; sourcesSucceeded: number } }>(
      '/api/news/refresh',
      { method: 'POST' }
    );
  },

  async getTasks(params: Record<string, string | undefined> = {}): Promise<{ tasks: Task[]; stats: TaskStats }> {
    if (!isSupabaseConfigured) return previewStore.getTasks(params);
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== 'all') search.set(k, v);
    });
    const qs = search.toString();
    return requestJson(`/api/tasks${qs ? `?${qs}` : ''}`);
  },

  async createTask(payload: Partial<Task>): Promise<{ task: Task }> {
    if (!isSupabaseConfigured) return previewStore.createTask(payload);
    return requestJson('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
  },

  async updateTask(id: string, payload: Partial<Task>): Promise<{ task: Task; spawnedNextTask?: Task | null }> {
    if (!isSupabaseConfigured) return previewStore.updateTask(id, payload);
    return requestJson(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },

  async deleteTask(id: string) {
    if (!isSupabaseConfigured) return previewStore.deleteTask(id);
    return requestJson(`/api/tasks/${id}`, { method: 'DELETE' });
  },

  async getReminders(status?: string): Promise<{ reminders: Reminder[] }> {
    if (!isSupabaseConfigured) return previewStore.getReminders();
    const qs = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return requestJson(`/api/reminders${qs}`);
  },

  async createReminder(payload: Partial<Reminder>): Promise<{ reminder: Reminder }> {
    if (!isSupabaseConfigured) return previewStore.createReminder(payload);
    return requestJson('/api/reminders', { method: 'POST', body: JSON.stringify(payload) });
  },

  async updateReminder(id: string, payload: Partial<Reminder>): Promise<{ reminder: Reminder }> {
    if (!isSupabaseConfigured) return previewStore.updateReminder(id, payload);
    return requestJson(`/api/reminders/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },

  async snoozeReminder(id: string, minutes: number): Promise<{ reminder: Reminder }> {
    if (!isSupabaseConfigured) return previewStore.snoozeReminder(id, minutes);
    return requestJson(`/api/reminders/${id}/snooze`, {
      method: 'POST',
      body: JSON.stringify({ minutes }),
    });
  },

  async deleteReminder(id: string) {
    if (!isSupabaseConfigured) return previewStore.deleteReminder(id);
    return requestJson(`/api/reminders/${id}`, { method: 'DELETE' });
  },

  async getSettings(): Promise<{ profile: UserProfile; notificationPreferences: NotificationPreferences }> {
    if (!isSupabaseConfigured) return previewStore.getSettings();
    return requestJson('/api/settings');
  },

  async updateProfile(patch: Partial<UserProfile>): Promise<{ profile: UserProfile }> {
    if (!isSupabaseConfigured) return previewStore.updateProfile(patch);
    return requestJson('/api/settings/profile', { method: 'PUT', body: JSON.stringify(patch) });
  },

  async updateNotificationPreferences(
    patch: Partial<NotificationPreferences>
  ): Promise<{ notificationPreferences: NotificationPreferences }> {
    if (!isSupabaseConfigured) return previewStore.updateNotificationPrefs(patch);
    return requestJson('/api/settings/notifications', { method: 'PUT', body: JSON.stringify(patch) });
  },

  async getVapidPublicKey(): Promise<{ configured: boolean; publicKey: string }> {
    return requestJson('/api/notifications/vapid-public-key');
  },

  async getNotificationStatus(): Promise<{
    capabilities: Record<string, boolean | string>;
    preferences: NotificationPreferences | null;
    browserSubscriptionCount: number;
    telegram: { connected: boolean; chatId?: string; botUsername?: string };
    recentLogs: NotificationLog[];
  }> {
    if (!isSupabaseConfigured) {
      const { notificationPreferences } = previewStore.getSettings();
      return {
        capabilities: {
          supabaseConfigured: false,
          webPushConfigured: false,
          defaultTelegramConfigured: false,
          encryptionConfigured: false,
        },
        preferences: notificationPreferences,
        browserSubscriptionCount: 0,
        telegram: { connected: false },
        recentLogs: [],
      };
    }
    return requestJson('/api/notifications/status');
  },

  async subscribePush(subscription: PushSubscriptionJSON) {
    if (!isSupabaseConfigured) {
      throw new ApiError(
        'Web Push subscriptions require Supabase + VAPID keys configured on the backend.',
        503,
        'SUPABASE_NOT_CONFIGURED'
      );
    }
    return requestJson('/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription, userAgent: navigator.userAgent }),
    });
  },

  async unsubscribePush(endpoint: string) {
    if (!isSupabaseConfigured) return { unsubscribed: true };
    return requestJson('/api/notifications/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    });
  },

  async testBrowserPush() {
    if (!isSupabaseConfigured) {
      throw new ApiError(
        'Cannot send a real Web Push notification in Preview Mode. Configure Supabase and VAPID keys in backend/.env first.',
        503,
        'SUPABASE_NOT_CONFIGURED'
      );
    }
    return requestJson<{ delivered: boolean; message: string }>('/api/notifications/test', {
      method: 'POST',
    });
  },

  async getTelegramStatus(): Promise<TelegramStatus> {
    if (!isSupabaseConfigured) return previewStore.getTelegramStatus();
    return requestJson('/api/telegram/status');
  },

  async connectTelegram(payload: { botToken?: string; chatId: string; enabled: boolean }) {
    if (!isSupabaseConfigured) {
      throw new ApiError(
        'Saving Telegram credentials requires Supabase + CREDENTIALS_ENCRYPTION_KEY configured on the backend.',
        503,
        'SUPABASE_NOT_CONFIGURED'
      );
    }
    return requestJson<{ connected: boolean; message: string; botUsername: string }>('/api/telegram/connect', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async disconnectTelegram() {
    if (!isSupabaseConfigured) return { disconnected: true };
    return requestJson('/api/telegram/disconnect', { method: 'POST' });
  },

  async testTelegram() {
    if (!isSupabaseConfigured) {
      throw new ApiError(
        'Cannot deliver a Telegram message in Preview Mode. Configure Supabase and connect your Telegram bot first.',
        503,
        'SUPABASE_NOT_CONFIGURED'
      );
    }
    return requestJson<{ delivered: boolean; message: string }>('/api/telegram/test', {
      method: 'POST',
    });
  },
};
