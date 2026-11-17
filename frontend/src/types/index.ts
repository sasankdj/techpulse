export type ImportanceLabel = 'Breaking' | 'Important' | 'Trending' | 'General';

export interface Category {
  id: string;
  name: string;
  slug: string;
  group_name: string;
}

export interface Source {
  id: string;
  name: string;
  feed_url: string;
  website_url: string;
  favicon_url?: string | null;
  category: string;
  reliability_score: number;
  enabled: boolean;
  last_fetched_at?: string | null;
  last_success_at?: string | null;
  last_error?: string | null;
  failure_count?: number;
}

export interface Article {
  id: string;
  title: string;
  url: string;
  normalized_url?: string;
  description?: string | null;
  content_excerpt?: string | null;
  summary_source?: 'rss_excerpt' | 'extractive' | 'ollama';
  image_url?: string | null;
  source_id?: string;
  source?: {
    id?: string;
    name: string;
    website_url?: string;
    favicon_url?: string | null;
    reliability_score?: number;
  } | null;
  published_at: string;
  fetched_at?: string;
  importance_score: number;
  importance_label: ImportanceLabel;
  cluster_id?: string | null;
  corroboration_count: number;
  keywords?: string[];
  categories: Category[];
  is_read: boolean;
  is_bookmarked: boolean;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'overdue';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  subtasks: Subtask[];
  recurrence_rule?: string | null;
  due_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionPercentage: number;
}

export type NotificationChannel = 'both' | 'browser' | 'telegram';

export interface Reminder {
  id: string;
  user_id?: string;
  title: string;
  description?: string | null;
  remind_at: string;
  timezone: string;
  recurrence_rule: string;
  notification_channel: NotificationChannel;
  is_active: boolean;
  is_completed: boolean;
  snoozed_until?: string | null;
  last_triggered_at?: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  browser_enabled: boolean;
  telegram_enabled: boolean;
  hourly_news_enabled: boolean;
  daily_digest_enabled: boolean;
  digest_time: string;
  importance_threshold: number;
  timezone: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  timezone: string;
  preferred_categories: string[];
  preferred_sources: string[];
}

export interface NotificationLog {
  id: string;
  notification_type: 'daily_digest' | 'hourly_news' | 'reminder' | 'task_deadline' | 'test';
  reference_id?: string | null;
  channel: 'browser' | 'telegram';
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  attempt_count: number;
  sent_at: string;
  error_message?: string | null;
}

export interface TelegramStatus {
  connected: boolean;
  enabled: boolean;
  chatId: string | null;
  botUsername: string | null;
  hasCustomBotToken: boolean;
  isVerified: boolean;
  defaultServerBotAvailable: boolean;
  encryptionConfigured: boolean;
  updatedAt?: string | null;
}

export interface DashboardStatsResponse {
  news: {
    totalArticles: number;
    last24hArticles: number;
    breakingOrTrending24h: number;
    activeSources: number;
    bookmarkedCount: number;
  };
  breakingNews: Article[];
  latestNews: Article[];
  tasks: {
    stats: TaskStats;
    today: Task[];
  };
  reminders: {
    upcoming: Reminder[];
  };
  notifications: {
    browserEnabled: boolean;
    telegramEnabled: boolean;
    hourlyNewsEnabled?: boolean;
    dailyDigestEnabled?: boolean;
    digestTime: string;
    timezone: string;
  };
}
