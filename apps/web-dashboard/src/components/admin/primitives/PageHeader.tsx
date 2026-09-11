import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  eyebrow?: string;
}

/**
 * Standard Admin Console page header: title + one-line purpose + an optional
 * right-aligned primary action, closed by a hairline rule. Used at the top
 * of every Admin page for consistent information hierarchy.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action, eyebrow }) => {
  return (
    <div className="mb-6 pb-4 border-b border-[var(--adm-border)]">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          {eyebrow && (
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--adm-accent)] mb-1">
              {eyebrow}
            </div>
          )}
          <h1 className="text-[22px] leading-7 font-semibold text-[var(--adm-ink)]">{title}</h1>
          {description && (
            <p className="mt-1 text-sm leading-5 text-[var(--adm-ink-2)] max-w-2xl">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
};
