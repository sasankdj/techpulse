import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Bell,
  BellRing,
  Bookmark,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Newspaper,
  Plus,
  Radio,
  RefreshCw,
  Send,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDateTimeInTz, formatRecurrenceLabel, getGreetingForTimezone } from '../lib/utils';
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton } from '../components/ui/Primitives';
import { ArticleCard } from '../components/news/ArticleCard';
import { ArticleClusterModal } from '../components/news/ArticleClusterModal';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { ReminderFormModal } from '../components/reminders/ReminderFormModal';
import type { Article, Task } from '../types';

export function OverviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [nowClock, setNowClock] = useState(() => new Date());
  const [clusterId, setClusterId] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNowClock(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
  });

  const refreshFeedsMutation = useMutation({
    mutationFn: () => api.refreshNewsFeeds(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast({
        title: 'Feeds refreshed',
        description: `Ingested ${res.result.articlesInserted} new articles across ${res.result.sourcesSucceeded} sources.`,
        variant: 'success',
      });
    },
    onError: (err: Error) => {
      toast({ title: 'Feed refresh unavailable', description: err.message, variant: 'error' });
    },
  });

  const articleStateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { is_read?: boolean; is_bookmarked?: boolean } }) =>
      api.updateArticleState(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: (task: Task) =>
      api.updateTask(task.id, { status: task.status === 'completed' ? 'todo' : 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (payload: Partial<Task>) => api.createTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Task created', variant: 'success' });
    },
  });

  const createReminderMutation = useMutation({
    mutationFn: api.createReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast({ title: 'Reminder scheduled', variant: 'success' });
    },
  });

  const displayName =
    user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Engineer';
  const tz = data?.notifications?.timezone || 'Asia/Kolkata';
  const greeting = getGreetingForTimezone(tz);

  const formattedDateTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(nowClock);

  if (error) {
    return (
      <ErrorState
        title="Could not load dashboard"
        message={(error as Error).message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting & Quick Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            {formattedDateTime} · {tz}
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1">
            {greeting}, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Your real-time technology intelligence feed, tasks, and scheduled alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setTaskModalOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Task
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setReminderModalOpen(true)}>
            <BellRing className="h-3.5 w-3.5" />
            Reminder
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => refreshFeedsMutation.mutate()}
            disabled={refreshFeedsMutation.isPending}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshFeedsMutation.isPending ? 'animate-spin' : ''}`} />
            Sync Feeds
          </Button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card className="p-4">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-xs font-medium">Stories (24h)</span>
                <Newspaper className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="mt-2 text-2xl font-semibold font-mono tracking-tight">
                {data?.news.last24hArticles ?? 0}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                {data?.news.activeSources ?? 0} active RSS feeds
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-xs font-medium">Breaking & Trending</span>
                <Flame className="h-4 w-4 text-rose-500" />
              </div>
              <p className="mt-2 text-2xl font-semibold font-mono tracking-tight">
                {data?.news.breakingOrTrending24h ?? 0}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                {data?.news.bookmarkedCount ?? 0} saved articles
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-xs font-medium">Task Progress</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-semibold font-mono tracking-tight">
                {data?.tasks.stats.completionPercentage ?? 0}%
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                {data?.tasks.stats.pending ?? 0} pending · {data?.tasks.stats.overdue ?? 0} overdue
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-xs font-medium">Alerts & Digest</span>
                <Radio className="h-4 w-4 text-sky-500" />
              </div>
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <Badge variant={data?.notifications.browserEnabled ? 'emerald' : 'neutral'}>
                  Push {data?.notifications.browserEnabled ? 'On' : 'Off'}
                </Badge>
                <Badge variant={data?.notifications.telegramEnabled ? 'sky' : 'neutral'}>
                  Telegram {data?.notifications.telegramEnabled ? 'On' : 'Off'}
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5">
                Daily digest at {data?.notifications.digestTime || '08:00'} IST
              </p>
            </Card>
          </>
        )}
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left 8 cols: Breaking + Latest Tech Headlines */}
        <div className="xl:col-span-8 space-y-6">
          {/* Breaking & High-Signal Intelligence */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-rose-500" />
                <h2 className="text-sm font-semibold tracking-tight">High-Signal & Breaking Tech</h2>
              </div>
              <Link
                to="/news?sort=important"
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Explore all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            ) : (data?.breakingNews || []).length === 0 ? (
              <EmptyState
                icon={<Newspaper className="h-5 w-5" />}
                title="No breaking stories yet"
                description="Once RSS feeds are ingested, top-scoring technology stories will surface here automatically."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(data?.breakingNews || []).slice(0, 4).map((article: Article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    compact
                    onOpenCluster={(cid) => setClusterId(cid)}
                    onToggleBookmark={(a) =>
                      articleStateMutation.mutate({
                        id: a.id,
                        patch: { is_bookmarked: !a.is_bookmarked },
                      })
                    }
                    onToggleRead={(a) =>
                      articleStateMutation.mutate({ id: a.id, patch: { is_read: !a.is_read } })
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {/* Recently Published Feed */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-500" />
                <h2 className="text-sm font-semibold tracking-tight">Latest Technology Headlines</h2>
              </div>
              <Link
                to="/news"
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Full feed <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.latestNews || []).slice(0, 5).map((article: Article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onOpenCluster={(cid) => setClusterId(cid)}
                    onToggleBookmark={(a) =>
                      articleStateMutation.mutate({
                        id: a.id,
                        patch: { is_bookmarked: !a.is_bookmarked },
                      })
                    }
                    onToggleRead={(a) =>
                      articleStateMutation.mutate({ id: a.id, patch: { is_read: !a.is_read } })
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right 4 cols: Today's Tasks, Upcoming Reminders, Notification Channels */}
        <div className="xl:col-span-4 space-y-5">
          {/* Today's Tasks */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Today&apos;s Focus Tasks</h2>
              <Link
                to="/tasks"
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View all
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : (data?.tasks.today || []).length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-zinc-500">All caught up for today.</p>
                <Button variant="ghost" size="sm" onClick={() => setTaskModalOpen(true)} className="mt-2">
                  <Plus className="h-3.5 w-3.5" /> Add a task
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {(data?.tasks.today || []).map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start gap-2.5 rounded-lg border border-zinc-100 dark:border-[#1c1c23] bg-zinc-50/60 dark:bg-[#141419] p-2.5"
                  >
                    <button
                      onClick={() => toggleTaskMutation.mutate(task)}
                      className="mt-0.5 text-zinc-400 hover:text-indigo-500 shrink-0"
                      aria-label={`Mark ${task.title} complete`}
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            task.priority === 'urgent'
                              ? 'rose'
                              : task.priority === 'high'
                              ? 'amber'
                              : 'neutral'
                          }
                        >
                          {task.priority}
                        </Badge>
                        {task.due_at && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            {formatDateTimeInTz(task.due_at, tz)}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Upcoming Reminders */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Upcoming Reminders</h2>
              <Link
                to="/reminders"
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Manage
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : (data?.reminders.upcoming || []).length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-zinc-500">No upcoming reminders scheduled.</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReminderModalOpen(true)}
                  className="mt-2"
                >
                  <Plus className="h-3.5 w-3.5" /> Schedule reminder
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {(data?.reminders.upcoming || []).map((rem) => (
                  <li
                    key={rem.id}
                    className="rounded-lg border border-zinc-100 dark:border-[#1c1c23] bg-zinc-50/60 dark:bg-[#141419] p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {rem.title}
                      </p>
                      <Badge variant="indigo">{formatRecurrenceLabel(rem.recurrence_rule)}</Badge>
                    </div>
                    <p className="text-[11px] font-mono text-zinc-500 mt-1">
                      {formatDateTimeInTz(rem.snoozed_until || rem.remind_at, rem.timezone)} ·{' '}
                      {rem.notification_channel}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Notification Status Card */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Notification Pipeline</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>
                Configure
              </Button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/80">
                <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Bell className="h-3.5 w-3.5" /> Browser Web Push
                </span>
                <Badge variant={data?.notifications.browserEnabled ? 'emerald' : 'neutral'}>
                  {data?.notifications.browserEnabled ? 'Enabled' : 'Not configured'}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/80">
                <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Send className="h-3.5 w-3.5" /> Telegram Bot
                </span>
                <Badge variant={data?.notifications.telegramEnabled ? 'sky' : 'neutral'}>
                  {data?.notifications.telegramEnabled ? 'Connected' : 'Not connected'}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Bookmark className="h-3.5 w-3.5" /> Daily Digest
                </span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  {data?.notifications.digestTime || '08:00'} ({tz})
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ArticleClusterModal clusterId={clusterId} onClose={() => setClusterId(null)} />

      <TaskFormModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={async (payload) => {
          await createTaskMutation.mutateAsync(payload);
        }}
        submitting={createTaskMutation.isPending}
      />

      <ReminderFormModal
        open={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        onSubmit={async (payload) => {
          await createReminderMutation.mutateAsync(payload);
        }}
        submitting={createReminderMutation.isPending}
      />
    </div>
  );
}
