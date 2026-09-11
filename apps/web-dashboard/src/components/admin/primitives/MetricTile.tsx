import React from 'react';
import { DataProvenanceBadge, Provenance } from './DataProvenanceBadge';

type MetricTone = 'neutral' | 'healthy' | 'warning' | 'critical';

interface MetricTileProps {
  label: string;
  value: React.ReactNode;
  context?: string;
  tone?: MetricTone;
  provenance?: Provenance;
  icon?: React.ReactNode;
}

const toneColor: Record<MetricTone, string> = {
  neutral: 'var(--adm-ink)',
  healthy: 'var(--adm-healthy)',
  warning: 'var(--adm-warning)',
  critical: 'var(--adm-critical)',
};

/**
 * A single administrative metric. Every metric MUST carry a context
 * sub-line -- a bare number is not an acceptable Admin Console tile
 * (see docs/ADMIN_CONSOLE_IMPLEMENTATION_SPEC.md §K). `context` is
 * required at the call site conceptually; left optional in the type only
 * to allow a loading/error tile to omit it.
 */
export const MetricTile: React.FC<MetricTileProps> = ({ label, value, context, tone = 'neutral', provenance, icon }) => {
  return (
    <div className="bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] p-4 flex flex-col gap-1.5 shadow-[var(--adm-shadow-card)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[var(--adm-ink-2)]">{label}</span>
        <div className="flex items-center gap-1.5">
          {provenance && <DataProvenanceBadge kind={provenance} compact />}
          {icon}
        </div>
      </div>
      <div className="text-[30px] leading-9 font-semibold tabular-nums" style={{ color: toneColor[tone] }}>
        {value}
      </div>
      {context && <div className="text-xs text-[var(--adm-ink-3)]">{context}</div>}
    </div>
  );
};
