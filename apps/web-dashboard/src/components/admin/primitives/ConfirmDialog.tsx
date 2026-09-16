import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogField {
  label: string;
  value: React.ReactNode;
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Named fields describing exactly what/who this action targets (spec §13/§J.4). */
  fields?: ConfirmDialogField[];
  consequence: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Government-grade confirmation for every destructive/high-risk Admin action.
 * Never window.confirm()/alert() -- always names the target, its current
 * state, and the precise consequence (spec §J.4).
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  fields = [],
  consequence,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(22,32,44,0.45)] p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md bg-[var(--adm-surface)] rounded-[var(--adm-radius)] shadow-[var(--adm-shadow-modal)] border border-[var(--adm-border)] outline-none"
      >
        <div className="flex items-start gap-3 px-5 pt-5">
          <div
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: destructive ? 'var(--adm-critical-bg)' : 'var(--adm-warning-bg)',
              color: destructive ? 'var(--adm-critical)' : 'var(--adm-warning)',
            }}
          >
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="confirm-dialog-title" className="text-base font-semibold text-[var(--adm-ink)]">
              {title}
            </h2>
          </div>
        </div>

        {fields.length > 0 && (
          <dl className="mx-5 mt-4 rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-raised)] p-3 space-y-1.5">
            {fields.map((f) => (
              <div key={f.label} className="flex items-baseline justify-between gap-3 text-xs">
                <dt className="text-[var(--adm-ink-3)]">{f.label}</dt>
                <dd className="font-medium text-[var(--adm-ink)] text-right">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <p className="mx-5 mt-4 text-sm text-[var(--adm-ink-2)]">{consequence}</p>

        <div className="flex justify-end gap-2 px-5 py-4 mt-4 border-t border-[var(--adm-border)]">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] px-4 py-2 text-sm font-semibold text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-[var(--adm-radius)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: destructive ? 'var(--adm-critical)' : 'var(--adm-primary)' }}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
