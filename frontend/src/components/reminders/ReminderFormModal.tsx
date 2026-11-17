import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { NotificationChannel, Reminder } from '../../types';
import { COMMON_TIMEZONES } from '../../lib/utils';
import { Button, Modal } from '../ui/Primitives';

interface ReminderFormModalProps {
  open: boolean;
  onClose: () => void;
  initialReminder?: Reminder | null;
  onSubmit: (payload: Partial<Reminder>) => Promise<void>;
  submitting?: boolean;
}

function getDefaultDateTime() {
  const d = new Date(Date.now() + 3600000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function ReminderFormModal({
  open,
  onClose,
  initialReminder,
  onSubmit,
  submitting,
}: ReminderFormModalProps) {
  const [quickText, setQuickText] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [recurrenceType, setRecurrenceType] = useState('once');
  const [customDays, setCustomDays] = useState('3');
  const [channel, setChannel] = useState<NotificationChannel>('both');

  useEffect(() => {
    if (open) {
      const defaults = getDefaultDateTime();
      setQuickText('');
      if (initialReminder) {
        const d = new Date(initialReminder.remind_at);
        const pad = (n: number) => String(n).padStart(2, '0');
        setTitle(initialReminder.title);
        setDescription(initialReminder.description || '');
        setDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
        setTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
        setTimezone(initialReminder.timezone || 'Asia/Kolkata');
        if (initialReminder.recurrence_rule?.startsWith('custom:')) {
          setRecurrenceType('custom');
          const m = /^custom:(\d+):days/.exec(initialReminder.recurrence_rule);
          if (m) setCustomDays(m[1]);
        } else {
          setRecurrenceType(initialReminder.recurrence_rule || 'once');
        }
        setChannel(initialReminder.notification_channel || 'both');
      } else {
        setTitle('');
        setDescription('');
        setDate(defaults.date);
        setTime(defaults.time);
        setTimezone('Asia/Kolkata');
        setRecurrenceType('once');
        setCustomDays('3');
        setChannel('both');
      }
    }
  }, [open, initialReminder]);

  const applyQuickFill = () => {
    const raw = quickText.trim();
    if (!raw) return;

    const target = new Date();
    let rec = 'once';
    if (/\bevery\s+day\b|\bdaily\b/i.test(raw)) rec = 'daily';
    else if (/\bevery\s+sunday\b|\bevery\s+week\b|\bweekly\b/i.test(raw)) rec = 'weekly';
    else if (/\bevery\s+month\b|\bmonthly\b/i.test(raw)) rec = 'monthly';

    if (/\btomorrow\b/i.test(raw)) {
      target.setDate(target.getDate() + 1);
    }

    const timeMatch = /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i.exec(raw);
    if (timeMatch) {
      let h = Number(timeMatch[1]);
      const m = Number(timeMatch[2] || 0);
      const ap = (timeMatch[3] || '').toLowerCase();
      if (ap === 'pm' && h < 12) h += 12;
      if (ap === 'am' && h === 12) h = 0;
      target.setHours(h, m, 0, 0);
    } else {
      target.setHours(8, 0, 0, 0);
    }

    const cleaned = raw
      .replace(/^remind me (to |about )?/i, '')
      .replace(/\b(tomorrow|today|every\s+(day|week|month|sunday))\b/gi, '')
      .replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(am|pm)?\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const pad = (n: number) => String(n).padStart(2, '0');
    setTitle(cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : raw);
    setDate(`${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`);
    setTime(`${pad(target.getHours())}:${pad(target.getMinutes())}`);
    setRecurrenceType(rec);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;

    const remindAtIso = new Date(`${date}T${time}:00`).toISOString();
    const recurrenceRule =
      recurrenceType === 'custom'
        ? `custom:${Math.max(1, Number(customDays) || 2)}:days`
        : recurrenceType;

    await onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      remind_at: remindAtIso,
      timezone,
      recurrence_rule: recurrenceRule,
      notification_channel: channel,
      is_active: true,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialReminder ? 'Edit Reminder' : 'Schedule Reminder'}
      description="Delivered reliably through Browser Push and/or Telegram."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Natural-language ready quick fill */}
        {!initialReminder && (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mb-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Quick natural-language fill (rule-based, AI-ready)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                placeholder='e.g. "Remind me to study DSA tomorrow at 7 AM"'
                className="flex-1 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d10] px-2.5 text-xs focus:outline-none focus:border-indigo-500"
              />
              <Button type="button" size="sm" variant="secondary" onClick={applyQuickFill}>
                Fill
              </Button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Study DSA — Dynamic Programming"
            className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-3 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes included in your notification..."
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] p-2.5 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-3 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Time *
            </label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-3 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Recurrence
            </label>
            <select
              value={recurrenceType}
              onChange={(e) => setRecurrenceType(e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-2.5 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="once">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom interval (days)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Channel
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as NotificationChannel)}
              className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-2.5 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="both">Browser Push + Telegram</option>
              <option value="browser">Browser Push only</option>
              <option value="telegram">Telegram only</option>
            </select>
          </div>
        </div>

        {recurrenceType === 'custom' && (
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Repeat every N days
            </label>
            <input
              type="number"
              min={1}
              max={90}
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              className="w-32 h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-3 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-2.5 text-sm focus:outline-none focus:border-indigo-500"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Saving...' : initialReminder ? 'Save Reminder' : 'Schedule Reminder'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
