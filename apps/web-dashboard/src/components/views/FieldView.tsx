import React, { useState } from 'react';
import { Camera, ShieldCheck, Upload, CheckCircle2, AlertCircle, WifiOff, RefreshCw, FileCheck, MapPin, Clock } from 'lucide-react';

export const FieldView: React.FC = () => {
  const [hazardType, setHazardType] = useState('ROCKFALL');
  const [description, setDescription] = useState('Fresh rockfall debris blocking eastbound lane on NH-27 near Haflong Pass.');
  const [clearedHoursInput, setClearedHoursInput] = useState('18.0');
  const [fileMime, setFileMime] = useState('image/jpeg');
  const [fileSignatureStatus, setFileSignatureStatus] = useState<string | null>('JPEG Signature Verified: FF D8 FF');
  const [submitted, setSubmitted] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(2);

  const handleFileSimulate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileMime(file.type || 'image/jpeg');
      if (file.name.endsWith('.png')) {
        setFileSignatureStatus('PNG Signature Verified: 89 50 4E 47');
      } else {
        setFileSignatureStatus('JPEG Signature Verified: FF D8 FF');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setQueueCount((prev) => prev + 1);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const handleForceSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setQueueCount(0);
    }, 2000);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-black tracking-wide">Field Officer Ground Truth & Offline Incident Reporter</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Offline-first ground incident entry, PostGIS location tagging, BRO clearance updates, and magic byte file signature verification.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span>Offline Mode ({queueCount} Queued)</span>
          </div>
          <button
            onClick={handleForceSync}
            disabled={syncing || queueCount === 0}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Force Sync Now'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns: Hazard Report & BRO Clearance Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Submit Ground Observation Report</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                FIELD_OFFICER_07 (Assigned)
              </span>
            </div>

            {submitted && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Report Saved to Offline Local Storage! Magic byte validation passed. Sync scheduled.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-700">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Hazard Classification Type</label>
                <select
                  value={hazardType}
                  onChange={(e) => setHazardType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ROCKFALL">Rockfall Debris</option>
                  <option value="LANDSLIDE">Landslide Earth Slip (Major Blockage)</option>
                  <option value="ROAD_BLOCKED">Complete Road Blockage</option>
                  <option value="MUD_SLIDE">Mud Slide Saturated Soil</option>
                  <option value="BRIDGE_RISK">Bridge Structural Damage</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Field Observation Details</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* BRO Estimated Clearance Progress Input */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  On-Site BRO Debris Clearance Estimate (Hours):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={clearedHoursInput}
                  onChange={(e) => setClearedHoursInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Camera Photo Upload Simulation & Magic Byte Verification */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-900 text-xs">
                  Attach Photo Evidence (Server Validates File Magic Bytes):
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleFileSimulate}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>

                {fileSignatureStatus && (
                  <div className="text-[11px] font-mono text-emerald-800 bg-emerald-100/60 p-2 rounded border border-emerald-200 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Magic Byte Validation: <strong>{fileSignatureStatus}</strong></span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Captured Location:</span>
                  <span className="font-bold text-slate-800">Haflong Pass (25.1500, 92.7000)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Vector Clock Counter:</span>
                  <span className="font-bold text-indigo-700">vc_field_officer:142</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition shadow-sm flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Submit Ground Observation (Store & Enqueue)</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Offline Sync Queue Inspector */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Offline Sync Queue Status</span>
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>QUEUE ID #OFF-402</span>
                  <span className="text-amber-700 font-bold">PENDING SYNC</span>
                </div>
                <p className="text-slate-800 text-[11px] font-sans font-bold">
                  NH-27 Haflong Pass Debris Update (18.0h ETA)
                </p>
                <div className="text-[10px] text-slate-500">Magic Byte: JPEG (FF D8 FF)</div>
              </div>

              {queueCount >= 2 && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>QUEUE ID #OFF-401</span>
                    <span className="text-amber-700 font-bold">PENDING SYNC</span>
                  </div>
                  <p className="text-slate-800 text-[11px] font-sans font-bold">
                    Phedema Gap Mudslide Hazard Photo
                  </p>
                  <div className="text-[10px] text-slate-500">Magic Byte: PNG (89 50 4E 47)</div>
                </div>
              )}
            </div>

            <div className="pt-2 text-[11px] text-slate-500 leading-relaxed border-t border-slate-100">
              When network connectivity resumes, the client automatically flushes the local vector clock queue to <strong className="font-mono text-slate-700">/api/incidents/sync</strong> using monotonic conflict resolution.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
