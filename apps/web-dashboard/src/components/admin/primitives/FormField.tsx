import React, { useId } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: (inputProps: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => React.ReactNode;
}

/**
 * Accessible label + control + error/hint wrapper. All Admin form fields use
 * this so labels are always programmatically associated with their control.
 */
export const FormField: React.FC<FormFieldProps> = ({ label, required, error, hint, children }) => {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-[var(--adm-ink-2)]">
        {label} {required && <span style={{ color: 'var(--adm-critical)' }}>*</span>}
      </label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': describedBy })}
      {hint && !error && (
        <span id={hintId} className="text-xs text-[var(--adm-ink-3)]">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className="text-xs font-medium" style={{ color: 'var(--adm-critical)' }}>
          {error}
        </span>
      )}
    </div>
  );
};

export const inputBaseClass =
  'w-full rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] px-3 py-2 text-sm text-[var(--adm-ink)] placeholder:text-[var(--adm-ink-3)] focus:border-[var(--adm-primary)] focus:outline-none disabled:bg-[var(--adm-raised)] disabled:text-[var(--adm-ink-3)]';
