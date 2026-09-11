import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutGrid,
  Users,
  UserPlus,
  Map,
  ShieldAlert,
  Siren,
  Camera,
  Truck,
  Warehouse,
  MessageSquare,
  Cpu,
  Activity,
  UserCircle,
} from 'lucide-react';

interface AdminSidebarProps {
  open: boolean;
  onNavigate?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ open, onNavigate }) => {
  const { t } = useTranslation();

  const GROUPS = [
    {
      label: t('nav.admin.groupAdministration', 'Administration'),
      items: [
        { to: '/admin/users', label: t('nav.admin.users', 'Users'), icon: Users },
        { to: '/admin/users/provision', label: t('nav.admin.provisionUser', 'Provision User'), icon: UserPlus },
        { to: '/admin/districts', label: t('nav.admin.districts', 'Districts & Corridors'), icon: Map },
      ],
    },
    {
      label: t('nav.admin.groupOperations', 'Operations Oversight'),
      items: [
        { to: '/admin/risk', label: t('nav.admin.risk', 'Risk Intelligence'), icon: ShieldAlert },
        { to: '/admin/emergencies', label: t('nav.admin.emergencies', 'Emergencies & SOS'), icon: Siren },
        { to: '/admin/field-reports', label: t('nav.admin.fieldReports', 'Field Reports'), icon: Camera },
        { to: '/admin/fleet', label: t('nav.admin.fleet', 'Fleet & Deliveries'), icon: Truck },
        { to: '/admin/supply', label: t('nav.admin.supply', 'Warehouses & Supply'), icon: Warehouse },
      ],
    },
    {
      label: t('nav.admin.groupPlatform', 'Platform'),
      items: [
        { to: '/admin/notifications', label: t('nav.admin.notifications', 'Notifications & Outbox'), icon: MessageSquare },
        { to: '/admin/model', label: t('nav.admin.model', 'Model Transparency'), icon: Cpu },
        { to: '/admin/status', label: t('nav.admin.status', 'Service Status'), icon: Activity },
      ],
    },
    {
      label: t('nav.admin.account', 'Account'),
      items: [{ to: '/admin/account', label: t('common.profile', 'My Account'), icon: UserCircle }],
    },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-[var(--adm-radius)] px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-[var(--adm-primary-wash)] text-[var(--adm-primary)] font-semibold'
        : 'text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)] hover:text-[var(--adm-ink)]'
    }`;

  return (
    <nav
      aria-label="Admin navigation"
      className={`
        bg-[var(--adm-surface)] border-r border-[var(--adm-border)] w-64 shrink-0
        overflow-y-auto
        md:sticky md:top-0 md:h-screen md:block
        ${open ? 'fixed inset-y-0 left-0 z-40 block shadow-[var(--adm-shadow-modal)]' : 'hidden md:block'}
      `}
    >
      <div className="px-4 py-4 space-y-1">
        <NavLink to="/admin" end className={linkClass} onClick={onNavigate}>
          <LayoutGrid className="w-4 h-4" aria-hidden="true" />
          {t('common.overview', 'Overview')}
        </NavLink>
      </div>

      {GROUPS.map((group) => (
        <div key={group.label} className="px-4 py-2">
          <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--adm-ink-3)]">
            {group.label}
          </div>
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass} onClick={onNavigate}>
                <item.icon className="w-4 h-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
};

