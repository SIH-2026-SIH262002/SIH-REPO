import React, { useState, useEffect } from 'react';
import { GitBranch, CheckCircle2, RotateCw, AlertTriangle, ShieldCheck, ArrowRight, Clock, MapPin } from 'lucide-react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, EmptyState } from '../../components/admin/primitives/QueryStates';
import { ConfirmDialog } from '../../components/admin/primitives/ConfirmDialog';
import { apiService } from '../../services/apiService';

export const LogisticsReroutingPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [bypassPlans, setBypassPlans] = useState<Record<string, any>>({});

  // Dialog State
  const [reviewingVehicle, setReviewingVehicle] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchRerouteDemands = async () => {
    setLoading(true);
    setError(null);
    try {
      const vList = (await apiService.getVehicles()) || [];
      setVehicles(vList);

      // For every convoy that needs a reroute decision, ask the backend
      // Dijkstra planner for a real alternate corridor -- never fabricate one.
      const candidates = vList.filter(
        (v: any) => v.status === 'DELAYED' || v.status === 'AT_RISK' || v.delivery_status?.includes('DELAYED')
      );
      const planEntries = await Promise.all(
        candidates
          .filter((v: any) => v.origin && v.destination)
          .map(async (v: any) => {
            try {
              const plan = await apiService.planRoute(v.origin, v.destination, 2);
              return [v.id || v.code, plan] as const;
            } catch {
              return [v.id || v.code, null] as const;
            }
          })
      );
      setBypassPlans(Object.fromEntries(planEntries));
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve active convoy reroute intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRerouteDemands();
  }, []);

  const getBypassRoute = (v: any) => {
    const plan = bypassPlans[v.id || v.code];
    const routes = plan?.routes as any[] | undefined;
    if (!routes || routes.length === 0) return null;
    // Prefer an alternate whose path differs from the vehicle's current (hazardous) route.
    const currentPath = (v.route_nodes || []).join('>');
    const alt = routes.find((r) => (r.path || []).join('>') !== currentPath) || routes[0];
    return alt;
  };

  const handleApproveBypass = async () => {
    if (!reviewingVehicle) return;
    const bypass = getBypassRoute(reviewingVehicle);
    if (!bypass) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    const vehicleId = reviewingVehicle.id || reviewingVehicle.code;
    const bypassLabel = `${bypass.path_names.join(' -> ')} (${bypass.total_distance_km}km, risk ${bypass.max_segment_risk}/100)`;

    try {
      await apiService.approveReroute(
        vehicleId,
        bypassLabel,
        'Operator approved alternate bypass corridor computed by the backend route planner.'
      );
      setActionSuccess(`Bypass route via ${bypass.path_names.join(' → ')} approved and dispatched to ${vehicleId}.`);
      setReviewingVehicle(null);
      await fetchRerouteDemands();
    } catch (err: any) {
      setActionError(
        `Failed to approve reroute: ${err?.response?.data?.detail || err?.message || 'Backend execution failed'}`
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Identify vehicles delayed or at-risk
  const candidatesForReroute = vehicles.filter(
    (v) => v.status === 'DELAYED' || v.status === 'AT_RISK' || v.delivery_status?.includes('DELAYED')
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Human-in-the-Loop AI Reroute Approvals"
        subtitle="Review, approve, or hold convoys affected by active hill corridor landslides before alternate paths are locked."
        action={
          <div className="flex items-center gap-2">
            <DataProvenanceBadge kind="LIVE" />
            <button
              onClick={fetchRerouteDemands}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] text-xs font-semibold text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)]"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Refresh Candidates</span>
            </button>
          </div>
        }
      />

      {/* Action Success / Error Notifications */}
      {actionSuccess && (
        <div className="p-3 bg-[var(--adm-healthy-bg)] border border-[var(--adm-healthy)] text-[var(--adm-healthy)] rounded-[var(--adm-radius)] text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccess}</span>
          </span>
          <button onClick={() => setActionSuccess(null)} className="underline text-xs">Dismiss</button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-[var(--adm-critical-bg)] border border-[var(--adm-critical)] text-[var(--adm-critical)] rounded-[var(--adm-radius)] text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{actionError}</span>
          </span>
          <button onClick={() => setActionError(null)} className="underline text-xs">Dismiss</button>
        </div>
      )}

      <SectionCard
        title="Convoys Requiring Reroute Authorization"
        subtitle="Transport units encountering active roadblock hazards or severe delay risk."
      >
        {loading ? (
          <LoadingState label="Analyzing route risk exposure…" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchRerouteDemands} />
        ) : candidatesForReroute.length === 0 ? (
          <EmptyState
            title="NO PENDING REROUTE DECISIONS"
            description="All active convoys are progressing smoothly along safe primary corridors without severe landslide exposure."
          />
        ) : (
          <div className="space-y-4">
            {candidatesForReroute.map((v) => {
              const bypass = getBypassRoute(v);
              return (
              <div
                key={v.id || v.code}
                className="p-4 bg-[var(--adm-raised)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--adm-border)] pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-[var(--adm-primary)]">{v.code || v.id}</span>
                    <span className="text-xs text-[var(--adm-ink-3)] font-medium">({v.driver || v.driver_name || 'Driver'})</span>
                    <StatusBadge tone="critical" label={v.status || 'DELAYED'} />
                  </div>
                  <div className="text-xs font-mono text-[var(--adm-ink-2)]">
                    Payload: <strong className="text-[var(--adm-ink)]">{v.cargo || v.cargo_type || 'Essential Cargo'}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--adm-critical)] block">
                      Current Blocked / Hazardous Segment
                    </span>
                    <div className="font-semibold text-[var(--adm-ink)]">
                      Primary Highway via {v.origin_name || v.origin} → {v.destination_name || v.destination}
                    </div>
                    <p className="text-[11px] text-[var(--adm-ink-3)]">
                      Delivery status: {v.delivery_status || v.status}. See Logistics Risk for live corridor sensor readings.
                    </p>
                  </div>

                  <div className="p-3 bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--adm-healthy)] block">
                      Backend-Computed Bypass Corridor
                    </span>
                    {bypass ? (
                      <>
                        <div className="font-semibold text-[var(--adm-ink)]">
                          {bypass.path_names.join(' → ')}
                        </div>
                        <p className="text-[11px] text-[var(--adm-ink-3)]">
                          {bypass.total_distance_km} km · {bypass.estimated_time_hr} hrs · Peak corridor risk {bypass.max_segment_risk}/100
                        </p>
                      </>
                    ) : (
                      <p className="text-[11px] text-[var(--adm-ink-3)] italic">
                        No alternate corridor available from the route planner for this origin/destination.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-[var(--adm-ink-3)] font-mono">
                    {bypass ? `Route status: ${bypass.status}` : 'Awaiting a viable alternate route'}
                  </div>
                  <button
                    onClick={() => setReviewingVehicle(v)}
                    disabled={!bypass}
                    className="px-3 py-1.5 bg-[var(--adm-primary)] text-white text-xs font-semibold rounded-[var(--adm-radius)] hover:bg-[var(--adm-primary-dark)] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Authorize Reroute Bypass
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Confirmation Dialog */}
      {reviewingVehicle && (
        <ConfirmDialog
          open={!!reviewingVehicle}
          title="Authorize Highway Corridor Reroute"
          description={`Confirm authorization to reroute convoy ${reviewingVehicle.code || reviewingVehicle.id} via the backend-computed alternate corridor (${getBypassRoute(reviewingVehicle)?.path_names?.join(' → ') || 'unavailable'}). Telematics routing instructions will be dispatched to the driver.`}
          confirmLabel={actionLoading ? 'Dispatching to Convoy…' : 'Authorize & Reroute'}
          tone="primary"
          onConfirm={handleApproveBypass}
          onCancel={() => setReviewingVehicle(null)}
        />
      )}
    </div>
  );
};
