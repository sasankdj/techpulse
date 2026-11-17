import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-200/90 dark:border-[#222228] bg-white dark:bg-[#111114] transition-colors',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'icon';
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/40 shadow-sm disabled:opacity-50',
    secondary:
      'bg-zinc-100 hover:bg-zinc-200/80 dark:bg-[#1a1a20] dark:hover:bg-[#22222a] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-[#2a2a33] disabled:opacity-50',
    ghost:
      'bg-transparent hover:bg-zinc-100 dark:hover:bg-[#1a1a20] text-zinc-600 dark:text-zinc-300 border border-transparent disabled:opacity-50',
    danger:
      'bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 border border-rose-500/25 disabled:opacity-50',
  };

  const sizes = {
    sm: 'h-8 px-2.5 text-xs rounded-lg gap-1.5',
    md: 'h-9 px-3.5 text-sm rounded-lg gap-2',
    icon: 'h-9 w-9 rounded-lg justify-center',
  };

  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
    />
  );
}

export function Badge({
  children,
  variant = 'neutral',
  className,
}: {
  children: React.ReactNode;
  variant?: 'neutral' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
  className?: string;
}) {
  const styles = {
    neutral: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/60',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 border-sky-200 dark:border-sky-500/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-tight',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50',
        checked
          ? 'bg-indigo-600 border-indigo-500'
          : 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1'
        )}
      />
    </button>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-zinc-200/80 dark:bg-zinc-800/70', className)} />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 py-12 px-6 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 py-10 px-6 text-center">
      <AlertTriangle className="h-6 w-6 text-rose-500 mb-2.5" />
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-[#26262e] bg-white dark:bg-[#111114] shadow-2xl max-h-[90vh] flex flex-col animate-slide-up',
          maxWidth
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 dark:border-[#202026] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
            {description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
