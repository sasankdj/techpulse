import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setSupabaseClientForTests } from '../src/config/supabase.js';

describe('TechPulse REST API Endpoints & Authentication', () => {
  const app = createApp();

  afterEach(() => {
    setSupabaseClientForTests(null);
  });

  it('GET /api/health returns service status and capability flags', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('techpulse-api');
    expect(res.body.capabilities).toHaveProperty('supabaseConfigured');
    expect(res.body.capabilities).toHaveProperty('webPushConfigured');
  });

  it('blocks unauthenticated access to protected task, reminder, and telegram endpoints', async () => {
    const [tasksRes, remindersRes, tgRes] = await Promise.all([
      request(app).get('/api/tasks'),
      request(app).get('/api/reminders'),
      request(app).get('/api/telegram/status'),
    ]);

    expect(tasksRes.status).toBe(401);
    expect(tasksRes.body.code).toBe('UNAUTHORIZED');
    expect(remindersRes.status).toBe(401);
    expect(tgRes.status).toBe(401);
  });

  it('rejects invalid Bearer JWT tokens with 401', async () => {
    setSupabaseClientForTests({
      auth: {
        async getUser() {
          return { data: { user: null }, error: { message: 'Invalid JWT' } };
        },
      },
    });

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer invalid-token-value');

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_TOKEN');
  });

  it('validates request body when creating a task with an authenticated user', async () => {
    setSupabaseClientForTests({
      auth: {
        async getUser() {
          return { data: { user: { id: 'user-123', email: 'dev@techpulse.app' } }, error: null };
        },
      },
    });

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', 'Bearer valid-mock-token')
      .send({ title: '', priority: 'invalid_priority' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it('returns 404 JSON on unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
