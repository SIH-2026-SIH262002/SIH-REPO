import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  AlertTriangle,
  PackageCheck,
  Warehouse,
  Route,
  Activity,
  ArrowRight,
  ShieldCheck,
  Clock,
  RotateCw,
} from 'lucide-react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { MetricTile } from '../../components/admin/primitives/MetricTile';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { DataTable, Column } from '../../components/admin/primitives/DataTable';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, EmptyState } from '../../components/admin/primitives/QueryStates';
import { NERMap, MapSensorNode, MapVehicle } from '../../components/map/NERMap';
import { useWebSocket } from '../../hooks/useWebSocket';
import { apiService } from '../../services/apiService';

export const LogisticsOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [supplyGaps, setSupplyGaps] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [riskyCorridors, setRiskyCorridors] = useState<any[]>([]);
  const [sensors, setSensors] = useState<MapSensorNode[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<MapVehicle | null>(null);

  const { lastEvent } = useWebSocket();

  const loadOverviewData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, vehRes, gapsRes, whRes, graphRes, sensRes] = await Promise.allSettled([
        apiService.getDashboardSummary(),
        apiService.getVehicles(),
        apiService.getSupplyGapIntelligence(),
        apiService.getWarehouses(),
        apiService.getRouteGraph(),
        apiService.getSensors(),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
      if (vehRes.status === 'fulfilled') setVehicles(Array.isArray(vehRes.value) ? vehRes.value : []);
      if (sensRes.status === 'fulfilled') setSensors(Array.isArray(sensRes.value) ? sensRes.value : []);
      if (gapsRes.status === 'fulfilled') {
        const val = gapsRes.value;
        setSupplyGaps(Array.isArray(val?.supply_gaps) ? val.supply_gaps : Array.isArray(val) ? val : []);
      }
      if (whRes.status === 'fulfilled') setWarehouses(Array.isArray(whRes.value) ? whRes.value : []);
      if (graphRes.status === 'fulfilled') {
        const rawEdges = graphRes.value?.edges;
        const edges = Array.isArray(rawEdges) ? rawEdges : [];
        setRiskyCorridors(
          edges
            .filter((e) => (e.risk_score || 0) >= 40)
            .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
            .slice(0, 4)
        );
      }

      // If all core promises failed, report service error
      if (sumRes.status === 'rejected' && vehRes.status === 'rejected') {
        setError('Logistics telemetry and operational services are currently unreachable.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load logistics command overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverviewData();
  }, []);

  // Listen to WebSocket Delta Events for real-time sensor and vehicle updates
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.kind === 'sensor_update' && lastEvent.data) {
      const updated = lastEvent.data;
      setSensors((prev) =>
        prev.map((s) => (s.node_key?.toUpperCase() === updated.node_key?.toUpperCase() ? { ...s, ...updated } : s))
      );
    }
    if (lastEvent.kind === 'vehicle_update' && lastEvent.data) {
      const updated = lastEvent.data;
      const uid = String(updated.id || updated.code);
      setVehicles((prev) =>
        prev.map((v) => (String(v.id || v.code) === uid ? { ...v, ...updated } : v))
      );
      setSelectedVehicle((prev) => {
        if (!prev || String(prev.id) !== uid) return prev;
        return {
          ...prev,
          location: { lat: updated.lat, lng: updated.lon },
          speed_kmh: updated.speed_kmph ?? updated.speed_kmh,
          eta: updated.eta_formatted ?? updated.eta,
          eta_minutes: updated.eta_minutes,
          remaining_distance_km: updated.remaining_distance_km,
          route_label: updated.route_label,
          route_path_names: updated.route_path_names,
          route_coordinates: updated.active_route_coordinates,
          current_segment: updated.current_segment,
        };
      });
    }
    if (lastEvent.kind === 'route_rerouted' && lastEvent.data) {
      const rerouted = lastEvent.data;
      const vid = String(rerouted.vehicle_id || rerouted.vehicle_code);
      setVehicles((prev) =>
        prev.map((v) => {
          if (String(v.id || v.code) === vid) {
            return {
              ...v,
              route_label: (rerouted.new_path_names || []).join(' → '),
              route_nodes: rerouted.new_path,
              route_path_names: rerouted.new_path_names,
            };
          }
          return v;
        })
      );
    }
  }, [lastEvent]);

  if (loading) {
    return <LoadingState label="Loading regional logistics operational telemetry…" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadOverviewData} />;
  }

  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const safeSupplyGaps = Array.isArray(supplyGaps) ? supplyGaps : [];
  const safeWarehouses = Array.isArray(warehouses) ? warehouses : [];
  const safeRiskyCorridors = Array.isArray(riskyCorridors) ? riskyCorridors : [];

  const activeVehiclesCount = safeVehicles.filter((v) => v.status !== 'COMPLETED' && v.status !== 'DELIVERED').length;
  const delayedVehiclesCount = safeVehicles.filter((v) => v.status === 'DELAYED' || v.delivery_status?.includes('DELAYED')).length;
  const atRiskVehiclesCount = safeVehicles.filter((v) => v.status === 'AT_RISK' || v.status === 'SOS' || v.status === 'BREAKDOWN').length;
  const criticalSupplyCount = safeSupplyGaps.filter((g) => g.status === 'HIGH_RISK_DELAY').length;

  const mapVehicles: MapVehicle[] = safeVehicles.map((v) => {
    let status: 'IN_TRANSIT' | 'DELAYED' | 'AT_RISK' | 'OFFLINE' = 'IN_TRANSIT';
    const rawStatus = (v.status || '').toUpperCase();
    if (rawStatus === 'DELAYED' || v.delivery_status?.includes('DELAYED')) status = 'DELAYED';
    else if (rawStatus === 'AT_RISK' || rawStatus === 'SOS' || rawStatus === 'BREAKDOWN') status = 'AT_RISK';
    else if (rawStatus === 'OFFLINE') status = 'OFFLINE';

    return {
      id: String(v.id || v.code),
      code: v.code || v.id || 'VEH',
      driver: v.driver || v.driver_name || 'Unassigned',
      phone: v.phone || v.driver_phone || '+91-99887-12345',
      status,
      location: {
        lat: Number(v.lat ?? (v.location?.lat ?? 26.15)),
        lng: Number(v.lon ?? (v.location?.lng ?? 92.93)),
      },
      origin: v.origin_name || v.origin || 'Guwahati',
      destination: v.destination_name || v.destination || 'Silchar',
      cargo: v.cargo || v.cargo_type || 'Essential Supplies',
      speed_kmh: Number(v.speed_kmph ?? v.speed_kmh ?? v.speed ?? 45),
      eta: v.eta_formatted ?? (typeof v.eta === 'string' ? v.eta : undefined),
      eta_minutes: v.eta_minutes,
      remaining_distance_km: v.remaining_distance_km,
      route_label: v.route_label,
      route_path_names: v.route_path_names,
      route_coordinates: v.active_route_coordinates,
      current_segment: v.current_segment,
    };
  });

  const vehicleColumns: Column<any>[] = [
    {
      key: 'code',
      header: 'Vehicle Code',
      render: (v) => (
        <span className="font-mono font-bold text-[var(--adm-primary)]">{v.code || v.id}</span>
      ),
    },
    {
      key: 'driver',
      header: 'Assigned Driver',
      render: (v) => v.driver || v.driver_name || 'Unassigned',
    },
    {
      key: 'headed_to',
      header: 'Headed To / ETA',
      render: (v) => {
        const eta = v.eta_formatted || (typeof v.eta === 'string' ? v.eta : '1h 30m');
        const dist = v.remaining_distance_km !== undefined ? `${v.remaining_distance_km} km` : null;
        return (
          <div className="text-xs">
            <div className="font-bold text-[var(--adm-ink)] flex items-center gap-1">
              <span className="text-indigo-600 dark:text-indigo-400">🎯</span>
              <span>{v.destination_name || v.destination || 'Silchar'}</span>
            </div>
            <div className="text-[11px] text-[var(--adm-ink-2)] font-mono">
              ETA: <span className="font-bold text-emerald-600 dark:text-emerald-400">{eta}</span>
              {dist && <span className="ml-1 text-[var(--adm-ink-3)]">({dist})</span>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'route',
      header: 'Corridor Route',
      render: (v) => (
        <div className="text-xs">
          <span className="font-medium text-[var(--adm-ink)] block">
            {v.route_label || `${v.origin_name || v.origin || 'Guwahati'} → ${v.destination_name || v.destination || 'Silchar'}`}
          </span>
          {v.current_segment && (
            <span className="text-[10px] text-[var(--adm-ink-3)] font-mono">
              Segment: {v.current_segment}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'cargo',
      header: 'Cargo Payload',
      render: (v) => (
        <span className="text-xs text-[var(--adm-ink-2)] truncate max-w-[180px] block" title={v.cargo || v.cargo_type}>
          {v.cargo || v.cargo_type || 'Essential Supplies'}
        </span>
      ),
    },
    {
      key: 'speed',
      header: 'Speed / Progress',
      render: (v) => (
        <span className="font-mono text-xs tabular-nums">
          {v.speed || `${v.speed_kmph || 45} km/h`}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Operational Status',
      render: (v) => {
        const s = v.status || 'MOVING';
        if (s === 'AT_RISK' || s === 'SOS') return <StatusBadge tone="critical" label="AT RISK" />;
        if (s === 'DELAYED') return <StatusBadge tone="warning" label="DELAYED" />;
        if (s === 'COMPLETED' || s === 'DELIVERED') return <StatusBadge tone="healthy" label="DELIVERED" />;
        return <StatusBadge tone="healthy" label="IN TRANSIT" />;
      },
    },
    {
      key: 'actions',
      header: 'Tactical Focus',
      align: 'right',
      render: (v) => {
        const vid = String(v.id || v.code);
        const isSelected = selectedVehicle?.id === vid;
        return (
          <button
            onClick={() => {
              const mv = mapVehicles.find((m) => m.id === vid);
              if (mv) {
                setSelectedVehicle(mv);
                const mapEl = document.getElementById('logistics-gis-radar');
                if (mapEl) {
                  mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            }}
            className={`text-xs font-semibold px-2.5 py-1 rounded-[var(--adm-radius)] transition ${
              isSelected
                ? 'bg-[var(--adm-primary)] text-white shadow-xs'
                : 'text-[var(--adm-primary)] bg-[var(--adm-primary-wash)] hover:bg-[var(--adm-raised)] border border-[var(--adm-border)]'
            }`}
          >
            {isSelected ? 'Focused on Radar' : 'Locate on Radar'}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Logistics Operations Overview"
        subtitle="Live convoy movements, corridor risk warnings, rerouting requirements, and essential supply chain continuity."
        action={
          <button
            onClick={loadOverviewData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] text-xs font-semibold text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)]"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>
        }
      />

      {/* Metric Tiles Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          label="Active Convoys"
          value={safeVehicles.length > 0 ? activeVehiclesCount : 0}
          context={`${safeVehicles.length} total registered fleet units`}
          tone="healthy"
          provenance="SIMULATED"
          icon={<Truck className="w-5 h-5 text-[var(--adm-healthy)]" />}
        />
        <MetricTile
          label="Delayed / Disrupted"
          value={delayedVehiclesCount}
          context="Trips blocked by hill corridor landslides"
          tone={delayedVehiclesCount > 0 ? 'warning' : 'neutral'}
          provenance="SIMULATED"
          icon={<Clock className="w-5 h-5 text-[var(--adm-warning)]" />}
        />
        <MetricTile
          label="Corridors Flagged / Blocked"
          value={`${summary?.flagged_corridors ?? 0} / ${summary?.blocked_corridors ?? 0}`}
          context="Severe landslide hazard risk threshold"
          tone={summary?.blocked_corridors > 0 ? 'critical' : 'warning'}
          provenance="LIVE"
          icon={<AlertTriangle className="w-5 h-5 text-[var(--adm-critical)]" />}
        />
        <MetricTile
          label="Supply Gaps at Risk"
          value={criticalSupplyCount}
          context="Districts experiencing incoming supply delays"
          tone={criticalSupplyCount > 0 ? 'critical' : 'healthy'}
          provenance="LIVE"
          icon={<Warehouse className="w-5 h-5 text-[var(--adm-primary)]" />}
        />
      </div>

      {/* GIS Tactical Telematics & Regional Convoy Radar Map */}
      <div id="logistics-gis-radar">
        <SectionCard
          title="GIS Tactical Landslide & Fleet Spatial Radar"
          subtitle="Real-time spatial monitoring of active logistics convoys, 18 IoT landslide sensor nodes, and hill corridor hazard zones across North East India."
          action={
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--adm-radius)] bg-[var(--adm-raised)] border border-[var(--adm-border)] text-[11px] font-mono font-medium text-[var(--adm-ink-2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {mapVehicles.length} Active Fleet Convoys
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--adm-radius)] bg-[var(--adm-raised)] border border-[var(--adm-border)] text-[11px] font-mono font-medium text-[var(--adm-ink-2)]">
                <Activity className="w-3 h-3 text-[var(--adm-primary)]" />
                {sensors.length} Sensor Stations
              </span>
              <button
                onClick={() => navigate('/logistics/routes')}
                className="text-xs font-semibold text-[var(--adm-primary)] hover:underline flex items-center gap-1"
              >
                <span>AI Route Planner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          }
        >
          <div className="h-[480px] w-full rounded-[var(--adm-radius)] overflow-hidden border border-[var(--adm-border)]">
            <NERMap
              sensors={sensors}
              vehicles={mapVehicles}
              selectedVehicle={selectedVehicle}
              onSelectVehicle={(v) => setSelectedVehicle(v)}
            />
          </div>

          {selectedVehicle && (
            <div className="mt-3 p-4 bg-[var(--adm-raised)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--adm-border)] pb-2.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="p-2 rounded-lg bg-[var(--adm-primary-wash)] text-[var(--adm-primary)] flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-[var(--adm-ink)]">{selectedVehicle.code}</span>
                      <StatusBadge
                        tone={selectedVehicle.status === 'AT_RISK' ? 'critical' : selectedVehicle.status === 'DELAYED' ? 'warning' : 'healthy'}
                        label={selectedVehicle.status.replace('_', ' ')}
                      />
                    </div>
                    <div className="text-xs text-[var(--adm-ink-2)]">
                      Assigned Driver: <strong className="text-[var(--adm-ink)]">{selectedVehicle.driver}</strong> • 📞 {selectedVehicle.phone || '+91-99887-12345'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="text-xs text-[var(--adm-ink-3)] hover:text-[var(--adm-ink)] font-semibold px-3 py-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] hover:bg-[var(--adm-raised)] transition"
                >
                  Clear Radar Focus
                </button>
              </div>

              {/* 4 Telematics Data Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. Destination / Headed To */}
                <div className="p-3 rounded-[var(--adm-radius)] bg-[var(--adm-surface)] border border-[var(--adm-border)] space-y-1">
                  <span className="text-[10px] font-bold text-[var(--adm-ink-3)] uppercase tracking-wider block">
                    🎯 Headed To (Destination)
                  </span>
                  <div className="text-base font-black text-[var(--adm-primary)] leading-tight">
                    {selectedVehicle.destination}
                  </div>
                  <div className="text-[11px] text-[var(--adm-ink-2)]">
                    Origin: <strong>{selectedVehicle.origin}</strong>
                  </div>
                </div>

                {/* 2. Active Route Corridor */}
                <div className="p-3 rounded-[var(--adm-radius)] bg-[var(--adm-surface)] border border-[var(--adm-border)] space-y-1">
                  <span className="text-[10px] font-bold text-[var(--adm-ink-3)] uppercase tracking-wider block">
                    🛣️ Active Corridor Route
                  </span>
                  <div className="text-xs font-semibold text-[var(--adm-ink)] leading-snug">
                    {selectedVehicle.route_label || `${selectedVehicle.origin} ➔ ${selectedVehicle.destination}`}
                  </div>
                  {selectedVehicle.current_segment && (
                    <div className="text-[10px] text-[var(--adm-ink-3)] font-mono">
                      Active: {selectedVehicle.current_segment}
                    </div>
                  )}
                </div>

                {/* 3. Real-Time ETA & Remaining Distance */}
                <div className="p-3 rounded-[var(--adm-radius)] bg-[var(--adm-surface)] border border-[var(--adm-border)] space-y-1">
                  <span className="text-[10px] font-bold text-[var(--adm-ink-3)] uppercase tracking-wider block">
                    ⏱️ Real-Time ETA
                  </span>
                  <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono leading-tight">
                    {selectedVehicle.eta || (selectedVehicle.eta_minutes ? `${Math.floor(selectedVehicle.eta_minutes / 60)}h ${selectedVehicle.eta_minutes % 60}m` : 'On Schedule')}
                  </div>
                  <div className="text-[11px] text-[var(--adm-ink-2)] font-mono">
                    {selectedVehicle.remaining_distance_km !== undefined ? `${selectedVehicle.remaining_distance_km} km remaining` : 'Calculating route dist…'}
                  </div>
                </div>

                {/* 4. Speed & Cargo Payload */}
                <div className="p-3 rounded-[var(--adm-radius)] bg-[var(--adm-surface)] border border-[var(--adm-border)] space-y-1">
                  <span className="text-[10px] font-bold text-[var(--adm-ink-3)] uppercase tracking-wider block">
                    ⚡ Telemetry & Cargo
                  </span>
                  <div className="text-xs font-bold text-[var(--adm-ink)] font-mono">
                    Speed: {selectedVehicle.speed_kmh ? `${selectedVehicle.speed_kmh} km/h` : '45 km/h'}
                  </div>
                  <div className="text-[11px] text-[var(--adm-ink-2)] truncate" title={selectedVehicle.cargo}>
                    Cargo: <strong>{selectedVehicle.cargo}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Active Fleet Convoy Telemetry Table */}
      <SectionCard
        title="Active Convoy Telematics & Movement"
        subtitle="Real-time vehicle coordinates, speeds, assigned drivers, and cargo payloads moving along the NER highway network."
        action={
          <button
            onClick={() => navigate('/logistics/fleet')}
            className="text-xs font-semibold text-[var(--adm-primary)] hover:underline flex items-center gap-1"
          >
            <span>View Full Fleet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      >
        {safeVehicles.length === 0 ? (
          <EmptyState
            title="NO ACTIVE CONVOYS"
            description="There are currently no active transport vehicles reporting telemetry in the logistics network."
          />
        ) : (
          <DataTable
            columns={vehicleColumns}
            data={safeVehicles.slice(0, 6)}
            keyExtractor={(v) => v.id || v.code}
          />
        )}
      </SectionCard>

      {/* Operational Split: Regional Supply Gap Warnings & Corridor Risk Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Supply Gaps */}
        <SectionCard
          title="Regional Essential Supply Chain Gaps"
          subtitle="Identified warehouse buffer risks and delayed inbound medical/food shipments."
          action={
            <button
              onClick={() => navigate('/logistics/warehouses')}
              className="text-xs font-semibold text-[var(--adm-primary)] hover:underline flex items-center gap-1"
            >
              <span>Manage Warehouses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          {safeSupplyGaps.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--adm-ink-3)]">
              All monitored regional districts report stable supply buffer levels.
            </div>
          ) : (
            <div className="divide-y divide-[var(--adm-border)]">
              {safeSupplyGaps.slice(0, 4).map((gap, idx) => (
                <div key={idx} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--adm-ink)]">{gap.district}</span>
                      {gap.status === 'HIGH_RISK_DELAY' ? (
                        <StatusBadge tone="critical" label="HIGH RISK DELAY" />
                      ) : gap.status === 'MODERATE_DELAY' ? (
                        <StatusBadge tone="warning" label="MODERATE DELAY" />
                      ) : (
                        <StatusBadge tone="healthy" label="STABLE" />
                      )}
                    </div>
                    <div className="text-xs text-[var(--adm-ink-2)]">
                      Commodities: <span className="font-medium">{gap.commodities?.join(', ') || 'General Rations'}</span>
                    </div>
                    <p className="text-[11px] text-[var(--adm-ink-3)] italic">
                      {gap.operational_recommendation}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-[var(--adm-ink)]">
                      Risk: {gap.max_corridor_risk}/100
                    </div>
                    <div className="text-[10px] text-[var(--adm-ink-3)] font-mono">
                      {gap.delayed_shipments || 0} Delayed Inbound
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Quick Decision & Corridor Watchlist */}
        <SectionCard
          title="Corridor Watchlist & Reroute Demands"
          subtitle="Highway segments requiring operator intervention due to hazardous rainfall or debris."
          action={
            <button
              onClick={() => navigate('/logistics/reroutes')}
              className="text-xs font-semibold text-[var(--adm-primary)] hover:underline flex items-center gap-1"
            >
              <span>Review Decisions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          {safeRiskyCorridors.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--adm-ink-3)] italic">
              No monitored highway corridors are currently flagged for elevated risk.
            </div>
          ) : (
            <div className="space-y-3">
              {safeRiskyCorridors.map((c, idx) => {
                const isSevere = (c.risk_score || 0) >= 70;
                return (
                  <div
                    key={idx}
                    className="p-3 bg-[var(--adm-raised)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--adm-ink)]">
                        {c.highway_ref} {(c.from_name || c.from)} ↔ {(c.to_name || c.to)}
                      </span>
                      <StatusBadge
                        tone={isSevere ? 'critical' : 'warning'}
                        label={`${isSevere ? 'AVOID' : 'CAUTION'} (RISK ${c.risk_score}%)`}
                      />
                    </div>
                    {isSevere && (
                      <div className="pt-2 flex items-center justify-end border-t border-[var(--adm-border)]">
                        <button
                          onClick={() => navigate('/logistics/reroutes')}
                          className="px-2.5 py-1 bg-[var(--adm-primary)] text-white text-xs font-semibold rounded-[var(--adm-radius)] hover:bg-[var(--adm-primary-dark)]"
                        >
                          Review Reroute Decisions
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};
