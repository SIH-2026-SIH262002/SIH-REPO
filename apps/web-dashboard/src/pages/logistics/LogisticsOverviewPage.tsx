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

  const loadOverviewData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, vehRes, gapsRes, whRes, graphRes] = await Promise.allSettled([
        apiService.getDashboardSummary(),
        apiService.getVehicles(),
        apiService.getSupplyGapIntelligence(),
        apiService.getWarehouses(),
        apiService.getRouteGraph(),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
      if (vehRes.status === 'fulfilled') setVehicles(Array.isArray(vehRes.value) ? vehRes.value : []);
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
      key: 'cargo',
      header: 'Cargo Payload',
      render: (v) => (
        <span className="text-xs text-[var(--adm-ink-2)] truncate max-w-[200px] block">
          {v.cargo || v.cargo_type || 'Essential Supplies'}
        </span>
      ),
    },
    {
      key: 'route',
      header: 'Corridor Segment',
      render: (v) => (
        <span className="text-xs font-medium">
          {v.origin_name || v.origin || 'Guwahati'} → {v.destination_name || v.destination || 'Silchar'}
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
