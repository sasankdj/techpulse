/**
 * Timezone-aware scheduling & recurrence utilities.
 * Default timezone: Asia/Kolkata (IST).
 */

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export function isValidTimezone(tz) {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function getSafeTimezone(tz) {
  return isValidTimezone(tz) ? tz : DEFAULT_TIMEZONE;
}

/**
 * Returns local calendar & clock parts for a Date in the given IANA timezone.
 */
export function getLocalTimeParts(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const safeTz = getSafeTimezone(timeZone);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  });

  const parts = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') {
      parts[part.type] = part.value;
    }
  }

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    timeHHMM: `${parts.hour}:${parts.minute}`,
    weekday: parts.weekday,
    timezone: safeTz,
  };
}

/**
 * Determines if a daily digest scheduled at `digestTime` ("HH:MM") should fire now
 * within a configurable catch-up grace window (default 30 minutes) so server restarts
 * right at 8:00 AM still deliver the digest without duplicating (deduped by dateKey in DB).
 */
export function isDigestWindowDue({ digestTime = '08:00', timezone = DEFAULT_TIMEZONE, now = new Date(), graceMinutes = 30 }) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(digestTime || '08:00').trim());
  const targetHour = match ? Number(match[1]) : 8;
  const targetMinute = match ? Number(match[2]) : 0;

  const local = getLocalTimeParts(now, timezone);
  const currentTotalMinutes = local.hour * 60 + local.minute;
  const targetTotalMinutes = targetHour * 60 + targetMinute;
  const diff = currentTotalMinutes - targetTotalMinutes;

  return {
    due: diff >= 0 && diff <= graceMinutes,
    dateKey: local.dateKey,
    localTime: local.timeHHMM,
  };
}

/**
 * Computes the next ISO timestamp for a recurring reminder or task.
 * Returns null if recurrenceRule is 'once' or invalid.
 *
 * Supported rules:
 * - 'once'
 * - 'daily'
 * - 'weekly'
 * - 'monthly'
 * - 'custom:N:days'   (e.g. 'custom:3:days')
 * - 'custom:N:weeks'  (e.g. 'custom:2:weeks')
 * - 'custom:N:hours'  (e.g. 'custom:6:hours')
 * - 'custom:weekdays:0,2,4' (0=Sun .. 6=Sat)
 */
export function computeNextOccurrence(currentIso, recurrenceRule, now = new Date()) {
  if (!recurrenceRule || recurrenceRule === 'once') {
    return null;
  }

  const base = new Date(currentIso);
  if (Number.isNaN(base.getTime())) {
    return null;
  }

  const nowMs = new Date(now).getTime();
  let next = new Date(base.getTime());

  const stepOnce = (d) => {
    const copy = new Date(d.getTime());
    if (recurrenceRule === 'daily') {
      copy.setUTCDate(copy.getUTCDate() + 1);
      return copy;
    }
    if (recurrenceRule === 'weekly') {
      copy.setUTCDate(copy.getUTCDate() + 7);
      return copy;
    }
    if (recurrenceRule === 'monthly') {
      const origDay = copy.getUTCDate();
      copy.setUTCMonth(copy.getUTCMonth() + 1);
      if (copy.getUTCDate() < origDay) {
        copy.setUTCDate(0);
      }
      return copy;
    }

    const intervalMatch = /^custom:(\d+):(hours|days|weeks)$/i.exec(recurrenceRule);
    if (intervalMatch) {
      const amount = Math.max(1, Number(intervalMatch[1]));
      const unit = intervalMatch[2].toLowerCase();
      if (unit === 'hours') copy.setUTCHours(copy.getUTCHours() + amount);
      else if (unit === 'days') copy.setUTCDate(copy.getUTCDate() + amount);
      else if (unit === 'weeks') copy.setUTCDate(copy.getUTCDate() + amount * 7);
      return copy;
    }

    const weekdayMatch = /^custom:weekdays:([0-6](?:,[0-6])*)$/i.exec(recurrenceRule);
    if (weekdayMatch) {
      const allowedDays = new Set(weekdayMatch[1].split(',').map(Number));
      for (let i = 1; i <= 7; i += 1) {
        const candidate = new Date(copy.getTime());
        candidate.setUTCDate(candidate.getUTCDate() + i);
        if (allowedDays.has(candidate.getUTCDay())) {
          return candidate;
        }
      }
    }

    return null;
  };

  // Always advance at least once, and keep advancing if the reminder fell behind while server was down
  let guard = 0;
  do {
    next = stepOnce(next);
    if (!next) return null;
    guard += 1;
  } while (next.getTime() <= nowMs && guard < 366);

  return next.toISOString();
}
