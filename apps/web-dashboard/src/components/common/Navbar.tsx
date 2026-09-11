import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';
import {
  User as UserIcon,
  LogOut,
  MapPin,
  Truck,
  Activity,
} from 'lucide-react';
import { UserRole } from '../../types/auth';

const getRoleBadge = (role?: UserRole) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return { label: 'SUPER ADMIN', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'ADMIN':
      return { label: 'ADMINISTRATOR', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'DISTRICT_AUTHORITY':
      return { label: 'DISTRICT AUTHORITY', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'LOGISTICS_OPERATOR':
      return { label: 'LOGISTICS OPERATOR', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'FIELD_OFFICER':
      return { label: 'FIELD OFFICER', color: 'bg-teal-50 text-teal-700 border-teal-200' };
    case 'DRIVER':
      return { label: 'DRIVER / FLEET', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    default:
      return { label: 'USER', color: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
};

const getRoleDashboardPath = (role?: UserRole) => {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin';
    case 'DISTRICT_AUTHORITY':
      return '/district-dashboard';
    case 'LOGISTICS_OPERATOR':
      return '/logistics';
    case 'FIELD_OFFICER':
      return '/field';
    case 'DRIVER':
      return '/driver';
    default:
      return '/profile';
  }
};

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const badge = getRoleBadge(user?.role);
  const dashboardPath = getRoleDashboardPath(user?.role);

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to={dashboardPath} className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-wider text-base text-slate-900 group-hover:text-emerald-600 transition">
                {t('header.appName', 'NER LogiSense')}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block tracking-tight">
              {t('header.accessibilityTag', 'ACCESSIBILITY INTELLIGENCE')}
            </span>
          </div>
        </Link>

        {/* Right Section */}
        {user ? (
          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <LanguageSelector variant="header" />

            {/* District Badge */}
            {user.district && (
              <div className="hidden md:flex items-center space-x-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 text-xs font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{user.district}</span>
              </div>
            )}

            {/* Role Badge */}
            <span
              className={`text-[11px] font-bold tracking-wide px-2.5 py-1 rounded border ${badge.color}`}
            >
              {badge.label}
            </span>

            {/* Dashboard Link */}
            <Link
              to={dashboardPath}
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center space-x-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            {/* Profile Link */}
            <Link
              to="/profile"
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center space-x-1.5"
            >
              <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{user.fullName || t('common.profile', 'Profile')}</span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition flex items-center space-x-1.5"
              title={t('header.logout', 'Logout')}
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">{t('common.signOut', 'Sign out')}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <LanguageSelector variant="header" />
            <Link
              to="/login"
              className="text-xs font-medium px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            >
              {t('common.signIn', 'Sign In')}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

