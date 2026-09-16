import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, RotateCw, ArrowRight, Route, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, EmptyState } from '../../components/admin/primitives/QueryStates';
import { apiService } from '../../services/apiService';

export const LogisticsJourneysPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const fetchJourneys = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getVehicles();
      setVehicles(data || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to fetch active transport journey state.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneys();
  }, []);

  const activeJourneys = vehicles.filter((v) => v.status !== 'COMPLETED');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Convoy Journeys & Corridor Transit"
        subtitle="End-to-end trip progress tracking, route segment waypoint progression, and in-transit hazard exposure."
        action={
          <div className="flex items-center gap-2">
            <DataProvenanceBadge kind="SIMULATED" />
            <button
              onClick={fetchJourneys}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] text-xs font-semibold text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)]"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Refresh Journeys</span>
            </button>
          </div>
        }
      />

      <SectionCard title="Live Journey Trajectories" subtitle="Waypoint progression through North Eastern road topography.">
        {loading ? (
          <LoadingState label="Loading convoy trajectories…" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchJourneys} />
        ) : activeJourneys.length === 0 ? (
          <EmptyState
            title="NO ACTIVE JOURNEYS"
            description="There are currently no active convoy journeys registered on the regional transit network."
          />
        ) : (
          <div className="divide-y divide-[var(--adm-border)]">
            {activeJourneys.map((v) => {
              const progress = Math.round((v.segment_progress ?? 0) * 100);
              const isDelayed = v.status === 'DELAYED' || v.delivery_status?.includes('DELAYED');
              const isAtRisk = v.status === 'AT_RISK' || v.status === 'SOS';

              return (
                <div key={v.id || v.code} className="py-4 space-y-3">
                  {/* Top Bar: Vehicle, Driver, Origin -> Destination, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[var(--adm-primary-wash)] text-[var(--adm-primary)] rounded-[var(--adm-radius)] font-bold text-xs">
                        {v.code || v.id}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[var(--adm-ink)]">
                          {v.origin_name || v.origin || 'Guwahati'} → {v.destination_name || v.destination || 'Silchar'}
                        </div>
                        <div className="text-[11px] text-[var(--adm-ink-3)]">
                          Driver: <strong className="text-[var(--adm-ink-2)]">{v.driver || v.driver_name || 'Driver'}</strong> • Payload:{' '}
                          <span className="font-medium">{v.cargo || v.cargo_type || 'Essential Supplies'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAtRisk ? (
                        <StatusBadge tone="critical" label="CORRIDOR HAZARD RISK" />
                      ) : isDelayed ? (
                        <StatusBadge tone="warning" label="TRANSIT DELAYED" />
                      ) : (
                        <StatusBadge tone="healthy" label="ON SCHEDULE" />
                      )}
                      {(isDelayed || isAtRisk) && (
                        <button
                          onClick={() => navigate('/logistics/reroutes')}
                          className="px-2.5 py-1 text-xs font-semibold bg-[var(--adm-critical-bg)] text-[var(--adm-critical)] border border-[var(--adm-critical)] rounded-[var(--adm-radius)] hover:opacity-90 flex items-center gap-1"
                        >
                          <span>Review Reroute</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Path Nodes Display */}
                  {v.route_nodes && v.route_nodes.length > 0 && (
                    <div className="text-xs bg-[var(--adm-raised)] border border-[var(--adm-border)] p-2.5 rounded-[var(--adm-radius)] flex flex-wrap items-center gap-1.5 font-mono">
                      <span className="text-[10px] uppercase font-bold text-[var(--adm-ink-3)] mr-1">Corridor Nodes:</span>
                      {v.route_nodes.map((nodeKey: string, idx: number) => {
                        const isCurrent = idx === (v.segment_index || 0);
                        return (
                          <React.Fragment key={nodeKey}>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                isCurrent
                                  ? 'bg-[var(--adm-primary)] text-white'
                                  : 'bg-[var(--adm-surface)] border border-[var(--adm-border)] text-[var(--adm-ink-2)]'
                              }`}
                            >
                              {nodeKey}
                            </span>
                            {idx < v.route_nodes.length - 1 && <span className="text-[var(--adm-ink-3)]">→</span>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  {/* Progress Bar & Telemetry */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-[var(--adm-ink-3)] font-mono">
                      <span>Segment Progress</span>
                      <span className="tabular-nums font-bold text-[var(--adm-ink)]">{progress}% Completed</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--adm-border)] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isAtRisk
                            ? 'bg-[var(--adm-critical)]'
                            : isDelayed
                            ? 'bg-[var(--adm-warning)]'
                            : 'bg-[var(--adm-healthy)]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
};
