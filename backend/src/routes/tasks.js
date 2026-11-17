import { Router } from 'express';
import { z } from 'zod';
import { requireSupabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { computeNextOccurrence } from '../services/scheduler/recurrence.js';

const router = Router();

const subtaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  completed: z.boolean(),
});

const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(200),
  description: z.string().max(2000).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'completed', 'overdue']).default('todo'),
  category: z.string().trim().min(1).max(60).default('General'),
  subtasks: z.array(subtaskSchema).default([]),
  recurrence_rule: z.string().max(50).nullable().optional(),
  due_at: z.string().datetime({ offset: true }).nullable().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const { view = 'all', priority, category, q } = req.query;

    const { data: allTasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // Derive effective status (mark past-due open tasks as overdue dynamically)
    const normalizedTasks = (allTasks || []).map((t) => {
      if (t.status !== 'completed' && t.due_at && new Date(t.due_at).getTime() < now.getTime()) {
        return { ...t, status: 'overdue' };
      }
      return t;
    });

    const total = normalizedTasks.length;
    const completed = normalizedTasks.filter((t) => t.status === 'completed').length;
    const overdue = normalizedTasks.filter((t) => t.status === 'overdue').length;
    const pending = total - completed;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    let filtered = normalizedTasks;
    if (view === 'today') {
      filtered = filtered.filter((t) => {
        if (t.status === 'completed') return false;
        if (!t.due_at) return false;
        const due = new Date(t.due_at).getTime();
        return due >= startOfToday.getTime() && due <= endOfToday.getTime();
      });
    } else if (view === 'upcoming') {
      filtered = filtered.filter(
        (t) => t.status !== 'completed' && t.due_at && new Date(t.due_at).getTime() > endOfToday.getTime()
      );
    } else if (view === 'completed') {
      filtered = filtered.filter((t) => t.status === 'completed');
    } else if (view === 'overdue') {
      filtered = filtered.filter((t) => t.status === 'overdue');
    }

    if (priority && ['low', 'medium', 'high', 'urgent'].includes(String(priority))) {
      filtered = filtered.filter((t) => t.priority === String(priority));
    }

    if (category && String(category) !== 'all') {
      filtered = filtered.filter((t) => t.category.toLowerCase() === String(category).toLowerCase());
    }

    if (q && String(q).trim()) {
      const term = String(q).trim().toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          (t.description || '').toLowerCase().includes(term)
      );
    }

    res.json({
      tasks: filtered,
      stats: {
        total,
        completed,
        pending,
        overdue,
        completionPercentage,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', validateBody(createTaskSchema), async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const payload = {
      ...req.body,
      user_id: req.user.id,
      completed_at: req.body.status === 'completed' ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase.from('tasks').insert(payload).select('*').single();
    if (error) throw error;
    res.status(201).json({ task: data });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validateBody(updateTaskSchema), async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const { data: existing, error: fetchErr } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existing) {
      return res.status(404).json({ error: 'Task not found', code: 'NOT_FOUND' });
    }

    const updates = { ...req.body };
    const transitioningToComplete =
      updates.status === 'completed' && existing.status !== 'completed';
    const reopening =
      updates.status && updates.status !== 'completed' && existing.status === 'completed';

    if (transitioningToComplete) {
      updates.completed_at = new Date().toISOString();
    } else if (reopening) {
      updates.completed_at = null;
    }

    if (updates.due_at && updates.due_at !== existing.due_at) {
      updates.deadline_notified_at = null;
    }

    const { data: updated, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('*')
      .single();

    if (error) throw error;

    // If a recurring task was just completed, spawn the next occurrence cleanly
    let spawnedNextTask = null;
    if (transitioningToComplete && existing.recurrence_rule && existing.recurrence_rule !== 'once') {
      const nextDue = computeNextOccurrence(
        existing.due_at || new Date().toISOString(),
        existing.recurrence_rule
      );
      if (nextDue) {
        const resetSubtasks = (existing.subtasks || []).map((st) => ({ ...st, completed: false }));
        const { data: nextTask } = await supabase
          .from('tasks')
          .insert({
            user_id: req.user.id,
            title: existing.title,
            description: existing.description,
            priority: existing.priority,
            status: 'todo',
            category: existing.category,
            subtasks: resetSubtasks,
            recurrence_rule: existing.recurrence_rule,
            due_at: nextDue,
          })
          .select('*')
          .single();
        spawnedNextTask = nextTask || null;
      }
    }

    res.json({ task: updated, spawnedNextTask });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id');

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Task not found', code: 'NOT_FOUND' });
    }
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default router;
