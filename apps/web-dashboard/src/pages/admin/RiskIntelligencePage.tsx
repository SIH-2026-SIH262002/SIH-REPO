import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { DataTable, DataTableColumn } from '../../components/admin/primitives/DataTable';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, classifyError } from '../../components/admin/primitives/QueryStates';
import { useAsyncData } from '../../hooks/admin/useAsyncData';
import { useWebSocket } from '../../hooks/useWebSocket';
import { adminApi } from '../../api/adminApi';
import { SensorNode } from '../../types/admin';

export const RiskIntelligencePage: React.FC = () => {
  const { data: sensors, loading, error, refetch } = useAsyncData<SensorNode[]>(() => adminApi.getSensors(), []);
  const { isConnected, lastEvent } = useWebSocket((import.meta.env.VITE_WS_URL as string) || 'ws://localhost:8000/ws');
  const [liveSensors, setLiveSensors] = useState<SensorNode[] | null>(null);

  useEffect(() => {
    if (sensors) setLiveSensors(sensors);
  }, [sensors]);

  useEffect(() => {
    if (lastEvent?.kind === 'sensor_update' && lastEvent.data) {
      const updated = lastEvent.data as SensorNode;
      setLiveSensors((prev) =>
        prev
          ? prev.map((s) => (s.node_key.toUpperCase() === updated.node_key?.toUpperCase() ? { ...s, ...updated } : s))
          : prev
      );
    }
  }, [lastEvent]);

  const rows = liveSensors || sensors || [];

  const columns: DataTableColumn<SensorNode>[] = [
    { key: 'node', header: 'Monitored Node', sortable: true, sortValue: (s) => s.name, accessor: (s) => s.name },
    { key: 'district', header: 'District', sortable: true, sortValue: (s) => s.district, accessor: (s) => s.district },
    {
      key: 'risk',
      header: 'Risk Score',
      align: 'right',
      sortable: true,
      sortValue: (s) => s.risk_score,
      accessor: (s) => <span className="tabular-nums font-medium">{s.risk_score?.toFixed(1)}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      sortValue: (s) => s.risk_score,
      accessor: (s) => <StatusBadge status={s.category} />,
    },
    {
      key: 'storm',
      header: 'Storm Event',
      accessor: (s) => (s.storm_event ? <span className="text-[var(--adm-critical)] text-xs font-semibold">Active</span> : <span className="text-[var(--adm-ink-3)] text-xs">—</span>),
    },
    {
      key: 'override',
      header: 'Ground-Truth Override',
      accessor: (s) => (s.manual_flag != null ? <span className="text-[var(--adm-warning)] text-xs font-semibold">Manual override active</span> : <span className="text-[var(--adm-ink-3)] text-xs">—</span>),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Risk Intelligence"
        description="Live landslide risk scoring across all 18 monitored NER sensor nodes."
        action={
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: isConnected ? 'var(--adm-healthy)' : 'var(--adm-warning)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: isConnected ? 'var(--adm-healthy)' : 'var(--adm-warning)' }}
              />
              {isConnected ? 'Live stream connected' : 'Reconnecting…'}
            </span>
            <DataProvenanceBadge kind="SIMULATED" />
          </div>
        }
      />

      <SectionCard noPadding>
        {loading ? (
          <LoadingState label="Loading sensor network…" />
        ) : error ? (
          <ErrorState message={classifyError(error).message} onRetry={refetch} />
        ) : (
          <DataTable
            caption="Landslide risk by monitored node"
            columns={columns}
            rows={rows}
            rowKey={(s) => s.node_key}
            pageSize={18}
            emptyTitle="No sensor nodes reporting."
          />
        )}
      </SectionCard>

      <p className="mt-3 text-xs text-[var(--adm-ink-3)]">
        Risk scores are produced by a trained ML model (real, see Model Transparency) evaluated against a simulated
        sensor telemetry feed — the physical sensor readings themselves are not live hardware in this deployment.
      </p>
    </div>
  );
};
