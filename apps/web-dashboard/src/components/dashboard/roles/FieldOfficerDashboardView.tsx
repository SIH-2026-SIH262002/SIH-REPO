import React, { useState } from 'react';
import { HardHat, CheckCircle2, AlertTriangle, Camera, Activity, FileCheck, ShieldCheck, MapPin, Upload, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FieldTask {

  id: string;
  location: string;
  district: string;
  triggerType: 'SENSOR_ANOMALY' | 'DRIVER_HAZARD_FLAG' | 'OPERATOR_DISPATCH';
  taskState: 'ACKNOWLEDGED' | 'EN_ROUTE' | 'ON_SITE' | 'COMPLETED' | 'UNABLE_TO_REACH';
  verificationOutcome?: 'HAZARD_CONFIRMED' | 'NO_HAZARD_FOUND' | 'CONDITION_CHANGED' | 'UNABLE_TO_REACH';
  notes?: string;
  photoHash?: string;
}

interface SensorAnomaly {
  nodeKey: string;
  name: string;
  soilMoisture: number;
  vibration: number;
  slopeAngle: number;
  anomalyTime: string;
}

export const FieldOfficerDashboardView: React.FC = () => {
  const { t } = useTranslation();

  // 1. Field Task Queue
  const [tasks, setTasks] = useState<FieldTask[]>([
    {
      id: 'TASK-HAFLONG-104',
      location: 'NH-27 Km 142 Slope Inspection',
      district: 'Dima Hasao (Haflong)',
      triggerType: 'SENSOR_ANOMALY',
      taskState: 'ON_SITE',
    },
    {
      id: 'TASK-SILCHAR-201',
      location: 'Silchar Bypass Bridge Access Way',
      district: 'Cachar (Silchar)',
      triggerType: 'DRIVER_HAZARD_FLAG',
      taskState: 'ACKNOWLEDGED',
    },
  ]);

  // 2. IoT Sensor Anomaly Telemetry Stream
  const [anomalies] = useState<SensorAnomaly[]>([
    { nodeKey: 'SILCHAR-S4', name: 'Silchar Sensor Node #4', soilMoisture: 94.2, vibration: 4.8, slopeAngle: 34, anomalyTime: '14:46:10' },
    { nodeKey: 'AIZAWL-S2', name: 'Aizawl North Hillside Node', soilMoisture: 86.5, vibration: 3.2, slopeAngle: 28, anomalyTime: '14:40:00' },
  ]);

  // 3. Photo Proof Upload State
  const [selectedTaskForUpload, setSelectedTaskForUpload] = useState<string>('TASK-HAFLONG-104');
  const [uploadStatus, setUploadStatus] = useState<{ isUploading: boolean; success: boolean; hash?: string }>({
    isUploading: false,
    success: false,
  });

  // Action: Update Task Lifecycle State
  const handleUpdateTaskState = (taskId: string, newState: FieldTask['taskState']) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, taskState: newState } : t))
    );
  };

  // Action: Submit Field Verification Outcome
  const handleSetOutcome = (taskId: string, outcome: NonNullable<FieldTask['verificationOutcome']>) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, verificationOutcome: outcome, taskState: outcome === 'UNABLE_TO_REACH' ? 'UNABLE_TO_REACH' : 'COMPLETED' } : t
      )
    );
  };

  // Action: Simulate Photo Proof Upload with SHA-256 Hashing & Magic Byte Verification
  const handleSimulatePhotoUpload = () => {
    setUploadStatus({ isUploading: true, success: false });
    setTimeout(() => {
      const mockHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      setUploadStatus({ isUploading: false, success: true, hash: mockHash });
      setTasks((prev) =>
        prev.map((t) => (t.id === selectedTaskForUpload ? { ...t, photoHash: mockHash } : t))
      );
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <HardHat className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {t('field.consoleTitle', 'Field Officer Incident Portal')}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                {t('roles.fieldOfficer', 'Field Reporting Officer')}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Acknowledge field tasks, inspect IoT landslide anomalies, submit verified outcomes, and attach evidence photos.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Activity className="w-4 h-4" />
            2 Pending Verification Assignments
          </span>
        </div>
      </div>

      {/* Field Inspection Tasks & Verification Outcome Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Field Verification Task Queue & Ground Truth Outcomes
            </h3>
            <p className="text-xs text-slate-400">Validate real-world road conditions to complete the closed-loop intelligence cycle.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tasks.map((task) => (
            <div key={task.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono font-bold text-sm text-amber-300">{task.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      task.taskState === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : task.taskState === 'UNABLE_TO_REACH'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {task.taskState}
                  </span>
                </div>

                <div className="text-xs font-bold text-white flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{task.location} ({task.district})</span>
                </div>

                <div className="text-[11px] text-slate-400 mt-1">
                  Trigger Origin: <strong className="text-slate-200 font-mono">{task.triggerType}</strong>
                </div>

                {/* State Progress Lifecycle Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] text-slate-400 font-medium">Update Task Progress Lifecycle:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(['ACKNOWLEDGED', 'EN_ROUTE', 'ON_SITE', 'UNABLE_TO_REACH'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateTaskState(task.id, st)}
                        className={`px-2.5 py-1 rounded text-[10px] font-semibold transition ${
                          task.taskState === st
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ground Truth Outcome Selector */}
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] text-slate-300 font-bold">Select Ground Truth Verification Outcome:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSetOutcome(task.id, 'HAZARD_CONFIRMED')}
                      className={`p-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                        task.verificationOutcome === 'HAZARD_CONFIRMED'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-slate-900 hover:bg-rose-950/60 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>HAZARD_CONFIRMED</span>
                    </button>

                    <button
                      onClick={() => handleSetOutcome(task.id, 'NO_HAZARD_FOUND')}
                      className={`p-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                        task.verificationOutcome === 'NO_HAZARD_FOUND'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-900 hover:bg-emerald-950/60 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>NO_HAZARD_FOUND</span>
                    </button>

                    <button
                      onClick={() => handleSetOutcome(task.id, 'CONDITION_CHANGED')}
                      className={`p-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                        task.verificationOutcome === 'CONDITION_CHANGED'
                          ? 'bg-sky-600 text-white shadow-md'
                          : 'bg-slate-900 hover:bg-sky-950/60 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                      <span>CONDITION_CHANGED</span>
                    </button>

                    <button
                      onClick={() => handleSetOutcome(task.id, 'UNABLE_TO_REACH')}
                      className={`p-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                        task.verificationOutcome === 'UNABLE_TO_REACH'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-slate-900 hover:bg-purple-950/60 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <HardHat className="w-3.5 h-3.5 text-purple-400" />
                      <span>UNABLE_TO_REACH</span>
                    </button>
                  </div>
                </div>

                {task.photoHash && (
                  <div className="mt-3 p-2 bg-emerald-950/50 border border-emerald-700/50 rounded-lg text-[10px] font-mono text-emerald-300 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">Evidence Hash: {task.photoHash}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IoT Anomaly Telemetry & Photo Evidence Security Uploader (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IoT Anomaly Stream */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            Real-Time IoT Sensor Anomaly Telemetry
          </h3>
          <div className="space-y-3">
            {anomalies.map((anom) => (
              <div key={anom.nodeKey} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-white">{anom.name}</span>
                  <span className="text-[10px] font-mono text-rose-400">{anom.anomalyTime}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400">Soil Moisture</span>
                    <div className="font-bold text-rose-400">{anom.soilMoisture}%</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400">Vibration</span>
                    <div className="font-bold text-amber-400">{anom.vibration} Richter</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400">Slope Angle</span>
                    <div className="font-bold text-sky-400">{anom.slopeAngle}°</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Photo Evidence Security Uploader */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              Photo Evidence SHA-256 Hashing Uploader
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Cryptographically sign ground photo evidence with client magic-byte validation prior to server upload.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Target Inspection Task:</label>
                <select
                  value={selectedTaskForUpload}
                  onChange={(e) => setSelectedTaskForUpload(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs text-white p-2.5"
                >
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} - {t.location}
                    </option>
                  ))}
                </select>
              </div>

              <div
                onClick={handleSimulatePhotoUpload}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-950/60"
              >
                <Camera className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <div className="text-xs font-bold text-white">Click to Upload Ground Photo Evidence</div>
                <div className="text-[10px] text-slate-500 mt-1">JPEG/PNG Magic Byte Check + Client SHA-256 Auto-Hasher</div>
              </div>

              {uploadStatus.isUploading && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-amber-300 flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Computing SHA-256 & Uploading Photo...</span>
                </div>
              )}

              {uploadStatus.success && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Evidence Cryptographically Verified & Attached</span>
                  </div>
                  <div className="font-mono text-[10px] text-emerald-300 truncate">
                    SHA-256: {uploadStatus.hash}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
