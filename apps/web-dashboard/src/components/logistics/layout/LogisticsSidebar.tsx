import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Truck,
  Navigation,
  PackageCheck,
  Route,
  GitBranch,
  AlertTriangle,
  Warehouse,
  Bell,
  User,
  LogOut,
  Shield,
  X,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { RoleBadge } from '../../admin/primitives/RoleBadge';

interface LogisticsSidebarProps {
  open: boolean;
  onNavigate: () => void;
}

export const LogisticsSidebar: React.FC<LogisticsSidebarProps> = ({ open, onNavigate }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const NAV_ITEMS = [
    { to: '/logistics', label: t('nav.logistics.overview', 'Operations Overview'), icon: LayoutDashboard, end: true },
    { to: '/logistics/fleet', label: t('nav.logistics.fleet', 'Fleet Operations'), icon: Truck },
    { to: '/logistics/journeys', label: t('nav.logistics.journeys', 'Active Journeys'), icon: Navigation },
    { to: '/logistics/deliveries', label: t('nav.logistics.deliveries', 'Deliveries & Proofs'), icon: PackageCheck },
    { to: '/logistics/routes', label: t('nav.logistics.routes', 'Routes & Corridors'), icon: Route },
    { to: '/logistics/reroutes', label: t('nav.logistics.reroutes', 'Reroute Decisions'), icon: GitBranch },
    { to: '/logistics/risk', label: t('nav.logistics.risk', 'Logistics Risk & Incidents'), icon: AlertTriangle },
    { to: '/logistics/warehouses', label: t('nav.logistics.warehouses', 'Warehouses & Supply'), icon: Warehouse },
    { to: '/logistics/notifications', label: t('nav.logistics.notifications', 'Notifications'), icon: Bell },
  ];

  return (
    <aside
      className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 bg-[var(--adm-surface)] border-r border-[var(--adm-border)] flex flex-col transition-transform duration-200 ease-in-out ${
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
      aria-label="Logistics Operator Navigation"
    >
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-[var(--adm-border)] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-[var(--adm-radius)] bg-[var(--adm-primary)] text-white flex items-center justify-center font-bold text-sm shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[var(--adm-ink)] truncate tracking-wide">
              {t('nav.logistics.brand', 'NER LOGISENSE')}
            </div>
            <div className="text-[10px] font-semibold text-[var(--adm-ink-3)] uppercase tracking-wider">
              {t('nav.logistics.consoleLabel', 'Logistics Command')}
            </div>
          </div>
        </div>
        <button
          onClick={onNavigate}
          className="md:hidden p-1.5 rounded-[var(--adm-radius)] text-[var(--adm-ink-3)] hover:bg-[var(--adm-raised)]"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5" aria-label="Logistics Navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-[var(--adm-radius)] text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--adm-primary-wash)] text-[var(--adm-primary)] font-semibold shadow-xs'
                    : 'text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)] hover:text-[var(--adm-ink)]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Session & Role Footer */}
      <div className="p-3 border-t border-[var(--adm-border)] bg-[var(--adm-raised)]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[var(--adm-ink)] truncate">
              {user?.fullName || user?.identifier || t('roles.logisticsOperator', 'Logistics Operator')}
            </div>
            <div className="text-[10px] text-[var(--adm-ink-3)] truncate">
              {user?.district ? `${user.district} ${t('nav.logistics.districtSuffix', 'District')}` : t('nav.logistics.regionalOps', 'Regional Operations')}
            </div>
          </div>
          <RoleBadge role="LOGISTICS_OPERATOR" compact />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[var(--adm-border)] text-xs">
          <NavLink
            to="/profile"
            onClick={onNavigate}
            className="text-[var(--adm-ink-2)] hover:text-[var(--adm-primary)] flex items-center gap-1.5 font-medium"
          >
            <User className="w-3.5 h-3.5" />
            <span>{t('common.profile', 'Profile')}</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="text-[var(--adm-critical)] hover:underline flex items-center gap-1 font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('common.signOut', 'Sign out')}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

