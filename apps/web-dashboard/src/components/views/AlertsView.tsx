import React from 'react';
import { Bell, ShieldAlert, MessageSquare, Volume2, CheckCircle2 } from 'lucide-react';
import { LiveAlertsPanel } from '../dashboard/LiveAlertsPanel';

export const AlertsView: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-black tracking-wide">Live Alerts & Multi-Channel Notification Stream</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time emergency dispatch notifications, Twilio SMS / WhatsApp outbox logging, and WebSocket broadcast streaming.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center space-x-2 text-xs font-mono">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>Audio Chime ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[500px]">
        {/* Left Column: Alerts Stream */}
        <div className="lg:col-span-2">
          <LiveAlertsPanel />
        </div>

        {/* Right Column: Channel Integration Log */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Twilio WhatsApp & SMS Outbox</span>
          </h3>

          <div className="space-y-2 text-xs font-mono">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>WHATSAPP (+919876543213)</span>
                <span className="text-emerald-700 font-bold">DELIVERED</span>
              </div>
              <p className="text-slate-700 text-[11px]">
                🚨 CRITICAL ALERT: NH-27 Haflong Pass blocked by Landslide. Alternate route R2 assigned to vehicle NER-07.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>SMS DISPATCH (+919876543213)</span>
                <span className="text-emerald-700 font-bold">SENT</span>
              </div>
              <p className="text-slate-700 text-[11px]">
                [NER LOGISENSE] Weather Warning: Heavy rain (145mm/24h) in Dima Hasao Sector. Maintain caution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
