import React from 'react';
import { adminApi } from '../../../api/adminApi';
import { useAsyncData } from '../../../hooks/admin/useAsyncData';
import { inputBaseClass } from '../primitives/FormField';

interface DistrictScopeSelectorProps {
  value: string;
  onChange: (district: string) => void;
  id?: string;
  disabled?: boolean;
}

/**
 * District/scope assignment, populated from the live sensor topology (the
 * canonical 18-district list) rather than free text -- a user should never
 * be able to type a district that doesn't exist on the map.
 */
export const DistrictScopeSelector: React.FC<DistrictScopeSelectorProps> = ({ value, onChange, id, disabled }) => {
  const { data: districts, loading, error } = useAsyncData(() => adminApi.getDistricts(), []);

  if (loading) {
    return <div className={`${inputBaseClass} text-[var(--adm-ink-3)]`}>Loading districts…</div>;
  }
  if (error || !districts) {
    return (
      <div className={`${inputBaseClass} text-[var(--adm-critical)]`}>
        Unable to load district list. Check that the risk service is running.
      </div>
    );
  }

  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={inputBaseClass}
    >
      <option value="" disabled>
        Select a district…
      </option>
      {districts.map((d) => (
        <option key={d} value={d}>
          {d}
        </option>
      ))}
    </select>
  );
};
