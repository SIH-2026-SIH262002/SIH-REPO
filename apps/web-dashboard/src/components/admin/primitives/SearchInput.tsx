import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  'aria-label'?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder = 'Search…', ...rest }) => (
  <div className="relative">
    <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--adm-ink-3)]" aria-hidden="true" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={rest['aria-label'] || placeholder}
      className="w-full sm:w-64 rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] pl-8 pr-3 py-1.5 text-sm text-[var(--adm-ink)] placeholder:text-[var(--adm-ink-3)] focus:border-[var(--adm-primary)] focus:outline-none"
    />
  </div>
);
