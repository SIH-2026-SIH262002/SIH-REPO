import React from 'react';
import { ShieldAlert, Activity, Cpu, Layers, RefreshCw, CheckCircle2 } from 'lucide-react';
import { RiskIntelligencePanel } from '../dashboard/RiskIntelligencePanel';
import { RecoveryPredictionCard } from '../dashboard/RecoveryPredictionCard';

export const RiskView: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black tracking-wide">AI Risk Intelligence & Multi-Source Evidence Fusion</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Dempster-Shafer evidence combination theory (m1 ⊕ m2) with exponential time-decay belief estimation C(t) = C0 * e^(-lambda * deltaT).
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg text-center border border-white/15">
          <span className="text-[10px] text-slate-300 block uppercase font-mono">Fused Confidence</span>
          <span className="text-xl font-black text-emerald-400">92.4%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Risk Intelligence Panel */}
        <div className="space-y-4">
          <RiskIntelligencePanel
            overallRisk="HIGH"
            weatherImpactPct={85}
            roadConditionPct={90}
            historicalRiskPct={55}
            fieldReportsPct={88}
          />

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span>Dempster-Shafer Belief Fusion Engine</span>
            </h3>

            <div className="space-y-2 text-xs font-mono text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">IoT Weather Node Belief m1(Hazard):</span>
                <span className="font-bold text-slate-900">0.750</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Human Field Report Belief m2(Hazard):</span>
                <span className="font-bold text-slate-900">0.850</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 text-emerald-700">
                <span>Conflict Metric K (m1 vs m2):</span>
                <span className="font-bold">0.082 (Low Conflict)</span>
              </div>
              <div className="flex justify-between text-indigo-700 font-bold">
                <span>Fused Overall Confidence Score:</span>
                <span>92.4%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recovery Prediction Card */}
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
