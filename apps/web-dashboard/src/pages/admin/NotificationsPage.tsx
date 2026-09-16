import React from 'react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { DataTable, DataTableColumn } from '../../components/admin/primitives/DataTable';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, classifyError } from '../../components/admin/primitives/QueryStates';
import { useAsyncData } from '../../hooks/admin/useAsyncData';
import { adminApi } from '../../api/adminApi';

interface OutboxMessage {
  id: string;
  to: string;
  channel: string;
  body: string;
  status: string;
  error: string | null;
  created_at: string;
  attempts: number;
}

interface Subscriber {
  name: string;
  phone: string;
  district: string;
  role: string;
  channels: string[];
}

const statusColor = (status: string): string => {
  if (status === 'SENT') return 'var(--adm-healthy)';
  if (status === 'SIMULATED') return 'var(--adm-warning)';
  return 'var(--adm-neutral)';
};

export const NotificationsPage: React.FC = () => {
  const { data: outbox, loading: outboxLoading, error: outboxError, refetch: refetchOutbox } = useAsyncData<OutboxMessage[]>(
    () => adminApi.getOutbox(),
    []
  );
  const { data: subscribers, loading: subLoading, error: subError } = useAsyncData<Subscriber[]>(
    () => adminApi.getSubscribers(),
    []
  );

  const outboxColumns: DataTableColumn<OutboxMessage>[] = [
    { key: 'to', header: 'Recipient', accessor: (m) => m.to },
    { key: 'channel', header: 'Channel', accessor: (m) => <span className="uppercase text-xs">{m.channel}</span> },
    { key: 'body', header: 'Message', accessor: (m) => <span className="text-xs">{m.body}</span> },
    {
      key: 'status',
      header: 'Status',
      accessor: (m) => (
        <span className="text-xs font-semibold uppercase" style={{ color: statusColor(m.status) }}>
          {m.status}
        </span>
      ),
    },
    {
      key: 'time',
      header: 'Time',
      sortable: true,
      sortValue: (m) => m.created_at,
      accessor: (m) => <span className="text-xs text-[var(--adm-ink-3)]">{new Date(m.created_at).toLocaleString()}</span>,
    },
  ];

  const subscriberColumns: DataTableColumn<Subscriber>[] = [
    { key: 'name', header: 'Name', sortable: true, sortValue: (s) => s.name, accessor: (s) => s.name },
    { key: 'phone', header: 'Phone', accessor: (s) => s.phone },
    { key: 'district', header: 'District', accessor: (s) => s.district },
    { key: 'role', header: 'Role', accessor: (s) => s.role },
    { key: 'channels', header: 'Channels', accessor: (s) => (s.channels || []).join(', ') },
  ];

  return (
    <div>
      <PageHeader
        title="Notifications & Outbox"
        description="Multi-channel alert dispatch log. Messages show SIMULATED unless Twilio credentials are configured — this reflects the real dispatch outcome, not a placeholder."
        action={<DataProvenanceBadge kind="SIMULATED" />}
      />

      <div className="space-y-4">
        <SectionCard noPadding title="Outbox">
          {outboxLoading && <LoadingState label="Loading outbox…" />}
          {!outboxLoading && outboxError && <ErrorState message={classifyError(outboxError).message} onRetry={refetchOutbox} />}
          {!outboxLoading && !outboxError && (
            <DataTable
              caption="Notification outbox"
              columns={outboxColumns}
              rows={outbox || []}
              rowKey={(m) => m.id}
              emptyTitle="No notifications dispatched yet."
            />
          )}
        </SectionCard>

        <SectionCard noPadding title="Subscribers">
          {subLoading && <LoadingState label="Loading subscribers…" />}
          {!subLoading && subError && <ErrorState message={classifyError(subError).message} />}
          {!subLoading && !subError && (
            <DataTable
              caption="Alert subscribers"
              columns={subscriberColumns}
              rows={subscribers || []}
              rowKey={(s) => s.phone}
              emptyTitle="No subscribers registered."
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
};
