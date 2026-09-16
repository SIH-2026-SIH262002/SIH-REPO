import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Siren, ShieldAlert, Route, FlagTriangleRight } from 'lucide-react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { MetricTile } from '../../components/admin/primitives/MetricTile';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, classifyError } from '../../components/admin/primitives/QueryStates';
import { useAsyncData } from '../../hooks/admin/useAsyncData';
import { useServiceProbes } from '../../hooks/admin/useServiceProbes';
import { adminApi } from '../../api/adminApi';
import { ROLE_INFO } from '../../types/admin';
import { UserRole } from '../../types/auth';

interface DistrictStatusRow {
  district: string;
  state: string;
  node_name: string;
  risk_score: number;
  category: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  storm_event: boolean;
  manually_flagged: boolean;
}

interface AlertRow {
  id: string;
  node_name: string;
  district: string;
  category: string;
  message: string;
  created_at: string;
}

interface DashboardSummary {
  nodes_by_category: Record<string, number>;
  total_nodes: number;
  flagged_corridors: number;
  blocked_corridors: number;
  open_sos: number;
  vehicles_total: number;
  vehicles_by_status: Record<string, number>;
  district_status: DistrictStatusRow[];
  recent_alerts: AlertRow[];
}

const ROLE_ORDER: UserRole[] = ['ADMIN', 'EMERGENCY_OPERATOR', 'LOGISTICS_OPERATOR', 'FIELD_OFFICER', 'DRIVER'];

