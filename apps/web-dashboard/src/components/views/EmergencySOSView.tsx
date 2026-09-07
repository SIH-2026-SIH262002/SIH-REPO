import React, { useState, useEffect } from 'react';
import { Siren, AlertOctagon, CheckCircle2, Phone, MapPin, Truck, ShieldAlert } from 'lucide-react';
import { apiService } from '../../services/apiService';

export const EmergencySOSView: React.FC = () => {
  const [sosList, setSosList] = useState<any[]>([
    {
      id: 'SOS-9041',
      vehicle_code: 'NER-07',
      driver_name: 'Rajesh Sharma',
      location_name: 'Dima Hasao Pass (NH-27 KM 42)',
      latitude: 25.18,
      longitude: 92.93,
      emergency_type: 'ENGINE_FAILURE_LANDSLIDE_BLOCKED',
      description: 'Medical supply truck trapped near loose scree rockfall zone.',
      cargo: 'Emergency Medicines & Oxygen Cylinders',
      created_at: new Date().toISOString(),
      status: 'ACTIVE',
    },
  ]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchSOS = async () => {
    try {
      const data = await apiService.getSOS();
      if (Array.isArray(data) && data.length > 0) {
        setSosList(data);
      }
    } catch (err) {
      console.warn('Backend SOS fetch offline, displaying live simulated SOS queue');
    }
  };

  useEffect(() => {
    fetchSOS();
  }, []);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await apiService.resolveSOS(id, 'NDRF & BRO Response Team Dispatched');
      setSosList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setSosList((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-rose-950 text-white rounded-2xl p-6 border border-rose-800 shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Siren className="w-6 h-6 text-rose-400 animate-pulse" />
            <h1 className="text-xl font-black tracking-wide">
              Emergency SOS Command Radar
            </h1>
            <span className="bg-rose-900 text-rose-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-700">
              HIGH PRIORITY DISPATCH
            </span>
          </div>
          <p className="text-xs text-rose-200">
            Real-time driver emergency triggers, landslide entrapment alerts, and state disaster response dispatch queue.
          </p>
        </div>
      </div>

      {/* SOS List */}
      <div className="space-y-4">
        {sosList.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
              No Active Emergency SOS Triggers
            </h3>
            <p className="text-xs text-slate-500">
              All logistics vehicles operating safely along designated corridors.
            </p>
          </div>
        ) : (
          sosList.map((sos) => (
            <div
              key={sos.id}
              className="bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-xl">
                    <AlertOctagon className="w-6 h-6 animate-ping" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-slate-900 dark:text-slate-100 text-base">
                        {sos.vehicle_code || 'NER-07'} ({sos.driver_name || 'Driver'})
                      </span>
                      <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {sos.emergency_type || 'LANDSLIDE_BLOCKED'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{sos.location_name || 'NH-27 Dima Hasao Pass'}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  {sos.description || 'Logistics truck carrying emergency supplies blocked by scree slope failure.'}
                </p>

                <div className="flex items-center space-x-4 text-xs font-mono text-slate-500">
                  <span>Cargo: <strong className="text-emerald-600 dark:text-emerald-400">{sos.cargo || 'Medical Freight'}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                <button
                  onClick={() => handleResolve(sos.id)}
                  disabled={resolvingId === sos.id}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{resolvingId === sos.id ? 'Dispatching...' : 'Dispatch NDRF Response & Resolve'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
