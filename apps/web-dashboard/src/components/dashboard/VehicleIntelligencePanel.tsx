import React from 'react';
import { Truck, Navigation, Clock, ShieldAlert, ArrowRight, CornerUpRight, Send, X, User, MapPin, Compass, AlertTriangle, Maximize2 } from 'lucide-react';
import { Vehicle } from '../../types/vehicle';
import { VEHICLE_ROUTES, VehicleRouteInfo } from '../../data/mockData';

interface VehicleIntelligencePanelProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onFollowToggle?: (isFollowing: boolean) => void;
  isFollowing?: boolean;
  onFitFullRoute?: () => void;
  onOpenRerouteModal?: (vehicle: Vehicle) => void;
}

export const VehicleIntelligencePanel: React.FC<VehicleIntelligencePanelProps> = ({
  vehicle,
  onClose,
  onFollowToggle,
  isFollowing = false,
  onFitFullRoute,
  onOpenRerouteModal,
}) => {
  if (!vehicle) return null;

  const routeInfo: VehicleRouteInfo = VEHICLE_ROUTES[vehicle.code] || {
    originName: vehicle.origin || 'Guwahati Hub',
    originCoords: [26.1445, 91.7362],
    destinationName: vehicle.destination || 'Silchar Depot',
    destinationCoords: [24.8333, 92.7789],
    primaryRouteName: 'NH-27 Primary Corridor',
    primaryCoords: [],
    alternativeRouteName: 'SH-51 Bypass Corridor',
    alternativeCoords: [],
    totalDistanceKm: 315.0,
    remainingDistanceKm: 142.5,
    alternativeReason: '✨ AI RECOMMENDED: Avoids route blockage hazard',
  };

  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-xl space-y-2.5 font-sans text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150 max-w-[320px] w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-black text-xs">
            {vehicle.code.split('-')[1] || '07'}
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
              <span>{vehicle.code}</span>
              <span className="text-[9px] bg-slate-100 text-slate-700 font-mono px-1 py-0.2 rounded border border-slate-200 uppercase">
                {vehicle.status}
              </span>
            </h3>
            <div className="flex items-center space-x-1 text-[10px] text-slate-500">
              <User className="w-3 h-3 text-slate-400" />
              <span>Driver: <strong className="text-slate-800">{vehicle.driverName}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onFollowToggle?.(!isFollowing)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition flex items-center space-x-1 ${
              isFollowing
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Keep map centered on vehicle telemetry"
          >
            <Compass className={`w-3 h-3 ${isFollowing ? 'animate-spin' : ''}`} />
            <span>{isFollowing ? 'Follow' : 'Follow'}</span>
          </button>

          <button
            onClick={onFitFullRoute}
            className="p-1 rounded hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
            title="Zoom out to fit Origin → Destination route bounds"
          >
            <Maximize2 className="w-3 h-3" />
          </button>

          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Journey Progress Timeline */}
      <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px]">
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-700">
          <span className="flex items-center space-x-1 truncate max-w-[120px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">{routeInfo.originName.split(' ')[0]}</span>
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0 mx-1" />
          <span className="flex items-center space-x-1 truncate max-w-[120px] font-bold text-slate-900">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="truncate">{routeInfo.destinationName.split(' ')[0]}</span>
          </span>
        </div>

        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden my-1">
          <div className="h-full bg-indigo-600 rounded-full" style={{ width: '55%' }} />
        </div>

        <div className="text-[10px] font-mono text-slate-600 space-y-0.5 pt-0.5">
          <div className="flex justify-between">
            <span className="text-slate-400 uppercase">Sector:</span>
            <span className="font-semibold text-slate-800 truncate max-w-[200px]">{vehicle.location.address}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 uppercase">Remaining:</span>
            <span className="font-bold text-indigo-900">{routeInfo.remainingDistanceKm} km (ETA: {vehicle.eta})</span>
          </div>
        </div>
      </div>

      {/* Live Telemetry Grid */}
      <div className="grid grid-cols-4 gap-1 text-center text-xs bg-slate-50 p-1.5 rounded-lg border border-slate-100 font-mono">
        <div>
          <span className="text-[8px] text-slate-400 block uppercase">Speed</span>
          <strong className="text-slate-900 text-[11px]">{vehicle.speedKmh} km/h</strong>
        </div>
        <div>
          <span className="text-[8px] text-slate-400 block uppercase">Heading</span>
          <strong className="text-slate-900 text-[11px]">135° SE</strong>
        </div>
        <div>
          <span className="text-[8px] text-slate-400 block uppercase">Remaining</span>
          <strong className="text-indigo-900 text-[11px]">{routeInfo.remainingDistanceKm} km</strong>
        </div>
        <div>
          <span className="text-[8px] text-slate-400 block uppercase">ETA</span>
          <strong className="text-emerald-700 text-[11px]">{vehicle.eta}</strong>
        </div>
      </div>

      {/* Route Intelligence & Hazards */}
      <div className="space-y-1 border-t border-slate-100 pt-1.5 text-[10px]">
        <div className="flex justify-between text-slate-600 font-medium">
          <span>Primary Route:</span>
          <span className="font-mono font-bold text-slate-800 truncate max-w-[190px]">{routeInfo.primaryRouteName}</span>
        </div>
        <div className="flex justify-between text-slate-600 font-medium">
          <span>Recommended Bypass:</span>
          <span className="font-mono font-bold text-indigo-700 truncate max-w-[170px]">{routeInfo.alternativeRouteName}</span>
        </div>

        <div className="bg-amber-50 text-amber-900 p-1.5 rounded border border-amber-200 text-[10px] space-y-0.5">
          <div className="font-bold flex items-center space-x-1 text-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Reroute Rationale:</span>
          </div>
          <p className="leading-tight text-amber-950 font-mono text-[9.5px]">
            {routeInfo.alternativeReason}
          </p>
        </div>
      </div>

      {/* Reroute Action Button */}
      <button
        onClick={() => onOpenRerouteModal?.(vehicle)}
        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-sm transition flex items-center justify-center space-x-1.5"
      >
        <Send className="w-3 h-3" />
        <span>Reroute & Notify Driver ({vehicle.driverName})</span>
      </button>
    </div>
  );
};
