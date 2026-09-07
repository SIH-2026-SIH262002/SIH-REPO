import React, { useEffect, useRef } from 'react';
import { Search, Filter, X, SlidersHorizontal, AlertCircle, ShieldAlert, Truck, Package } from 'lucide-react';

export interface FilterState {
  searchQuery: string;
  priority: string;
  vehicleStatus: string;
  riskLevel: string;
  district: string;
  commodity: string;
}

interface OperationalToolbarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onClearFilters: () => void;
  totalAssetsCount?: number;
  filteredAssetsCount?: number;
}

export const OperationalToolbar: React.FC<OperationalToolbarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  totalAssetsCount = 0,
  filteredAssetsCount = 0,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Press '/' to focus global search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeFiltersCount = [
    filters.priority !== 'ALL' ? 1 : 0,
    filters.vehicleStatus !== 'ALL' ? 1 : 0,
    filters.riskLevel !== 'ALL' ? 1 : 0,
    filters.district !== 'ALL' ? 1 : 0,
    filters.commodity !== 'ALL' ? 1 : 0,
    filters.searchQuery.trim() !== '' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2.5 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Global Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Global Search (Vehicle code, driver, shipment ID, commodity, district, incident)... [/]"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange('searchQuery', '')}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Operational Filter Dropdowns */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange('priority', e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Priority: All</option>
            <option value="CRITICAL">🚨 Critical</option>
            <option value="HIGH">⚠️ High</option>
            <option value="NORMAL">Standard</option>
          </select>

          {/* Vehicle Status Filter */}
          <select
            value={filters.vehicleStatus}
            onChange={(e) => onFilterChange('vehicleStatus', e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Status: All</option>
            <option value="ON_TRACK">🟢 On Track</option>
            <option value="DELAYED">🟡 Delayed</option>
            <option value="AT_RISK">🔴 At Risk</option>
            <option value="OFFLINE">⚪ Offline</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={filters.riskLevel}
            onChange={(e) => onFilterChange('riskLevel', e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Risk: All</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          {/* District Filter */}
          <select
            value={filters.district}
            onChange={(e) => onFilterChange('district', e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">District: All</option>
            <option value="Dima Hasao">Dima Hasao (Haflong)</option>
            <option value="Silchar (Cachar)">Silchar (Cachar)</option>
            <option value="Kamrup Metro">Guwahati (Kamrup)</option>
            <option value="Kohima">Kohima (Nagaland)</option>
            <option value="Aizawl">Aizawl (Mizoram)</option>
          </select>

          {/* Clear Filters Button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={onClearFilters}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-rose-700 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
