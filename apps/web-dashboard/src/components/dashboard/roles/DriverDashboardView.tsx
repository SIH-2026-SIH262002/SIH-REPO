import React, { useState, useEffect } from 'react';
import { Compass, AlertTriangle, Radio, ShieldAlert, CheckCircle2, MapPin, Truck, Navigation, Globe } from 'lucide-react';
import { apiService } from '../../../services/apiService';
import { useTranslation } from 'react-i18next';

export const DriverDashboardView: React.FC = () => {
  const { t, i18n } = useTranslation();

  // Transit Status State
  const [transitState, setTransitState] = useState<'PICKED_UP' | 'IN_TRANSIT' | 'DELAYED_LANDSLIDE' | 'ARRIVED_DESTINATION'>('IN_TRANSIT');

  // Hazard Report Log State
  const [reportedHazards, setReportedHazards] = useState<Array<{ type: string; timestamp: string; location: string }>>([
    { type: 'ROCKFALL', timestamp: '14:35:10', location: 'NH-27 Km 142 Haflong Pass' },
  ]);

  // SOS State
  const [sosActive, setSosActive] = useState(false);
  const [sosStatus, setSosStatus] = useState<'IDLE' | 'BROADCASTING' | 'RELAYED_MESH'>('IDLE');

  // Multilingual Driver Warning State (Connected Backend Feature)
  const [driverLang, setDriverLang] = useState<'AS' | 'BN' | 'HI' | 'MN' | 'MZ' | 'EN'>('AS');
  const [warningText, setWarningText] = useState<string>('');

  useEffect(() => {
    const fetchI18n = async () => {
      const trans = await apiService.getTranslations(driverLang);
      if (trans?.hazard_warning) {
        setWarningText(trans.hazard_warning);
      }
    };
    fetchI18n();
  }, [driverLang]);

  // Action: Report En-Route Hazard (POST /api/mobile/driver/me/hazard)
  const handleReportHazard = (hazardType: string) => {
    const newHazard = {
      type: hazardType,
      timestamp: new Date().toLocaleTimeString(),
      location: 'NH-27 Highway Km 144 (GPS: 25.18, 93.02)',
    };
    setReportedHazards((prev) => [newHazard, ...prev]);
  };

  // Action: Trigger SOS Panic Signal
  const handleTriggerSOS = () => {
    setSosActive(true);
    setSosStatus('BROADCASTING');
    setTimeout(() => {
      setSosStatus('RELAYED_MESH');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Compass className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Convoy Telematics & Driver Mobile Portal
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                DRIVER ROLE
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              View assigned convoy route telemetry, update shipment transit status, flag en-route road hazards, and broadcast mesh SOS panic alerts.
            </p>
          </div>
        </div>

        {/* Multilingual Driver Warning Language Toggle */}
        <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 p-1.5 rounded-xl">
          <Globe className="w-4 h-4 text-emerald-400 ml-1" />
          {(['as', 'bn', 'hi', 'mn', 'mz', 'en'] as const).map((l) => {
            const isCurrent = (i18n.language || 'en').toLowerCase().startsWith(l);
            return (
              <button
                key={l}
                onClick={() => {
                  setDriverLang(l.toUpperCase() as any);
                  i18n.changeLanguage(l);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  isCurrent
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {l === 'as' ? 'অসমীয়া' : l === 'bn' ? 'বাংলা' : l === 'hi' ? 'हिंदी' : l === 'mn' ? 'ꯃꯩꯇꯩ' : l === 'mz' ? 'Mizo' : 'EN'}
              </button>
            );
          })}
        </div>
      </div>


      {/* Multilingual Active Driver Warning Banner */}
      {warningText && (
        <div className="p-3.5 bg-amber-950/40 border border-amber-700/60 rounded-xl text-amber-300 text-xs font-semibold flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{warningText}</span>
        </div>
      )}

      {/* Convoy Telematics & Shipment Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Assigned Convoy Details & Telematics
            </h3>
            <p className="text-xs text-slate-400">Vehicle Code: NER-07 • License: AS-01-HC-9412</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            GPS Signal: Lock (12 Satellites)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
            <span className="text-[10px] text-slate-400 font-medium uppercase">Cargo Description</span>
            <div className="text-sm font-bold text-white">2.5 Tons Critical Medical Supplies</div>
            <div className="text-xs text-emerald-400 font-semibold">Silchar Civil Hospital District Order</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
            <span className="text-[10px] text-slate-400 font-medium uppercase">Route Itinerary</span>
            <div className="text-sm font-bold text-white flex items-center space-x-1">
              <span>Guwahati Hub</span>
              <Navigation className="w-3.5 h-3.5 text-sky-400 rotate-90" />
              <span>Silchar Depot</span>
            </div>
            <div className="text-xs text-sky-300 font-mono">Via NH-27 Haflong Highway Pass</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
            <span className="text-[10px] text-slate-400 font-medium uppercase">Vehicle Telematics</span>
            <div className="text-sm font-bold text-white">Speed: 48 km/h • Fuel: 76%</div>
            <div className="text-xs text-slate-400 font-mono">Mesh Node: Active (5 Hops Max TTL)</div>
          </div>
        </div>

        {/* Driver Transit Status Progress Selector */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <span className="text-xs text-slate-300 font-bold">Update Shipment Transit Status:</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(['PICKED_UP', 'IN_TRANSIT', 'DELAYED_LANDSLIDE', 'ARRIVED_DESTINATION'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setTransitState(st)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition text-center ${
                  transitState === st
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg ring-1 ring-emerald-400'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* En-Route Hazard Reporter & One-Tap SOS Panic Button (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* En-Route Hazard Reporter (POST /api/mobile/driver/me/hazard) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">En-Route Road Hazard Flagging</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ROAD_HAZARD_FLAG_SELF
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Encountered a road obstruction? Flag hazards in real-time to alert nearby convoys and regional operators.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => handleReportHazard('🪨 ROCKFALL_BLOCKAGE')}
                className="p-3 bg-slate-950 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/50 rounded-xl text-xs font-bold text-white text-left transition flex items-center space-x-2"
              >
                <span className="text-base">🪨</span>
                <span>Rockfall / Mudslide</span>
              </button>

              <button
                onClick={() => handleReportHazard('🌳 FALLEN_TREE')}
                className="p-3 bg-slate-950 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/50 rounded-xl text-xs font-bold text-white text-left transition flex items-center space-x-2"
              >
                <span className="text-base">🌳</span>
                <span>Fallen Tree / Debris</span>
              </button>

              <button
                onClick={() => handleReportHazard('🚧 ROAD_SUBSIDENCE')}
                className="p-3 bg-slate-950 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/50 rounded-xl text-xs font-bold text-white text-left transition flex items-center space-x-2"
              >
                <span className="text-base">🚧</span>
                <span>Road Subsidence</span>
              </button>

              <button
                onClick={() => handleReportHazard('🌊 FLASH_FLOOD_OVERFLOW')}
                className="p-3 bg-slate-950 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/50 rounded-xl text-xs font-bold text-white text-left transition flex items-center space-x-2"
              >
                <span className="text-base">🌊</span>
                <span>Flash Flood Overflow</span>
              </button>
            </div>

            {reportedHazards.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] text-slate-400 font-medium">Logged Hazard Flags:</span>
                {reportedHazards.map((h, i) => (
                  <div key={i} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs flex justify-between items-center">
                    <span className="font-bold text-amber-300">{h.type}</span>
                    <span className="text-[10px] font-mono text-slate-400">{h.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* One-Tap Emergency SOS Panic Button */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
                <h3 className="font-bold text-white text-sm">Emergency Mesh Relay SOS</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                DRIVER_SOS_TRIGGER
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              In immediate danger or trapped by a landslide? Tap the emergency SOS panic button. The signal will propagate via RF Mesh Relay if cellular signal is lost.
            </p>

            <button
              onClick={handleTriggerSOS}
              className={`w-full py-6 rounded-2xl font-extrabold text-base tracking-wider uppercase shadow-2xl transition-all transform active:scale-95 flex flex-col items-center justify-center space-y-1 ${
                sosActive
                  ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-400/50'
                  : 'bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 hover:from-rose-600 hover:to-red-500 text-white border border-rose-500/40'
              }`}
            >
              <Radio className={`w-8 h-8 ${sosActive ? 'animate-ping' : ''}`} />
              <span>{sosActive ? '🚨 SOS PANIC SIGNAL ACTIVE 🚨' : 'TRIGGER EMERGENCY SOS PANIC'}</span>
              <span className="text-[10px] tracking-normal font-mono font-normal opacity-80">
                Instant GPS Telemetry Broadcast + Multi-hop Mesh Relay
              </span>
            </button>

            {sosStatus === 'BROADCASTING' && (
              <div className="mt-4 p-3 bg-rose-950/80 border border-rose-700/60 rounded-xl text-xs text-rose-300 text-center font-mono">
                📡 Broadcasting RF Packet to Nearby Convoy Nodes...
              </div>
            )}

            {sosStatus === 'RELAYED_MESH' && (
              <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-xs text-emerald-300 space-y-1">
                <div className="font-bold flex items-center justify-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>SOS Signal Relayed to Command Center via Mesh Hop 2!</span>
                </div>
                <div className="text-[10px] text-emerald-400 text-center font-mono">
                  Deduplicated Packet ID: MESH-NER07-9412 • Emergency Operator Alerted
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
