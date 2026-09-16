/**
 * EmergencySidebar.tsx — Left sidebar navigation for the Emergency Operator console.
 *
 * Sections:
 * - Overview → /emergency
 * - SOS Queue → /emergency/sos
 * - Emergency Resources → /emergency/resources
 * - Notifications → /emergency/notifications
 * - Profile → /emergency/profile
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Siren,
  Truck,
  Bell,
  User2,
} from 'lucide-react';

interface NavItem {
  labelKey: string;
  labelFallback: string;
  to: string;
  icon: React.ReactNode;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    labelKey: 'emergency.nav.overview',
    labelFallback: 'Overview',
    to: '/emergency',
    icon: <LayoutDashboard className="w-4.5 h-4.5" />,
    end: true,
  },
  {
    labelKey: 'emergency.nav.sosQueue',
    labelFallback: 'SOS Queue',
    to: '/emergency/sos',
    icon: <Siren className="w-4.5 h-4.5" />,
  },
  {
    labelKey: 'emergency.nav.resources',
    labelFallback: 'Emergency Resources',
    to: '/emergency/resources',
    icon: <Truck className="w-4.5 h-4.5" />,
  },
  {
    labelKey: 'emergency.nav.notifications',
    labelFallback: 'Notifications',
    to: '/emergency/notifications',
    icon: <Bell className="w-4.5 h-4.5" />,
  },
  {
    labelKey: 'emergency.nav.profile',
    labelFallback: 'Profile',
    to: '/emergency/profile',
    icon: <User2 className="w-4.5 h-4.5" />,
  },
];

export const EmergencySidebar: React.FC = () => {
  const { t } = useTranslation();

  return (
    <nav className="eo-sidebar">
      <div className="eo-sidebar-section-label">
        {t('emergency.nav.sectionLabel', 'EMERGENCY OPS')}
      </div>
      <ul className="eo-sidebar-list">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `eo-sidebar-link ${isActive ? 'eo-sidebar-link--active' : ''}`
              }
            >
              {item.icon}
              <span>{t(item.labelKey, item.labelFallback)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
