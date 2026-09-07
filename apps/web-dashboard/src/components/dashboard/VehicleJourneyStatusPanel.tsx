import React from 'react';
import { Truck, Navigation, Clock, ShieldAlert, ArrowRight, CornerUpRight, RefreshCw, CheckCircle2, User, Send, UserCheck } from 'lucide-react';
import { Vehicle } from '../../types/vehicle';

interface VehicleJourneyStatusPanelProps {
  vehicles: Vehicle[];
  onSelectVehicle?: (vehicle: Vehicle) => void;
  onOpenRerouteModal?: (vehicle: Vehicle) => void;
  simulationStep?: number;
}

export const VehicleJourneyStatusPanel: React.FC<VehicleJourneyStatusPanelProps> = ({
  vehicles,
  onSelectVehicle,
  onOpenRerouteModal,
  simulationStep = 1,
}) => {
  const getStatusBadge = (v: Vehicle) => {
    if (v.code === 'NER-07') {
      if (simulationStep === 4 || simulationStep === 5) {
        return {
          label: 'OPERATOR APPROVED REROUTE',
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-2 ring-indigo-500/20 font-black animate-pulse',
          icon: UserCheck,
        };
      }
      if (simulationStep === 3) {
        return {
          label: 'BLOCKED - OPERATOR ACTION REQUIRED',
          color: 'bg-rose-50 text-rose-700 border-rose-200 ring-2 ring-rose-500/20 font-black animate-bounce',
          icon: ShieldAlert,
        };
      }
      if (simulationStep === 2) {
        return {
          label: 'WEATHER DELAYED',
          color: 'bg-amber-50 text-amber-700 border-amber-200 font-bold',
          icon: Clock,
        };
      }
    }

    switch (v.status) {
      case 'ON_TRACK':
        return {
          label: 'ON TRACK',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
          icon: CheckCircle2,
        };
      case 'DELAYED':
        return {
          label: 'DELAYED',
          color: 'bg-amber-50 text-amber-700 border-amber-200 font-bold',
          icon: Clock,
        };
      case 'AT_RISK':
        return {
          label: 'AT RISK',
          color: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
          icon: ShieldAlert,
        };
      default:
        return {
          label: v.status.replace('_', ' '),
          color: 'bg-slate-50 text-slate-700 border-slate-200 font-medium',
          icon: Navigation,
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col h-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <Truck className="w-4 h-4 text-emerald-600" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            VEHICLE JOURNEY ETA & HUMAN REROUTE COMMAND
          </h2>
        </div>
        <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
          HUMAN-IN-THE-LOOP AUTHORIZED
        </span>
      </div>

      {/* Scrollable Vehicle List */}
      <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1 flex-1">
        {vehicles.map((v) => {
          const badge = getStatusBadge(v);
          const BadgeIcon = badge.icon;
          const isNeedsOperatorAction = v.code === 'NER-07' && (simulationStep === 3 || simulationStep === 4);

          return (
            <div
              key={v.id}
              className={`bg-slate-50 hover:bg-slate-100/80 p-3 rounded-lg border transition space-y-2 group ${
                isNeedsOperatorAction ? 'border-indigo-400 ring-2 ring-indigo-500/10' : 'border-slate-200'
              }`}
            >
              {/* Top Row: Vehicle Code + Driver + Status Badge */}
              <div className="flex items-center justify-between">
                <div
                  onClick={() => onSelectVehicle?.(v)}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-black text-xs group-hover:bg-emerald-600 transition">
                    {v.code.split('-')[1] || '01'}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">{v.code}</h3>
                    <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{v.driverName}</span>
                    </div>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] border flex items-center space-x-1 ${badge.color}`}>
                  <BadgeIcon className="w-3 h-3" />
                  <span>{badge.label}</span>
                </span>
              </div>

              {/* Journey Route & Commodity */}
              <div className="text-xs text-slate-700 font-medium flex items-center justify-between pt-1 border-t border-slate-200/60">
                <div className="flex items-center space-x-1 font-mono text-[11px] text-slate-800">
                  <span>{v.origin || 'Guwahati'}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span>{v.destination || 'Silchar'}</span>
                </div>
                <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 font-semibold">
                  {v.commodityType || 'Emergency Rations'}
                </span>
              </div>

              {/* Bottom Row: ETA + Speed + Human Operator Reroute Button */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center space-x-1 text-slate-900">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[10px] text-slate-400 uppercase font-bold">ETA:</span>
                  <strong className="font-mono text-indigo-900">{v.eta}</strong>
                </div>

                <button
                  onClick={() => onOpenRerouteModal?.(v)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-sm transition flex items-center space-x-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Reroute & Notify Driver</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
