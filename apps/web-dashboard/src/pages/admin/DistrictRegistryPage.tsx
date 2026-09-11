import React, { useMemo } from 'react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { DataTable, DataTableColumn } from '../../components/admin/primitives/DataTable';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, classifyError } from '../../components/admin/primitives/QueryStates';
import { NERMap, MapSensorNode } from '../../components/map/NERMap';
import { useAsyncData } from '../../hooks/admin/useAsyncData';
import { adminApi } from '../../api/adminApi';
import { SensorNode } from '../../types/admin';

interface GraphEdge {
  from: string;
  to: string;
  distance_km: number;
  base_time_hr: number;
  highway_ref: string;
  risk_score: number;
  category: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  flagged: boolean;
  blocked: boolean;
}

interface GraphSnapshot {
  nodes: (SensorNode & { name: string })[];
  edges: GraphEdge[];
}

export const DistrictRegistryPage: React.FC = () => {
  const { data: sensors, loading: sensorsLoading, error: sensorsError, refetch: refetchSensors } = useAsyncData<SensorNode[]>(
    () => adminApi.getSensors(),
    []
  );
  const { data: graph, loading: graphLoading, error: graphError } = useAsyncData<GraphSnapshot>(
    () => adminApi.getRouteGraph(),
    []
  );
  const { data: users } = useAsyncData(() => adminApi.listUsers(), []);

  const staffingByDistrict = useMemo(() => {
    const counts: Record<string, number> = {};
    (users || []).forEach((u) => {
      const d = u.metadata.district;
      if (d) counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
  }, [users]);

  const nodeNameByKey = useMemo(() => {
    const map: Record<string, string> = {};
    (sensors || []).forEach((s) => {
      map[s.node_key] = s.name;
    });
    return map;
  }, [sensors]);

  const districtColumns: DataTableColumn<SensorNode>[] = [
    { key: 'district', header: 'District', sortable: true, sortValue: (s) => s.district, accessor: (s) => s.district },
    { key: 'state', header: 'State', sortable: true, sortValue: (s) => s.state, accessor: (s) => s.state },
    { key: 'node', header: 'Monitored Node', sortable: true, sortValue: (s) => s.name, accessor: (s) => s.name },
    {
      key: 'risk',
      header: 'Risk Category',
      sortable: true,
      sortValue: (s) => s.risk_score,
      accessor: (s) => <StatusBadge status={s.category} />,
    },
    {
      key: 'staffing',
      header: 'Assigned Personnel',
      align: 'right',
      sortable: true,
      sortValue: (s) => staffingByDistrict[s.district] || 0,
      accessor: (s) =>
        staffingByDistrict[s.district] ? (
          <span className="font-medium">{staffingByDistrict[s.district]}</span>
        ) : (
          <span className="text-[var(--adm-warning)] font-medium">0 — unstaffed</span>
        ),
    },
  ];

  const corridorColumns: DataTableColumn<GraphEdge>[] = [
    { key: 'highway', header: 'Highway', sortable: true, sortValue: (e) => e.highway_ref, accessor: (e) => e.highway_ref },
    {
      key: 'segment',
      header: 'Corridor Segment',
      accessor: (e) => `${nodeNameByKey[e.from] || e.from} ↔ ${nodeNameByKey[e.to] || e.to}`,
    },
    { key: 'distance', header: 'Distance', align: 'right', sortable: true, sortValue: (e) => e.distance_km, accessor: (e) => `${e.distance_km} km` },
    {
      key: 'risk',
      header: 'Risk Category',
      sortable: true,
      sortValue: (e) => e.risk_score,
      accessor: (e) => <StatusBadge status={e.category} />,
    },
    {
      key: 'corridor_status',
      header: 'Corridor Status',
      accessor: (e) => (e.blocked ? <StatusBadge status="BLOCKED" /> : e.flagged ? <StatusBadge status="FLAGGED" /> : <span className="text-[var(--adm-ink-3)] text-xs">Clear</span>),
    },
  ];

  const mapSensors: MapSensorNode[] = (sensors || []).map((s) => ({
    node_key: s.node_key,
    name: s.name,
    district: s.district,
    lat: s.lat,
    lon: s.lon,
    risk_score: s.risk_score,
    category: s.category,
  }));

  return (
    <div>
      <PageHeader
        title="Districts & Corridors"
        description="The 18 monitored districts and 20 highway corridors that make up the NER road network topology."
        action={<DataProvenanceBadge kind="SIMULATED" />}
      />

      <SectionCard className="mb-4" noPadding title="Regional Map">
        <div className="h-[420px]">
          {sensorsLoading ? (
            <LoadingState label="Loading map…" />
          ) : sensorsError ? (
            <ErrorState message={classifyError(sensorsError).message} onRetry={refetchSensors} />
          ) : (
            <NERMap sensors={mapSensors} />
          )}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SectionCard noPadding title="District Registry">
          {sensorsLoading ? (
            <LoadingState />
          ) : sensorsError ? (
            <ErrorState message={classifyError(sensorsError).message} onRetry={refetchSensors} />
          ) : (
            <DataTable caption="District registry" columns={districtColumns} rows={sensors || []} rowKey={(s) => s.node_key} pageSize={18} />
          )}
        </SectionCard>

        <SectionCard noPadding title="Highway Corridors">
          {graphLoading ? (
            <LoadingState />
          ) : graphError ? (
            <ErrorState message={classifyError(graphError).message} />
          ) : (
            <DataTable caption="Highway corridors" columns={corridorColumns} rows={graph?.edges || []} rowKey={(e) => `${e.from}-${e.to}`} pageSize={20} />
          )}
        </SectionCard>
      </div>
    </div>
  );
};
