import React, { useState, useEffect } from 'react';
import { Route, RotateCw, Navigation, Compass, AlertTriangle, CheckCircle2, Search, ArrowRight, Activity, Send, MountainSnow } from 'lucide-react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { DataTable, Column } from '../../components/admin/primitives/DataTable';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, EmptyState } from '../../components/admin/primitives/QueryStates';
import { NERMap, MapSensorNode } from '../../components/map/NERMap';
import { apiService } from '../../services/apiService';
import { useWebSocket } from '../../hooks/useWebSocket';

export const LogisticsRoutesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [corridors, setCorridors] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [sensors, setSensors] = useState<MapSensorNode[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Interactive Route Planner Form State
  const [origin, setOrigin] = useState('GHY');
  const [destination, setDestination] = useState('SLC');
  const [avoidSteepRoads, setAvoidSteepRoads] = useState(false);
  const [planningRoute, setPlanningRoute] = useState(false);
  const [routePlanResult, setRoutePlanResult] = useState<any | null>(null);
  const [routePlanError, setRoutePlanError] = useState<string | null>(null);
  const [ambiguityData, setAmbiguityData] = useState<{ field: 'origin' | 'destination'; query: string; candidates: any[] } | null>(null);

  // Real Dispatch State
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [dispatchVehicleId, setDispatchVehicleId] = useState<string>('');
  const [dispatchingRouteId, setDispatchingRouteId] = useState<string | null>(null);
  const [dispatchBanner, setDispatchBanner] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  // Live reroute/dispatch banner fed by the same WS stream the rest of the
  // operator dashboard uses -- shows real backend-driven events, not local UI state.
  const { lastEvent } = useWebSocket();
  const [liveRerouteBanner, setLiveRerouteBanner] = useState<any | null>(null);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.kind === 'route_rerouted') {
      setLiveRerouteBanner(lastEvent.data);
    } else if (lastEvent.kind === 'route_dispatched') {
      setDispatchBanner({
        tone: 'success',
        message: `Route ${lastEvent.data?.route_id} dispatched to ${lastEvent.data?.vehicle_id} by ${lastEvent.data?.dispatched_by}.`,
      });
    }
  }, [lastEvent]);

  const fetchRouteNetwork = async () => {
    setLoading(true);
    setError(null);
    try {
      const [graphData, sensorsData, vehiclesData] = await Promise.allSettled([
        apiService.getRouteGraph(),
        apiService.getSensors(),
        apiService.getVehicles(),
      ]);
      if (graphData.status === 'fulfilled' && graphData.value) {
        if (graphData.value.edges) setCorridors(graphData.value.edges);
        if (graphData.value.nodes) setNodes(graphData.value.nodes);
      }
      if (sensorsData.status === 'fulfilled' && Array.isArray(sensorsData.value)) {
        setSensors(sensorsData.value);
      }
      if (vehiclesData.status === 'fulfilled' && Array.isArray(vehiclesData.value)) {
        setVehicles(vehiclesData.value);
        if (!dispatchVehicleId && vehiclesData.value.length > 0) {
          setDispatchVehicleId(vehiclesData.value[0].id);
        }
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
    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      setRoutePlanError('Origin and destination addresses must be different.');
      return;
    }

    setPlanningRoute(true);
    setRoutePlanError(null);
    setRoutePlanResult(null);
    setDispatchBanner(null);
    setAmbiguityData(null);

    try {
      // 1. Geocode and validate address ambiguity
      const origGeocode = await apiService.geocodeAddress(origin).catch(() => null);
      if (origGeocode?.status === 'AMBIGUOUS' && origGeocode.candidates?.length > 1) {
        setAmbiguityData({ field: 'origin', query: origin, candidates: origGeocode.candidates });
        setPlanningRoute(false);
        return;
      }
      const destGeocode = await apiService.geocodeAddress(destination).catch(() => null);
      if (destGeocode?.status === 'AMBIGUOUS' && destGeocode.candidates?.length > 1) {
        setAmbiguityData({ field: 'destination', query: destination, candidates: destGeocode.candidates });
        setPlanningRoute(false);
        return;
      }

      // 2. Query Local GraphHopper & NER Risk Engine
      const plan = await apiService.planRoute(origin, destination, undefined, 1.0, avoidSteepRoads);
      if (plan && plan.routes && plan.routes.length > 0) {
        setRoutePlanResult(plan);
        setSelectedRouteId(plan.routes[0]?.route_id || null);
      } else {
        setRoutePlanError('No viable connecting road corridor found between requested addresses.');
      }
    } catch (err: any) {
      setRoutePlanError(err?.response?.data?.detail || err?.message || 'Route computation failed on backend.');
    } finally {
      setPlanningRoute(false);
    }
  };

  const handleDispatch = async (routeId: string) => {
    if (!dispatchVehicleId) {
      setDispatchBanner({ tone: 'error', message: 'Select a vehicle to dispatch this route to.' });
      return;
    }
    setDispatchingRouteId(routeId);
    setDispatchBanner(null);
    try {
      // The backend re-plans and re-validates from scratch server-side --
      // route_id only tells it which of the freshly computed candidates to
      // use, it never trusts geometry/risk computed on the client.
      const result = await apiService.assignRoute(dispatchVehicleId, {
        origin,
        destination,
        avoidSteepRoads,
        routeId,
      });
      setDispatchBanner({
        tone: 'success',
        message: `Dispatched "${result.route?.label || routeId}" (${result.route?.status}) to ${dispatchVehicleId} via ${result.routing_source || result.engine}.`,
      });
      const refreshed = await apiService.getVehicles();
      if (Array.isArray(refreshed)) setVehicles(refreshed);
    } catch (err: any) {
      setDispatchBanner({
        tone: 'error',
        message: err?.response?.data?.detail || err?.message || 'Dispatch failed on backend.',
      });
    } finally {
      setDispatchingRouteId(null);
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

      {liveRerouteBanner && (
        <div className="p-3 bg-[var(--adm-warning-bg,#fff7ed)] border border-[var(--adm-warning)] rounded-[var(--adm-radius)] text-xs font-medium text-[var(--adm-ink)] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--adm-warning)] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold">
              LIVE REROUTE — Vehicle {liveRerouteBanner.vehicle_id}: {liveRerouteBanner.previous_status} → {liveRerouteBanner.new_status}
            </div>
            <div>{liveRerouteBanner.reason} (risk {liveRerouteBanner.risk_before} → {liveRerouteBanner.risk_after})</div>
            <div className="text-[var(--adm-ink-3)] font-mono">
              {liveRerouteBanner.previous_path_names?.join(' → ')} <ArrowRight className="inline w-3 h-3" /> {liveRerouteBanner.new_path_names?.join(' → ')}
            </div>
          </div>
          <button onClick={() => setLiveRerouteBanner(null)} className="ml-auto text-[var(--adm-ink-3)] hover:text-[var(--adm-ink)]">×</button>
        </div>
      )}

      {ambiguityData && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Ambiguous {ambiguityData.field.toUpperCase()} Address: "{ambiguityData.query}" — Select Exact Target Location:</span>
            </div>
            <button
              onClick={() => setAmbiguityData(null)}
              className="text-xs text-amber-700 dark:text-amber-400 font-bold hover:underline"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ambiguityData.candidates.map((cand: any, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (ambiguityData.field === 'origin') setOrigin(cand.address);
                  else setDestination(cand.address);
                  setAmbiguityData(null);
                }}
                className="p-2.5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 hover:border-indigo-500 rounded-lg text-left text-xs font-medium text-slate-800 dark:text-slate-200 transition space-y-1 shadow-sm"
              >
                <div className="font-bold text-indigo-600 dark:text-indigo-400 line-clamp-1">{cand.address}</div>
                <div className="text-[10px] font-mono text-slate-500">
                  Lat: {cand.lat.toFixed(4)}, Lon: {cand.lng.toFixed(4)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive AI Route Planner Box */}
      <SectionCard
        title="Interactive AI Corridor Planner (NetworkX Dijkstra & GraphHopper)"
        subtitle="Query optimal risk-aware convoy routing between any two regional logistics hubs."
      >
        <form onSubmit={handlePlanRoute} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--adm-ink-2)] block mb-1">Origin Location / Hub</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                list="origin-nodes-datalist"
                placeholder="Select hub or type city/lat,lon (e.g. Kolkata, Delhi, 26.14,91.73)"
                className="w-full bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] px-3 py-2 text-xs font-medium text-[var(--adm-ink)] focus:ring-2 focus:ring-[var(--adm-primary)]"
              />
              <datalist id="origin-nodes-datalist">
                {nodes.map((n) => (
                  <option key={`orig-${n.node_key}`} value={n.name}>
                    {n.name} ({n.district})
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--adm-ink-2)] block mb-1">Destination Location / Hub</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                list="dest-nodes-datalist"
                placeholder="Select hub or type city/lat,lon (e.g. Silchar, Mumbai, 22.57,88.36)"
                className="w-full bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] px-3 py-2 text-xs font-medium text-[var(--adm-ink)] focus:ring-2 focus:ring-[var(--adm-primary)]"
              />
              <datalist id="dest-nodes-datalist">
                {nodes.map((n) => (
                  <option key={`dest-${n.node_key}`} value={n.name}>
                    {n.name} ({n.district})
                  </option>
                ))}
              </datalist>
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

          <label className="flex items-center gap-2 text-xs font-semibold text-[var(--adm-ink-2)] cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={avoidSteepRoads}
              onChange={(e) => setAvoidSteepRoads(e.target.checked)}
              className="rounded accent-[var(--adm-primary)]"
            />
            <MountainSnow className="w-3.5 h-3.5" />
            <span>Avoid steep roads (slope ≥ 25°) — uses the risk-aware NetworkX engine</span>
          </label>

          {routePlanError && (
            <div className="p-3 bg-[var(--adm-critical-bg)] border border-[var(--adm-critical)] text-[var(--adm-critical)] rounded-[var(--adm-radius)] text-xs font-medium">
              {routePlanError}
            </div>
          )}

          {routePlanResult?.graphhopper_error && (
            <div className="p-2.5 bg-[var(--adm-raised)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] text-[11px] text-[var(--adm-ink-2)] flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--adm-warning)]" />
              <span>
                GraphHopper unavailable ({routePlanResult.graphhopper_error}) — using local risk-aware NetworkX routing instead.
              </span>
            </div>
          )}

          {/* Embedded Geospatial Map */}
          <div className="h-[440px] w-full rounded-[var(--adm-radius)] overflow-hidden border border-[var(--adm-border)]">
            <NERMap
              sensors={sensors}
              routes={routePlanResult?.routes || []}
              selectedRouteId={selectedRouteId}
              onSelectRoute={(id) => setSelectedRouteId(id)}
              originCoords={routePlanResult?.origin_coords}
              destinationCoords={routePlanResult?.destination_coords}
              originName={routePlanResult?.origin_name || origin}
              destinationName={routePlanResult?.destination_name || destination}
            />
          </div>

          {routePlanResult && (
            <div className="p-4 bg-[var(--adm-raised)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--adm-border)] pb-2">
                <span className="text-xs font-bold text-[var(--adm-ink)] uppercase tracking-wide">
                  Routing Solutions ({routePlanResult.engine === 'graphhopper' ? 'GraphHopper Engine' : 'NetworkX Dijkstra Fallback'})
                </span>
                <span className="text-xs text-[var(--adm-ink-3)] font-mono">
                  {routePlanResult.routes.length} Candidate Route(s)
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-[var(--adm-ink-2)]">Dispatch to vehicle:</span>
                <select
                  value={dispatchVehicleId}
                  onChange={(e) => setDispatchVehicleId(e.target.value)}
                  className="bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] px-2 py-1 text-xs font-medium"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id} — {v.driver_name} ({v.cargo_type})
                    </option>
                  ))}
                </select>
              </div>

              {dispatchBanner && (
                <div
                  className={`p-2.5 rounded-[var(--adm-radius)] text-[11px] font-medium border ${
                    dispatchBanner.tone === 'success'
                      ? 'bg-[var(--adm-healthy-bg,#ecfdf5)] border-[var(--adm-healthy)] text-[var(--adm-healthy)]'
                      : 'bg-[var(--adm-critical-bg)] border-[var(--adm-critical)] text-[var(--adm-critical)]'
                  }`}
                >
                  {dispatchBanner.message}
                </div>
              )}

              <div className="space-y-3">
                {routePlanResult.routes.map((rt: any, idx: number) => {
                  const isSelected = selectedRouteId === rt.route_id || (idx === 0 && !selectedRouteId);
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedRouteId(rt.route_id)}
                      className={`p-3 rounded-[var(--adm-radius)] space-y-2 cursor-pointer transition border ${
                        isSelected
                          ? 'bg-[var(--adm-surface)] border-[var(--adm-primary)] ring-1 ring-[var(--adm-primary)]'
                          : 'bg-[var(--adm-surface)] border-[var(--adm-border)] hover:border-[var(--adm-ink-3)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--adm-primary)]">
                          {rt.label || (idx === 0 ? 'Primary Recommended Route' : `Alternate Option #${idx + 1}`)}
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

                      {rt.instructions && rt.instructions.length > 0 && (
                        <details className="mt-2 text-xs border-t border-[var(--adm-border)] pt-2" onClick={(e) => e.stopPropagation()}>
                          <summary className="font-semibold text-[var(--adm-primary)] hover:underline flex items-center gap-1.5 cursor-pointer">
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Turn-by-Turn Navigation Steps ({rt.instructions.length} steps on actual highway roads)</span>
                          </summary>
                          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1">
                            {rt.instructions.map((step: any, sIdx: number) => (
                              <div key={sIdx} className="flex items-center justify-between text-[11px] text-[var(--adm-ink-2)] bg-[var(--adm-raised,#f8fafc)] px-2 py-1.5 rounded border border-[var(--adm-border)]">
                                <span className="font-medium text-[var(--adm-ink)]">
                                  {sIdx + 1}. {step.text}
                                </span>
                                <span className="font-mono text-[10px] text-[var(--adm-ink-3)] tabular-nums shrink-0 ml-2">
                                  {step.distance_m >= 1000 ? `${(step.distance_m / 1000).toFixed(1)} km` : `${Math.round(step.distance_m)} m`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDispatch(rt.route_id);
                          }}
                          disabled={dispatchingRouteId !== null || rt.status === 'AVOID'}
                          title={rt.status === 'AVOID' ? 'AVOID-classified routes cannot be dispatched from here.' : undefined}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--adm-radius)] bg-[var(--adm-primary)] text-white text-[11px] font-semibold hover:bg-[var(--adm-primary-dark)] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{dispatchingRouteId === rt.route_id ? 'Dispatching…' : 'Dispatch to Vehicle'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
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
