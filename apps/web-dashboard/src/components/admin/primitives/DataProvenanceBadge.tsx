import React from 'react';

export type Provenance = 'LIVE' | 'SIMULATED' | 'NOT_CONFIGURED' | 'NOT_IMPLEMENTED';

const CONFIG: Record<Provenance, { label: string; fg: string; bg: string; title: string }> = {
  LIVE: {
    label: 'LIVE',
    fg: 'var(--adm-healthy)',
    bg: 'var(--adm-healthy-bg)',
    title: 'Backed by a real, persistent computation or store.',
  },
  SIMULATED: {
    label: 'SIMULATED',
    fg: 'var(--adm-warning)',
    bg: 'var(--adm-warning-bg)',
    title: 'Backed by the in-memory simulation/demo engine, not physical infrastructure.',
  },
  NOT_CONFIGURED: {
    label: 'NOT CONFIGURED',
    fg: 'var(--adm-neutral)',
    bg: 'var(--adm-neutral-bg)',
    title: 'Code path exists but requires an external service that is not running.',
  },
  NOT_IMPLEMENTED: {
    label: 'NOT IMPLEMENTED',
    fg: 'var(--adm-neutral)',
    bg: 'var(--adm-neutral-bg)',
    title: 'No backend support exists for this yet.',
  },
};

interface DataProvenanceBadgeProps {
  kind: Provenance;
  compact?: boolean;
}

/**
 * Every data-driven panel in the Admin Console must be honest about what it
 * is showing. This badge is the single mechanism for that -- never render
 * simulated data without one (see spec §I: "no panel may claim LIVE for
 * simulated data").
 */
export const DataProvenanceBadge: React.FC<DataProvenanceBadgeProps> = ({ kind, compact = false }) => {
  const c = CONFIG[kind];
  return (
    <span
      title={c.title}
      className={`inline-flex items-center rounded-sm font-semibold uppercase tracking-wide ${
        compact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1'
      }`}
      style={{ color: c.fg, background: c.bg }}
    >
      {c.label}
    </span>
  );
};
