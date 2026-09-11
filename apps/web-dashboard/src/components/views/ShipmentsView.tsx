import React, { useState, useEffect } from 'react';
import { EssentialSupplySummary } from '../../types/shipment';
import { Vehicle } from '../../types/vehicle';
import { Package, ShieldAlert, Clock, ArrowRight, Truck, Send, AlertTriangle } from 'lucide-react';
import { OperationalToolbar, FilterState } from '../dashboard/OperationalToolbar';
import { apiService } from '../../services/apiService';

interface ShipmentsViewProps {
  supplies?: EssentialSupplySummary[];
  onOpenRerouteModal?: (vehicle: Vehicle | null) => void;
  onSelectVehicle?: (vehicleCode: string) => void;
}

export const ShipmentsView: React.FC<ShipmentsViewProps> = ({
  supplies = [],
  onOpenRerouteModal,
  onSelectVehicle,
}) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService
      .getVehicles()
      .then((data) => {
        setVehicles(data || []);
      })
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false));
  }, []);

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

  const shipmentsList = vehicles.map((v) => {
    const cargo = v.cargo || v.cargo_type || 'Essential Cargo';
    const isCritical =
      cargo.toLowerCase().includes('medic') ||
      cargo.toLowerCase().includes('oxygen') ||
      cargo.toLowerCase().includes('vaccine');
    return {
      code: `SHP-${v.id || v.code}`,
      commodity: cargo,
      priority: isCritical ? 'CRITICAL' : 'NORMAL',
      vehicleCode: v.code || v.id,
      origin: v.origin_name || v.origin || 'Unknown Origin',
      destination: v.destination_name || v.destination || 'Unknown Destination',
      status: v.status || 'IN_TRANSIT',
      riskLevel: v.status === 'AT_RISK' ? 'HIGH' : v.status === 'DELAYED' ? 'MODERATE' : 'LOW',
      supplyCriticality: v.status === 'AT_RISK' ? 'HIGH_RISK' : 'STABLE',
    };
  });

  const criticalShipment = shipmentsList.find((s) => s.priority === 'CRITICAL' && s.riskLevel !== 'LOW');

  const filteredShipments = shipmentsList.filter((s) => {
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matchCode = s.code.toLowerCase().includes(q);
      const matchCommodity = s.commodity.toLowerCase().includes(q);
      const matchVehicle = s.vehicleCode.toLowerCase().includes(q);
      const matchDest = s.destination.toLowerCase().includes(q);
      if (!matchCode && !matchCommodity && !matchVehicle && !matchDest) return false;
    }

    if (filters.priority !== 'ALL' && s.priority !== filters.priority) return false;
    if (filters.riskLevel !== 'ALL' && s.riskLevel !== filters.riskLevel) return false;

    return true;
  });

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Operational Toolbar */}
      <OperationalToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        totalAssetsCount={shipmentsList.length}
        filteredAssetsCount={filteredShipments.length}
      />

      {/* Critical Shipment Highlight Alert Banner -- only rendered when a real at-risk critical shipment exists */}
      {criticalShipment && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 bg-rose-600 text-white rounded-lg font-bold text-[10px] animate-pulse">
              🚨 CRITICAL SHIPMENT
            </span>
            <div>
              <h4 className="font-extrabold text-rose-950 text-xs">
                {criticalShipment.code}: {criticalShipment.commodity}
              </h4>
              <p className="text-[11px] text-rose-800 font-mono">
                Assigned: <strong>{criticalShipment.vehicleCode}</strong> | Dest:{' '}
                <strong>{criticalShipment.destination}</strong> | Status: <strong>{criticalShipment.status}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenRerouteModal?.(null)}
            className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold shadow-md shadow-rose-700/20 transition flex items-center space-x-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Evaluate & Approve Reroute</span>
          </button>
        </div>
      )}

      {/* Shipments Operations Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs uppercase tracking-wide">Essential Cargo Dispatch & Criticality Matrix</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Showing {filteredShipments.length} of {shipmentsList.length} Shipments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="p-3">Shipment Code / Priority</th>
                <th className="p-3">Commodity Payload</th>
                <th className="p-3">Assigned Convoy</th>
                <th className="p-3">Destination</th>
                <th className="p-3">Status / Delay</th>
                <th className="p-3">Supply Criticality</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredShipments.map((s) => (
                <tr key={s.code} className="hover:bg-slate-50 transition">
                  <td className="p-3">
                    <div className="font-mono font-bold text-slate-900 text-xs">{s.code}</div>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.2 rounded text-[9px] font-extrabold ${
                        s.priority === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                          : s.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {s.priority}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-800 max-w-xs">{s.commodity}</td>
                  <td className="p-3 font-mono font-bold text-indigo-700">
                    <button
                      onClick={() => onSelectVehicle?.(s.vehicleCode)}
                      className="hover:underline text-indigo-700"
                    >
                      {s.vehicleCode}
                    </button>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-900">{s.destination}</td>
                  <td className="p-3 font-mono text-[11px]">
                    <div className="font-bold text-slate-900">{s.status}</div>
                    <div className={s.status === 'DELAYED' ? 'text-rose-700 font-bold' : 'text-emerald-700'}>
                      {s.status === 'DELAYED' ? 'Delayed' : 'On Time'}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-[10.5px]">
                    <span
                      className={`font-bold ${
                        s.supplyCriticality.includes('CRITICAL') ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {s.supplyCriticality}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1">
                    <button
                      onClick={() => onSelectVehicle?.(s.vehicleCode)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-[10.5px] transition"
                    >
                      Track
                    </button>
                    <button
                      onClick={() => onOpenRerouteModal?.(null)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10.5px] shadow-sm transition"
                    >
                      Reroute
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
