import React from 'react';

interface SectionCardProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

/**
 * Standard content surface: 1px border, subtle header strip, no drop shadow
 * by default (a hairline shadow only). This is the workhorse container for
 * every table, form, and panel in the Admin Console.
 */
export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  action,
  children,
  className = '',
  noPadding = false,
}) => {
  return (
    <section
      className={`bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] shadow-[var(--adm-shadow-card)] ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-[var(--adm-border)] bg-[var(--adm-raised)] rounded-t-[var(--adm-radius)]">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-[var(--adm-ink)]">{title}</h2>}
            {description && <p className="text-xs text-[var(--adm-ink-2)] mt-0.5">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </section>
  );
};
