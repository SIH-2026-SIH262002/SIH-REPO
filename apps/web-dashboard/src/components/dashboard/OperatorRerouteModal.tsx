import React, { useState } from 'react';
import { Vehicle } from '../../types/vehicle';
import { Send, AlertTriangle, ShieldCheck, ArrowRight, CornerUpRight, Clock, MapPin, X, CheckCircle2 } from 'lucide-react';

interface OperatorRerouteModalProps {
  vehicle?: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReroute: (vehicleCode: string, routeName: string, driverNotes: string) => void;
}

export const OperatorRerouteModal: React.FC<OperatorRerouteModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  onConfirmReroute,
}) => {
  const [selectedRoute, setSelectedRoute] = useState('SH-51');
  const [driverNotes, setDriverNotes] = useState(
    'PROCEED VIA SH-51 LUMDING BYPASS. PRIMARY HIGHWAY NH-27 BLOCKED BY EARTH SLIP.'
  );
  const [channels, setChannels] = useState({ sms: true, whatsapp: true, push: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionState, setActionState] = useState<'IDLE' | 'REQUESTED' | 'ACCEPTED' | 'DISPATCHED'>('IDLE');

  if (!isOpen) return null;

  const vehicleCode = vehicle ? vehicle.code : 'NER-07';
  const driverName = vehicle ? vehicle.driverName : 'Bikash Gogoi';
  const cargoName = vehicle ? vehicle.cargo : 'Emergency Medical Oxygen Cylinders';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionState('REQUESTED');

    setTimeout(() => {
      setActionState('ACCEPTED');
      setTimeout(() => {
        setActionState('DISPATCHED');
        onConfirmReroute(vehicleCode, selectedRoute, driverNotes);
        setIsSubmitting(false);
        setTimeout(() => {
          onClose();
          setActionState('IDLE');
        }, 800);
      }, 500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans text-xs">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Send className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-black tracking-wide">Human-in-the-Loop Reroute Approval</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                CONVOY: <strong className="text-emerald-400">{vehicleCode}</strong> ({driverName})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Action Status Indicator if Submitting */}
          {actionState !== 'IDLE' && (
            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between text-emerald-900 font-mono font-bold text-xs">
              <span className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>ACTION STATE: {actionState}</span>
              </span>
              <span className="text-[10px] text-emerald-700">Audit Log Appended</span>
            </div>
          )}

          {/* Cargo Priority Banner */}
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-rose-900 font-extrabold text-xs">
              <span>Payload Cargo:</span>
              <span className="bg-rose-600 text-white px-2 py-0.5 rounded text-[10px] uppercase font-mono">🚨 CRITICAL</span>
            </div>
            <p className="text-[11px] text-rose-800 font-mono">{cargoName}</p>
          </div>

          {/* Route Comparison Matrix */}
          <div className="grid grid-cols-2 gap-3">
            {/* Current Primary Route */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">CURRENT ROUTE</span>
              <div className="font-bold text-slate-900 text-xs">NH-27 Guwahati-Silchar</div>
              <div className="text-[10.5px] text-slate-600 font-mono space-y-0.5 pt-1">
                <div>Distance: 315.0 km</div>
                <div>ETA: 7h 30m</div>
                <div className="text-rose-700 font-bold">Risk: HIGH (88)</div>
                <div className="text-rose-700 text-[10px]">Hazard: Mudslide Blockage</div>
              </div>
            </div>

            {/* Recommended Alternate Route */}
            <div className="bg-emerald-50/70 border-2 border-emerald-500 p-3 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-700 block flex items-center justify-between">
                <span>RECOMMENDED BYPASS</span>
                <span className="bg-emerald-600 text-white px-1.5 py-0.2 rounded text-[9px]">AI 88%</span>
              </span>
              <div className="font-bold text-emerald-950 text-xs">SH-51 Lumding Bypass</div>
              <div className="text-[10.5px] text-emerald-900 font-mono space-y-0.5 pt-1">
                <div>Distance: 333.0 km (+18 km)</div>
                <div>ETA: 8h 06m (+36 min)</div>
                <div className="text-emerald-700 font-bold">Risk: LOW (22)</div>
                <div className="text-emerald-800 text-[10px]">Hazard: Clear Pass</div>
              </div>
            </div>
          </div>

          {/* Select Route Input */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-900 text-xs">Select Detour Route to Dispatch:</label>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="SH-51">✨ SH-51 Lumding Bypass Corridor (132 km - LOW RISK)</option>
              <option value="SH-14">SH-14 Mountain Pass Detour (148 km - MEDIUM RISK)</option>
              <option value="VR-09">VR-09 Emergency Track (115 km - CAUTION)</option>
            </select>
          </div>

          {/* Driver Instruction Notes */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-900 text-xs">Driver Telemetry Instruction Notes:</label>
            <textarea
              rows={2}
              value={driverNotes}
              onChange={(e) => setDriverNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Dispatch Channel Toggles */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-500 font-semibold">Notification Channels:</span>
            <div className="flex space-x-3 font-mono text-[11px]">
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.sms}
                  onChange={(e) => setChannels((p) => ({ ...p, sms: e.target.checked }))}
                  className="rounded accent-emerald-600"
                />
                <span>SMS</span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.whatsapp}
                  onChange={(e) => setChannels((p) => ({ ...p, whatsapp: e.target.checked }))}
                  className="rounded accent-emerald-600"
                />
                <span>WhatsApp</span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.push}
                  onChange={(e) => setChannels((p) => ({ ...p, push: e.target.checked }))}
                  className="rounded accent-emerald-600"
                />
                <span>Push</span>
              </label>
            </div>
          </div>

          {/* Submit Actions */}
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md shadow-emerald-600/30 transition flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <CheckCircle2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Approve & Dispatch Reroute</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
