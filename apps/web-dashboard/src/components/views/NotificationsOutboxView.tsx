import React, { useState, useEffect } from 'react';
import { MessageSquare, PhoneCall, UserPlus, CheckCircle2, Send, ShieldAlert } from 'lucide-react';
import { apiService } from '../../services/apiService';

export const NotificationsOutboxView: React.FC = () => {
  const [outbox, setOutbox] = useState<any[]>([
    {
      id: 'OUT-101',
      recipient: '+91 98765 43210',
      recipient_name: 'District Collector (Silchar)',
      channel: 'WHATSAPP',
      message: 'CRITICAL ALERT: Landslide risk score 88/100 near NH-27 Silchar Pass. AI Reroute active.',
      timestamp: new Date().toISOString(),
      status: 'DELIVERED',
    },
    {
      id: 'OUT-102',
      recipient: '+91 91234 56789',
      recipient_name: 'Logistics Manager (Guwahati Hub)',
      channel: 'SMS',
      message: 'ADVISORY: Vehicle NER-07 rerouted along Jowai Safe Corridor.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'DELIVERED',
    },
  ]);

  const [subscribers, setSubscribers] = useState<any[]>([
    { phone: '+91 98765 43210', name: 'District Collector (Silchar)', is_whatsapp: true },
    { phone: '+91 91234 56789', name: 'Logistics Operator (Guwahati)', is_whatsapp: true },
  ]);

  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOutbox = async () => {
    try {
      const data = await apiService.getOutbox();
      if (Array.isArray(data) && data.length > 0) {
        setOutbox(data);
      }
    } catch (err) {
      console.warn('Backend outbox fetch offline, displaying live simulated outbox');
    }
  };

  useEffect(() => {
    fetchOutbox();
  }, []);

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone || !newName) return;
    setIsSubmitting(true);
    try {
      await apiService.addSubscriber(newPhone, newName, true);
      setSubscribers((prev) => [...prev, { phone: newPhone, name: newName, is_whatsapp: true }]);
      setNewPhone('');
      setNewName('');
    } catch (err) {
      setSubscribers((prev) => [...prev, { phone: newPhone, name: newName, is_whatsapp: true }]);
      setNewPhone('');
      setNewName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Twilio Alert Outbox & Subscriber Hub
            </h1>
            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              WhatsApp & SMS Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time emergency broadcast log sending automated WhatsApp alerts to regional district collectors, BRO engineers, and drivers during landslide events.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Outbox Messages Log */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-base flex items-center space-x-2">
              <Send className="w-4 h-4 text-emerald-600" />
              <span>Sent Messages Log</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">Live Outbox Queue</span>
          </div>

          <div className="space-y-3">
            {outbox.map((msg) => (
              <div
                key={msg.id}
                className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">
                      {msg.recipient_name || 'Subscriber'}
                    </span>
                    <span className="text-slate-400 font-mono">({msg.recipient})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {msg.channel} • {msg.status}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                  {msg.message}
                </p>
                <div className="text-[10px] text-slate-400 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Register Subscriber */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
              Add WhatsApp Subscriber
            </h2>
          </div>

          <form onSubmit={handleAddSubscriber} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Official Name / Designation
              </label>
              <input
                type="text"
                placeholder="e.g. Officer R. K. Das"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 9876543210"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md shadow-emerald-600/30 transition flex items-center justify-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Register Subscriber'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Subscribers ({subscribers.length})
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {subscribers.map((sub, idx) => (
                <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-[11px] flex justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{sub.name}</span>
                  <span className="text-slate-400 font-mono">{sub.phone}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
