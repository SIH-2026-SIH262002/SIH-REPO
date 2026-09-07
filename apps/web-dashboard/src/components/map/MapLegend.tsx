import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export const MapLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative font-sans text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/90 hover:bg-white backdrop-blur-md border border-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center space-x-1.5 transition text-[11px]"
      >
        <Info className="w-3.5 h-3.5 text-indigo-600" />
        <span>Map Legend</span>
        {isOpen ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronUp className="w-3 h-3 text-slate-500" />}
      </button>

      {isOpen && (
        <div className="absolute bottom-9 left-0 w-60 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-xl space-y-2 text-[11px] animate-in fade-in zoom-in-95 duration-100 z-30">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] border-b border-slate-100 pb-1 flex items-center justify-between">
            <span>Map Key & Status Legend</span>
            <span className="text-emerald-700 font-mono text-[9px]">NER GIS</span>
          </div>

          {/* Vehicle States */}
          <div>
            <span className="text-slate-400 font-semibold text-[10px] uppercase block mb-1">Vehicle Status</span>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>On Track</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Delayed</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>At Risk</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span>Offline</span>
              </div>
            </div>
          </div>

          {/* Incidents */}
          <div>
            <span className="text-slate-400 font-semibold text-[10px] uppercase block mb-1">Incidents</span>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-600" />
                <span>Landslide</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-600" />
                <span>Flood</span>
              </div>
            </div>
          </div>

          {/* Route Types */}
          <div>
            <span className="text-slate-400 font-semibold text-[10px] uppercase block mb-1">Corridors</span>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-4 h-1 bg-amber-500 rounded" />
                <span>Primary Highway</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-1 bg-cyan-600 rounded" />
                <span className="text-cyan-700 font-bold">AI Rerouted Bypass</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
