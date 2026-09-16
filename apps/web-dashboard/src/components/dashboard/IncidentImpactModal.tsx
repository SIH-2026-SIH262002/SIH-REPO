import React, { useState, useEffect } from 'react';
import { Incident } from '../../types/incident';
import { ShieldAlert, AlertTriangle, X, Truck, ArrowRight, Send, Activity, Loader2 } from 'lucide-react';
import { apiService } from '../../services/apiService';

interface IncidentImpactModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectVehicle?: (vehicleCode: string) => void;
  onOpenRerouteModal?: (vehicleCode: string) => void;
}

interface IncidentImpactChain {
  incidentId: number;
  incidentType: string;
  districtName: string;
  reportedSeverity: string;
  severityScore: number;
  confidenceLevel: number;
  affectedCorridors: Array<{
    corridorCode: string;
    corridorName: string;
    accessibilityStatus: string;
    disruptionSeverity: string;
  }>;
  affectedVehiclesDetails: Array<{
    vehicleCode: string;
    driverName: string;
    status: string;
    currentPosition: string;
    destination: string;
    eta: string;
    riskLevel: string;
  }>;
  affectedShipmentsDetails: Array<{
    shipmentCode: string;
    commodity: string;
    priority: string;
    destination: string;
    eta: string;
    delayHours: number;
    supplyCriticality: string;
  }>;
  supplyImpactSummary: string;
  recommendedAction: string;
  recommendationReason: string;
  recommendationConfidence: number;
  reasoningBullets: string[];
}

export const IncidentImpactModal: React.FC<IncidentImpactModalProps> = ({
  incident,
  isOpen,
  onClose,
  onSelectVehicle,
  onOpenRerouteModal,
}) => {
  const [impactChain, setImpactChain] = useState<IncidentImpactChain | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && incident) {
      setIsLoading(true);
      setLoadError(null);
      setImpactChain(null);
      apiService
        .getIncidentImpactChain(String(incident.id))
        .then((data) => {
          if (data?.affectedCorridors) {
            setImpactChain(data);
          } else {
            setLoadError('No downstream impact chain is available for this incident yet.');
          }
        })
        .catch(() => {
          setLoadError('Impact chain analysis service is currently unreachable.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, incident]);

  if (!isOpen || !incident) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans text-xs">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-sm font-black tracking-wide">Incident Impact Chain Analysis</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {incident.title} ({incident.location.district})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Relationship Chain Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-500 text-xs font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Computing incident impact chain…</span>
            </div>
          )}

          {!isLoading && loadError && (
            <div className="py-8 text-center text-xs text-slate-500 italic">{loadError}</div>
          )}

          {!isLoading && !loadError && impactChain && (
            <>
          {/* Step 1: Incident & Affected Corridor */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              1. Incident & Corridors Affected
            </span>
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center justify-between text-rose-900">
              <div className="space-y-0.5">
                <span className="font-bold text-xs">{incident.title}</span>
                <p className="text-[11px] text-rose-800 leading-relaxed font-mono">{incident.description}</p>
              </div>
              <span className="px-2.5 py-1 bg-rose-700 text-white font-mono font-bold rounded text-[10px] shrink-0">
                {incident.severity}
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="w-4 h-4 text-slate-400 transform rotate-90" />
          </div>

          {/* Step 2: Affected Vehicles & Cargo */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              2. Affected Convoys & Essential Shipments
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {impactChain?.affectedVehiclesDetails?.map((v) => (
                <div key={v.vehicleCode} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-900 flex items-center space-x-1.5">
                      <Truck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{v.vehicleCode}</span>
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono">
                      {v.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <div>Driver: <strong>{v.driverName}</strong></div>
                    <div>Position: <span className="font-mono text-slate-800">{v.currentPosition}</span></div>
                    <div>Dest: <span className="font-mono text-slate-800">{v.destination}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="w-4 h-4 text-slate-400 transform rotate-90" />
          </div>

          {/* Step 3: Supply Consequence & Projected Shortage */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              3. Regional Supply Impact Consequence
            </span>
            <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl text-amber-950 font-mono text-[11px] space-y-1">
              <div className="font-bold text-amber-900 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Impact Assessment:</span>
              </div>
              <p className="leading-relaxed">{impactChain?.supplyImpactSummary}</p>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="w-4 h-4 text-slate-400 transform rotate-90" />
          </div>

          {/* Step 4: AI Recommendation & Action */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              4. AI Intelligence Recommendation
            </span>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-2 text-emerald-950">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-900 text-xs flex items-center space-x-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>RECOMMENDED ACTION: {impactChain?.recommendedAction || 'N/A'}</span>
                </span>
                {typeof impactChain?.recommendationConfidence === 'number' && (
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    CONFIDENCE: {Math.round(impactChain.recommendationConfidence * 100)}%
                  </span>
                )}
              </div>

              <p className="text-[11px] text-emerald-900 font-mono leading-relaxed">
                {impactChain?.recommendationReason}
              </p>

              <ul className="space-y-0.5 text-[10.5px] text-emerald-800 list-disc list-inside font-mono pt-1">
                {impactChain?.reasoningBullets?.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition"
          >
            Close
          </button>
          {impactChain?.affectedVehiclesDetails?.[0]?.vehicleCode && (
            <button
              onClick={() => {
                const vehicleCode = impactChain.affectedVehiclesDetails[0].vehicleCode;
                onClose();
                onOpenRerouteModal?.(vehicleCode);
              }}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md shadow-emerald-600/20 transition flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Reroute Convoy ({impactChain.affectedVehiclesDetails[0].vehicleCode})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
