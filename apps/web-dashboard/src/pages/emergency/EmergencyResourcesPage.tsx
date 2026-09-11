/**
 * EmergencyResourcesPage.tsx — Emergency Operator: Emergency Resources Registry
 *
 * Displays real emergency resource data from GET /api/emergency/resources.
 * Shows status, base location, contact phone for each resource.
 * Zero mock data.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Truck,
  RefreshCw,
  AlertTriangle,
  Phone,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { resourceApi, type EmergencyResource, type ResourceStatus } from '../../api/sosApi';

const STATUS_COLOR: Record<ResourceStatus, string> = {
  AVAILABLE: 'eo-resource-status--available',
  ASSIGNED: 'eo-resource-status--assigned',
  EN_ROUTE: 'eo-resource-status--en-route',
  BUSY: 'eo-resource-status--busy',
  UNAVAILABLE: 'eo-resource-status--unavailable',
};

const TYPE_ICON: Record<string, string> = {
  RESCUE_TEAM: '🛡️',
  AMBULANCE: '🚑',
  HEAVY_EQUIPMENT: '🚜',
  PERSONNEL: '👮',
};

export const EmergencyResourcesPage: React.FC = () => {
  const { t } = useTranslation();
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await resourceApi.getResources();
      setResources(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const availableCount = resources.filter((r) => r.status === 'AVAILABLE').length;
  const assignedCount = resources.filter((r) => r.status === 'ASSIGNED' || r.status === 'EN_ROUTE').length;

  return (
    <div className="eo-page">
      {/* Header */}
      <div className="eo-page-header">
        <div>
          <h1 className="eo-page-title">
            <Truck className="w-5 h-5 text-slate-600" />
            {t('emergency.resources.title', 'Emergency Resources')}
          </h1>
          <p className="eo-page-subtitle">
            {t('emergency.resources.subtitle', 'Live registry of NDRF teams, ambulances, and heavy equipment assigned to the region.')}
          </p>
        </div>
        <button onClick={fetchResources} className="eo-btn eo-btn-ghost" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh', 'Refresh')}
        </button>
      </div>

      {/* Summary Strip */}
      {!loading && !error && resources.length > 0 && (
        <div className="eo-stats-strip">
          <div className="eo-stat eo-stat-resolved">
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <div className="eo-stat-value">{availableCount}</div>
              <div className="eo-stat-label">{t('emergency.resources.available', 'Available')}</div>
            </div>
          </div>
          <div className="eo-stat eo-stat-moderate">
            <Truck className="w-5 h-5" />
            <div>
              <div className="eo-stat-value">{assignedCount}</div>
              <div className="eo-stat-label">{t('emergency.resources.deployed', 'Deployed')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="eo-error-card">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <div className="eo-error-title">{t('emergency.overview.backendError', 'Backend Unavailable')}</div>
            <div className="eo-error-message">{error}</div>
          </div>
          <button onClick={fetchResources} className="eo-btn eo-btn-danger">
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

      {/* Resources Grid */}
      {!loading && !error && resources.length > 0 && (
        <div className="eo-resource-grid">
          {resources.map((r) => (
            <div key={r.resourceId} className="eo-card eo-resource-card">
              <div className="eo-resource-card-head">
                <div className="eo-resource-card-icon">
                  {TYPE_ICON[r.resourceType] || '🔧'}
                </div>
                <div className="eo-resource-card-meta">
                  <span className={`eo-resource-status ${STATUS_COLOR[r.status]}`}>
                    {r.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="eo-resource-card-name">{r.name}</div>
              <div className="eo-resource-card-type">
                {r.resourceType?.replace(/_/g, ' ')}
              </div>

              {r.baseLocation && (
                <div className="eo-resource-card-detail">
                  <MapPin className="w-3.5 h-3.5" />
                  {r.baseLocation}
                </div>
              )}

              {r.contactPhone && (
                <div className="eo-resource-card-detail">
                  <Phone className="w-3.5 h-3.5" />
                  {r.contactPhone}
                </div>
              )}

              {r.assignedSosId && (
                <div className="eo-resource-assigned-notice">
                  {t('emergency.resources.assignedToSos', 'Assigned to SOS #{{id}}', { id: r.assignedSosId })}
                </div>
              )}

              <div className="eo-resource-id-label">{r.resourceId}</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && resources.length === 0 && (
        <div className="eo-empty-card">
          <Truck className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="eo-empty-title">{t('common.noDataAvailable', 'No data available')}</div>
          <div className="eo-empty-subtitle">
            {t('emergency.resources.noResources', 'No emergency resources registered for this region.')}
          </div>
        </div>
      )}
    </div>
  );
};
