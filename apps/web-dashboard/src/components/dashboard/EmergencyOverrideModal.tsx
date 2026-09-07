import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Send, X, CheckCircle2, Lock } from 'lucide-react';

interface EmergencyOverrideModalProps {
  corridorId?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirmOverride: (action: string, reason: string) => void;
}

export const EmergencyOverrideModal: React.FC<EmergencyOverrideModalProps> = ({
  corridorId = 'NH-27_HAFLONG_PASS',
  isOpen,
  onClose,
  onConfirmOverride,
}) => {
  const [overrideAction, setOverrideAction] = useState('FORCE_EMERGENCY_REROUTE');
  const [reason, setReason] = useState('Safety hazard override: Active rockfall risk exceeds safety margin for convoy.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirmOverride(overrideAction, reason);
      setIsSubmitting(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-rose-950 text-white p-4 flex items-center justify-between border-b border-rose-800">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-sm font-black tracking-wide">Emergency Operator Safety Override</h3>
              <p className="text-[11px] text-rose-300 font-mono">ROLE AUTHORIZED: EMERGENCY_OPERATOR</p>
            </div>
          </div>
          <button onClick={onClose} className="text-rose-400 hover:text-white p-1 rounded-lg hover:bg-rose-900 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700">
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-rose-900 font-bold">
              <span>Target Corridor:</span>
              <span className="font-mono text-xs">{corridorId}</span>
            </div>
            <p className="text-[11px] text-rose-800 leading-relaxed">
              This action overrides economic logistics routing and forces mandatory safety controls across all active convoys on this corridor.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-900 text-xs">Select Emergency Action:</label>
            <select
              value={overrideAction}
              onChange={(e) => setOverrideAction(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500"
            >
              <option value="FORCE_EMERGENCY_REROUTE">🚨 Force Immediate Emergency Detour (All Convoys)</option>
              <option value="FORCE_CONVOY_WAIT">⛔ Force Convoy Hold & Wait (Clearance In Progress)</option>
              <option value="CLOSE_CORRIDOR">🚫 Close Corridor Completely (High Failure Risk)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-900 text-xs">Emergency Rationale & Audit Notes:</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold shadow-md shadow-rose-700/30 transition flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <CheckCircle2 className="w-4 h-4 animate-spin" />
                  <span>Logging Override...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Execute Emergency Override</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
