import React from 'react';
import { UserRole } from '../../types/auth';
import { ShieldCheck, Truck, AlertTriangle, HardHat, Compass } from 'lucide-react';

interface RoleSwitcherBarProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const RoleSwitcherBar: React.FC<RoleSwitcherBarProps> = ({ activeRole, onRoleChange }) => {
  const roles: { role: UserRole; label: string; icon: React.FC<{ className?: string }>; color: string; desc: string }[] = [
    {
      role: 'ADMIN',
      label: 'Admin Governance',
      icon: ShieldCheck,
      color: 'from-purple-600 to-indigo-600',
      desc: 'System health, user soft-states, ML model rollback & security audit log stream',
    },
    {
      role: 'LOGISTICS_OPERATOR',
      label: 'Logistics Operator',
      icon: Truck,
      color: 'from-blue-600 to-cyan-600',
      desc: 'Fleet telemetry, essential commodity stock grid & GraphHopper reroute approvals',
    },
    {
      role: 'EMERGENCY_OPERATOR',
      label: 'Emergency Operator',
      icon: AlertTriangle,
      color: 'from-rose-600 to-red-600',
      desc: 'SOS panic queue, false alarm triage, NDRF rescue dispatch & corridor geofencing',
    },
    {
      role: 'FIELD_OFFICER',
      label: 'Field Officer',
      icon: HardHat,
      color: 'from-amber-600 to-orange-600',
      desc: 'Ground verification tasks, NO_HAZARD / UNABLE_TO_REACH audit & photo proof hash',
    },
    {
      role: 'DRIVER',
      label: 'Driver Portal',
      icon: Compass,
      color: 'from-emerald-600 to-teal-600',
      desc: 'Vehicle telemetry, transit status updates, rockfall hazard reporting & mesh SOS',
    },
  ];

  const currentRoleInfo = roles.find((r) => r.role === activeRole) || roles[0];

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Role Selector Header Info */}
        <div className="flex items-center space-x-3">
          <div className="px-2.5 py-1 rounded bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-[10px] font-mono uppercase tracking-wider font-bold">
            Interactive Demo Persona Switcher
          </div>
          <span className="text-xs text-slate-400 hidden lg:inline">
            Active Persona View: <strong className="text-white font-semibold">{currentRoleInfo.desc}</strong>
          </span>
        </div>

        {/* Switcher Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {roles.map((r) => {
            const Icon = r.icon;
            const isActive = activeRole === r.role;
            return (
              <button
                key={r.role}
                onClick={() => onRoleChange(r.role)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                  isActive
                    ? `bg-gradient-to-r ${r.color} text-white ring-2 ring-white/20 shadow-md scale-[1.02]`
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                }`}
                title={r.desc}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{r.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse ml-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
