import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  Circle,
  Edit3,
  Plus,
  Repeat,
  Search,
  Trash2,
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { formatDateTimeInTz, formatRecurrenceLabel } from '../lib/utils';
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton } from '../components/ui/Primitives';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import type { Task } from '../types';

const VIEWS = [
  { id: 'today', label: "Today's Tasks" },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'all', label: 'All Tasks' },
  { id: 'completed', label: 'Completed' },
  { id: 'overdue', label: 'Overdue' },
];

export function TasksPage() {
  const [view, setView] = useState('all');
  const [priority, setPriority] = useState('all');
  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', { view, priority, q }],
    queryFn: () => api.getTasks({ view, priority, q: q.trim() || undefined }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Task>) => api.createTask(payload),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Task created', variant: 'success' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) => api.updateTask(id, patch),
    onSuccess: (res) => {
      invalidate();
      if (res.spawnedNextTask) {
        toast({
          title: 'Recurring task completed',
          description: 'Next recurring occurrence has been scheduled automatically.',
          variant: 'success',
        });
      }
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Task deleted', variant: 'info' });
    },
  });

  const stats = data?.stats || { total: 0, completed: 0, pending: 0, overdue: 0, completionPercentage: 0 };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My Tasks</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Track priorities, deadlines, subtasks, and recurring workflows.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingTask(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3.5">
          <p className="text-[11px] text-zinc-500">Total Tasks</p>
          <p className="text-xl font-semibold font-mono mt-1">{stats.total}</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[11px] text-zinc-500">Completed</p>
          <p className="text-xl font-semibold font-mono text-emerald-500 mt-1">{stats.completed}</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[11px] text-zinc-500">Pending / Overdue</p>
          <p className="text-xl font-semibold font-mono mt-1">
            {stats.pending}{' '}
            {stats.overdue > 0 && <span className="text-xs text-rose-500">({stats.overdue} overdue)</span>}
          </p>
        </Card>
        <Card className="p-3.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>Completion Rate</span>
            <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
              {stats.completionPercentage}%
            </span>
          </div>
          <div className="mt-2.5 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Views + Search/Priority Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {VIEWS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                view === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-[#111114] border border-zinc-200 dark:border-[#222228] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter tasks..."
              className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] pl-8 pr-3 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            aria-label="Filter by priority"
            className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] px-2.5 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {error ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (data?.tasks || []).length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-5 w-5" />}
          title="No tasks in this view"
          description="Create a task with priorities, subtasks, and deadlines to keep your workflow organized."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingTask(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Create Task
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {(data?.tasks || []).map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <Card key={task.id} className={`p-4 ${isCompleted ? 'opacity-70' : ''}`}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() =>
                      updateMutation.mutate({
                        id: task.id,
                        patch: { status: isCompleted ? 'todo' : 'completed' },
                      })
                    }
                    className="mt-0.5 text-zinc-400 hover:text-indigo-500 transition-colors shrink-0"
                    aria-label={isCompleted ? 'Reopen task' : 'Complete task'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm font-medium ${
                          isCompleted ? 'line-through text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        {task.title}
                      </h3>
                      <Badge
                        variant={
                          task.priority === 'urgent'
                            ? 'rose'
                            : task.priority === 'high'
                            ? 'amber'
                            : task.priority === 'medium'
                            ? 'indigo'
                            : 'neutral'
                        }
                      >
                        {task.priority}
                      </Badge>
                      <Badge
                        variant={
                          task.status === 'overdue'
                            ? 'rose'
                            : task.status === 'completed'
                            ? 'emerald'
                            : task.status === 'in_progress'
                            ? 'sky'
                            : 'neutral'
                        }
                      >
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="neutral">{task.category}</Badge>
                      {task.recurrence_rule && (
                        <Badge variant="indigo">
                          <Repeat className="h-3 w-3" />
                          {formatRecurrenceLabel(task.recurrence_rule)}
                        </Badge>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Subtasks checklist */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <ul className="mt-2.5 space-y-1 pl-1">
                        {task.subtasks.map((st) => (
                          <li key={st.id} className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={st.completed}
                              onChange={() => {
                                const nextSubtasks = task.subtasks.map((x) =>
                                  x.id === st.id ? { ...x, completed: !x.completed } : x
                                );
                                updateMutation.mutate({
                                  id: task.id,
                                  patch: { subtasks: nextSubtasks },
                                });
                              }}
                              className="rounded border-zinc-400 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span
                              className={
                                st.completed
                                  ? 'line-through text-zinc-400'
                                  : 'text-zinc-700 dark:text-zinc-300'
                              }
                            >
                              {st.title}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {task.due_at && (
                      <p className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500">
                        <Calendar className="h-3 w-3" />
                        Due {formatDateTimeInTz(task.due_at, 'Asia/Kolkata')} IST
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingTask(task);
                        setModalOpen(true);
                      }}
                      aria-label="Edit task"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(task.id)}
                      aria-label="Delete task"
                      className="hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <TaskFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTask={editingTask}
        submitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={async (payload) => {
          if (editingTask) {
            await updateMutation.mutateAsync({ id: editingTask.id, patch: payload });
          } else {
            await createMutation.mutateAsync(payload);
          }
        }}
      />
    </div>
  );
}
