import React from 'react';
import { AlertTriangle, MapPin, Clock, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { Incident } from '../../types/incident';
import { RecoveryPredictionCard } from '../dashboard/RecoveryPredictionCard';

interface IncidentsViewProps {
  incidents: Incident[];
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({ incidents }) => {
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-red-950 to-slate-900 text-white rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-black tracking-wide">Disaster & Corridor Disruption Management</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Real-time PostGIS incident tracking, severity analysis, emergency BRO dispatch triggers, and clearance duration bounds.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg text-center border border-white/15">
          <span className="text-[10px] text-slate-300 block uppercase font-mono">Active Incidents</span>
          <span className="text-xl font-black text-rose-400">{incidents.length} Events</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Incidents List */}
        <div className="lg:col-span-2 space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  <h3 className="text-sm font-bold text-slate-900">{inc.title}</h3>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase ${
                    inc.severity === 'CRITICAL'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {inc.severity} SEVERITY
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{inc.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Location:</span>
                  <span className="font-semibold text-slate-800">{inc.locationName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Coordinates:</span>
                  <span className="font-semibold text-slate-800">({inc.location.lat}, {inc.location.lng})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Reported By:</span>
                  <span className="font-semibold text-slate-800">{inc.reportedBy}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Verification:</span>
                  <span className="font-semibold text-emerald-700">{inc.verificationStatus}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Live Recovery Prediction Card */}
        <div className="space-y-4">
          <RecoveryPredictionCard
            corridorId="NH-27_HAFLONG_PASS"
            predictedClearanceHours={18.0}
            confidenceLowHours={14.0}
            confidenceHighHours={22.0}
            recommendedAction="EMERGENCY_REROUTE"
            reasoningSummary="EMERGENCY REROUTE: Cold-chain vaccine thermal budget (12.0h) expires BEFORE predicted clearance (18.0h). Immediate detour recommended via alternate corridor."
          />
        </div>
      </div>
    </div>
  );
};
