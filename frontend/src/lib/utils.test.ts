import { describe, it, expect } from 'vitest';
import { formatRecurrenceLabel, getGreetingForTimezone } from './utils';
import { SIDEBAR_NAV_ITEMS } from '../components/layout/navigation';

describe('TechPulse Frontend Utilities & Navigation', () => {
  it('formats recurrence rules into readable labels', () => {
    expect(formatRecurrenceLabel('once')).toBe('One-time');
    expect(formatRecurrenceLabel('daily')).toBe('Daily');
    expect(formatRecurrenceLabel('weekly')).toBe('Weekly');
    expect(formatRecurrenceLabel('monthly')).toBe('Monthly');
    expect(formatRecurrenceLabel('custom:3:days')).toBe('Every 3 days');
    expect(formatRecurrenceLabel('custom:weekdays:0')).toBe('Every Sun');
  });

  it('returns a valid greeting for Asia/Kolkata timezone', () => {
    const greeting = getGreetingForTimezone('Asia/Kolkata');
    expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greeting);
  });

  it('includes all 16 required sidebar navigation items', () => {
    expect(SIDEBAR_NAV_ITEMS).toHaveLength(16);
    const labels = SIDEBAR_NAV_ITEMS.map((item) => item.label);
    expect(labels).toEqual([
      'Overview',
      'All News',
      'AI & Machine Learning',
      'Programming',
      'Startups',
      'Cybersecurity',
      'Hardware',
      'Cloud & DevOps',
      'Open Source',
      'Science & Space',
      'Gaming',
      'My Tasks',
      'Reminders',
      'Saved Articles',
      'Notifications',
      'Settings',
    ]);
  });
});
