import React, { useState } from 'react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { DataTable, DataTableColumn } from '../../components/admin/primitives/DataTable';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { ConfirmDialog } from '../../components/admin/primitives/ConfirmDialog';
import { LoadingState, ErrorState, PermissionDeniedState, classifyError } from '../../components/admin/primitives/QueryStates';
import { useAsyncData } from '../../hooks/admin/useAsyncData';
import { adminApi } from '../../api/adminApi';

interface SosEvent {
  id: string;
  vehicle_id: string | null;
  driver_name: string;
  phone: string;
  lat: number;
  lon: number;
  issue_type: string;
  message: string;
  status: 'OPEN' | 'RESOLVED';
  created_at: string;
}

export const EmergencyOversightPage: React.FC = () => {
  const { data: sosEvents, loading, error, refetch } = useAsyncData<SosEvent[]>(() => adminApi.getSOS(), []);
  const [resolving, setResolving] = useState<SosEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleResolve = async () => {
    if (!resolving) return;
    setBusy(true);
    setActionError(null);
    try {
      await adminApi.resolveSOS(resolving.id);
      setResolving(null);
      refetch();
    } catch (err) {
      setActionError(classifyError(err).message);
      setResolving(null);
    } finally {
      setBusy(false);
    }
  };

  const columns: DataTableColumn<SosEvent>[] = [
    { key: 'id', header: 'Event', accessor: (e) => <span className="font-mono text-xs">{e.id}</span> },
    { key: 'driver', header: 'Driver', sortable: true, sortValue: (e) => e.driver_name, accessor: (e) => e.driver_name },
    { key: 'issue', header: 'Issue Type', accessor: (e) => e.issue_type.replace(/_/g, ' ') },
    { key: 'message', header: 'Message', accessor: (e) => <span className="text-xs">{e.message || '—'}</span> },
    { key: 'status', header: 'Status', sortable: true, sortValue: (e) => e.status, accessor: (e) => <StatusBadge status={e.status} /> },
    {
      key: 'created',
      header: 'Triggered',
      sortable: true,
      sortValue: (e) => e.created_at,
      accessor: (e) => <span className="text-xs text-[var(--adm-ink-3)]">{new Date(e.created_at).toLocaleString()}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      accessor: (e) =>
        e.status === 'OPEN' ? (
          <button
            onClick={() => setResolving(e)}
            className="rounded-[var(--adm-radius)] px-3 py-1 text-xs font-semibold text-white"
            style={{ background: 'var(--adm-primary)' }}
          >
            Resolve
          </button>
        ) : null,
    },
  ];

  let body: React.ReactNode;
  if (loading) body = <LoadingState label="Loading SOS events…" />;
  else if (error) {
    const { kind, message } = classifyError(error);
    body = kind === 'permission' ? <PermissionDeniedState message={message} /> : <ErrorState message={message} onRetry={refetch} />;
  } else {
    body = (
      <DataTable
        caption="Emergency SOS events"
        columns={columns}
        rows={sosEvents || []}
        rowKey={(e) => e.id}
        emptyTitle="No SOS events."
        emptyDescription="No driver has triggered an emergency panic signal."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Emergencies & SOS"
        description="System-wide view of driver emergency panic signals. Admin sees all districts; Emergency Operators see only their assigned district."
        action={<DataProvenanceBadge kind="SIMULATED" />}
      />

      {actionError && (
        <p role="alert" className="mb-3 text-sm font-medium" style={{ color: 'var(--adm-critical)' }}>
          {actionError}
        </p>
      )}

      <SectionCard noPadding>{body}</SectionCard>

      <ConfirmDialog
        open={resolving !== null}
        title="Resolve SOS event"
        fields={resolving ? [
          { label: 'Driver', value: resolving.driver_name },
          { label: 'Issue', value: resolving.issue_type.replace(/_/g, ' ') },
        ] : []}
        consequence="Only resolve once the driver is confirmed safe and, if dispatched, a rescue/response team has verified extraction."
        confirmLabel="Mark Resolved"
        busy={busy}
        onConfirm={handleResolve}
        onCancel={() => setResolving(null)}
      />
    </div>
  );
};
