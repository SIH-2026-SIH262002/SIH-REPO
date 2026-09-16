import React from 'react';
import { CheckCircle2, AlertTriangle, XOctagon, Circle, Radio } from 'lucide-react';

// Every status pairs a colour with a glyph and a text label -- never colour
// alone (accessibility requirement, spec §J / §25).
type StatusKind =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DEACTIVATED'
  | 'LOW'
  | 'MODERATE'
  | 'HIGH'
  | 'SEVERE'
  | 'OPEN'
  | 'RESOLVED'
  | 'FLAGGED'
  | 'BLOCKED'
  | 'VERIFIED'
  | 'UNVERIFIED';

const CONFIG: Record<StatusKind, { label: string; fg: string; bg: string; Icon: React.ElementType }> = {
  ACTIVE: { label: 'Active', fg: 'var(--adm-healthy)', bg: 'var(--adm-healthy-bg)', Icon: CheckCircle2 },
  SUSPENDED: { label: 'Suspended', fg: 'var(--adm-warning)', bg: 'var(--adm-warning-bg)', Icon: AlertTriangle },
  DEACTIVATED: { label: 'Deactivated', fg: 'var(--adm-neutral)', bg: 'var(--adm-neutral-bg)', Icon: XOctagon },

  LOW: { label: 'Low', fg: 'var(--adm-healthy)', bg: 'var(--adm-healthy-bg)', Icon: Circle },
  MODERATE: { label: 'Moderate', fg: 'var(--adm-warning)', bg: 'var(--adm-warning-bg)', Icon: Circle },
  HIGH: { label: 'High', fg: 'var(--adm-warning)', bg: 'var(--adm-warning-bg)', Icon: AlertTriangle },
  SEVERE: { label: 'Severe', fg: 'var(--adm-critical)', bg: 'var(--adm-critical-bg)', Icon: AlertTriangle },

  OPEN: { label: 'Open', fg: 'var(--adm-critical)', bg: 'var(--adm-critical-bg)', Icon: Radio },
  RESOLVED: { label: 'Resolved', fg: 'var(--adm-healthy)', bg: 'var(--adm-healthy-bg)', Icon: CheckCircle2 },

  FLAGGED: { label: 'Flagged', fg: 'var(--adm-warning)', bg: 'var(--adm-warning-bg)', Icon: AlertTriangle },
  BLOCKED: { label: 'Blocked', fg: 'var(--adm-critical)', bg: 'var(--adm-critical-bg)', Icon: XOctagon },

  VERIFIED: { label: 'Verified', fg: 'var(--adm-healthy)', bg: 'var(--adm-healthy-bg)', Icon: CheckCircle2 },
  UNVERIFIED: { label: 'Unverified', fg: 'var(--adm-neutral)', bg: 'var(--adm-neutral-bg)', Icon: Circle },
};

interface StatusBadgeProps {
  status: StatusKind | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const key = String(status).toUpperCase() as StatusKind;
  const cfg = CONFIG[key] || { label: status, fg: 'var(--adm-ink-3)', bg: 'var(--adm-neutral-bg)', Icon: Circle };
  const { label, fg, bg, Icon } = cfg;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-semibold"
      style={{ color: fg, background: bg }}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      {label}
    </span>
  );
};
