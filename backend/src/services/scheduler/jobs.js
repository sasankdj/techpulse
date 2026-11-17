import { getSupabaseAdmin } from '../../config/supabase.js';
import { runIngestionCycle } from '../news/rssIngestor.js';
import { dispatchNotification } from '../notifications/notificationDispatcher.js';
import {
  formatDailyDigestTelegram,
  formatHourlyNewsTelegram,
  formatReminderTelegram,
  formatTaskDeadlineTelegram,
} from '../notifications/telegramService.js';
import { computeNextOccurrence, isDigestWindowDue, getSafeTimezone } from './recurrence.js';

function getEnabledChannels(prefs, requestedChannel = 'both') {
  const channels = [];
  if (prefs?.browser_enabled && (requestedChannel === 'both' || requestedChannel === 'browser')) {
    channels.push('browser');
  }
  if (prefs?.telegram_enabled && (requestedChannel === 'both' || requestedChannel === 'telegram')) {
    channels.push('telegram');
  }
  return channels;
}

/**
 * 1. Hourly RSS ingestion + Hourly important news alerts
 */
export async function runHourlyNewsJob({ supabase = getSupabaseAdmin(), ingestFn = runIngestionCycle, dispatcher = dispatchNotification } = {}) {
  if (!supabase) {
    return { skipped: true, reason: 'SUPABASE_NOT_CONFIGURED' };
  }

  const ingestionResult = await ingestFn();
  const newIds = ingestionResult.newArticleIds || [];
  if (newIds.length === 0) {
    return { ingestionResult, usersNotified: 0, reason: 'NO_NEW_ARTICLES' };
  }

  const { data: newArticles } = await supabase
    .from('articles')
    .select('id, title, url, description, content_excerpt, importance_score, importance_label, cluster_id, sources(name)')
    .in('id', newIds)
    .order('importance_score', { ascending: false });

  if (!newArticles || newArticles.length === 0) {
    return { ingestionResult, usersNotified: 0 };
  }

  // Deduplicate by event cluster_id so users aren't spammed with 3 stories on the same announcement
  const dedupedNewArticles = [];
  const seenClusters = new Set();
  for (const art of newArticles) {
    if (art.cluster_id && seenClusters.has(art.cluster_id)) continue;
    if (art.cluster_id) seenClusters.add(art.cluster_id);
    dedupedNewArticles.push(art);
  }

  const { data: prefsList } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('hourly_news_enabled', true);

  let usersNotified = 0;

  for (const prefs of prefsList || []) {
    const channels = getEnabledChannels(prefs, 'both');
    if (channels.length === 0) continue;

    const threshold = prefs.importance_threshold ?? 60;
    const qualifying = dedupedNewArticles
      .filter((a) => Number(a.importance_score) >= threshold)
      .slice(0, 5);

    if (qualifying.length === 0) continue;

    const top = qualifying[0];
    const hourBucket = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
    const dedupeKey = `hourly:${hourBucket}:${top.id}`;

    await dispatcher({
      userId: prefs.user_id,
      notificationType: 'hourly_news',
      referenceId: top.id,
      dedupeKey,
      channels,
      browserPayload: {
        title:
          qualifying.length === 1
            ? `[${top.importance_label}] ${top.title}`
            : `${qualifying.length} important tech updates`,
        body:
          qualifying.length === 1
            ? `${top.sources?.name || 'TechPulse'} — ${(top.content_excerpt || top.description || '').slice(0, 120)}`
            : `Top: ${top.title}`,
        url: qualifying.length === 1 ? top.url : '/news',
        type: 'hourly_news',
        referenceId: top.id,
        tag: `techpulse-hourly-${hourBucket}`,
      },
      telegramHtml: formatHourlyNewsTelegram(qualifying),
      supabase,
    });

    usersNotified += 1;
  }

  return { ingestionResult, usersNotified };
}

/**
 * 2. Daily Digest Job (default 08:00 Asia/Kolkata, respects each user's configured time & timezone)
 */
export async function runDailyDigestCheckJob({ now = new Date(), supabase = getSupabaseAdmin(), dispatcher = dispatchNotification } = {}) {
  if (!supabase) {
    return { skipped: true, reason: 'SUPABASE_NOT_CONFIGURED' };
  }

  const { data: prefsList } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('daily_digest_enabled', true);

  if (!prefsList || prefsList.length === 0) {
    return { checked: 0, sent: 0 };
  }

  const sinceIso = new Date(now.getTime() - 24 * 3600000).toISOString();
  const { data: recentArticles } = await supabase
    .from('articles')
    .select('id, title, url, description, content_excerpt, importance_score, importance_label, cluster_id, published_at, sources(name)')
    .gte('published_at', sinceIso)
    .order('importance_score', { ascending: false })
    .limit(40);

  // Deduplicate by event cluster_id for a clean digest
  const topDigestArticles = [];
  const seenClusters = new Set();
  for (const art of recentArticles || []) {
    if (art.cluster_id && seenClusters.has(art.cluster_id)) continue;
    if (art.cluster_id) seenClusters.add(art.cluster_id);
    topDigestArticles.push(art);
    if (topDigestArticles.length >= 8) break;
  }

  if (topDigestArticles.length === 0) {
    return { checked: prefsList.length, sent: 0, reason: 'NO_RECENT_ARTICLES' };
  }

  let sent = 0;

  for (const prefs of prefsList) {
    const channels = getEnabledChannels(prefs, 'both');
    if (channels.length === 0) continue;

    const tz = getSafeTimezone(prefs.timezone);
    const windowCheck = isDigestWindowDue({
      digestTime: prefs.digest_time || '08:00',
      timezone: tz,
      now,
      graceMinutes: 30,
    });

    if (!windowCheck.due) continue;

    const dedupeKey = `daily_digest:${windowCheck.dateKey}`;
    const res = await dispatcher({
      userId: prefs.user_id,
      notificationType: 'daily_digest',
      referenceId: windowCheck.dateKey,
      dedupeKey,
      channels,
      browserPayload: {
        title: `TechPulse Daily Digest (${windowCheck.dateKey})`,
        body: `Top ${topDigestArticles.length} tech stories: ${topDigestArticles[0].title}`,
        url: '/news',
        type: 'daily_digest',
        referenceId: windowCheck.dateKey,
        tag: `techpulse-digest-${windowCheck.dateKey}`,
      },
      telegramHtml: formatDailyDigestTelegram(topDigestArticles, `${windowCheck.dateKey} (${tz})`),
      supabase,
    });

    if (Object.values(res).some((r) => r.ok && !r.skipped)) {
      sent += 1;
    }
  }

  return { checked: prefsList.length, sent };
}

