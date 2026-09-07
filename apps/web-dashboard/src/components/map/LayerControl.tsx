import React, { useState } from 'react';
import { Layers, Eye, EyeOff, Truck, AlertTriangle, ShieldAlert, Route, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

export interface MapLayersState {
  showVehicles: boolean;
  showIncidents: boolean;
  showRiskZones: boolean;
  showRoutes: boolean;
  showDistrictBoundaries: boolean;
}

interface LayerControlProps {
  layers: MapLayersState;
  onToggleLayer: (layerKey: keyof MapLayersState) => void;
}

export const LayerControl: React.FC<LayerControlProps> = ({ layers, onToggleLayer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative font-sans text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/90 hover:bg-white backdrop-blur-md border border-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center space-x-1.5 transition"
      >
        <Layers className="w-4 h-4 text-indigo-600" />
        <span>Map Layers</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-xl space-y-2 animate-in fade-in zoom-in-95 duration-100 z-30">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 font-bold uppercase text-[10px] tracking-wider text-slate-700">
            <span>Toggle Layers</span>
            <span className="text-[9px] text-slate-400 font-normal">Active</span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => onToggleLayer('showVehicles')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded transition text-xs ${
                layers.showVehicles ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-500'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Vehicles</span>
              </div>
              {layers.showVehicles ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <button
              onClick={() => onToggleLayer('showIncidents')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded transition text-xs ${
                layers.showIncidents ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-500'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Incidents</span>
              </div>
              {layers.showIncidents ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <button
              onClick={() => onToggleLayer('showRiskZones')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded transition text-xs ${
                layers.showRiskZones ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-500'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Risk Zones</span>
              </div>
              {layers.showRiskZones ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <button
              onClick={() => onToggleLayer('showRoutes')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded transition text-xs ${
                layers.showRoutes ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-500'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <Route className="w-3.5 h-3.5 text-indigo-600" />
                <span>Corridors & Reroutes</span>
              </div>
              {layers.showRoutes ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <button
              onClick={() => onToggleLayer('showDistrictBoundaries')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded transition text-xs ${
                layers.showDistrictBoundaries ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-500'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-600" />
                <span>District Access</span>
              </div>
              {layers.showDistrictBoundaries ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
