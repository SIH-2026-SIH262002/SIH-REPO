/**
 * EmergencySosDetailPage.tsx — Emergency Operator: SOS Event Detail & Action Center
 *
 * Full operational workflow:
 *   1. Acknowledge → PUT /api/sos/{id}/acknowledge  (SOS_ACKNOWLEDGE)
 *   2. Assign Responder → PUT /api/sos/{id}/assign   (SOS_DISPATCH)
 *   3. Resolve → PUT /api/sos/{id}/resolve            (SOS_RESOLVE)
 *
 * Shows: type, vehicle, GPS, district, message, delivery type, relay chain,
 * timestamps, assigned responder, resolution notes, audit trail.
 *
 * Zero mock data. Every action calls the real backend.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Siren,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Clock,
  Truck,
  User2,
  RefreshCw,
  ShieldCheck,
  Navigation,
  MessageSquare,
  Radio,
  X,
} from 'lucide-react';
import { sosApi, resourceApi, type SosEvent, type EmergencyResource } from '../../api/sosApi';
import { SosStatusBadge } from '../../components/emergency/SosStatusBadge';

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString([], {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch { return '—'; }
}

export const EmergencySosDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const sosId = Number(id);

  const [sos, setSos] = useState<SosEvent | null>(null);
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [responderInput, setResponderInput] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<string>('');

  const fetchData = useCallback(async () => {
    if (!sosId || isNaN(sosId)) {
      setError(t('emergency.detail.invalidId', 'Invalid SOS ID.'));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [sosData, resData] = await Promise.allSettled([
        sosApi.getSosById(sosId),
        resourceApi.getResources(),
      ]);
      if (sosData.status === 'fulfilled') setSos(sosData.value);
      else throw new Error((sosData as PromiseRejectedResult).reason?.message);
      if (resData.status === 'fulfilled') setResources(resData.value);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  }, [sosId, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const clearActionFeedback = () => {
    setActionError(null);
    setActionSuccess(null);
  };

  const handleAcknowledge = async () => {
    clearActionFeedback();
    setActionLoading(true);
    try {
      const updated = await sosApi.acknowledgeSos(sosId);
      setSos(updated);
      setActionSuccess(t('emergency.detail.ackSuccess', 'SOS acknowledged successfully.'));
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || t('common.somethingWentWrong'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignResponder = async () => {
    if (!responderInput.trim()) return;
    clearActionFeedback();
    setActionLoading(true);
    try {
      const updated = await sosApi.assignResponder(sosId, responderInput.trim());
      setSos(updated);
      setShowAssignModal(false);
      setResponderInput('');
      setActionSuccess(t('emergency.detail.assignSuccess', 'Responder assigned successfully.'));
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || t('common.somethingWentWrong'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveNotes.trim()) return;
    clearActionFeedback();
    setActionLoading(true);
    try {
      const updated = await sosApi.resolveSos(sosId, resolveNotes.trim());
      setSos(updated);
      setShowResolveModal(false);
      setResolveNotes('');
      setActionSuccess(t('emergency.detail.resolveSuccess', 'SOS event resolved.'));
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || t('common.somethingWentWrong'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignResource = async () => {
    if (!selectedResource) return;
    clearActionFeedback();
    setActionLoading(true);
    try {
      await resourceApi.assignResourceToSos(selectedResource, sosId);
      setShowResourceModal(false);
      setSelectedResource('');
      setActionSuccess(t('emergency.detail.resourceAssigned', 'Emergency resource dispatched.'));
      // Refresh resources to reflect new assignment state
      const resData = await resourceApi.getResources();
      setResources(resData);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || t('common.somethingWentWrong');
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="eo-page">
        <div className="eo-loading-card">
          <RefreshCw className="w-5 h-5 animate-spin text-red-600" />
          <span>{t('common.loading', 'Loading...')}</span>
        </div>
      </div>
    );
  }

  if (error && !sos) {
    return (
      <div className="eo-page">
        <div className="eo-error-card">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <div className="eo-error-title">{t('emergency.overview.backendError', 'Backend Unavailable')}</div>
            <div className="eo-error-message">{error}</div>
          </div>
          <button onClick={fetchData} className="eo-btn eo-btn-danger">
            <RefreshCw className="w-3.5 h-3.5" />{t('common.retry', 'Retry')}
          </button>
        </div>
        <button onClick={() => navigate('/emergency/sos')} className="eo-btn eo-btn-ghost mt-4">
          <ArrowLeft className="w-4 h-4" />{t('common.back', 'Back to Queue')}
        </button>
      </div>
    );
  }

  if (!sos) return null;

  const isMesh = sos.deliveryType === 'MESH_RELAY_STORE_FORWARD';
  const isActive = sos.status !== 'RESOLVED' && sos.status !== 'FALSE_ALARM';
  const canAck = isActive && sos.status === 'TRIGGERED' || sos.status === 'RECEIVED';
  const canAssign = isActive && (sos.status === 'ACKNOWLEDGED' || sos.status === 'TRIGGERED' || sos.status === 'RECEIVED');
  const canResolve = isActive;

  return (
    <div className="eo-page">
      {/* Back + Header */}
      <div className="eo-page-header">
        <div className="flex items-center gap-3">
          <Link to="/emergency/sos" className="eo-btn eo-btn-ghost">
            <ArrowLeft className="w-4 h-4" />
            {t('common.back', 'Back')}
          </Link>
          <div>
            <h1 className="eo-page-title">
              <Siren className="w-5 h-5 text-red-600" />
              {t('emergency.detail.title', 'SOS Event')} #{sos.id}
            </h1>
            <p className="eo-page-subtitle">
              {t('emergency.detail.subtitle', 'Full operational context and response actions.')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SosStatusBadge status={sos.status} />
          <button onClick={fetchData} className="eo-btn eo-btn-ghost" disabled={loading}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Feedback */}
      {actionError && (
        <div className="eo-error-card">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="eo-error-message flex-1">{actionError}</span>
          <button onClick={() => setActionError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {actionSuccess && (
        <div className="eo-success-card">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span className="flex-1">{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="eo-detail-grid">
        {/* === Left Column: Incident Context === */}
        <div className="eo-detail-main">
          {/* Emergency Type */}
          <div className="eo-card">
            <div className="eo-card-title">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              {t('emergency.detail.emergencyType', 'Emergency Type')}
            </div>
            <div className="eo-detail-type">
              {sos.emergencyType?.replace(/_/g, ' ') || t('common.unknown', 'Unknown')}
            </div>
            {sos.message && (
              <div className="eo-detail-message">
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>{sos.message}</span>
              </div>
            )}
          </div>

          {/* Vehicle & Trigger */}
          <div className="eo-card">
            <div className="eo-card-title">
              <Truck className="w-4 h-4 text-slate-500" />
              {t('emergency.detail.vehicleInfo', 'Vehicle & Trigger')}
            </div>
            <div className="eo-detail-fields">
              <div className="eo-detail-field">
                <span className="eo-field-label">{t('logistics.vehicleCode', 'Vehicle')}</span>
                <span className="eo-field-value">{sos.vehicleCode || t('common.notAvailable', 'N/A')}</span>
              </div>
              <div className="eo-detail-field">
                <span className="eo-field-label">{t('emergency.detail.triggeredBy', 'Triggered By')}</span>
                <span className="eo-field-value">{sos.triggeredBy}</span>
              </div>
              <div className="eo-detail-field">
                <span className="eo-field-label">{t('emergency.detail.deliveryType', 'Delivery Type')}</span>
                <span className={`eo-field-value ${isMesh ? 'eo-mesh-label' : ''}`}>
                  {isMesh ? '📡 Mesh P2P Relay' : '📱 Direct Cellular'}
                </span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="eo-card">
            <div className="eo-card-title">
              <MapPin className="w-4 h-4 text-slate-500" />
              {t('common.location', 'Location')}
            </div>
            <div className="eo-detail-fields">
              {sos.district && (
                <div className="eo-detail-field">
                  <span className="eo-field-label">{t('common.district', 'District')}</span>
                  <span className="eo-field-value">{sos.district}</span>
                </div>
              )}
              {sos.latitude != null && sos.longitude != null && (
                <div className="eo-detail-field">
                  <span className="eo-field-label">GPS</span>
                  <span className="eo-field-value eo-field-mono">
                    {sos.latitude.toFixed(6)}, {sos.longitude.toFixed(6)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mesh Relay Info (only if applicable) */}
          {isMesh && (
            <div className="eo-card eo-card-mesh">
              <div className="eo-card-title">
                <Radio className="w-4 h-4 text-indigo-600" />
                {t('emergency.detail.meshRelayInfo', 'Offline P2P Mesh Relay')}
              </div>
              <div className="eo-detail-fields">
                <div className="eo-detail-field">
                  <span className="eo-field-label">{t('emergency.detail.meshPacketId', 'Packet ID')}</span>
                  <span className="eo-field-value eo-field-mono">{sos.meshPacketId || '—'}</span>
                </div>
                <div className="eo-detail-field">
                  <span className="eo-field-label">{t('emergency.detail.relayedBy', 'Relayed By Vehicle')}</span>
                  <span className="eo-field-value">{sos.relayedByVehicle || '—'}</span>
                </div>
                <div className="eo-detail-field">
                  <span className="eo-field-label">{t('emergency.detail.hopCount', 'Hop Count')}</span>
                  <span className="eo-field-value">{sos.relayHopCount ?? '—'}</span>
                </div>
                <div className="eo-detail-field">
                  <span className="eo-field-label">{t('emergency.detail.relayLatency', 'Relay Latency')}</span>
                  <span className="eo-field-value">{sos.relayLatencyMinutes != null ? `${sos.relayLatencyMinutes} min` : '—'}</span>
                </div>
                {sos.pathAccumulator && (
                  <div className="eo-detail-field eo-detail-field--full">
                    <span className="eo-field-label">{t('emergency.detail.pathAccumulator', 'Relay Chain')}</span>
                    <span className="eo-field-value eo-field-mono">{sos.pathAccumulator}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="eo-card">
            <div className="eo-card-title">
              <Clock className="w-4 h-4 text-slate-500" />
              {t('emergency.detail.timeline', 'Event Timeline')}
            </div>
            <div className="eo-timeline">
              <div className="eo-timeline-item">
                <div className="eo-timeline-dot eo-timeline-dot--red" />
                <div>
                  <div className="eo-timeline-label">{t('emergency.detail.originTime', 'SOS Origin')}</div>
                  <div className="eo-timeline-time">{formatDateTime(sos.originTimestamp)}</div>
                </div>
              </div>
              <div className="eo-timeline-item">
                <div className="eo-timeline-dot" />
                <div>
                  <div className="eo-timeline-label">{t('emergency.detail.receivedTime', 'Received at Command')}</div>
                  <div className="eo-timeline-time">{formatDateTime(sos.createdAt)}</div>
                </div>
              </div>
              {sos.acknowledgedAt && (
                <div className="eo-timeline-item">
                  <div className="eo-timeline-dot eo-timeline-dot--amber" />
                  <div>
                    <div className="eo-timeline-label">
                      {t('emergency.detail.acknowledgedTime', 'Acknowledged')}
                      {sos.acknowledgedBy && ` by ${sos.acknowledgedBy}`}
                    </div>
                    <div className="eo-timeline-time">{formatDateTime(sos.acknowledgedAt)}</div>
                  </div>
                </div>
              )}
              {sos.assignedResponder && (
                <div className="eo-timeline-item">
                  <div className="eo-timeline-dot eo-timeline-dot--blue" />
                  <div>
                    <div className="eo-timeline-label">
                      {t('emergency.detail.responderAssigned', 'Responder Assigned')}: {sos.assignedResponder}
                    </div>
                  </div>
                </div>
              )}
              {sos.resolvedAt && (
                <div className="eo-timeline-item">
                  <div className="eo-timeline-dot eo-timeline-dot--green" />
                  <div>
                    <div className="eo-timeline-label">{t('emergency.detail.resolved', 'Resolved')}</div>
                    <div className="eo-timeline-time">{formatDateTime(sos.resolvedAt)}</div>
                    {sos.resolutionNotes && (
                      <div className="eo-timeline-notes">{sos.resolutionNotes}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === Right Column: Action Panel === */}
        <div className="eo-detail-sidebar">
          {/* Action Bar */}
          <div className="eo-card eo-action-card">
            <div className="eo-card-title">
              <ShieldCheck className="w-4 h-4 text-red-600" />
              {t('emergency.detail.responseActions', 'Response Actions')}
            </div>

            {!isActive && (
              <div className="eo-resolved-notice">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>{t('emergency.detail.eventClosed', 'This event is closed.')}</span>
              </div>
            )}

            {isActive && (
              <div className="eo-action-list">
                {/* 1. Acknowledge */}
                {canAck && (
                  <button
                    onClick={handleAcknowledge}
                    disabled={actionLoading}
                    className="eo-action-btn eo-action-btn--secondary"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {actionLoading
                      ? t('common.loading', 'Loading...')
                      : t('emergency.detail.acknowledge', 'Acknowledge SOS')}
                  </button>
                )}

                {/* 2. Assign Responder */}
                {canAssign && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    disabled={actionLoading}
                    className="eo-action-btn eo-action-btn--primary"
                  >
                    <Navigation className="w-4 h-4" />
                    {t('emergency.detail.assignResponder', 'Assign Responder')}
                  </button>
                )}

                {/* 3. Dispatch Emergency Resource */}
                {canAssign && (
                  <button
                    onClick={() => setShowResourceModal(true)}
                    disabled={actionLoading}
                    className="eo-action-btn eo-action-btn--resource"
                  >
                    <Truck className="w-4 h-4" />
                    {t('emergency.detail.dispatchResource', 'Dispatch Emergency Resource')}
                  </button>
                )}

                {/* 4. Resolve */}
                {canResolve && (
                  <button
                    onClick={() => setShowResolveModal(true)}
                    disabled={actionLoading}
                    className="eo-action-btn eo-action-btn--resolve"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {t('emergency.detail.resolveEvent', 'Mark as Resolved')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Current Responder */}
          {sos.assignedResponder && (
            <div className="eo-card">
              <div className="eo-card-title">
                <User2 className="w-4 h-4 text-blue-600" />
                {t('emergency.detail.currentResponder', 'Assigned Responder')}
              </div>
              <div className="eo-responder-name">{sos.assignedResponder}</div>
            </div>
          )}

          {/* Emergency Resources Panel */}
          <div className="eo-card">
            <div className="eo-card-title">
              <Truck className="w-4 h-4 text-slate-500" />
              {t('emergency.detail.emergencyResources', 'Emergency Resources')}
            </div>
            {resources.length === 0 ? (
              <div className="eo-empty-sub">{t('common.noDataAvailable', 'No data available')}</div>
            ) : (
              <div className="eo-resource-list">
                {resources.map((r) => (
                  <div key={r.resourceId} className="eo-resource-row">
                    <div className="eo-resource-info">
                      <div className="eo-resource-name">{r.name}</div>
                      <div className="eo-resource-type">{r.resourceType?.replace(/_/g, ' ')}</div>
                      {r.baseLocation && (
                        <div className="eo-resource-location">{r.baseLocation}</div>
                      )}
                    </div>
                    <span className={`eo-resource-status eo-resource-status--${r.status.toLowerCase()}`}>
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === Assign Responder Modal === */}
      {showAssignModal && (
        <div className="eo-modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="eo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="eo-modal-header">
              <h3 className="eo-modal-title">
                <Navigation className="w-5 h-5 text-blue-600" />
                {t('emergency.detail.assignResponder', 'Assign Responder')}
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="eo-modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="eo-modal-body">
              <label className="eo-form-label">
                {t('emergency.detail.responderName', 'Responder Name / Unit Identifier')}
              </label>
              <input
                type="text"
                value={responderInput}
                onChange={(e) => setResponderInput(e.target.value)}
                placeholder={t('emergency.detail.responderPlaceholder', 'e.g. Haflong NDRF Team Alpha')}
                className="eo-form-input"
                autoFocus
              />
            </div>
            <div className="eo-modal-footer">
              <button onClick={() => setShowAssignModal(false)} className="eo-btn eo-btn-ghost">
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleAssignResponder}
                disabled={!responderInput.trim() || actionLoading}
                className="eo-btn eo-btn-primary"
              >
                {actionLoading ? t('common.loading', 'Loading...') : t('common.confirm', 'Assign')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Resolve Modal === */}
      {showResolveModal && (
        <div className="eo-modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="eo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="eo-modal-header">
              <h3 className="eo-modal-title">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                {t('emergency.detail.resolveEvent', 'Resolve SOS Event')}
              </h3>
              <button onClick={() => setShowResolveModal(false)} className="eo-modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="eo-modal-body">
              <label className="eo-form-label">
                {t('emergency.detail.resolutionNotes', 'Resolution Notes (required)')}
              </label>
              <textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                rows={4}
                placeholder={t('emergency.detail.resolutionPlaceholder', 'Describe how the emergency was resolved...')}
                className="eo-form-input"
                autoFocus
              />
            </div>
            <div className="eo-modal-footer">
              <button onClick={() => setShowResolveModal(false)} className="eo-btn eo-btn-ghost">
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolveNotes.trim() || actionLoading}
                className="eo-btn eo-btn-resolve"
              >
                {actionLoading ? t('common.loading', 'Loading...') : t('emergency.detail.confirmResolve', 'Confirm Resolution')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Dispatch Emergency Resource Modal === */}
      {showResourceModal && (
        <div className="eo-modal-overlay" onClick={() => setShowResourceModal(false)}>
          <div className="eo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="eo-modal-header">
              <h3 className="eo-modal-title">
                <Truck className="w-5 h-5 text-orange-600" />
                {t('emergency.detail.dispatchResource', 'Dispatch Emergency Resource')}
              </h3>
              <button onClick={() => setShowResourceModal(false)} className="eo-modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="eo-modal-body">
              <label className="eo-form-label">
                {t('emergency.detail.selectResource', 'Select Available Resource')}
              </label>
              <div className="eo-resource-select-list">
                {resources
                  .filter((r) => r.status === 'AVAILABLE')
                  .map((r) => (
                    <label key={r.resourceId} className={`eo-resource-select-item ${selectedResource === r.resourceId ? 'eo-resource-select-item--selected' : ''}`}>
                      <input
                        type="radio"
                        name="resource"
                        value={r.resourceId}
                        checked={selectedResource === r.resourceId}
                        onChange={() => setSelectedResource(r.resourceId)}
                      />
                      <div>
                        <div className="eo-resource-name">{r.name}</div>
                        <div className="eo-resource-type">{r.resourceType?.replace(/_/g, ' ')} · {r.baseLocation}</div>
                        {r.contactPhone && <div className="eo-resource-phone">{r.contactPhone}</div>}
                      </div>
                    </label>
                  ))}
                {resources.filter((r) => r.status === 'AVAILABLE').length === 0 && (
                  <div className="eo-empty-sub">
                    {t('emergency.detail.noAvailableResources', 'No available resources at this time.')}
                  </div>
                )}
              </div>
            </div>
            <div className="eo-modal-footer">
              <button onClick={() => setShowResourceModal(false)} className="eo-btn eo-btn-ghost">
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleAssignResource}
                disabled={!selectedResource || actionLoading}
                className="eo-btn eo-btn-primary"
              >
                {actionLoading ? t('common.loading', 'Loading...') : t('emergency.detail.dispatch', 'Dispatch')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
