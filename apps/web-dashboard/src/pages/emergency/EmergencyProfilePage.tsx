/**
 * EmergencyProfilePage.tsx — Emergency Operator: Operator Profile
 *
 * Shows live identity from the AuthContext (real backend JWT).
 * No fake data — role, district, email, and session info all come from the auth context.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { User2, Shield, MapPin, Mail, Phone, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const EmergencyProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="eo-page">
        <div className="eo-empty-card">
          <User2 className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="eo-empty-title">{t('common.loading', 'Loading profile...')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="eo-page">
      <div className="eo-page-header">
        <div>
          <h1 className="eo-page-title">
            <User2 className="w-5 h-5 text-slate-600" />
            {t('profile.title', 'My Profile')}
          </h1>
          <p className="eo-page-subtitle">
            {t('emergency.profile.subtitle', 'Your operator identity and district assignment.')}
          </p>
        </div>
      </div>

      <div className="eo-profile-grid">
        {/* Identity Card */}
        <div className="eo-card">
          <div className="eo-profile-avatar">
            <User2 className="w-8 h-8 text-slate-500" />
          </div>
          <div className="eo-profile-name">{user.fullName || user.username || 'Operator'}</div>
          <div className="eo-profile-role">
            <BadgeCheck className="w-4 h-4 text-red-600" />
            {t('roles.emergencyOperator', 'Emergency Operator')}
          </div>

          <div className="eo-profile-fields">
            {user.email && (
              <div className="eo-profile-field">
                <Mail className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="eo-field-label">{t('common.email', 'Email')}</div>
                  <div className="eo-field-value">{user.email}</div>
                </div>
              </div>
            )}
            {user.phone && (
              <div className="eo-profile-field">
                <Phone className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="eo-field-label">{t('common.phone', 'Phone')}</div>
                  <div className="eo-field-value">{user.phone}</div>
                </div>
              </div>
            )}
            {user.district && (
              <div className="eo-profile-field">
                <MapPin className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="eo-field-label">{t('profile.district', 'Assigned District')}</div>
                  <div className="eo-field-value eo-field-value--district">{user.district}</div>
                </div>
              </div>
            )}
            {user.organization && (
              <div className="eo-profile-field">
                <Shield className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="eo-field-label">{t('profile.organization', 'Organization')}</div>
                  <div className="eo-field-value">{user.organization}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Permissions Card */}
        <div className="eo-card">
          <div className="eo-card-title">
            <Shield className="w-4 h-4 text-red-600" />
            {t('emergency.profile.permissionsTitle', 'Operational Permissions')}
          </div>
          <p className="eo-card-description">
            {t('emergency.profile.permissionsDescription', 'As Emergency Operator, you hold the following authorizations granted by the platform administrator.')}
          </p>
          <div className="eo-permissions-list">
            {[
              { key: 'SOS_VIEW', label: t('emergency.permissions.sosView', 'View SOS Events (district-scoped)') },
              { key: 'SOS_ACKNOWLEDGE', label: t('emergency.permissions.sosAck', 'Acknowledge SOS Events') },
              { key: 'SOS_DISPATCH', label: t('emergency.permissions.sosDispatch', 'Dispatch Responders') },
              { key: 'SOS_RESOLVE', label: t('emergency.permissions.sosResolve', 'Resolve SOS Events') },
              { key: 'EMERGENCY_RESOURCE_VIEW', label: t('emergency.permissions.resourceView', 'View Emergency Resources') },
              { key: 'EMERGENCY_RESOURCE_MANAGE', label: t('emergency.permissions.resourceManage', 'Manage Emergency Resources') },
              { key: 'INCIDENT_VIEW', label: t('emergency.permissions.incidentView', 'View Incidents') },
              { key: 'INCIDENT_VERIFY', label: t('emergency.permissions.incidentVerify', 'Verify Incidents') },
              { key: 'INCIDENT_RESOLVE', label: t('emergency.permissions.incidentResolve', 'Resolve Incidents') },
            ].map((perm) => (
              <div key={perm.key} className="eo-permission-item">
                <BadgeCheck className="w-4 h-4 text-green-600 shrink-0" />
                <span>{perm.label}</span>
              </div>
            ))}
          </div>
          <p className="eo-permissions-footer">
            {t('emergency.profile.permissionsNote', 'All actions are logged in the platform audit trail.')}
          </p>
        </div>
      </div>
    </div>
  );
};
