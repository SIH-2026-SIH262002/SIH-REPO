import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { Truck, Bell, Radio, MapPin, LogOut, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../common/LanguageSelector';

interface CommandHeaderProps {
  activeStep?: number;
  onResetSimulation?: () => void;
  lang?: string;
  onLanguageChange?: (lang: string) => void;
}

export const CommandHeader: React.FC<CommandHeaderProps> = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 sticky top-0 z-50 shadow-sm transition-colors duration-200">
      <div className="max-w-[1920px] mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand & Platform Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20 border border-emerald-500">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-wider text-sm sm:text-base text-slate-900 dark:text-slate-100">
                {t('header.appName', 'NER LogiSense')}
              </span>
              <span className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 tracking-wide">
                {t('header.accessibilityTag', 'ACCESSIBILITY INTELLIGENCE')}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block tracking-tight">
              {t('header.commandCenterSurface', 'Command Center Surface • North Eastern Region (8 States)')}
            </span>
          </div>
        </div>

        {/* System & Telemetry Status Bar */}
        <div className="hidden lg:flex items-center space-x-6 text-xs bg-slate-50 dark:bg-slate-900 px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500 dark:text-slate-400">SYSTEM:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
              {t('header.systemOperational', 'OPERATIONAL')}
            </span>
          </div>

          <div className="h-3 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="text-slate-500 dark:text-slate-400">STREAM:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {t('header.streamLive', 'WebSocket Live Feed')}
            </span>
          </div>

          <div className="h-3 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-slate-500 dark:text-slate-400">{t('header.highRiskCorridor', 'HIGH-RISK CORRIDOR')}:</span>
            <span className="font-semibold text-amber-700 dark:text-amber-400">NH-27 Dima Hasao Pass</span>
          </div>
        </div>

        {/* Right Controls - Theme Toggle, Language Switcher, Notifications & User Info */}
        <div className="flex items-center space-x-3">
          {/* Light / Dark Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-semibold hidden md:inline">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold hidden md:inline text-amber-300">Light</span>
              </>
            )}
          </button>

          {/* Multilingual Selector */}
          <LanguageSelector variant="header" />

          {/* Notifications Trigger */}
          <button className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition border border-slate-200 dark:border-slate-700">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          {/* User Profile Info */}
          {user && (
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="text-right hidden sm:block">
                <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">{user.fullName || 'Govind (Officer)'}</span>
                <span className="block text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">{user.role || 'ADMIN'}</span>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs border border-emerald-500 shadow-sm hover:scale-105 transition"
                title={t('header.viewProfile', 'View Profile')}
              >
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 transition"
                title={t('header.logout', 'Logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

