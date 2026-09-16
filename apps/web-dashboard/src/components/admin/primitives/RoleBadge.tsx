import React from 'react';
import { UserRole } from '../../../types/auth';

const LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  EMERGENCY_OPERATOR: 'Emergency Operator',
  LOGISTICS_OPERATOR: 'Logistics Operator',
  FIELD_OFFICER: 'Field Officer',
  DRIVER: 'Driver',
  SUPER_ADMIN: 'Super Admin',
  DISTRICT_AUTHORITY: 'District Authority',
};

interface RoleBadgeProps {
  role: UserRole | string;
  compact?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, compact = false }) => {
  const label = LABELS[role as UserRole] || role;
  return (
    <span
      className={`inline-flex items-center rounded-sm border border-[var(--adm-border)] bg-[var(--adm-raised)] font-medium text-[var(--adm-ink-2)] ${
        compact ? 'px-1.5 py-0.25 text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}
    >
      {label}
    </span>
  );
};

