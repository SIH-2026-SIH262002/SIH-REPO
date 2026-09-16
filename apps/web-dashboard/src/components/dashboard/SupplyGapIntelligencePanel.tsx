import React, { useState, useEffect } from 'react';
import { ShieldAlert, Send, RefreshCw } from 'lucide-react';
import { Vehicle } from '../../types/vehicle';
import { apiService } from '../../services/apiService';

interface SupplyGapData {
  district: string;
  commodityType: string;
  riskLevel: string;
  estimatedDelayHours: number;
  affectedShipmentsCount: number;
  recommendedAction: string;
  rationale: string;
  availableQuantity?: number;
  unitOfMeasure?: string;
  consumptionRatePerHour?: number;
  reasons?: string[];
}

interface SupplyGapIntelligencePanelProps {
  onOpenRerouteModal?: (vehicle: Vehicle | null) => void;
}

export const SupplyGapIntelligencePanel: React.FC<SupplyGapIntelligencePanelProps> = ({
  onOpenRerouteModal,
}) => {
  const [data, setData] = useState<SupplyGapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSupplyGapIntelligence = async () => {
    setIsLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await apiService.getSupplyGapIntelligence();
      if (res?.supply_gaps?.length > 0) {
        const item = res.supply_gaps[0];
        setData({
          district: item.district,
          commodityType: item.commodities?.join(', ') || 'Essential Commodities',
          riskLevel: item.max_corridor_risk >= 70 ? 'CRITICAL' : item.max_corridor_risk >= 50 ? 'HIGH' : 'MODERATE',
          estimatedDelayHours: item.delayed_shipments * 2,
          affectedShipmentsCount: item.incoming_shipments_count,
          recommendedAction: item.operational_recommendation,
          rationale: `Monitored ${item.district} corridor with peak segment hazard risk score ${item.max_corridor_risk}.`,
          availableQuantity: item.stock_quantity,
          unitOfMeasure: item.unit,
          consumptionRatePerHour: item.consumption_rate_per_hr,
          reasons: [
            `Peak corridor risk score: ${item.max_corridor_risk}`,
            `Incoming shipments in transit: ${item.incoming_shipments_count}`,
            `Warehouse stock status: ${item.warehouse_stock_feed}`
          ],
        });
      }
    } catch (e) {
      setError('Supply gap intelligence service is currently unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplyGapIntelligence();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm animate-pulse space-y-2">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-12 bg-slate-100 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs text-slate-500 flex items-center justify-between">
        <span>{error}</span>
        <button onClick={fetchSupplyGapIntelligence} className="text-slate-700 font-bold underline">
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs text-slate-500 italic">
        No supply gap risk currently detected.
      </div>
    );
  }

  return (
    <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-sm space-y-3 font-sans relative overflow-hidden">
      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              Supply Gap Intelligence & Consequence Projection
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              TARGET DISTRICT: <strong className="text-slate-900">{data.district}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 uppercase animate-pulse">
            🚨 {data.riskLevel} GAP
          </span>
          <button
            onClick={fetchSupplyGapIntelligence}
            className="p-1 text-slate-400 hover:text-slate-700 transition"
            title="Refresh Supply Gap Telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid Metrics Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 bg-rose-50/50 p-3 rounded-lg border border-rose-100 text-xs">
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-400 block">Warehouse Stock</span>
          <strong className="text-rose-900 font-extrabold text-sm">
            {data.availableQuantity != null ? `${data.availableQuantity} ${data.unitOfMeasure || ''}` : 'No warehouse linked'}
          </strong>
          {data.consumptionRatePerHour != null && (
            <span className="text-[9px] text-slate-500 block">Rate: {data.consumptionRatePerHour} /hr</span>
          )}
        </div>

        <div>
          <span className="text-[9px] uppercase font-bold text-slate-400 block">Incoming Shipments</span>
          <strong className="text-slate-900 font-mono text-sm">{data.affectedShipmentsCount}</strong>
          <span className="text-[9px] text-rose-700 font-bold block">Delayed: {data.estimatedDelayHours > 0 ? `~${data.estimatedDelayHours}h` : 'None'}</span>
        </div>

        <div>
          <span className="text-[9px] uppercase font-bold text-slate-400 block">Recommended Action</span>
          <strong className="text-rose-700 font-mono text-[11px]">{data.recommendedAction}</strong>
        </div>
      </div>

      {/* Operational Consequence Rationale */}
      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
        <span className="font-bold text-slate-800 text-[11px] block">Operational Rationale & Signals:</span>
        <ul className="space-y-0.5 text-[10.5px] text-slate-600 list-disc list-inside font-mono">
          {data.reasons?.map((reason, idx) => (
            <li key={idx}>{reason}</li>
          ))}
        </ul>
      </div>

      {/* Action Triggers */}
      <div className="flex items-center justify-end space-x-2 pt-1">
        <button
          onClick={() => onOpenRerouteModal?.(null)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Evaluate & Approve Reroute</span>
        </button>
      </div>
    </div>
  );
};
