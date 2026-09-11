import React, { useState, useEffect } from 'react';
import { Route, RotateCw, Navigation, Compass, AlertTriangle, CheckCircle2, Search, ArrowRight, Activity } from 'lucide-react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { DataTable, Column } from '../../components/admin/primitives/DataTable';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, EmptyState } from '../../components/admin/primitives/QueryStates';
import { apiService } from '../../services/apiService';

export const LogisticsRoutesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [corridors, setCorridors] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);

  // Interactive Route Planner Form State
  const [origin, setOrigin] = useState('GHY');
  const [destination, setDestination] = useState('SLC');
  const [planningRoute, setPlanningRoute] = useState(false);
  const [routePlanResult, setRoutePlanResult] = useState<any | null>(null);
  const [routePlanError, setRoutePlanError] = useState<string | null>(null);

  const fetchRouteNetwork = async () => {
    setLoading(true);
    setError(null);
    try {
      const graphData = await apiService.getRouteGraph();
      if (graphData && graphData.edges) {
        setCorridors(graphData.edges);
      }
      if (graphData && graphData.nodes) {
        setNodes(graphData.nodes);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve NetworkX road corridor graph.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRouteNetwork();
  }, []);

  const handlePlanRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;
    if (origin === destination) {
      setRoutePlanError('Origin and destination nodes must be different.');
      return;
    }

    setPlanningRoute(true);
    setRoutePlanError(null);
    setRoutePlanResult(null);

    try {
      const plan = await apiService.planRoute(origin, destination);
      if (plan && plan.routes && plan.routes.length > 0) {
        setRoutePlanResult(plan);
      } else {
        setRoutePlanError('No viable connecting road corridor found between selected hubs.');
      }
    } catch (err: any) {
      setRoutePlanError(err?.response?.data?.detail || err?.message || 'Route computation failed on backend.');
    } finally {
      setPlanningRoute(false);
    }
  };

  const corridorColumns: Column<any>[] = [
    {
      key: 'highway_ref',
      header: 'Highway Reference',
      render: (c) => (
        <span className="font-mono font-bold text-[var(--adm-primary)]">{c.highway_ref}</span>
      ),
    },
    {
      key: 'segment',
      header: 'Corridor Segment',
      render: (c) => (
        <span className="font-medium text-[var(--adm-ink)]">
          {c.from_name || c.from} ↔ {c.to_name || c.to}
        </span>
      ),
    },
    {
      key: 'distance',
      header: 'Length & Base Travel',
      render: (c) => (
        <span className="text-xs font-mono text-[var(--adm-ink-2)] tabular-nums">
          {c.distance_km} km ({c.base_time_hr} hrs)
        </span>
      ),
    },
    {
      key: 'risk',
      header: 'Current Risk Score',
      render: (c) => {
        const score = c.risk_score ?? 0;
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs tabular-nums">{score}/100</span>
            <div className="w-16 h-1.5 bg-[var(--adm-border)] rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  score >= 70 ? 'bg-[var(--adm-critical)]' : score >= 40 ? 'bg-[var(--adm-warning)]' : 'bg-[var(--adm-healthy)]'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Operational Safety Band',
      render: (c) => {
        if (c.blocked || c.risk_score >= 70) {
          return <StatusBadge tone="critical" label="AVOID — SEVERE RISK" />;
        }
        if (c.flagged || c.risk_score >= 40) {
          return <StatusBadge tone="warning" label="CAUTION — MODERATE RISK" />;
        }
        return <StatusBadge tone="healthy" label="SAFE FOR TRANSIT" />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Highway Corridors & AI Route Planning"
        subtitle="NetworkX weighted road graph, active landslide hazard resistance, and alternate bypass calculations."
        action={
          <div className="flex items-center gap-2">
            <DataProvenanceBadge kind="LIVE" />
            <button
              onClick={fetchRouteNetwork}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] text-xs font-semibold text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)]"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Refresh Corridors</span>
            </button>
          </div>
        }
      />

      {/* Interactive AI Route Planner Box */}
      <SectionCard
        title="Interactive AI Corridor Planner (NetworkX Dijkstra)"
        subtitle="Query optimal risk-aware convoy routing between any two regional logistics hubs."
      >
        <form onSubmit={handlePlanRoute} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--adm-ink-2)] block mb-1">Origin Node</label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] px-3 py-2 text-xs font-medium text-[var(--adm-ink)] focus:ring-2 focus:ring-[var(--adm-primary)]"
              >
                {nodes.map((n) => (
                  <option key={n.key} value={n.key}>
                    {n.name} ({n.district})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--adm-ink-2)] block mb-1">Destination Node</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] px-3 py-2 text-xs font-medium text-[var(--adm-ink)] focus:ring-2 focus:ring-[var(--adm-primary)]"
              >
                {nodes.map((n) => (
                  <option key={n.key} value={n.key}>
                    {n.name} ({n.district})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={planningRoute}
                className="w-full px-4 py-2 bg-[var(--adm-primary)] text-white text-xs font-semibold rounded-[var(--adm-radius)] hover:bg-[var(--adm-primary-dark)] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>{planningRoute ? 'Computing Route Graph…' : 'Compute Safe Route'}</span>
              </button>
            </div>
          </div>

          {routePlanError && (
            <div className="p-3 bg-[var(--adm-critical-bg)] border border-[var(--adm-critical)] text-[var(--adm-critical)] rounded-[var(--adm-radius)] text-xs font-medium">
              {routePlanError}
            </div>
          )}

          {routePlanResult && (
            <div className="p-4 bg-[var(--adm-raised)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--adm-border)] pb-2">
                <span className="text-xs font-bold text-[var(--adm-ink)] uppercase tracking-wide">
                  Backend Routing Solution (NetworkX Dijkstra)
                </span>
                <span className="text-xs text-[var(--adm-ink-3)] font-mono">
                  {routePlanResult.routes.length} Candidate Route(s)
                </span>
              </div>

              <div className="space-y-3">
                {routePlanResult.routes.map((rt: any, idx: number) => (
                  <div key={idx} className="p-3 bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--adm-primary)]">
                        {idx === 0 ? 'Primary Recommended Route' : `Alternate Option #${idx + 1}`}
                      </span>
                      <StatusBadge
                        tone={rt.status === 'SAFE' ? 'healthy' : rt.status === 'CAUTION' ? 'warning' : 'critical'}
                        label={rt.status || 'SAFE'}
                      />
                    </div>

                    <div className="text-xs font-mono flex flex-wrap gap-1.5 items-center">
                      {rt.path_names?.map((pName: string, pIdx: number) => (
                        <React.Fragment key={pName}>
                          <span className="font-semibold text-[var(--adm-ink)]">{pName}</span>
                          {pIdx < rt.path_names.length - 1 && <span className="text-[var(--adm-ink-3)]">→</span>}
                        </React.Fragment>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-[var(--adm-ink-2)] border-t border-[var(--adm-border)] pt-2 tabular-nums">
                      <span>Total Distance: <strong>{rt.total_distance_km} km</strong></span>
                      <span>Estimated Time: <strong>{rt.estimated_time_hr} hrs</strong></span>
                      <span>Peak Corridor Risk: <strong>{rt.max_segment_risk}/100</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </SectionCard>

      {/* Corridor Directory Table */}
      <SectionCard
        title="NHAI Highway Corridors Directory"
        subtitle="Monitored road segments connecting regional supply hubs across North East India."
      >
        {loading ? (
          <LoadingState label="Loading road corridors graph…" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchRouteNetwork} />
        ) : corridors.length === 0 ? (
          <EmptyState title="NO CORRIDORS FOUND" description="No active road corridors returned from network graph." />
        ) : (
          <DataTable columns={corridorColumns} data={corridors} keyExtractor={(c) => `${c.highway_ref}_${c.from}_${c.to}`} />
        )}
      </SectionCard>
    </div>
  );
};
