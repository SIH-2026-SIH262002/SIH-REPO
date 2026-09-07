import React, { useState } from 'react';
import { Activity, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, Clock, AlertTriangle } from 'lucide-react';

interface AIReasoningPanelProps {
  corridorId?: string;
  recommendedAction?: string;
  confidenceScore?: number;
  riskScore?: number;
  dataFreshness?: string;
  reasoningBullets?: string[];
}

export const AIReasoningPanel: React.FC<AIReasoningPanelProps> = ({
  corridorId = 'NH-27_HAFLONG_PASS',
  recommendedAction = 'Reroute via SH-51 Bypass',
  confidenceScore = 82,
  riskScore = 88,
  dataFreshness = 'Just now',
  reasoningBullets = [
    'Active incident (Landslide) near primary corridor NH-27',
    'Rainfall sensors detect continued high soil saturation rate',
    'Estimated corridor clearance time (18.0h) exceeds vaccine thermal budget (12.0h)',
    'Shipment priority is CRITICAL (Medical Oxygen & Vaccines)',
    'Alternate corridor SH-51 has 42% lower predicted disruption risk',
  ],
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 font-sans text-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              🧠 AI / Risk Decision Intelligence
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">CORRIDOR: {corridorId}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono">
          <span className="text-[10px] bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded border border-indigo-200">
            CONFIDENCE: {confidenceScore}%
          </span>
          <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-200">
            RISK: {riskScore}/100
          </span>
        </div>
      </div>

      {/* Main Recommendation Box */}
      <div className="bg-indigo-50/60 border border-indigo-100 p-3 rounded-xl space-y-1">
        <span className="text-[10px] font-bold uppercase text-indigo-700 block tracking-wider">
          Recommended Action:
        </span>
        <div className="text-sm font-extrabold text-indigo-950 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{recommendedAction}</span>
        </div>
      </div>

      {/* Rationale Bullet Points */}
      <div className="space-y-1.5 pt-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-slate-700 font-bold text-[11px]"
        >
          <span>Why is the AI system recommending this?</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isExpanded && (
          <ul className="space-y-1 font-mono text-[10.5px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            {reasoningBullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start space-x-1.5">
                <span className="text-indigo-600 font-bold shrink-0">•</span>
                <span className="leading-snug">{bullet}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Data Freshness Footer */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-2">
        <span className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>Data Freshness: <strong>{dataFreshness}</strong></span>
        </span>
        <span>Engine: Dempster-Shafer Fusion v2.1</span>
      </div>
    </div>
  );
};
