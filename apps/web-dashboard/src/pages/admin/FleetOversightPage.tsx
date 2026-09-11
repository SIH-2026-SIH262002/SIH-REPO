import React from 'react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { DataTable, DataTableColumn } from '../../components/admin/primitives/DataTable';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, classifyError } from '../../components/admin/primitives/QueryStates';
import { useAsyncData } from '../../hooks/admin/useAsyncData';
import { adminApi } from '../../api/adminApi';

interface Vehicle {
  id: string;
  driver_name: string;
  phone: string;
  cargo_type: string;
  speed_kmph: number;
  origin_name: string;
  destination_name: string;
  status: 'MOVING' | 'SOS' | 'BREAKDOWN' | 'ARRIVED' | string;
  lat: number;
  lon: number;
}

export const FleetOversightPage: React.FC = () => {
  const { data: vehicles, loading, error, refetch } = useAsyncData<Vehicle[]>(() => adminApi.getVehicles(), []);

  const columns: DataTableColumn<Vehicle>[] = [
    { key: 'id', header: 'Vehicle', sortable: true, sortValue: (v) => v.id, accessor: (v) => <span className="font-mono text-xs font-semibold">{v.id}</span> },
    { key: 'driver', header: 'Driver', sortable: true, sortValue: (v) => v.driver_name, accessor: (v) => v.driver_name },
    { key: 'cargo', header: 'Cargo', accessor: (v) => v.cargo_type },
    { key: 'route', header: 'Route', accessor: (v) => `${v.origin_name} → ${v.destination_name}` },
    {
      key: 'speed',
      header: 'Speed',
      align: 'right',
      sortable: true,
      sortValue: (v) => v.speed_kmph,
      accessor: (v) => <span className="tabular-nums">{v.speed_kmph} km/h</span>,
    },
    { key: 'status', header: 'Status', sortable: true, sortValue: (v) => v.status, accessor: (v) => <StatusBadge status={v.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Fleet & Deliveries"
        description="System-wide fleet position and status oversight — not a dispatcher console (that is the Logistics Operator's workspace)."
        action={<DataProvenanceBadge kind="SIMULATED" />}
      />
      <SectionCard noPadding>
        {loading ? (
          <LoadingState label="Loading fleet…" />
        ) : error ? (
          <ErrorState message={classifyError(error).message} onRetry={refetch} />
        ) : (
          <DataTable
            caption="Fleet vehicles"
            columns={columns}
            rows={vehicles || []}
            rowKey={(v) => v.id}
            emptyTitle="No vehicles registered."
          />
        )}
      </SectionCard>
    </div>
  );
};
