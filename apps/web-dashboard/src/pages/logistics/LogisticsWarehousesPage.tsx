import React, { useState, useEffect } from 'react';
import { Warehouse, RotateCw, AlertTriangle, CheckCircle2, ShieldAlert, Package, TrendingDown } from 'lucide-react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { DataTable, Column } from '../../components/admin/primitives/DataTable';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { SearchInput } from '../../components/admin/primitives/SearchInput';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, EmptyState } from '../../components/admin/primitives/QueryStates';
import { apiService } from '../../services/apiService';

export const LogisticsWarehousesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWarehouses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getWarehouses();
      setWarehouses(data || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve warehouse inventory telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const filteredWarehouses = warehouses.filter((wh) => {
    const q = searchQuery.toLowerCase().trim();
    const name = (wh.warehouse_name || '').toLowerCase();
    const code = (wh.warehouse_code || '').toLowerCase();
    const dist = (wh.district || '').toLowerCase();
    const comm = (wh.commodity_type || '').toLowerCase();
    return !q || name.includes(q) || code.includes(q) || dist.includes(q) || comm.includes(q);
  });

  const columns: Column<any>[] = [
    {
      key: 'warehouse_code',
      header: 'Warehouse Depot',
      render: (wh) => (
        <div>
          <div className="font-bold text-xs text-[var(--adm-ink)]">{wh.warehouse_name}</div>
          <div className="text-[10px] font-mono text-[var(--adm-primary)]">{wh.warehouse_code}</div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'District & State',
      render: (wh) => (
        <span className="text-xs text-[var(--adm-ink-2)]">
          {wh.district}, <strong className="text-[var(--adm-ink)]">{wh.state}</strong>
        </span>
      ),
    },
    {
      key: 'commodity',
      header: 'Stock Commodity',
      render: (wh) => (
        <span className="text-xs font-semibold text-[var(--adm-ink)]">
          {wh.commodity_type?.replace(/_/g, ' ') || 'ESSENTIAL SUPPLIES'}
        </span>
      ),
    },
    {
      key: 'stock',
      header: 'Current Stock',
      render: (wh) => (
        <div className="text-xs font-mono tabular-nums">
          <span className="font-bold text-[var(--adm-ink)]">{wh.stock_quantity?.toLocaleString()}</span>{' '}
          <span className="text-[10px] text-[var(--adm-ink-3)]">{wh.unit}</span>
        </div>
      ),
    },
    {
      key: 'buffer',
      header: 'Projected Buffer',
      render: (wh) => {
        const ratePerDay = (wh.consumption_rate_per_hr || 1) * 24;
        const days = ratePerDay > 0 ? (wh.stock_quantity / ratePerDay).toFixed(1) : 'N/A';
        const isDepleted = Number(days) <= 2;
        const isLow = Number(days) <= 5;

        return (
          <div className="text-xs font-mono tabular-nums">
            <span
              className={`font-bold ${
                isDepleted ? 'text-[var(--adm-critical)]' : isLow ? 'text-[var(--adm-warning)]' : 'text-[var(--adm-healthy)]'
              }`}
            >
              {days} Days
            </span>
            <span className="text-[10px] text-[var(--adm-ink-3)] block">
              Burn: {wh.consumption_rate_per_hr}/hr
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Depot Status',
      render: (wh) => {
        const isBelowThreshold = wh.stock_quantity <= wh.reorder_threshold;
        if (isBelowThreshold) {
          return <StatusBadge tone="critical" label="CRITICAL BUFFER" />;
        }
        return <StatusBadge tone="healthy" label={wh.status || 'CONNECTED LIVE'} />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regional Warehouses & Essential Commodity Reserves"
        subtitle="Hospital supply depots, civil food grain silos, emergency fuel stocks, and cold-chain vaccine inventories."
        action={
          <div className="flex items-center gap-2">
            <DataProvenanceBadge kind="SIMULATED" />
            <button
              onClick={fetchWarehouses}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] text-xs font-semibold text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)]"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Refresh Warehouses</span>
            </button>
          </div>
        }
      />

      <SectionCard
        title="Connected Warehouse Depots"
        subtitle="Simulated inventory feeds across Assam, Meghalaya, Manipur, Mizoram, Nagaland, and Sikkim."
      >
        <div className="mb-4 max-w-sm">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search warehouse by name, code, district, or commodity…"
          />
        </div>

        {loading ? (
          <LoadingState label="Loading warehouse reserve feeds…" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchWarehouses} />
        ) : filteredWarehouses.length === 0 ? (
          <EmptyState title="NO WAREHOUSES FOUND" description="No connected warehouse telemetry matched your search." />
        ) : (
          <DataTable columns={columns} data={filteredWarehouses} keyExtractor={(wh) => wh.warehouse_code} />
        )}
      </SectionCard>
    </div>
  );
};
