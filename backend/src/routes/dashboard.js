import { Router } from 'express';
import { requireSupabase } from '../config/supabase.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/stats', optionalAuth, async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const since24h = new Date(Date.now() - 24 * 3600000).toISOString();

    const [
      { count: totalArticles },
      { count: last24hArticles },
      { count: breakingCount },
      { count: activeSources },
      { data: breakingNews },
      { data: latestNews },
    ] = await Promise.all([
      supabase.from('articles').select('id', { count: 'exact', head: true }),
      supabase.from('articles').select('id', { count: 'exact', head: true }).gte('published_at', since24h),
      supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .in('importance_label', ['Breaking', 'Trending'])
        .gte('published_at', since24h),
      supabase.from('sources').select('id', { count: 'exact', head: true }).eq('enabled', true),
      supabase
        .from('articles')
        .select('id, title, url, importance_score, importance_label, published_at, corroboration_count, cluster_id, content_excerpt, sources(name, favicon_url)')
        .in('importance_label', ['Breaking', 'Trending', 'Important'])
        .order('importance_score', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(6),
      supabase
        .from('articles')
        .select('id, title, url, importance_score, importance_label, published_at, corroboration_count, cluster_id, content_excerpt, sources(name, favicon_url)')
        .order('published_at', { ascending: false })
        .limit(8),
    ]);

    let taskStats = { total: 0, completed: 0, pending: 0, overdue: 0, completionPercentage: 0 };
    let todayTasks = [];
    let upcomingReminders = [];
    let notificationStatus = { browserEnabled: false, telegramEnabled: false, digestTime: '08:00', timezone: 'Asia/Kolkata' };
    let bookmarkedCount = 0;

    if (req.user) {
      const [{ data: tasks }, { data: reminders }, { data: prefs }, { count: savedCount }] =
        await Promise.all([
          supabase.from('tasks').select('*').eq('user_id', req.user.id).order('due_at', { ascending: true }),
          supabase
            .from('reminders')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('is_active', true)
            .eq('is_completed', false)
            .order('remind_at', { ascending: true })
            .limit(6),
          supabase.from('notification_preferences').select('*').eq('user_id', req.user.id).maybeSingle(),
          supabase
            .from('user_articles')
            .select('article_id', { count: 'exact', head: true })
            .eq('user_id', req.user.id)
            .eq('is_bookmarked', true),
        ]);

      const now = new Date();
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);

      const list = (tasks || []).map((t) =>
        t.status !== 'completed' && t.due_at && new Date(t.due_at).getTime() < now.getTime()
          ? { ...t, status: 'overdue' }
          : t
      );

      const total = list.length;
      const completed = list.filter((t) => t.status === 'completed').length;
      const overdue = list.filter((t) => t.status === 'overdue').length;
      taskStats = {
        total,
        completed,
        pending: total - completed,
        overdue,
        completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };

      todayTasks = list
        .filter((t) => t.status !== 'completed' && (!t.due_at || new Date(t.due_at).getTime() <= endOfToday.getTime()))
        .slice(0, 6);

      upcomingReminders = reminders || [];
      bookmarkedCount = savedCount || 0;

      if (prefs) {
        notificationStatus = {
          browserEnabled: Boolean(prefs.browser_enabled),
          telegramEnabled: Boolean(prefs.telegram_enabled),
          hourlyNewsEnabled: Boolean(prefs.hourly_news_enabled),
          dailyDigestEnabled: Boolean(prefs.daily_digest_enabled),
          digestTime: prefs.digest_time || '08:00',
          timezone: prefs.timezone || 'Asia/Kolkata',
        };
      }
    }

    res.json({
      news: {
        totalArticles: totalArticles || 0,
        last24hArticles: last24hArticles || 0,
        breakingOrTrending24h: breakingCount || 0,
        activeSources: activeSources || 0,
        bookmarkedCount,
      },
      breakingNews: breakingNews || [],
      latestNews: latestNews || [],
      tasks: {
        stats: taskStats,
        today: todayTasks,
      },
      reminders: {
        upcoming: upcomingReminders,
      },
      notifications: notificationStatus,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
