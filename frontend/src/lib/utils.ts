export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const absSec = Math.round(Math.abs(diffMs) / 1000);
  const future = diffMs < 0;

  if (absSec < 60) return future ? 'in <1m' : 'just now';
  const mins = Math.floor(absSec / 60);
  if (mins < 60) return future ? `in ${mins}m` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return future ? `in ${hrs}h` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return future ? `in ${days}d` : `${days}d ago`;
  return new Date(isoDate).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTimeInTz(isoDate: string, timeZone = 'Asia/Kolkata'): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone,
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(isoDate));
  } catch {
    return new Date(isoDate).toLocaleString();
  }
}

export function getGreetingForTimezone(timeZone = 'Asia/Kolkata'): string {
  try {
    const hourStr = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(new Date());
    const hour = Number(hourStr);
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  } catch {
    return 'Welcome back';
  }
}

export function formatRecurrenceLabel(rule?: string | null): string {
  if (!rule || rule === 'once') return 'One-time';
  if (rule === 'daily') return 'Daily';
  if (rule === 'weekly') return 'Weekly';
  if (rule === 'monthly') return 'Monthly';
  if (rule.startsWith('custom:weekdays:')) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = rule
      .replace('custom:weekdays:', '')
      .split(',')
      .map((d) => dayNames[Number(d)] || d)
      .join(', ');
    return `Every ${days}`;
  }
  const match = /^custom:(\d+):(hours|days|weeks)$/i.exec(rule);
  if (match) {
    return `Every ${match[1]} ${match[2]}`;
  }
  return rule;
}

export const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];
