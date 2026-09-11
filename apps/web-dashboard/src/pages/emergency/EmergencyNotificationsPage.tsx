/**
 * EmergencyNotificationsPage.tsx — Emergency Operator: Notifications
 *
 * Fetches real notifications from GET /api/notify/outbox (FastAPI).
 * Honest empty/error states. Zero mock data.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, RefreshCw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { apiService } from '../../services/apiService';

function formatDateTime(isoString?: string): string {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString([], {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}

const PRIORITY_BADGE: Record<string, string> = {
  CRITICAL: 'eo-badge eo-badge-critical',
  HIGH: 'eo-badge eo-badge-high',
  MODERATE: 'eo-badge eo-badge-moderate',
  LOW: 'eo-badge eo-badge-neutral',
};

export const EmergencyNotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getOutbox();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  return (
    <div className="eo-page">
      <div className="eo-page-header">
        <div>
          <h1 className="eo-page-title">
            <Bell className="w-5 h-5 text-slate-600" />
            {t('nav.dashboard.notifications', 'Notifications')}
          </h1>
          <p className="eo-page-subtitle">
            {t('emergency.notifications.subtitle', 'Real-time emergency notifications and alerts outbox.')}
          </p>
        </div>
        <button onClick={fetchNotifications} className="eo-btn eo-btn-ghost" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh', 'Refresh')}
        </button>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="eo-error-card">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <div className="eo-error-title">{t('emergency.overview.backendError', 'Backend Unavailable')}</div>
            <div className="eo-error-message">{error}</div>
          </div>
          <button onClick={fetchNotifications} className="eo-btn eo-btn-danger">
            <RefreshCw className="w-3.5 h-3.5" />{t('common.retry', 'Retry')}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="eo-loading-card">
          <RefreshCw className="w-5 h-5 animate-spin text-red-600" />
          <span>{t('common.loading', 'Loading...')}</span>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && notifications.length === 0 && (
        <div className="eo-empty-card">
          <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
          <div className="eo-empty-title">
            {t('emergency.notifications.empty', 'No notifications at this time.')}
          </div>
        </div>
      )}

      {/* Notification List */}
      {!loading && !error && notifications.length > 0 && (
        <div className="eo-card">
          <div className="eo-notifications-list">
            {notifications.map((n: any, idx: number) => (
              <div key={n.id ?? idx} className="eo-notification-row">
                <div className="eo-notification-left">
                  <span className={PRIORITY_BADGE[n.priority] || 'eo-badge eo-badge-neutral'}>
                    {n.priority || 'INFO'}
                  </span>
                </div>
                <div className="eo-notification-body">
                  <div className="eo-notification-title">{n.title || n.message}</div>
                  {n.title && n.message && n.title !== n.message && (
                    <div className="eo-notification-message">{n.message}</div>
                  )}
                  {(n.targetRecipients?.length > 0) && (
                    <div className="eo-notification-recipients">
                      → {n.targetRecipients.join(', ')}
                    </div>
                  )}
                </div>
                <div className="eo-notification-time">
                  <Clock className="w-3.5 h-3.5" />
                  {n.timestamp || formatDateTime(n.created_at || n.sentAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
