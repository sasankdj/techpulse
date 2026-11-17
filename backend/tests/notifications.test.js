import { describe, it, expect, vi } from 'vitest';
import { formatDailyDigestTelegram, escapeHtml } from '../src/services/notifications/telegramService.js';
import { dispatchNotification } from '../src/services/notifications/notificationDispatcher.js';

function createMockSupabase({ alreadySent = false } = {}) {
  const insertedLogs = [];
  const client = {
    insertedLogs,
    from(table) {
      if (table === 'notification_logs') {
        return {
          select() {
            return {
              eq() { return this; },
              limit() {
                return Promise.resolve({ data: alreadySent ? [{ id: 'existing-log' }] : [] });
              },
            };
          },
          insert(row) {
            insertedLogs.push(row);
            return {
              select() {
                return {
                  maybeSingle() {
                    return Promise.resolve({ data: { id: 'log-1' }, error: null });
                  },
                };
              },
            };
          },
        };
      }
      return {};
    },
  };
  return client;
}

describe('Notification Delivery & Deduplication', () => {
  it('formats Telegram daily digest with escaped HTML and clickable links', () => {
    const html = formatDailyDigestTelegram(
      [
        {
          title: 'Rust <2.0> & WebAssembly Benchmarks',
          url: 'https://example.com/rust-wasm',
          importance_label: 'Important',
          content_excerpt: 'New compiler flags boost speed by 30%.',
          sources: { name: 'Ars Technica' },
        },
      ],
      '2026-11-17 (Asia/Kolkata)'
    );

    expect(html).toContain('Rust &lt;2.0&gt; &amp; WebAssembly Benchmarks');
    expect(html).toContain('<a href="https://example.com/rust-wasm">Read original article</a>');
    expect(html).toContain('Ars Technica');
  });

  it('skips duplicate notifications when dedupe_key was already sent', async () => {
    const mockSupabase = createMockSupabase({ alreadySent: true });
    const browserSender = vi.fn();

    const results = await dispatchNotification({
      userId: 'user-1',
      notificationType: 'daily_digest',
      dedupeKey: 'daily_digest:2026-11-17',
      channels: ['browser'],
      browserPayload: { title: 'Digest', body: 'Test' },
      supabase: mockSupabase,
      browserSender,
    });

    expect(results.browser.skipped).toBe(true);
    expect(results.browser.reason).toBe('ALREADY_SENT');
    expect(browserSender).not.toHaveBeenCalled();
  });

  it('logs failed delivery honestly without faking success', async () => {
    const mockSupabase = createMockSupabase({ alreadySent: false });
    const browserSender = vi.fn().mockResolvedValue({
      ok: false,
      code: 'VAPID_NOT_CONFIGURED',
      error: 'VAPID keys missing',
    });

    const results = await dispatchNotification({
      userId: 'user-1',
      notificationType: 'test',
      channels: ['browser'],
      browserPayload: { title: 'Test', body: 'Test' },
      supabase: mockSupabase,
      browserSender,
    });

    expect(results.browser.ok).toBe(false);
    expect(mockSupabase.insertedLogs).toHaveLength(1);
    expect(mockSupabase.insertedLogs[0].status).toBe('failed');
    expect(mockSupabase.insertedLogs[0].error_message).toBe('VAPID keys missing');
  });

  it('escapes special HTML characters safely', () => {
    expect(escapeHtml('<script>"alert&1"</script>')).toBe('&lt;script&gt;&quot;alert&amp;1&quot;&lt;/script&gt;');
  });
});
