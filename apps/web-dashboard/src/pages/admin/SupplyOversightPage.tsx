import React from 'react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { DataTable, DataTableColumn } from '../../components/admin/primitives/DataTable';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, classifyError } from '../../components/admin/primitives/QueryStates';
import { useAsyncData } from '../../hooks/admin/useAsyncData';
import { adminApi } from '../../api/adminApi';

interface Warehouse {
  warehouse_code: string;
  warehouse_name: string;
  district: string;
  state: string;
  commodity_type: string;
  stock_quantity: number;
  unit: string;
  reorder_threshold: number;
  consumption_rate_per_hr: number;
  status: string;
}

interface SupplyGap {
  district: string;
  incoming_shipments_count: number;
  commodities: string[];
  delayed_shipments: number;
  max_corridor_risk: number;
  status: 'HIGH_RISK_DELAY' | 'MODERATE_DELAY' | 'STABLE';
  operational_recommendation: string;
  warehouse_name: string | null;
  stock_quantity: number | null;
  unit: string | null;
}

export const SupplyOversightPage: React.FC = () => {
  const { data: warehouses, loading: whLoading, error: whError, refetch: refetchWh } = useAsyncData<Record<string, Warehouse> | Warehouse[]>(
    () => adminApi.getWarehouses(),
    []
  );
  const { data: gaps, loading: gapsLoading, error: gapsError, refetch: refetchGaps } = useAsyncData<SupplyGap[]>(
    () => adminApi.getSupplyGapIntelligence(),
    []
  );

  const warehouseRows: Warehouse[] = Array.isArray(warehouses) ? warehouses : Object.values(warehouses || {});

  const warehouseColumns: DataTableColumn<Warehouse>[] = [
    { key: 'name', header: 'Depot', sortable: true, sortValue: (w) => w.warehouse_name, accessor: (w) => w.warehouse_name },
    { key: 'district', header: 'District', sortable: true, sortValue: (w) => w.district, accessor: (w) => w.district },
    { key: 'commodity', header: 'Commodity', accessor: (w) => w.commodity_type.replace(/_/g, ' ') },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      sortable: true,
      sortValue: (w) => w.stock_quantity,
      accessor: (w) => (
        <span
          className="tabular-nums font-medium"
          style={{ color: w.stock_quantity <= w.reorder_threshold ? 'var(--adm-warning)' : 'var(--adm-ink)' }}
        >
          {w.stock_quantity} {w.unit}
        </span>
      ),
    },
    {
      key: 'burn',
      header: 'Consumption',
      align: 'right',
      accessor: (w) => <span className="tabular-nums text-xs text-[var(--adm-ink-3)]">{w.consumption_rate_per_hr}/hr</span>,
    },
  ];

  const gapColumns: DataTableColumn<SupplyGap>[] = [
    { key: 'district', header: 'District', sortable: true, sortValue: (g) => g.district, accessor: (g) => g.district },
    { key: 'shipments', header: 'Incoming Shipments', align: 'right', accessor: (g) => g.incoming_shipments_count },
    { key: 'delayed', header: 'Delayed', align: 'right', accessor: (g) => g.delayed_shipments },
    {
      key: 'risk',
      header: 'Max Corridor Risk',
      align: 'right',
      sortable: true,
      sortValue: (g) => g.max_corridor_risk,
      accessor: (g) => <span className="tabular-nums">{g.max_corridor_risk}</span>,
    },
    { key: 'status', header: 'Status', accessor: (g) => <StatusBadge status={g.status === 'HIGH_RISK_DELAY' ? 'SEVERE' : g.status === 'MODERATE_DELAY' ? 'MODERATE' : 'ACTIVE'} /> },
    { key: 'recommendation', header: 'Recommendation', accessor: (g) => <span className="text-xs">{g.operational_recommendation}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Warehouses & Supply"
        description="District depot inventory and corridor-linked supply gap intelligence."
        action={<DataProvenanceBadge kind="SIMULATED" />}
      />

      <div className="space-y-4">
        <SectionCard noPadding title="Supply Gap Intelligence">
          {gapsLoading ? (
            <LoadingState label="Loading supply gap intelligence…" />
          ) : gapsError ? (
            <ErrorState message={classifyError(gapsError).message} onRetry={refetchGaps} />
          ) : (
            <DataTable caption="Supply gap intelligence" columns={gapColumns} rows={gaps || []} rowKey={(g) => g.district} pageSize={18} />
          )}
        </SectionCard>

        <SectionCard noPadding title="Warehouse Inventory">
          {whLoading ? (
            <LoadingState label="Loading warehouse feeds…" />
          ) : whError ? (
            <ErrorState message={classifyError(whError).message} onRetry={refetchWh} />
          ) : (
            <DataTable caption="Warehouse inventory" columns={warehouseColumns} rows={warehouseRows} rowKey={(w) => w.warehouse_code} />
          )}
        </SectionCard>
      </div>
    </div>
  );
};
