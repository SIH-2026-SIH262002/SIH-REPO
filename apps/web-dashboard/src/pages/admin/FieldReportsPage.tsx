import React from 'react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { DataTable, DataTableColumn } from '../../components/admin/primitives/DataTable';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, classifyError } from '../../components/admin/primitives/QueryStates';
import { useAsyncData } from '../../hooks/admin/useAsyncData';
import { adminApi } from '../../api/adminApi';

interface FieldReport {
  id: string;
  reporter_name: string;
  phone: string;
  incident_type: string;
  description: string;
  nearest_node: string;
  nearest_node_name: string;
  photo_path: string | null;
  created_at: string;
}

export const FieldReportsPage: React.FC = () => {
  const { data: reports, loading, error, refetch } = useAsyncData<FieldReport[]>(() => adminApi.getReports(), []);

  const columns: DataTableColumn<FieldReport>[] = [
    { key: 'reporter', header: 'Reporter', sortable: true, sortValue: (r) => r.reporter_name, accessor: (r) => r.reporter_name },
    { key: 'incident', header: 'Incident Type', accessor: (r) => r.incident_type.replace(/_/g, ' ') },
    { key: 'node', header: 'Nearest Node', sortable: true, sortValue: (r) => r.nearest_node_name, accessor: (r) => r.nearest_node_name },
    { key: 'description', header: 'Description', accessor: (r) => <span className="text-xs">{r.description || '—'}</span> },
    {
      key: 'evidence',
      header: 'Evidence',
      accessor: (r) =>
        r.photo_path ? (
          <span className="text-xs font-semibold" style={{ color: 'var(--adm-healthy)' }}>
            Photo attached
          </span>
        ) : (
          <span className="text-xs text-[var(--adm-ink-3)]">None</span>
        ),
    },
    {
      key: 'created',
      header: 'Submitted',
      sortable: true,
      sortValue: (r) => r.created_at,
      accessor: (r) => <span className="text-xs text-[var(--adm-ink-3)]">{new Date(r.created_at).toLocaleString()}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Field Reports"
        description="Ground-truth incident reports submitted by Field Officers and Drivers. A confirmed report overrides the AI risk score for its nearest node to SEVERE (95.0)."
        action={<DataProvenanceBadge kind="LIVE" />}
      />
      <SectionCard noPadding>
        {loading ? (
          <LoadingState label="Loading field reports…" />
        ) : error ? (
          <ErrorState message={classifyError(error).message} onRetry={refetch} />
        ) : (
          <DataTable
            caption="Field incident reports"
            columns={columns}
            rows={reports || []}
            rowKey={(r) => r.id}
            emptyTitle="No field reports found."
            emptyDescription="No Field Officer or Driver has submitted a ground-truth incident report yet."
          />
        )}
      </SectionCard>
    </div>
  );
};
