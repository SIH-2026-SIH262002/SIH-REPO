import React, { useState, useEffect } from 'react';
import { Truck, RotateCw, Filter, Search, MapPin, Gauge, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { DataTable, Column } from '../../components/admin/primitives/DataTable';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { SearchInput } from '../../components/admin/primitives/SearchInput';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, EmptyState } from '../../components/admin/primitives/QueryStates';
import { apiService } from '../../services/apiService';

export const LogisticsFleetPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getVehicles();
      setVehicles(data || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load fleet telemetry from logistics service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter((v) => {
    const q = searchQuery.toLowerCase().trim();
    const code = (v.code || v.id || '').toLowerCase();
    const driver = (v.driver || v.driver_name || '').toLowerCase();
    const cargo = (v.cargo || v.cargo_type || '').toLowerCase();
    const orig = (v.origin_name || v.origin || '').toLowerCase();
    const dest = (v.destination_name || v.destination || '').toLowerCase();

    const matchesSearch = !q || code.includes(q) || driver.includes(q) || cargo.includes(q) || orig.includes(q) || dest.includes(q);
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'DELAYED' && (v.status === 'DELAYED' || v.delivery_status?.includes('DELAYED'))) ||
      (statusFilter === 'AT_RISK' && (v.status === 'AT_RISK' || v.status === 'SOS')) ||
      (statusFilter === 'DELIVERED' && (v.status === 'DELIVERED' || v.status === 'COMPLETED')) ||
      (statusFilter === 'IN_TRANSIT' && v.status !== 'DELIVERED' && v.status !== 'DELAYED' && v.status !== 'AT_RISK');

    return matchesSearch && matchesStatus;
  });

  const columns: Column<any>[] = [
    {
      key: 'code',
      header: 'Vehicle Code',
      render: (v) => (
        <span className="font-mono font-bold text-[var(--adm-primary)]">{v.code || v.id}</span>
      ),
    },
    {
      key: 'driver',
      header: 'Driver & Contact',
      render: (v) => (
        <div>
          <div className="font-medium text-[var(--adm-ink)]">{v.driver || v.driver_name || 'Unassigned'}</div>
          {v.phone && <div className="text-[10px] text-[var(--adm-ink-3)] font-mono">{v.phone}</div>}
        </div>
      ),
    },
    {
      key: 'cargo',
      header: 'Cargo Description',
      render: (v) => (
        <span className="text-xs font-medium text-[var(--adm-ink-2)] truncate max-w-[220px] block">
          {v.cargo || v.cargo_type || 'Essential Commodities'}
        </span>
      ),
    },
    {
      key: 'journey',
      header: 'Origin → Destination',
      render: (v) => (
        <div className="text-xs">
          <span className="text-[var(--adm-ink-2)]">{v.origin_name || v.origin || 'Guwahati'}</span>
          <span className="mx-1 text-[var(--adm-ink-3)]">→</span>
          <span className="font-semibold text-[var(--adm-ink)]">{v.destination_name || v.destination || 'Silchar'}</span>
        </div>
      ),
    },
    {
      key: 'speed',
      header: 'Speed',
      render: (v) => (
        <div className="text-xs font-mono tabular-nums">
          {v.speed_kmph != null ? `${v.speed_kmph} km/h` : v.speed || 'N/A'}
        </div>
      ),
    },
    {
      key: 'location',
      header: 'GPS Location',
      render: (v) => (
        <span className="text-[11px] font-mono text-[var(--adm-ink-2)]">
          {v.lat ? `${v.lat.toFixed(3)}, ${v.lon.toFixed(3)}` : 'In Transit'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trip Status',
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
      header: 'Actions',
      align: 'right',
      render: (v) => (
        <button
          onClick={() => setSelectedVehicle(v)}
          className="text-xs font-semibold text-[var(--adm-primary)] hover:underline"
        >
          Inspect Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet Telematics & Vehicle Registry"
        subtitle="Real-time operational monitoring of logistics convoys, speed limits, payload conditions, and driver assignments."
        action={
          <div className="flex items-center gap-2">
            <DataProvenanceBadge kind="SIMULATED" />
            <button
              onClick={fetchVehicles}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] text-xs font-semibold text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)]"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Refresh Fleet</span>
            </button>
          </div>
        }
      />

      <SectionCard title="Active Transport Fleet" subtitle="Live tracking across all 8 North Eastern Region states.">
        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by code, driver, cargo, or destination…"
          />

          <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
            <span className="text-[var(--adm-ink-3)] font-medium">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] px-2.5 py-1.5 text-xs text-[var(--adm-ink)] font-medium focus:ring-2 focus:ring-[var(--adm-primary)]"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELAYED">Delayed</option>
              <option value="AT_RISK">At Risk</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingState label="Loading fleet telematics data…" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchVehicles} />
        ) : filteredVehicles.length === 0 ? (
          <EmptyState
            title="NO ACTIVE CONVOYS"
            description="No logistics vehicles matched your filter criteria or there are no transport units active."
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredVehicles}
            keyExtractor={(v) => v.id || v.code}
          />
        )}
      </SectionCard>

      {/* Vehicle Inspection Modal / Drawer */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 bg-[rgba(22,32,44,0.45)] backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] max-w-lg w-full p-6 shadow-[var(--adm-shadow-modal)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--adm-border)] pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[var(--adm-primary)]" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--adm-ink)]">
                    Vehicle Dossier: {selectedVehicle.code || selectedVehicle.id}
                  </h3>
                  <p className="text-xs text-[var(--adm-ink-3)] font-mono">
                    DRIVER: {selectedVehicle.driver || selectedVehicle.driver_name || 'Unassigned'}
                  </p>
                </div>
              </div>
              <StatusBadge
                tone={selectedVehicle.status === 'AT_RISK' ? 'critical' : selectedVehicle.status === 'DELAYED' ? 'warning' : 'healthy'}
                label={selectedVehicle.status || 'IN TRANSIT'}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[var(--adm-raised)] border border-[var(--adm-border)] rounded-[var(--adm-radius)]">
                <span className="text-[10px] uppercase font-bold text-[var(--adm-ink-3)] block">Assigned Corridor</span>
                <span className="font-semibold text-[var(--adm-ink)]">
                  {selectedVehicle.origin_name || selectedVehicle.origin} → {selectedVehicle.destination_name || selectedVehicle.destination}
                </span>
              </div>
              <div className="p-3 bg-[var(--adm-raised)] border border-[var(--adm-border)] rounded-[var(--adm-radius)]">
                <span className="text-[10px] uppercase font-bold text-[var(--adm-ink-3)] block">Cargo Payload</span>
                <span className="font-semibold text-[var(--adm-ink)] truncate block">
                  {selectedVehicle.cargo || selectedVehicle.cargo_type || 'Unknown'}
                </span>
              </div>
              <div className="p-3 bg-[var(--adm-raised)] border border-[var(--adm-border)] rounded-[var(--adm-radius)]">
                <span className="text-[10px] uppercase font-bold text-[var(--adm-ink-3)] block">Current Coordinates</span>
                <span className="font-mono text-[var(--adm-ink)]">
                  {selectedVehicle.lat?.toFixed(4)}, {selectedVehicle.lon?.toFixed(4)}
                </span>
              </div>
              <div className="p-3 bg-[var(--adm-raised)] border border-[var(--adm-border)] rounded-[var(--adm-radius)]">
                <span className="text-[10px] uppercase font-bold text-[var(--adm-ink-3)] block">Speed & Telemetry</span>
                <span className="font-mono font-bold text-[var(--adm-primary)]">
                  {selectedVehicle.speed_kmph != null ? `${selectedVehicle.speed_kmph} km/h` : selectedVehicle.speed || 'N/A'}
                </span>
              </div>
            </div>

            {selectedVehicle.route_nodes && selectedVehicle.route_nodes.length > 0 && (
              <div className="p-3 bg-[var(--adm-raised)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[var(--adm-ink-3)] block">Planned Path Nodes</span>
                <div className="text-xs font-mono text-[var(--adm-ink)] flex flex-wrap gap-1 items-center">
                  {selectedVehicle.route_nodes.map((n: string, i: number) => (
                    <React.Fragment key={n}>
                      <span className="bg-[var(--adm-surface)] border border-[var(--adm-border)] px-1.5 py-0.5 rounded font-bold">
                        {n}
                      </span>
                      {i < selectedVehicle.route_nodes.length - 1 && <span className="text-[var(--adm-ink-3)]">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="px-4 py-2 bg-[var(--adm-primary)] text-white text-xs font-semibold rounded-[var(--adm-radius)] hover:bg-[var(--adm-primary-dark)]"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