/**
 * 3. Due Reminders Job — checks one-time & recurring reminders reliably without duplicate fires.
 */
export async function runDueRemindersJob({ now = new Date(), supabase = getSupabaseAdmin(), dispatcher = dispatchNotification } = {}) {
  if (!supabase) {
    return { skipped: true, reason: 'SUPABASE_NOT_CONFIGURED' };
  }

  const nowIso = now.toISOString();
  const { data: activeReminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('is_active', true)
    .eq('is_completed', false);

  if (error || !activeReminders) {
    return { processed: 0, error: error?.message };
  }

  const dueReminders = activeReminders.filter((r) => {
    const effectiveTrigger = r.snoozed_until || r.remind_at;
    return effectiveTrigger && new Date(effectiveTrigger).getTime() <= now.getTime();
  });

  if (dueReminders.length === 0) {
    return { processed: 0 };
  }

  let processed = 0;

  for (const reminder of dueReminders) {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', reminder.user_id)
      .maybeSingle();

    const channels = getEnabledChannels(prefs, reminder.notification_channel || 'both');
    const triggerStamp = reminder.snoozed_until || reminder.remind_at;
    const dedupeKey = `reminder:${reminder.id}:${new Date(triggerStamp).toISOString()}`;

    if (channels.length > 0) {
      await dispatcher({
        userId: reminder.user_id,
        notificationType: 'reminder',
        referenceId: reminder.id,
        dedupeKey,
        channels,
        browserPayload: {
          title: `Reminder: ${reminder.title}`,
          body: reminder.description || 'Scheduled TechPulse reminder is due now.',
          url: '/reminders',
          type: 'reminder',
          referenceId: reminder.id,
          tag: `techpulse-reminder-${reminder.id}`,
        },
        telegramHtml: formatReminderTelegram(reminder),
        supabase,
      });
    }

    // Advance recurring reminder or complete one-time reminder
    const nextRun = computeNextOccurrence(reminder.remind_at, reminder.recurrence_rule, now);
    if (nextRun) {
      await supabase
        .from('reminders')
        .update({
          remind_at: nextRun,
          snoozed_until: null,
          last_triggered_at: nowIso,
        })
        .eq('id', reminder.id);
    } else {
      await supabase
        .from('reminders')
        .update({
          is_active: false,
          is_completed: true,
          snoozed_until: null,
          last_triggered_at: nowIso,
        })
        .eq('id', reminder.id);
    }

    processed += 1;
  }

  return { processed };
}

/**
 * 4. Task Deadline Alert & Overdue Status Job
 */
export async function runTaskDeadlineAlertsJob({ now = new Date(), supabase = getSupabaseAdmin(), dispatcher = dispatchNotification } = {}) {
  if (!supabase) {
    return { skipped: true, reason: 'SUPABASE_NOT_CONFIGURED' };
  }

  const nowIso = now.toISOString();
  const soonIso = new Date(now.getTime() + 60 * 60000).toISOString(); // due within 60 mins

  // Mark past-due non-completed tasks as 'overdue'
  await supabase
    .from('tasks')
    .update({ status: 'overdue' })
    .in('status', ['todo', 'in_progress'])
    .lt('due_at', nowIso);

  // Find tasks due within 60 mins or overdue that haven't been notified yet
  const { data: dueTasks } = await supabase
    .from('tasks')
    .select('*')
    .neq('status', 'completed')
    .is('deadline_notified_at', null)
    .not('due_at', 'is', null)
    .lte('due_at', soonIso);

  let notified = 0;

  for (const task of dueTasks || []) {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', task.user_id)
      .maybeSingle();

    const channels = getEnabledChannels(prefs, 'both');
    const dedupeKey = `task_deadline:${task.id}:${task.due_at}`;

    if (channels.length > 0) {
      await dispatcher({
        userId: task.user_id,
        notificationType: 'task_deadline',
        referenceId: task.id,
        dedupeKey,
        channels,
        browserPayload: {
          title: `Task Due Soon: ${task.title}`,
          body: `Priority: ${task.priority.toUpperCase()}${task.description ? ` — ${task.description.slice(0, 100)}` : ''}`,
          url: '/tasks',
          type: 'task_deadline',
          referenceId: task.id,
          tag: `techpulse-task-${task.id}`,
        },
        telegramHtml: formatTaskDeadlineTelegram(task),
        supabase,
      });
    }

    await supabase
      .from('tasks')
      .update({ deadline_notified_at: nowIso })
      .eq('id', task.id);

    notified += 1;
  }

  return { notified };
}
