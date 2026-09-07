import React, { useState } from 'react';
import { Clock, ShieldAlert, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { EmergencyOverrideModal } from './EmergencyOverrideModal';

interface RecoveryPredictionCardProps {
  corridorId?: string;
  predictedClearanceHours?: number;
  confidenceLowHours?: number;
  confidenceHighHours?: number;
  recommendedAction?: 'WAIT' | 'REROUTE' | 'HOLD' | 'EMERGENCY_REROUTE' | string;
  reasoningSummary?: string;
  isOverridden?: boolean;
  onOverride?: (action: string) => void;
}

export const RecoveryPredictionCard: React.FC<RecoveryPredictionCardProps> = ({
  corridorId = 'NH-27_HAFLONG_PASS',
  predictedClearanceHours = 18.0,
  confidenceLowHours = 14.0,
  confidenceHighHours = 22.0,
  recommendedAction = 'EMERGENCY_REROUTE',
  reasoningSummary = 'EMERGENCY REROUTE: Cold-chain vaccine thermal budget (12.0h) expires BEFORE predicted corridor clearance (18.0h). Immediate detour recommended via alternate corridor.',
  isOverridden = false,
  onOverride,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [overrideAction, setOverrideAction] = useState<string | null>(null);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  const getBadgeStyle = (action: string) => {
    switch (action) {
      case 'EMERGENCY_REROUTE':
      case 'FORCE_EMERGENCY_REROUTE':
        return 'bg-red-500/10 text-red-700 border-red-300 ring-2 ring-red-500/20 animate-pulse';
      case 'REROUTE':
        return 'bg-amber-500/10 text-amber-700 border-amber-300';
      case 'WAIT':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-300';
      case 'HOLD':
        return 'bg-blue-500/10 text-blue-700 border-blue-300';
      default:
        return 'bg-slate-500/10 text-slate-700 border-slate-300';
    }
  };

  const handleConfirmEmergencyOverride = (action: string, reason: string) => {
    setOverrideAction(action);
    onOverride?.(action);
  };

  // Calculate percentage markers for interval range bar
  const minVal = 0;
  const maxVal = 48;
  const lowPct = Math.min(100, Math.max(0, (confidenceLowHours / maxVal) * 100));
  const highPct = Math.min(100, Math.max(0, (confidenceHighHours / maxVal) * 100));
  const predPct = Math.min(100, Math.max(0, (predictedClearanceHours / maxVal) * 100));
  const widthPct = Math.max(5, highPct - lowPct);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4 hover:shadow-md transition">
      {/* Header Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">Corridor Recovery Prediction</h3>
            <p className="text-[11px] text-slate-500 font-mono">{corridorId}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getBadgeStyle(
              overrideAction || recommendedAction
            )}`}
          >
            {overrideAction ? `OVERRIDDEN: ${overrideAction}` : recommendedAction}
          </span>
        </div>
      </div>

      {/* Main Prediction Metrics */}
      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Predicted Clearance
          </span>
          <div className="text-2xl font-black text-slate-900 flex items-baseline space-x-1">
            <span>{predictedClearanceHours}</span>
            <span className="text-xs font-semibold text-slate-500">hours</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Confidence Interval
          </span>
          <div className="text-sm font-bold text-indigo-700 mt-1">
            {confidenceLowHours}h – {confidenceHighHours}h
            <span className="text-[10px] text-slate-400 font-normal block">(±4.0h margin)</span>
          </div>
        </div>
      </div>

      {/* Horizontal Confidence Range Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[10px] font-medium text-slate-400">
          <span>0h (Now)</span>
          <span>Predicted Range ({confidenceLowHours}h - {confidenceHighHours}h)</span>
          <span>48h</span>
        </div>

        <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 bottom-0 bg-indigo-200 rounded-full"
            style={{ left: `${lowPct}%`, width: `${widthPct}%` }}
          />
          <div
            className="absolute top-0 bottom-0 w-2 bg-indigo-700 rounded-full transform -translate-x-1/2 shadow"
            style={{ left: `${predPct}%` }}
          />
        </div>
      </div>

      {/* Reasoning Accordion */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
        >
          <span className="flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Advisory Rationale</span>
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isExpanded && (
          <div className="p-3 bg-white text-xs text-slate-600 space-y-2 border-t border-slate-100">
            <p className="leading-relaxed font-mono text-[11px] bg-indigo-50/50 p-2.5 rounded border border-indigo-100 text-indigo-950">
              {reasoningSummary}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500">Route Engine: <strong className="text-slate-700">NetworkX Dijkstra</strong></span>
              <span className="text-slate-500">Weather Contract: <strong className="text-emerald-700">IMD Gridded API</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Human Emergency Operator Safety Override Button */}
      <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
        <span className="text-slate-500 text-[11px]">Emergency Operator Authority:</span>
        <button
          onClick={() => setIsEmergencyModalOpen(true)}
          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-[11px] font-bold transition flex items-center space-x-1"
        >
          <Lock className="w-3 h-3 text-rose-600" />
          <span>Emergency Safety Override</span>
        </button>
      </div>

      {/* Modal Integration */}
      <EmergencyOverrideModal
        corridorId={corridorId}
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onConfirmOverride={handleConfirmEmergencyOverride}
      />
    </div>
  );
};
