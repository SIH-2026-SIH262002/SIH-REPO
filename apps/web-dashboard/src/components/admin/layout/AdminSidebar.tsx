import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  UserPlus,
  ShieldCheck,
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

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: 'Administration',
    items: [
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/users/provision', label: 'Provision User', icon: UserPlus },
      { to: '/admin/roles', label: 'Roles & Access', icon: ShieldCheck },
      { to: '/admin/districts', label: 'Districts & Corridors', icon: Map },
    ],
  },
  {
    label: 'Operations Oversight',
    items: [
      { to: '/admin/risk', label: 'Risk Intelligence', icon: ShieldAlert },
      { to: '/admin/emergencies', label: 'Emergencies & SOS', icon: Siren },
      { to: '/admin/field-reports', label: 'Field Reports', icon: Camera },
      { to: '/admin/fleet', label: 'Fleet & Deliveries', icon: Truck },
      { to: '/admin/supply', label: 'Warehouses & Supply', icon: Warehouse },
    ],
  },
  {
    label: 'Platform',
    items: [
      { to: '/admin/notifications', label: 'Notifications & Outbox', icon: MessageSquare },
      { to: '/admin/model', label: 'Model Transparency', icon: Cpu },
      { to: '/admin/status', label: 'Service Status', icon: Activity },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/admin/account', label: 'My Account', icon: UserCircle }],
  },
];

interface AdminSidebarProps {
  open: boolean;
  onNavigate?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ open, onNavigate }) => {
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
          Overview
        </NavLink>
      </div>

      {GROUPS.map((group) => (
        <div key={group.label} className="px-4 py-2">
          <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--adm-ink-3)]">
            {group.label}
          </div>
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} onClick={onNavigate}>
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
