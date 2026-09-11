import React from 'react';
import { UserRole } from '../../../types/auth';

const LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  EMERGENCY_OPERATOR: 'Emergency Operator',
  LOGISTICS_OPERATOR: 'Logistics Operator',
  FIELD_OFFICER: 'Field Officer',
  DRIVER: 'Driver',
};

interface RoleBadgeProps {
  role: UserRole | string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const label = LABELS[role as UserRole] || role;
  return (
    <span className="inline-flex items-center rounded-sm border border-[var(--adm-border)] bg-[var(--adm-raised)] px-2 py-0.5 text-xs font-medium text-[var(--adm-ink-2)]">
      {label}
    </span>
  );
};
