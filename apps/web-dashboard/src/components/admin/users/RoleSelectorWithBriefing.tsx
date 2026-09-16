import React from 'react';
import { ROLE_INFO } from '../../../types/admin';
import { UserRole } from '../../../types/auth';
import { inputBaseClass } from '../primitives/FormField';

const ROLE_ORDER: UserRole[] = ['ADMIN', 'EMERGENCY_OPERATOR', 'LOGISTICS_OPERATOR', 'FIELD_OFFICER', 'DRIVER'];

interface RoleSelectorWithBriefingProps {
  value: UserRole | '';
  onChange: (role: UserRole) => void;
  id?: string;
  disabled?: boolean;
}

/**
 * Role assignment is security-sensitive -- this is deliberately not a bare
 * <select>. Choosing a role immediately shows its responsibility, scope, and
 * key access so an Admin sees exactly what they are granting before they
 * submit (spec §9 / §13).
 */
export const RoleSelectorWithBriefing: React.FC<RoleSelectorWithBriefingProps> = ({ value, onChange, id, disabled }) => {
  const info = value ? ROLE_INFO[value] : null;

  return (
    <div className="space-y-2">
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as UserRole)}
        className={inputBaseClass}
      >
        <option value="" disabled>
          Select a role…
        </option>
        {ROLE_ORDER.map((role) => (
          <option key={role} value={role}>
            {ROLE_INFO[role].label}
          </option>
        ))}
      </select>

      {info && (
        <div className="rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-primary-wash)] p-3 text-xs space-y-1.5">
          <div className="font-bold uppercase tracking-wide text-[var(--adm-primary)]">{info.label}</div>
          <div>
            <span className="font-semibold text-[var(--adm-ink-2)]">Responsibility: </span>
            <span className="text-[var(--adm-ink-2)]">{info.responsibility}</span>
          </div>
          <div>
            <span className="font-semibold text-[var(--adm-ink-2)]">Scope: </span>
            <span className="text-[var(--adm-ink-2)]">{info.scope}</span>
          </div>
          <div>
            <span className="font-semibold text-[var(--adm-ink-2)]">Key access:</span>
            <ul className="mt-0.5 ml-3.5 list-disc text-[var(--adm-ink-2)]">
              {info.keyAccess.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
