/**
 * EmergencySosQueuePage.tsx — Emergency Operator: Full SOS Event Queue
 *
 * Real-time list of all active SOS events from GET /api/sos/active.
 * Supports filtering by status. WebSocket pushes delta updates.
 * Zero mock data.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Siren,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Filter,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { sosApi, type SosEvent, type SosStatus } from '../../api/sosApi';
import { SosStatusBadge } from '../../components/emergency/SosStatusBadge';
import { useWebSocket } from '../../hooks/useWebSocket';

function formatDateTime(isoString?: string): string {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

const STATUS_FILTERS: { value: 'ALL' | SosStatus; labelKey: string; labelFallback: string }[] = [
  { value: 'ALL', labelKey: 'common.all', labelFallback: 'All' },
  { value: 'TRIGGERED', labelKey: 'emergency.status.triggered', labelFallback: 'Triggered' },
  { value: 'RECEIVED', labelKey: 'emergency.status.received', labelFallback: 'Received' },
  { value: 'ACKNOWLEDGED', labelKey: 'emergency.status.acknowledged', labelFallback: 'Acknowledged' },
  { value: 'RESPONDER_ASSIGNED', labelKey: 'emergency.status.responderAssigned', labelFallback: 'Responder Assigned' },
];

export const EmergencySosQueuePage: React.FC = () => {
  const { t } = useTranslation();
  const { lastEvent } = useWebSocket();

  const [sosEvents, setSosEvents] = useState<SosEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | SosStatus>('ALL');

  const fetchSos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sosApi.getActiveSos();
      // Sort: TRIGGERED first, then RECEIVED, then others by createdAt desc
      data.sort((a, b) => {
        const priority = (s: SosStatus) =>
          s === 'TRIGGERED' ? 0 : s === 'RECEIVED' ? 1 : s === 'ACKNOWLEDGED' ? 2 : 3;
        const pd = priority(a.status) - priority(b.status);
        if (pd !== 0) return pd;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      setSosEvents(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSos();
  }, [fetchSos]);

  // WebSocket delta updates
  useEffect(() => {
    if (!lastEvent || lastEvent.kind !== 'sos' || !lastEvent.data) return;
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
  }, [lastEvent]);

  const displayed =
    statusFilter === 'ALL' ? sosEvents : sosEvents.filter((s) => s.status === statusFilter);

  return (
    <div className="eo-page">
      {/* Page Header */}
      <div className="eo-page-header">
        <div>
          <h1 className="eo-page-title">
            <Siren className="w-5 h-5 text-red-600" />
            {t('emergency.sosQueue.title', 'SOS Event Queue')}
          </h1>
          <p className="eo-page-subtitle">
            {t('emergency.sosQueue.subtitle', 'All active SOS events in your district scope. Click any row to view details and take action.')}
          </p>
        </div>
        <button onClick={fetchSos} className="eo-btn eo-btn-ghost" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh', 'Refresh')}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="eo-filter-bar">
        <Filter className="w-4 h-4 text-slate-400" />
        <div className="eo-filter-tabs">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`eo-filter-tab ${statusFilter === f.value ? 'eo-filter-tab--active' : ''}`}
            >
              {t(f.labelKey, f.labelFallback)}
              {f.value !== 'ALL' && (
                <span className="eo-filter-count">
                  {sosEvents.filter((s) => s.status === f.value).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
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

      {/* Empty */}
      {!loading && !error && displayed.length === 0 && (
        <div className="eo-empty-card">
          <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
          <div className="eo-empty-title">
            {statusFilter === 'ALL'
              ? t('emergency.overview.allClear', 'All Clear — No Active SOS Events')
              : t('emergency.sosQueue.noFilteredResults', 'No events with this status')}
          </div>
          <div className="eo-empty-subtitle">
            {t('emergency.overview.allClearSub', 'All monitored vehicles operating safely in your district.')}
          </div>
        </div>
      )}

      {/* SOS List */}
      {!loading && !error && displayed.length > 0 && (
        <div className="eo-card eo-table-card">
          <div className="eo-table-header">
            <span>{t('emergency.sosQueue.totalEvents', '{{count}} event(s)', { count: displayed.length })}</span>
          </div>
          <div className="eo-sos-list">
            {displayed.map((sos) => (
              <Link
                key={sos.id}
                to={`/emergency/sos/${sos.id}`}
                className={`eo-sos-row ${sos.status === 'TRIGGERED' ? 'eo-sos-row--critical' : ''}`}
              >
                {/* Left: vehicle + type */}
                <div className="eo-sos-row-left">
                  <div className="eo-sos-row-vehicle">
                    {sos.vehicleCode ? (
                      <span className="eo-vehicle-code">{sos.vehicleCode}</span>
                    ) : null}
                    <span className="eo-triggered-by">by {sos.triggeredBy}</span>
                  </div>
                  <div className="eo-sos-row-type">
                    {sos.emergencyType?.replace(/_/g, ' ') || t('common.unknown', 'Unknown type')}
                  </div>
                  {sos.message && (
                    <div className="eo-sos-row-message">{sos.message}</div>
                  )}
                </div>

                {/* Middle: meta */}
                <div className="eo-sos-row-meta">
                  {sos.district && (
                    <div className="eo-meta-item">
                      <MapPin className="w-3.5 h-3.5" />
                      {sos.district}
                    </div>
                  )}
                  {(sos.latitude != null && sos.longitude != null) && (
                    <div className="eo-meta-item eo-meta-gps">
                      {sos.latitude.toFixed(4)}, {sos.longitude.toFixed(4)}
                    </div>
                  )}
                  <div className="eo-meta-item">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDateTime(sos.createdAt || sos.originTimestamp)}
                  </div>
                  {sos.deliveryType === 'MESH_RELAY_STORE_FORWARD' && (
                    <div className="eo-meta-item eo-mesh-badge">
                      Mesh Relay · {sos.relayHopCount ?? '?'} hops · {sos.relayLatencyMinutes ?? '?'} min lag
                    </div>
                  )}
                </div>

                {/* Right: status + action */}
                <div className="eo-sos-row-right">
                  <SosStatusBadge status={sos.status} />
                  <div className="eo-sos-row-action">
                    {t('common.view', 'View')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
