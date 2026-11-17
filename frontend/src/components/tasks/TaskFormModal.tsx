import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Subtask, Task, TaskPriority, TaskStatus } from '../../types';
import { Button, Modal } from '../ui/Primitives';

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  initialTask?: Task | null;
  onSubmit: (payload: Partial<Task>) => Promise<void>;
  submitting?: boolean;
}

const CATEGORIES = ['General', 'Engineering', 'Learning', 'DevOps', 'Personal', 'Projects', 'Research'];

function toLocalDateTimeInput(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TaskFormModal({ open, onClose, initialTask, onSubmit, submitting }: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [category, setCategory] = useState('General');
  const [dueLocal, setDueLocal] = useState('');
  const [recurrenceRule, setRecurrenceRule] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(initialTask?.title || '');
      setDescription(initialTask?.description || '');
      setPriority(initialTask?.priority || 'medium');
      setStatus(initialTask?.status || 'todo');
      setCategory(initialTask?.category || 'General');
      setDueLocal(toLocalDateTimeInput(initialTask?.due_at));
      setRecurrenceRule(initialTask?.recurrence_rule || '');
      setSubtasks(initialTask?.subtasks || []);
      setNewSubtask('');
    }
  }, [open, initialTask]);

  const handleAddSubtask = () => {
    const trimmed = newSubtask.trim();
    if (!trimmed) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, title: trimmed, completed: false },
    ]);
    setNewSubtask('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status,
      category,
      subtasks,
      recurrence_rule: recurrenceRule || null,
      due_at: dueLocal ? new Date(dueLocal).toISOString() : null,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialTask ? 'Edit Task' : 'Create Task'}
      description="Organize deadlines, priorities, subtasks, and optional recurrence."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Deploy TechPulse backend to Render"
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
            placeholder="Optional context or checklist notes..."
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] p-2.5 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-2.5 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-2.5 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-2.5 text-sm focus:outline-none focus:border-indigo-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Recurrence
            </label>
            <select
              value={recurrenceRule}
              onChange={(e) => setRecurrenceRule(e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-2.5 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">One-time (no repeat)</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Deadline
          </label>
          <input
            type="datetime-local"
            value={dueLocal}
            onChange={(e) => setDueLocal(e.target.value)}
            className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-3 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Subtasks */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Subtasks
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              placeholder="Add a subtask..."
              className="flex-1 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d10] px-3 text-xs focus:outline-none focus:border-indigo-500"
            />
            <Button type="button" variant="secondary" size="sm" onClick={handleAddSubtask}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          {subtasks.length > 0 && (
            <ul className="space-y-1.5 max-h-32 overflow-y-auto">
              {subtasks.map((st) => (
                <li
                  key={st.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-zinc-100/70 dark:bg-[#17171d] px-2.5 py-1.5 text-xs"
                >
                  <label className="flex items-center gap-2 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() =>
                        setSubtasks((prev) =>
                          prev.map((x) => (x.id === st.id ? { ...x, completed: !x.completed } : x))
                        )
                      }
                      className="rounded border-zinc-400 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className={st.completed ? 'line-through text-zinc-400 truncate' : 'truncate'}>
                      {st.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setSubtasks((prev) => prev.filter((x) => x.id !== st.id))}
                    className="text-zinc-400 hover:text-rose-500"
                    aria-label="Remove subtask"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Saving...' : initialTask ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
