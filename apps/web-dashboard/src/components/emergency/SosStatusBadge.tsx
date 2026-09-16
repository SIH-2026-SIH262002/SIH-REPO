/**
 * SosStatusBadge.tsx — Renders a styled badge for SosStatus.
 */
import React from 'react';
import type { SosStatus } from '../../../api/sosApi';

interface Props {
  status: SosStatus;
  className?: string;
}

const BADGE_CONFIG: Record<SosStatus, { label: string; cls: string }> = {
  TRIGGERED: { label: 'TRIGGERED', cls: 'eo-badge eo-badge-critical' },
  RECEIVED: { label: 'RECEIVED', cls: 'eo-badge eo-badge-high' },
  ACKNOWLEDGED: { label: 'ACKNOWLEDGED', cls: 'eo-badge eo-badge-moderate' },
  RESPONDER_ASSIGNED: { label: 'RESPONDER ASSIGNED', cls: 'eo-badge eo-badge-moderate' },
  RESOLVED: { label: 'RESOLVED', cls: 'eo-badge eo-badge-resolved' },
  FALSE_ALARM: { label: 'FALSE ALARM', cls: 'eo-badge eo-badge-neutral' },
};

export const SosStatusBadge: React.FC<Props> = ({ status, className = '' }) => {
  const cfg = BADGE_CONFIG[status] ?? { label: status, cls: 'eo-badge eo-badge-neutral' };
  return <span className={`${cfg.cls} ${className}`}>{cfg.label}</span>;
};
