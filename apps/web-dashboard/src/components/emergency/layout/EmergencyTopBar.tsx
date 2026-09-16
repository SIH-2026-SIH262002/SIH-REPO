/**
 * EmergencyTopBar.tsx — Top navigation bar for the Emergency Operator console.
 *
 * Institutional light design. Shows:
 * - NER LogiSense brand + Emergency Operator badge
 * - Operator identity + district scope
 * - Live WebSocket connection indicator
 * - LanguageSelector
 * - Sign-out link
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Siren, Radio, LogOut, User } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { LanguageSelector } from '../../common/LanguageSelector';

export const EmergencyTopBar: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isConnected } = useWebSocket();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="eo-topbar">
      {/* Brand + Role Badge */}
      <div className="eo-topbar-brand">
        <div className="eo-topbar-icon">
          <Siren className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <div className="eo-topbar-title">NER LogiSense</div>
          <div className="eo-topbar-subtitle">
            {t('emergency.consoleTitle', 'Emergency SOS Command Center')}
          </div>
        </div>
        <span className="eo-role-badge">
          {t('roles.emergencyOperator', 'Emergency Operator')}
        </span>
      </div>

      {/* Right Controls */}
      <div className="eo-topbar-controls">
        {/* Live Stream Indicator */}
        <div className={`eo-stream-indicator ${isConnected ? 'eo-stream-live' : 'eo-stream-offline'}`}>
          <Radio className="w-3.5 h-3.5" />
          <span>{isConnected ? t('header.streamActive', 'LIVE') : t('header.polling', 'OFFLINE')}</span>
        </div>

        {/* District Scope */}
        {user?.district && (
          <div className="eo-district-badge">
            <span className="eo-district-label">{t('common.district', 'District')}</span>
            <span className="eo-district-name">{user.district}</span>
          </div>
        )}

        {/* Language Selector */}
        <LanguageSelector />

        {/* Profile Link */}
        <Link to="/emergency/profile" className="eo-topbar-btn" title={t('common.profile', 'Profile')}>
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">{user?.fullName?.split(' ')[0] || 'Operator'}</span>
        </Link>

        {/* Sign Out */}
        <button onClick={handleLogout} className="eo-topbar-btn eo-logout-btn" title={t('common.signOut', 'Sign Out')}>
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{t('common.signOut', 'Sign Out')}</span>
        </button>
      </div>
    </header>
  );
};
