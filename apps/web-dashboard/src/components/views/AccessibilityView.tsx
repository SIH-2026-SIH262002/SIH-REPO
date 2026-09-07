import React from 'react';
import { MapPin, ShieldCheck, AlertOctagon, Activity, TrendingUp, CheckCircle, RefreshCw } from 'lucide-react';
import { DistrictStatus } from '../../types/district';

interface AccessibilityViewProps {
  districts: DistrictStatus[];
}

export const AccessibilityView: React.FC<AccessibilityViewProps> = ({ districts }) => {
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black tracking-wide">Regional Accessibility & Cutoff Vulnerability Matrix</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Live GIS accessibility monitoring across 8 North Eastern States. Analyzes roadbed integrity, historical failure rates, and real-time passability.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-lg text-center border border-white/15">
            <span className="text-[10px] text-slate-300 block uppercase font-mono">Overall Access Rate</span>
            <span className="text-xl font-black text-emerald-400">68%</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-lg text-center border border-white/15">
            <span className="text-[10px] text-slate-300 block uppercase font-mono">High Risk Passages</span>
            <span className="text-xl font-black text-amber-400">5 Passes</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {districts.map((d) => (
          <div
            key={d.id}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{d.name}</h3>
                <span className="text-[11px] text-slate-500 font-mono">{d.state}</span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${
                  d.status === 'FULL_ACCESS'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : d.status === 'PARTIAL_ACCESS'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {d.status.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Primary Highway:</span>
                <span className="font-mono font-semibold text-slate-800">{d.primaryRoute}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cutoff Hazard Score:</span>
                <span className="font-semibold text-slate-800">{d.riskScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Clearance:</span>
                <span className="font-semibold text-indigo-700">{d.estimatedClearanceHours}h</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Accessibility Index</span>
                <span>{100 - d.riskScore}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    d.riskScore > 70 ? 'bg-rose-500' : d.riskScore > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${100 - d.riskScore}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
