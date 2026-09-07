import React, { useState } from 'react';
import { AlertTriangle, Radio, ShieldAlert, Navigation, CheckCircle2, Siren, XCircle, MapPin, PhoneCall } from 'lucide-react';

interface SOSAlert {
  id: string;
  vehicleCode: string;
  driverName: string;
  highwaySegment: string;
  lat: number;
  lng: number;
  latencyMs: number;
  meshHops: number;
  deduplicatedCount: number;
  status: 'ACTIVE_PANIC' | 'FALSE_ALARM' | 'RESCUE_DISPATCHED';
  timestamp: string;
}

interface RescueUnit {
  id: string;
  unitName: string;
  type: 'NDRF_TEAM' | 'HEAVY_TOW' | 'MEDICAL_AMBULANCE';
  baseStation: string;
  status: 'AVAILABLE' | 'EN_ROUTE' | 'ON_SCENE';
}

interface CorridorGeofence {
  id: string;
  highwayCode: string;
  name: string;
  status: 'OPEN' | 'EMERGENCY_ONLY' | 'CLOSED_LANDSLIDE';
  affectedKm: string;
}

export const EmergencyOperatorView: React.FC = () => {
  // 1. Live SOS Alerts (Deduplicated Panic Grid)
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([
    {
      id: 'SOS-991',
      vehicleCode: 'NER-07',
      driverName: 'Raju Boro',
      highwaySegment: 'NH-27 Km 142 (Haflong Pass)',
      lat: 25.18,
      lng: 93.02,
      latencyMs: 140,
      meshHops: 2,
      deduplicatedCount: 14,
      status: 'ACTIVE_PANIC',
      timestamp: '14:47:02',
    },
    {
      id: 'SOS-988',
      vehicleCode: 'NER-02',
      driverName: 'B. Kalita',
      highwaySegment: 'Shillong Bypass Curve 4',
      lat: 25.55,
      lng: 91.82,
      latencyMs: 310,
      meshHops: 4,
      deduplicatedCount: 6,
      status: 'ACTIVE_PANIC',
      timestamp: '14:42:19',
    },
  ]);

  // 2. Rescue Units
  const [rescueUnits, setRescueUnits] = useState<RescueUnit[]>([
    { id: 'RU-01', unitName: '1st NDRF Battalion Alpha', type: 'NDRF_TEAM', baseStation: 'Guwahati Base', status: 'AVAILABLE' },
    { id: 'RU-02', unitName: 'Silchar Civil Mobile ICU Ambulance', type: 'MEDICAL_AMBULANCE', baseStation: 'Silchar Base', status: 'EN_ROUTE' },
    { id: 'RU-03', unitName: 'Heavy Excavator & Tow Unit 04', type: 'HEAVY_TOW', baseStation: 'Haflong Depot', status: 'AVAILABLE' },
  ]);

  // 3. Emergency Corridor Geofences
  const [corridors, setCorridors] = useState<CorridorGeofence[]>([
    { id: 'COR-01', highwayCode: 'NH-27', name: 'Guwahati - Haflong - Silchar Corridor', status: 'EMERGENCY_ONLY', affectedKm: 'Km 120 - Km 155' },
    { id: 'COR-02', highwayCode: 'NH-44', name: 'Shillong - Jowai Highway Pass', status: 'OPEN', affectedKm: 'Km 0 - Km 64' },
    { id: 'COR-03', highwayCode: 'NH-29', name: 'Dimapur - Kohima Pass', status: 'CLOSED_LANDSLIDE', affectedKm: 'Km 32 - Km 48' },
  ]);

  // Action: Mark False Alarm (markFalseAlarm)
  const handleMarkFalseAlarm = (sosId: string) => {
    setSosAlerts((prev) =>
      prev.map((s) => (s.id === sosId ? { ...s, status: 'FALSE_ALARM' } : s))
    );
  };

  // Action: Dispatch Rescue Team
  const handleDispatchRescue = (sosId: string) => {
    setSosAlerts((prev) =>
      prev.map((s) => (s.id === sosId ? { ...s, status: 'RESCUE_DISPATCHED' } : s))
    );
    setRescueUnits((prev) =>
      prev.map((r) => (r.id === 'RU-01' ? { ...r, status: 'EN_ROUTE' } : r))
    );
  };

  // Action: Toggle Corridor Geofence
  const handleToggleCorridor = (corridorId: string, targetStatus: 'OPEN' | 'EMERGENCY_ONLY' | 'CLOSED_LANDSLIDE') => {
    setCorridors((prev) =>
      prev.map((c) => (c.id === corridorId ? { ...c, status: targetStatus } : c))
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
            <Siren className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Disaster & Emergency Command Center
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-rose-500/20 border border-rose-500/40 text-rose-300">
                EMERGENCY_OPERATOR ROLE
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Live deduplicated SOS telemetry grid, NDRF rescue team dispatch, false alarm triage, and corridor geofence enforcement.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold animate-pulse">
            <Radio className="w-4 h-4" />
            2 ACTIVE SOS PANIC SIGNALS
          </span>
        </div>
      </div>

      {/* Live SOS Panic Command Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Deduplicated Live SOS Panic Signal Grid
            </h3>
            <p className="text-xs text-slate-400">Mesh network deduplication filters duplicate RF packets; exact lat/lon pinpointed.</p>
          </div>
          <span className="text-xs font-mono text-rose-400 font-bold">Latency: 140ms (Mesh 2 Hops)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sosAlerts.map((sos) => (
            <div
              key={sos.id}
              className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 transition ${
                sos.status === 'ACTIVE_PANIC'
                  ? 'bg-rose-950/40 border-rose-700/60 shadow-rose-900/20 shadow-lg ring-1 ring-rose-500/30'
                  : sos.status === 'RESCUE_DISPATCHED'
                  ? 'bg-emerald-950/40 border-emerald-700/60'
                  : 'bg-slate-950 border-slate-800 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className={`w-5 h-5 ${sos.status === 'ACTIVE_PANIC' ? 'text-rose-400 animate-bounce' : 'text-slate-400'}`} />
                    <span className="font-mono text-sm font-bold text-white">{sos.vehicleCode}</span>
                    <span className="text-xs text-slate-400">({sos.driverName})</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      sos.status === 'ACTIVE_PANIC'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : sos.status === 'RESCUE_DISPATCHED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {sos.status}
                  </span>
                </div>

                <div className="text-xs text-slate-300 flex items-center space-x-1.5 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{sos.highwaySegment}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-400">
                  <div>GPS: <strong className="text-white">{sos.lat}, {sos.lng}</strong></div>
                  <div>Hops: <strong className="text-sky-400">{sos.meshHops} Hops</strong></div>
                  <div>Dedup: <strong className="text-emerald-400">{sos.deduplicatedCount} pkts</strong></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 border-t border-slate-800/80 pt-3">
                {sos.status === 'ACTIVE_PANIC' && (
                  <>
                    <button
                      onClick={() => handleMarkFalseAlarm(sos.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Mark False Alarm</span>
                    </button>
                    <button
                      onClick={() => handleDispatchRescue(sos.id)}
                      className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition"
                    >
                      <Siren className="w-4 h-4" />
                      <span>Dispatch Rescue Unit</span>
                    </button>
                  </>
                )}
                {sos.status === 'RESCUE_DISPATCHED' && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>NDRF Rescue Team Dispatched & En Route</span>
                  </span>
                )}
                {sos.status === 'FALSE_ALARM' && (
                  <span className="text-xs font-medium text-slate-500">Logged as False Alarm</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rescue Dispatcher & Corridor Geofencing (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rescue Resource Dispatcher */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            Disaster Rescue Resource Allocation
          </h3>
          <div className="space-y-3">
            {rescueUnits.map((ru) => (
              <div key={ru.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="font-bold text-xs text-white">{ru.unitName}</div>
                  <div className="text-[11px] text-slate-400">{ru.baseStation} • Type: <strong className="text-sky-300">{ru.type}</strong></div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded text-xs font-bold ${
                    ru.status === 'AVAILABLE'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                  }`}
                >
                  {ru.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Corridor Geofencing Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            Emergency Highway Corridor Geofence Management
          </h3>
          <div className="space-y-3">
            {corridors.map((cor) => (
              <div key={cor.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-xs text-sky-300">{cor.highwayCode}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      cor.status === 'EMERGENCY_ONLY'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : cor.status === 'CLOSED_LANDSLIDE'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {cor.status}
                  </span>
                </div>
                <div className="text-xs font-semibold text-white">{cor.name}</div>
                <div className="text-[11px] text-slate-400 font-mono">Segment: {cor.affectedKm}</div>

                <div className="pt-2 flex space-x-2">
                  <button
                    onClick={() => handleToggleCorridor(cor.id, 'EMERGENCY_ONLY')}
                    className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 border border-rose-700/50 text-rose-300 text-[10px] font-bold transition"
                  >
                    Declare EMERGENCY_ONLY
                  </button>
                  <button
                    onClick={() => handleToggleCorridor(cor.id, 'OPEN')}
                    className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 text-[10px] font-bold transition"
                  >
                    Reopen Highway
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
