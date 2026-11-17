/**
 * Extensible Natural-Language Reminder Parser Interface.
 *
 * Initial version uses deterministic regex heuristics for common phrasing
 * ("Remind me to study DSA tomorrow at 7 AM", "Remind me every Sunday to review my projects")
 * so users can test quick-parse today, while keeping the contract ready for a future
 * local Ollama or AI parser provider without changing routes or UI.
 */

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function parseNaturalLanguageReminder(inputText, { now = new Date(), timezone = 'Asia/Kolkata' } = {}) {
  const raw = String(inputText || '').trim();
  if (!raw) return null;

  let title = raw.replace(/^remind me (to |about )?/i, '').trim();
  let recurrenceRule = 'once';
  const target = new Date(now.getTime());

  // Detect recurring patterns
  if (/\bevery\s+day\b|\bdaily\b/i.test(raw)) {
    recurrenceRule = 'daily';
  } else if (/\bevery\s+week\b|\bweekly\b/i.test(raw)) {
    recurrenceRule = 'weekly';
  } else if (/\bevery\s+month\b|\bmonthly\b/i.test(raw)) {
    recurrenceRule = 'monthly';
  } else {
    for (let i = 0; i < DAY_NAMES.length; i += 1) {
      const re = new RegExp(`\\bevery\\s+${DAY_NAMES[i]}\\b`, 'i');
      if (re.test(raw)) {
        recurrenceRule = `custom:weekdays:${i}`;
        const diff = (i - target.getDay() + 7) % 7 || 7;
        target.setDate(target.getDate() + diff);
        break;
      }
    }
  }

  // Detect relative date
  if (/\btomorrow\b/i.test(raw)) {
    target.setDate(target.getDate() + 1);
  } else if (recurrenceRule === 'once') {
    for (let i = 0; i < DAY_NAMES.length; i += 1) {
      const re = new RegExp(`\\b(on\\s+|next\\s+)?${DAY_NAMES[i]}\\b`, 'i');
      if (re.test(raw)) {
        const diff = (i - target.getDay() + 7) % 7 || 7;
        target.setDate(target.getDate() + diff);
        break;
      }
    }
  }

  // Detect clock time e.g. "at 7 AM", "at 18:30", "at 9:15 pm"
  const timeMatch = /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i.exec(raw);
  if (timeMatch) {
    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2] || 0);
    const meridiem = (timeMatch[3] || '').toLowerCase();
    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;
    target.setHours(hours, minutes, 0, 0);
  } else {
    target.setHours(9, 0, 0, 0);
  }

  // Clean timing phrases out of title
  title = title
    .replace(/\b(tomorrow|today|every\s+(day|week|month|sunday|monday|tuesday|wednesday|thursday|friday|saturday))\b/gi, '')
    .replace(/\b(on\s+|next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi, '')
    .replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(am|pm)?\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^to\s+/i, '')
    .trim();

  if (!title) title = raw;

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    remindAt: target.toISOString(),
    timezone,
    recurrenceRule,
    parser: 'rule_based_v1',
  };
}
