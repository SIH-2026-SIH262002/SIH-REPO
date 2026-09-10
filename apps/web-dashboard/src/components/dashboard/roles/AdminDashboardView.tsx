import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Database, Activity, RefreshCw, AlertCircle, CheckCircle2, UserX, UserCheck, Lock, Radio, BatteryCharging } from 'lucide-react';
import { apiService } from '../../../services/apiService';

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  district: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  lastActive: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  status: 'SUCCESS' | 'WARNING' | 'CRITICAL';
  ip: string;
}

interface DeviceTelemetry {
  deviceId: string;
  batteryPct: number;
  solarStatus: string;
  rssiDbm: number;
  firmware: string;
}

export const AdminDashboardView: React.FC = () => {
  // Device Hardware Telemetry State (Connected Backend Feature)
  const [deviceTelemetry, setDeviceTelemetry] = useState<DeviceTelemetry[]>([]);

  useEffect(() => {
    const fetchDevices = async () => {
      const data = await apiService.getDeviceTelemetry();
      if (Array.isArray(data)) setDeviceTelemetry(data);
    };
    fetchDevices();
  }, []);

  // 1. User Management State with Soft Account States
  const [users, setUsers] = useState<MockUser[]>([
    { id: 'USR-01', name: 'Dr. Rajesh Sharma', email: 'rajesh.sharma@ndma.gov.in', role: 'ADMIN', district: 'Guwahati (Kamrup)', status: 'ACTIVE', lastActive: 'Just now' },
    { id: 'USR-02', name: 'Major Vikram Sen', email: 'vikram.sen@logistics.ner.gov', role: 'LOGISTICS_OPERATOR', district: 'Silchar (Cachar)', status: 'ACTIVE', lastActive: '2 mins ago' },
    { id: 'USR-03', name: 'Ananya Roy', email: 'ananya.roy@disaster.state.gov', role: 'EMERGENCY_OPERATOR', district: 'Shillong (East Khasi)', status: 'ACTIVE', lastActive: '5 mins ago' },
    { id: 'USR-04', name: 'Inspector K. Gogoi', email: 'k.gogoi@field.ner.gov', role: 'FIELD_OFFICER', district: 'Haflong (Dima Hasao)', status: 'SUSPENDED', lastActive: '1 hour ago' },
    { id: 'USR-05', name: 'Raju Boro (Driver)', email: 'raju.boro@trans-ner.com', role: 'DRIVER', district: 'Assam Highway Corridor', status: 'ACTIVE', lastActive: '12 mins ago' },
    { id: 'USR-06', name: 'S. K. Das (Field Inspector)', email: 'sk.das@field.ner.gov', role: 'FIELD_OFFICER', district: 'Aizawl (Mizoram)', status: 'DEACTIVATED', lastActive: '3 days ago' },
  ]);

  // 2. ML Model State
  const [modelState, setModelState] = useState({
    version: 'v1.2-ner-landslide-prod',
    status: 'ACTIVE',
    drift: 2.4,
    accuracy: 94.8,
    lastTrained: '2026-09-01 (14,200 sensor samples)',
    isRollbackProcessing: false,
    rollbackMessage: '',
  });

  // 3. System Audit Log Feed
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: 'LOG-881', timestamp: '14:48:12', actor: 'admin.rajesh', role: 'ADMIN', action: 'ML Model v1.2 parameters validated', status: 'SUCCESS', ip: '10.240.0.14' },
    { id: 'LOG-880', timestamp: '14:45:02', actor: 'operator.ananya', role: 'EMERGENCY_OPERATOR', action: 'INCIDENT_VERIFY issued on NH-27 Corridor', status: 'WARNING', ip: '10.240.2.88' },
    { id: 'LOG-879', timestamp: '14:30:19', actor: 'system.security', role: 'SYSTEM', action: 'User USR-04 soft-suspended (FAILED_LOGIN_LIMIT)', status: 'CRITICAL', ip: '192.168.1.1' },
    { id: 'LOG-878', timestamp: '14:15:40', actor: 'driver.raju', role: 'DRIVER', action: 'En-route Hazard Flagged: ROCKFALL_NH27', status: 'SUCCESS', ip: '172.16.4.12' },
  ]);

  // Toggle user state
  const handleToggleUserStatus = (userId: string, targetStatus: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED') => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, status: targetStatus };
          const newLog: AuditLog = {
            id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
            timestamp: new Date().toLocaleTimeString(),
            actor: 'admin.current',
            role: 'ADMIN',
            action: `Account ${u.name} (${u.id}) status changed to ${targetStatus}`,
            status: targetStatus === 'ACTIVE' ? 'SUCCESS' : 'WARNING',
            ip: '10.240.0.1',
          };
          setAuditLogs((prevLogs) => [newLog, ...prevLogs]);
          return updated;
        }
        return u;
      })
    );
  };

  // Rollback ML model
  const handleRollbackModel = () => {
    setModelState((prev) => ({ ...prev, isRollbackProcessing: true }));
    setTimeout(() => {
      setModelState((prev) => ({
        ...prev,
        version: 'v1.1-ner-stable-legacy',
        drift: 1.1,
        accuracy: 93.5,
        isRollbackProcessing: false,
        rollbackMessage: 'Successfully rolled back ML model pipeline to v1.1-ner-stable-legacy',
      }));
      const newLog: AuditLog = {
        id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: new Date().toLocaleTimeString(),
        actor: 'admin.current',
        role: 'ADMIN',
        action: 'EMERGENCY_ROLLBACK: Reverted ML model to v1.1-ner-stable-legacy',
        status: 'CRITICAL',
        ip: '10.240.0.1',
      };
      setAuditLogs((prevLogs) => [newLog, ...prevLogs]);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Platform Governance & System Health Command
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-purple-500/20 border border-purple-500/40 text-purple-300">
                ADMIN ROLE
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Manage user access control, soft-account states, ML model governance, and infrastructure security metrics.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            System Governance: Operational
          </span>
        </div>
      </div>

      {/* Infrastructure Health & ML Governance Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ML Model Governance Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">AI / ML Model Governance</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                RANDOM_FOREST + XGBOOST
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Active Pipeline:</span>
                <span className="font-mono text-indigo-300 font-bold">{modelState.version}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Model Accuracy:</span>
                <span className="font-semibold text-emerald-400">{modelState.accuracy}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Data Drift Index:</span>
                <span className={`font-semibold ${modelState.drift > 5 ? 'text-rose-400' : 'text-amber-400'}`}>
                  {modelState.drift}% (Nominal threshold &lt; 5%)
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Last Training Epoch:</span>
                <span className="text-slate-300 font-mono text-[11px]">{modelState.lastTrained}</span>
              </div>
            </div>

            {modelState.rollbackMessage && (
              <div className="mt-3 p-2.5 bg-emerald-950/60 border border-emerald-700/50 rounded-lg text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{modelState.rollbackMessage}</span>
              </div>
            )}
          </div>

          <div className="mt-5">
            <button
              onClick={handleRollbackModel}
              disabled={modelState.isRollbackProcessing || modelState.version.includes('legacy')}
              className={`w-full py-2 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-2 ${
                modelState.version.includes('legacy')
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-md'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${modelState.isRollbackProcessing ? 'animate-spin' : ''}`} />
              <span>
                {modelState.isRollbackProcessing
                  ? 'Processing Rollback...'
                  : modelState.version.includes('legacy')
                  ? 'Model Rolled Back to Legacy v1.1'
                  : 'Emergency Rollback to Model v1.1'}
              </span>
            </button>
          </div>
        </div>

        {/* Infrastructure Health & IoT Edge Hardware Telemetry */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Infrastructure Telemetry</h3>
            </div>
            {deviceTelemetry.length > 0 && (
              <span className="flex items-center space-x-1 text-[10px] text-emerald-400 font-mono">
                <BatteryCharging className="w-3.5 h-3.5" />
                <span>IoT Solar Battery {deviceTelemetry[0].batteryPct}%</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 font-medium">PostGIS Database Pool</span>
              <div className="text-lg font-bold text-white mt-1">14 / 50 <span className="text-xs text-emerald-400 font-normal">Active</span></div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full w-[28%]" />
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 font-medium">Redis Cache Hit Rate</span>
              <div className="text-lg font-bold text-emerald-400 mt-1">98.4%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-400 h-full w-[98%]" />
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 font-medium">MQTT Sensor Broker</span>
              <div className="text-lg font-bold text-sky-400 mt-1">1,240 <span className="text-xs text-slate-400 font-normal">msg/s</span></div>
              <span className="inline-block mt-1 text-[10px] text-sky-400 font-mono">18 Active States</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 font-medium">API Gateway Latency</span>
              <div className="text-lg font-bold text-white mt-1">18ms <span className="text-xs text-emerald-400 font-normal">p99</span></div>
              <span className="inline-block mt-1 text-[10px] text-emerald-400 font-mono">Nominal &lt; 50ms</span>
            </div>
          </div>
        </div>

        {/* Security Audit Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-sm">Security Audit Log Stream</h3>
              </div>
              <span className="flex items-center space-x-1 text-[10px] text-purple-400 font-mono">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>LIVE FEED</span>
              </span>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-500">{log.timestamp} • {log.ip}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        log.status === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : log.status === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {log.actor} ({log.role})
                    </span>
                  </div>
                  <span className="text-slate-300 font-medium">{log.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* User Management & Soft Account States Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              User Access Governance & Soft Account States
            </h3>
            <p className="text-xs text-slate-400">
              Control platform personnel lifecycle. Soft states (`ACTIVE`, `SUSPENDED`, `DEACTIVATED`) restrict API permissions without hard deleting historical telemetry logs.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Total System Users: <strong className="text-white">{users.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Personnel Name</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Jurisdiction District</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((usr) => (
                <tr key={usr.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-300">{usr.id}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{usr.name}</div>
                    <div className="text-[11px] text-slate-500">{usr.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300">
                      {usr.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{usr.district}</td>
                  <td className="py-3.5 px-4">
                    {usr.status === 'ACTIVE' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> ACTIVE
                      </span>
                    )}
                    {usr.status === 'SUSPENDED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                        <AlertCircle className="w-3 h-3" /> SUSPENDED
                      </span>
                    )}
                    {usr.status === 'DEACTIVATED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-500">
                        <Lock className="w-3 h-3" /> DEACTIVATED
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{usr.lastActive}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {usr.status !== 'ACTIVE' && (
                        <button
                          onClick={() => handleToggleUserStatus(usr.id, 'ACTIVE')}
                          className="px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 text-[11px] font-semibold flex items-center space-x-1 transition"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Reactivate</span>
                        </button>
                      )}
                      {usr.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleToggleUserStatus(usr.id, 'SUSPENDED')}
                          className="px-2.5 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-700/50 text-amber-300 text-[11px] font-semibold flex items-center space-x-1 transition"
                        >
                          <UserX className="w-3 h-3" />
                          <span>Suspend</span>
                        </button>
                      )}
                      {usr.status !== 'DEACTIVATED' && (
                        <button
                          onClick={() => handleToggleUserStatus(usr.id, 'DEACTIVATED')}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 text-[11px] font-semibold transition"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
