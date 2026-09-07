import React, { useState } from 'react';
import { Vehicle } from '../../types/vehicle';
import { Truck, Navigation, Clock, ShieldAlert, Eye, Send, Search, User, MapPin, Compass } from 'lucide-react';
import { OperationalToolbar, FilterState } from '../dashboard/OperationalToolbar';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  onSelectVehicle?: (vehicle: Vehicle) => void;
  onOpenRerouteModal?: (vehicle: Vehicle) => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  vehicles,
  onSelectVehicle,
  onOpenRerouteModal,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    priority: 'ALL',
    vehicleStatus: 'ALL',
    riskLevel: 'ALL',
    district: 'ALL',
    commodity: 'ALL',
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      priority: 'ALL',
      vehicleStatus: 'ALL',
      riskLevel: 'ALL',
      district: 'ALL',
      commodity: 'ALL',
    });
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matchCode = v.code.toLowerCase().includes(q);
      const matchDriver = v.driverName.toLowerCase().includes(q);
      const matchCargo = v.cargo.toLowerCase().includes(q);
      const matchOrigin = (v.origin || '').toLowerCase().includes(q);
      const matchDest = (v.destination || '').toLowerCase().includes(q);
      if (!matchCode && !matchDriver && !matchCargo && !matchOrigin && !matchDest) return false;
    }

    if (filters.vehicleStatus !== 'ALL' && v.status !== filters.vehicleStatus) return false;
    if (filters.riskLevel !== 'ALL' && v.riskLevel !== filters.riskLevel) return false;

    return true;
  });

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Operational Toolbar */}
      <OperationalToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        totalAssetsCount={vehicles.length}
        filteredAssetsCount={filteredVehicles.length}
      />

      {/* Fleet Telematics Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs uppercase tracking-wide">Fleet Operations & Telematics</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Showing {filteredVehicles.length} of {vehicles.length} Active Convoys
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="p-3">Vehicle / Driver</th>
                <th className="p-3">Cargo Payload</th>
                <th className="p-3">Current Location</th>
                <th className="p-3">Speed / Heading</th>
                <th className="p-3">Status</th>
                <th className="p-3">ETA</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    No active convoys match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="p-3">
                      <div className="font-mono font-bold text-slate-900 text-xs">{v.code}</div>
                      <div className="text-[11px] text-slate-500">{v.driverName}</div>
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="font-bold text-slate-800 truncate">{v.cargo}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">{v.cargoCategory}</div>
                    </td>
                    <td className="p-3 font-mono text-[11px]">
                      <div className="text-slate-900 font-semibold">{v.location.address}</div>
                      <div className="text-slate-400 text-[10px]">{v.origin} → {v.destination}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-800">
                      <div>{v.location.speedKmH} km/h</div>
                      <div className="text-[10px] text-slate-400">135° SE</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                          v.status === 'ON_TRACK'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : v.status === 'DELAYED'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : v.status === 'AT_RISK'
                            ? 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">{v.eta}</td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => onSelectVehicle?.(v)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-[10.5px] transition"
                        title="Focus map on vehicle"
                      >
                        Track
                      </button>
                      <button
                        onClick={() => onOpenRerouteModal?.(v)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10.5px] shadow-sm transition"
                      >
                        Reroute
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
