/**
 * EmergencyOverviewPage.tsx — Emergency Operator: Overview Dashboard
 *
 * Zero-false-data rule:
 * - Fetches real SOS events from GET /api/sos/active
 * - If backend is down → renders an honest error state with retry
 * - If database empty → renders truthful empty state
 * - No Math.random(), no mock data, no setTimeout fake success
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Siren,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Radio,
  RefreshCw,
  Wifi,
  WifiOff,
  ArrowRight,
} from 'lucide-react';
import { sosApi, type SosEvent } from '../../api/sosApi';
import { SosStatusBadge } from '../../components/emergency/SosStatusBadge';
import { useWebSocket } from '../../hooks/useWebSocket';

function formatTime(isoString?: string): string {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '—';
  }
}

export const EmergencyOverviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { isConnected, lastEvent } = useWebSocket();

  const [sosEvents, setSosEvents] = useState<SosEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sosApi.getActiveSos();
      setSosEvents(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          t('common.somethingWentWrong', 'Something went wrong'),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSos();
  }, [fetchSos]);

  // Real-time SOS updates via WebSocket
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.kind === 'sos' && lastEvent.data) {
      const incoming = lastEvent.data as SosEvent;
      setSosEvents((prev) => {
        const idx = prev.findIndex((e) => e.id === incoming.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = incoming;
          return next;
        }
        return [incoming, ...prev];
      });
    }
  }, [lastEvent]);

  const criticalCount = sosEvents.filter((s) => s.status === 'TRIGGERED').length;
  const receivedCount = sosEvents.filter((s) => s.status === 'RECEIVED').length;
  const acknowledgedCount = sosEvents.filter(
    (s) => s.status === 'ACKNOWLEDGED' || s.status === 'RESPONDER_ASSIGNED',
  ).length;
  const meshRelayCount = sosEvents.filter((s) => s.deliveryType === 'MESH_RELAY_STORE_FORWARD').length;

  return (
    <div className="eo-page">
      {/* Page Header */}
      <div className="eo-page-header">
        <div>
          <h1 className="eo-page-title">
            <Siren className="w-5 h-5 text-red-600" />
            {t('emergency.overview.title', 'Emergency Operations Overview')}
          </h1>
          <p className="eo-page-subtitle">
            {t(
              'emergency.overview.subtitle',
              'District-scoped SOS feed. All data is live from the core service. No simulation.',
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live connection badge */}
          <div className={`eo-stream-indicator ${isConnected ? 'eo-stream-live' : 'eo-stream-offline'}`}>
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isConnected ? t('header.streamActive', 'LIVE') : t('header.polling', 'OFFLINE')}</span>
          </div>

          <button onClick={fetchSos} className="eo-btn eo-btn-ghost" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh', 'Refresh')}
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="eo-stats-strip">
        <div className="eo-stat eo-stat-critical">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <div className="eo-stat-value">{loading ? '—' : criticalCount}</div>
            <div className="eo-stat-label">{t('emergency.overview.statTriggered', 'Triggered')}</div>
          </div>
        </div>
        <div className="eo-stat eo-stat-high">
          <Radio className="w-5 h-5" />
          <div>
            <div className="eo-stat-value">{loading ? '—' : receivedCount}</div>
            <div className="eo-stat-label">{t('emergency.overview.statReceived', 'Received')}</div>
          </div>
        </div>
        <div className="eo-stat eo-stat-moderate">
          <Clock className="w-5 h-5" />
          <div>
            <div className="eo-stat-value">{loading ? '—' : acknowledgedCount}</div>
            <div className="eo-stat-label">{t('emergency.overview.statInProgress', 'In Progress')}</div>
          </div>
        </div>
        <div className="eo-stat eo-stat-neutral">
          <Siren className="w-5 h-5" />
          <div>
            <div className="eo-stat-value">{loading ? '—' : meshRelayCount}</div>
            <div className="eo-stat-label">{t('emergency.overview.statMeshRelay', 'Mesh Relay')}</div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="eo-error-card">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <div className="eo-error-title">{t('emergency.overview.backendError', 'Backend Unavailable')}</div>
            <div className="eo-error-message">{error}</div>
          </div>
          <button onClick={fetchSos} className="eo-btn eo-btn-danger">
            <RefreshCw className="w-3.5 h-3.5" />
            {t('common.retry', 'Retry')}
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

      {/* Empty State */}
      {!loading && !error && sosEvents.length === 0 && (
        <div className="eo-empty-card">
          <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
          <div className="eo-empty-title">
            {t('emergency.overview.allClear', 'All Clear — No Active SOS Events')}
          </div>
          <div className="eo-empty-subtitle">
            {t(
              'emergency.overview.allClearSub',
              'All monitored vehicles are operating safely within your district.',
            )}
          </div>
        </div>
      )}

      {/* Active SOS Cards */}
      {!loading && !error && sosEvents.length > 0 && (
        <div className="eo-section">
          <div className="eo-section-header">
            <h2 className="eo-section-title">
              {t('emergency.overview.activeSos', 'Active SOS Events')}
            </h2>
            <Link to="/emergency/sos" className="eo-link-cta">
              {t('emergency.overview.viewAll', 'View Full Queue')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="eo-sos-grid">
            {sosEvents.slice(0, 6).map((sos) => (
              <Link
                key={sos.id}
                to={`/emergency/sos/${sos.id}`}
                className={`eo-sos-card ${
                  sos.status === 'TRIGGERED' || sos.status === 'RECEIVED'
                    ? 'eo-sos-card--critical'
                    : 'eo-sos-card--normal'
                }`}
              >
                <div className="eo-sos-card-head">
                  <div className="eo-sos-card-vehicle">
                    {sos.vehicleCode || sos.triggeredBy}
                  </div>
                  <SosStatusBadge status={sos.status} />
                </div>

                <div className="eo-sos-card-type">
                  {sos.emergencyType?.replace(/_/g, ' ') || '—'}
                </div>

                {sos.message && (
                  <div className="eo-sos-card-message">{sos.message}</div>
                )}

                <div className="eo-sos-card-meta">
                  <span>{formatTime(sos.createdAt || sos.originTimestamp)}</span>
                  {sos.deliveryType === 'MESH_RELAY_STORE_FORWARD' && (
                    <span className="eo-mesh-badge">
                      Mesh ×{sos.relayHopCount ?? '?'}
                    </span>
                  )}
                  {sos.district && <span>{sos.district}</span>}
                </div>
              </Link>
            ))}
          </div>

          {sosEvents.length > 6 && (
            <div className="eo-view-more">
              <Link to="/emergency/sos" className="eo-btn eo-btn-secondary">
                {t('emergency.overview.viewMore', '+ {{count}} more in queue', {
                  count: sosEvents.length - 6,
                })}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
