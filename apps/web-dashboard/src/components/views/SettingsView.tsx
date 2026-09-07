import React from 'react';
import { Settings, Sliders, Radio, Globe, Shield, Lock, CheckCircle2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-black tracking-wide">Protocol Invariants & System Diagnostics</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            View P2P hardware invariants, WPC regulatory bands, and audit-controlled risk thresholds.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Risk Threshold Config (Gated to EMERGENCY_OPERATOR / SUPER_ADMIN) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Risk Score Thresholds</span>
            </h3>
            <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-mono font-bold flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>EMERGENCY ONLY</span>
            </span>
          </div>

          <div className="space-y-2.5 opacity-75">
            <div>
              <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                <span>HIGH Risk Threshold Score</span>
                <span className="font-mono font-bold text-amber-700">50.0</span>
              </div>
              <input type="range" min="30" max="70" defaultValue="50" disabled className="w-full accent-amber-600 cursor-not-allowed" />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                <span>SEVERE / CRITICAL Risk Threshold Score</span>
                <span className="font-mono font-bold text-rose-700">70.0</span>
              </div>
              <input type="range" min="60" max="90" defaultValue="70" disabled className="w-full accent-rose-600 cursor-not-allowed" />
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic">
            Threshold adjustments require Emergency Operator authentication. All modifications are appended to audit log.
          </p>
        </div>

        {/* Read-Only BLE & LoRa Hardware Diagnostics */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <Radio className="w-4 h-4 text-emerald-600" />
              <span>P2P Protocol Invariants (Read-Only)</span>
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              VERIFIED
            </span>
          </div>

          <div className="space-y-2 text-[11px] text-slate-600">
            <div className="flex justify-between">
              <span>BLE GATT Service UUID:</span>
              <span className="text-slate-900 font-bold">0000FE-NER-0000-1000</span>
            </div>
            <div className="flex justify-between">
              <span>BLE Max MTU Payload:</span>
              <span className="text-slate-900 font-bold">247 bytes</span>
            </div>
            <div className="flex justify-between">
              <span>LoRa Frequency Band:</span>
              <span className="text-emerald-700 font-bold">865.0 MHz (WPC India ISM)</span>
            </div>
            <div className="flex justify-between">
              <span>Maximum Relay Hops:</span>
              <span className="text-slate-900 font-bold">5 Hops</span>
            </div>
            <div className="flex justify-between">
              <span>Packet Time-to-Live (TTL):</span>
              <span className="text-slate-900 font-bold">12.0 Hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
