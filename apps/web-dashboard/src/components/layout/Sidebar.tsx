import React from 'react';
import {
  LayoutDashboard,
  Navigation,
  ShieldAlert,
  Siren,
  Camera,
  Truck,
  Package,
  MessageSquare,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'GIS Command Map', icon: LayoutDashboard },
    { id: 'route-planner', label: 'AI Route Planner', icon: Navigation },
    { id: 'risk', label: 'ML Risk Intelligence', icon: ShieldAlert },
    { id: 'sos', label: 'Emergency SOS Center', icon: Siren },
    { id: 'field', label: 'Field Incident Reports', icon: Camera },
    { id: 'vehicles', label: 'Vehicle Telemetry', icon: Truck },
    { id: 'shipments', label: 'Essential Logistics', icon: Package },
    { id: 'notifications', label: 'Notifications Outbox', icon: MessageSquare },
    { id: 'settings', label: 'Settings & i18n', icon: Settings },
  ];

  return (
    <aside className="w-60 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between py-4 shrink-0 shadow-sm transition-colors duration-200">
      <div className="space-y-1 px-3">
        <div className="px-3 pb-2 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Command Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 dark:shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer System Info */}
      <div className="px-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        <div className="flex items-center space-x-1.5 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">NER LogiSense v2.0</span>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">Logistics & Regional Intelligence</p>
      </div>
    </aside>
  );
};
