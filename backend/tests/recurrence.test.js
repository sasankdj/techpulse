import { describe, it, expect } from 'vitest';
import {
  computeNextOccurrence,
  isDigestWindowDue,
  getLocalTimeParts,
} from '../src/services/scheduler/recurrence.js';
import { parseNaturalLanguageReminder } from '../src/services/reminders/nlParser.js';

describe('Timezone Scheduling & Reminder Recurrence', () => {
  it('accurately detects 8:00 AM IST (02:30 UTC) daily digest window', () => {
    // 02:35 UTC == 08:05 Asia/Kolkata (IST is UTC+5:30)
    const nowUtc = new Date('2026-11-17T02:35:00Z');
    const parts = getLocalTimeParts(nowUtc, 'Asia/Kolkata');
    expect(parts.timeHHMM).toBe('08:05');
    expect(parts.dateKey).toBe('2026-11-17');

    const check = isDigestWindowDue({
      digestTime: '08:00',
      timezone: 'Asia/Kolkata',
      now: nowUtc,
      graceMinutes: 30,
    });
    expect(check.due).toBe(true);
    expect(check.dateKey).toBe('2026-11-17');
  });

  it('does not trigger daily digest before configured time', () => {
    // 02:15 UTC == 07:45 IST
    const check = isDigestWindowDue({
      digestTime: '08:00',
      timezone: 'Asia/Kolkata',
      now: new Date('2026-11-17T02:15:00Z'),
    });
    expect(check.due).toBe(false);
  });

  it('computes daily, weekly, monthly, and custom weekday recurrences and handles one-time reminders', () => {
    const base = '2026-11-17T01:30:00.000Z';
    const now = new Date('2026-11-17T01:31:00.000Z');

    expect(computeNextOccurrence(base, 'once', now)).toBeNull();
    expect(computeNextOccurrence(base, 'daily', now)).toBe('2026-11-18T01:30:00.000Z');
    expect(computeNextOccurrence(base, 'weekly', now)).toBe('2026-11-24T01:30:00.000Z');
    expect(computeNextOccurrence(base, 'monthly', now)).toBe('2026-12-17T01:30:00.000Z');
    expect(computeNextOccurrence(base, 'custom:3:days', now)).toBe('2026-11-20T01:30:00.000Z');
  });

  it('parses natural language reminder phrases cleanly', () => {
    const parsed = parseNaturalLanguageReminder('Remind me to study DSA tomorrow at 7 AM', {
      now: new Date('2026-11-17T10:00:00Z'),
      timezone: 'Asia/Kolkata',
    });
    expect(parsed.title).toBe('Study DSA');
    expect(parsed.recurrenceRule).toBe('once');

    const weekly = parseNaturalLanguageReminder('Remind me every Sunday to review my projects', {
      now: new Date('2026-11-17T10:00:00Z'),
    });
    expect(weekly.recurrenceRule).toBe('custom:weekdays:0');
    expect(weekly.title.toLowerCase()).toContain('review my projects');
  });
});
