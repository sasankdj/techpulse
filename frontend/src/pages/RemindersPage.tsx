import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BellRing,
  Check,
  Clock,
  Edit3,
  Plus,
  Repeat,
  Trash2,
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { formatDateTimeInTz, formatRecurrenceLabel } from '../lib/utils';
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton, Toggle } from '../components/ui/Primitives';
import { ReminderFormModal } from '../components/reminders/ReminderFormModal';
import type { Reminder } from '../types';

export function RemindersPage() {
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => api.getReminders(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['reminders'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Reminder>) => api.createReminder(payload),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Reminder scheduled', variant: 'success' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Reminder> }) =>
      api.updateReminder(id, patch),
    onSuccess: () => {
      invalidate();
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'error' }),
  });

  const snoozeMutation = useMutation({
    mutationFn: ({ id, minutes }: { id: string; minutes: number }) => api.snoozeReminder(id, minutes),
    onSuccess: (_res, vars) => {
      invalidate();
      toast({
        title: 'Reminder snoozed',
        description: `Rescheduled for ${vars.minutes >= 60 ? `${vars.minutes / 60}h` : `${vars.minutes}m`} from now.`,
        variant: 'info',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteReminder(id),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Reminder deleted', variant: 'info' });
    },
  });

  const allReminders = data?.reminders || [];
  const filtered = allReminders.filter((r) => {
    if (filter === 'active') return !r.is_completed;
    if (filter === 'completed') return r.is_completed;
    return true;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Reminders</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            One-time, daily, weekly, monthly, and custom recurring alerts in your timezone.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New Reminder
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5">
        {(['active', 'completed', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === tab
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-[#111114] border border-zinc-200 dark:border-[#222228] text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BellRing className="h-5 w-5" />}
          title="No reminders here"
          description='Try scheduling "Study DSA tomorrow at 7 AM" or "Review projects every Sunday".'
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Schedule Reminder
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {filtered.map((rem) => (
            <Card key={rem.id} className={`p-4 flex flex-col justify-between ${!rem.is_active ? 'opacity-70' : ''}`}>
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className={`text-sm font-semibold ${rem.is_completed ? 'line-through text-zinc-400' : ''}`}>
                      {rem.title}
                    </h3>
                    {rem.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{rem.description}</p>
                    )}
                  </div>
                  {!rem.is_completed && (
                    <Toggle
                      checked={rem.is_active}
                      label={`Toggle ${rem.title}`}
                      onChange={(next) =>
                        updateMutation.mutate({ id: rem.id, patch: { is_active: next } })
                      }
                    />
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="indigo">
                    <Repeat className="h-3 w-3" />
                    {formatRecurrenceLabel(rem.recurrence_rule)}
                  </Badge>
                  <Badge variant="neutral">{rem.notification_channel}</Badge>
                  {rem.snoozed_until && <Badge variant="amber">Snoozed</Badge>}
                  {rem.is_completed && <Badge variant="emerald">Completed</Badge>}
                </div>

                <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDateTimeInTz(rem.snoozed_until || rem.remind_at, rem.timezone)} ({rem.timezone})
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-[#1c1c22] flex flex-wrap items-center justify-between gap-2">
                {!rem.is_completed ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => snoozeMutation.mutate({ id: rem.id, minutes: 15 })}
                    >
                      +15m
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => snoozeMutation.mutate({ id: rem.id, minutes: 60 })}
                    >
                      +1h
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        updateMutation.mutate({
                          id: rem.id,
                          patch: { is_completed: true, is_active: false },
                        })
                      }
                    >
                      <Check className="h-3.5 w-3.5" /> Done
                    </Button>
                  </div>
                ) : (
                  <span className="text-[11px] text-zinc-400">Completed</span>
                )}

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(rem);
                      setModalOpen(true);
                    }}
                    aria-label="Edit reminder"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(rem.id)}
                    aria-label="Delete reminder"
                    className="hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ReminderFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialReminder={editing}
        submitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={async (payload) => {
          if (editing) {
            await updateMutation.mutateAsync({ id: editing.id, patch: payload });
          } else {
            await createMutation.mutateAsync(payload);
          }
        }}
      />
    </div>
  );
}
