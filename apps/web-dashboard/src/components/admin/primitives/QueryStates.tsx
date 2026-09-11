import React from 'react';
import { Loader2, Inbox, AlertOctagon, ShieldOff, ServerCrash, RotateCw } from 'lucide-react';

/**
 * The five states every data-driven Admin page must account for (spec §12).
 * Never silently swallow an error or fall back to fabricated data -- one of
 * these renders instead.
 */

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3 py-14 text-[var(--adm-ink-3)]">
    <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
    <span className="text-sm">{label}</span>
  </div>
);

export const EmptyState: React.FC<{ title: string; description?: string; action?: React.ReactNode }> = ({
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center gap-2 py-14 text-center px-6">
    <Inbox className="w-7 h-7 text-[var(--adm-ink-3)]" aria-hidden="true" />
    <div className="text-sm font-medium text-[var(--adm-ink)]">{title}</div>
    {description && <p className="text-xs text-[var(--adm-ink-3)] max-w-sm">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = 'Something went wrong while loading this data.',
  onRetry,
}) => (
  <div role="alert" className="flex flex-col items-center justify-center gap-2 py-14 text-center px-6">
    <AlertOctagon className="w-7 h-7 text-[var(--adm-critical)]" aria-hidden="true" />
    <div className="text-sm font-medium text-[var(--adm-ink)]">{message}</div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-2 inline-flex items-center gap-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)]"
      >
        <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
        Try again
      </button>
    )}
  </div>
);

export const PermissionDeniedState: React.FC<{ message?: string }> = ({
  message = 'You do not have permission to view this.',
}) => (
  <div role="alert" className="flex flex-col items-center justify-center gap-2 py-14 text-center px-6">
    <ShieldOff className="w-7 h-7 text-[var(--adm-warning)]" aria-hidden="true" />
    <div className="text-sm font-medium text-[var(--adm-ink)]">{message}</div>
  </div>
);

export const ServiceUnavailableState: React.FC<{ service: string; onRetry?: () => void }> = ({ service, onRetry }) => (
  <div role="alert" className="flex flex-col items-center justify-center gap-2 py-14 text-center px-6">
    <ServerCrash className="w-7 h-7 text-[var(--adm-neutral)]" aria-hidden="true" />
    <div className="text-sm font-medium text-[var(--adm-ink)]">{service} is currently unavailable.</div>
    <p className="text-xs text-[var(--adm-ink-3)]">Please check the service and try again.</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-2 inline-flex items-center gap-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)]"
      >
        <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
        Try again
      </button>
    )}
  </div>
);

/** Maps a caught error to the correct state component + message, per spec §12/§J.6. */
export function classifyError(err: unknown): { kind: 'permission' | 'auth' | 'notfound' | 'conflict' | 'network' | 'server'; message: string } {
  const anyErr = err as any;
  const status = anyErr?.response?.status;
  const serverMessage = anyErr?.response?.data?.error || anyErr?.response?.data?.detail;
  if (status === 401) return { kind: 'auth', message: 'Your session has expired. Please sign in again.' };
  if (status === 403) return { kind: 'permission', message: serverMessage || 'You do not have permission to perform this action.' };
  if (status === 404) return { kind: 'notfound', message: serverMessage || 'Not found.' };
  if (status === 409) return { kind: 'conflict', message: serverMessage || 'This action conflicts with the current state.' };
  if (!anyErr?.response) return { kind: 'network', message: 'Unable to reach the server. Check your connection and try again.' };
  return { kind: 'server', message: serverMessage || 'Unable to load this data. Please try again.' };
}