export const AdminOverviewPage: React.FC = () => {
  const { data: summary, loading: summaryLoading, error: summaryError, refetch: refetchSummary } = useAsyncData<DashboardSummary>(
    () => adminApi.getDashboardSummary(),
    []
  );
  const { data: users, loading: usersLoading, error: usersError } = useAsyncData(() => adminApi.listUsers(), []);
  const probes = useServiceProbes();

  const usersByRole = useMemo(() => {
    const counts: Record<string, number> = {};
    (users || []).forEach((u) => {
      counts[u.metadata.role] = (counts[u.metadata.role] || 0) + 1;
    });
    return counts;
  }, [users]);

  const inactiveCount = useMemo(() => (users || []).filter((u) => u.status !== 'ACTIVE').length, [users]);

  const districtsWithZeroStaff = useMemo(() => {
    if (!summary || !users) return null;
    const staffed = new Set(users.map((u) => u.metadata.district).filter(Boolean));
    const allDistricts = new Set(summary.district_status.map((d) => d.district));
    return Array.from(allDistricts).filter((d) => !staffed.has(d)).length;
  }, [summary, users]);

  const severeHighCount = summary ? (summary.nodes_by_category.HIGH || 0) + (summary.nodes_by_category.SEVERE || 0) : 0;
  const severeHighDistricts = summary
    ? new Set(summary.district_status.filter((d) => d.category === 'HIGH' || d.category === 'SEVERE').map((d) => d.district)).size
    : 0;
  const overrideCount = summary ? summary.district_status.filter((d) => d.manually_flagged).length : 0;

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Administrative command view: who has access, what is happening, and what requires attention."
      />

      {/* Band 1 — What needs attention */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--adm-ink-3)] mb-2">
          Requires Attention
        </h2>
        {summaryLoading ? (
          <LoadingState />
        ) : summaryError ? (
          <ErrorState message={classifyError(summaryError).message} onRetry={refetchSummary} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/admin/emergencies">
              <MetricTile
                label="Active SOS Events"
                value={summary?.open_sos ?? 0}
                tone={summary && summary.open_sos > 0 ? 'critical' : 'healthy'}
                context={summary && summary.open_sos > 0 ? 'Require dispatch review' : 'None currently open'}
                provenance="SIMULATED"
                icon={<Siren className="w-4 h-4 text-[var(--adm-ink-3)]" />}
              />
            </Link>
            <Link to="/admin/risk">
              <MetricTile
                label="High / Severe Risk Nodes"
                value={severeHighCount}
                tone={severeHighCount > 0 ? 'warning' : 'healthy'}
                context={severeHighCount > 0 ? `Across ${severeHighDistricts} district${severeHighDistricts === 1 ? '' : 's'}` : 'All nodes nominal'}
                provenance="SIMULATED"
                icon={<ShieldAlert className="w-4 h-4 text-[var(--adm-ink-3)]" />}
              />
            </Link>
            <Link to="/admin/districts">
              <MetricTile
                label="Blocked Corridors"
                value={summary?.blocked_corridors ?? 0}
                tone={summary && summary.blocked_corridors > 0 ? 'critical' : 'healthy'}
                context={summary ? `${summary.flagged_corridors} flagged for caution` : ''}
                provenance="SIMULATED"
                icon={<Route className="w-4 h-4 text-[var(--adm-ink-3)]" />}
              />
            </Link>
            <MetricTile
              label="Ground-Truth Overrides Active"
              value={overrideCount}
              tone={overrideCount > 0 ? 'warning' : 'neutral'}
              context="Field reports pinning a corridor's risk score"
              provenance="SIMULATED"
              icon={<FlagTriangleRight className="w-4 h-4 text-[var(--adm-ink-3)]" />}
            />
          </div>
        )}
      </section>

      {/* Band 2 — Who has access */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--adm-ink-3)] mb-2">Who Has Access</h2>
        {usersLoading ? (
          <LoadingState />
        ) : usersError ? (
          <ErrorState message={classifyError(usersError).message} />
        ) : (
          <SectionCard>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div>
                <div className="text-[30px] font-semibold tabular-nums text-[var(--adm-ink)]">{users?.length ?? 0}</div>
                <div className="text-xs text-[var(--adm-ink-3)]">Total provisioned users</div>
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-3">
                {ROLE_ORDER.map((role) => (
                  <div key={role} className="text-center">
                    <div className="text-lg font-semibold text-[var(--adm-ink)] tabular-nums">{usersByRole[role] || 0}</div>
                    <div className="text-[10px] text-[var(--adm-ink-3)] uppercase tracking-wide">{ROLE_INFO[role].label}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 sm:border-l sm:border-[var(--adm-border)] sm:pl-6">
                <div className="text-center">
                  <div className="text-lg font-semibold tabular-nums" style={{ color: inactiveCount > 0 ? 'var(--adm-warning)' : 'var(--adm-ink)' }}>
                    {inactiveCount}
                  </div>
                  <div className="text-[10px] text-[var(--adm-ink-3)] uppercase tracking-wide">Inactive</div>
                </div>
                {districtsWithZeroStaff !== null && (
                  <div className="text-center">
                    <div className="text-lg font-semibold tabular-nums" style={{ color: districtsWithZeroStaff > 0 ? 'var(--adm-warning)' : 'var(--adm-ink)' }}>
                      {districtsWithZeroStaff}
                    </div>
                    <div className="text-[10px] text-[var(--adm-ink-3)] uppercase tracking-wide">Unstaffed districts</div>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        )}
      </section>

      {/* Band 3 — What is happening */}
      <section className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="District Risk Register" description="Sorted by risk score" action={<DataProvenanceBadge kind="SIMULATED" compact />}>
          {summaryLoading ? (
            <LoadingState />
          ) : summaryError ? (
            <ErrorState message={classifyError(summaryError).message} onRetry={refetchSummary} />
          ) : (
            <ul className="space-y-1.5 max-h-72 overflow-y-auto">
              {summary?.district_status.slice(0, 10).map((d) => (
                <li key={d.district} className="flex items-center justify-between gap-3 text-sm py-1">
                  <span className="text-[var(--adm-ink-2)] truncate">{d.district}</span>
                  <StatusBadge status={d.category} />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 text-right">
            <Link to="/admin/risk" className="text-xs font-semibold text-[var(--adm-primary)] hover:underline">
              View full risk register →
            </Link>
          </div>
        </SectionCard>

        <SectionCard title="Recent Alerts" action={<DataProvenanceBadge kind="SIMULATED" compact />}>
          {summaryLoading ? (
            <LoadingState />
          ) : summaryError ? (
            <ErrorState message={classifyError(summaryError).message} />
          ) : summary && summary.recent_alerts.length > 0 ? (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {summary.recent_alerts.slice(0, 6).map((a) => (
                <li key={a.id} className="text-sm border-b border-[var(--adm-border)] pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.category} />
                    <span className="font-medium text-[var(--adm-ink)]">{a.node_name}</span>
                  </div>
                  <p className="text-xs text-[var(--adm-ink-3)] mt-0.5">{a.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--adm-ink-3)]">No recent alerts.</p>
          )}
        </SectionCard>
      </section>

      {/* Band 4 — Is the platform healthy */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--adm-ink-3)] mb-2">Platform Health</h2>
        <SectionCard noPadding>
          <ul className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-[var(--adm-border)]">
            {probes.map((p) => (
              <li key={p.key} className="flex items-center gap-2 px-5 py-3 sm:border-r sm:border-[var(--adm-border)] last:border-r-0">
                {p.status === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-[var(--adm-ink-3)]" />}
                {p.status === 'ok' && <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--adm-healthy)' }} />}
                {p.status === 'down' && <XCircle className="w-4 h-4" style={{ color: 'var(--adm-critical)' }} />}
                <span className="text-sm text-[var(--adm-ink-2)]">{p.name}</span>
              </li>
            ))}
          </ul>
          <div className="px-5 py-2 border-t border-[var(--adm-border)] text-right">
            <Link to="/admin/status" className="text-xs font-semibold text-[var(--adm-primary)] hover:underline">
              View full service status →
            </Link>
          </div>
        </SectionCard>
      </section>
    </div>
  );
};
