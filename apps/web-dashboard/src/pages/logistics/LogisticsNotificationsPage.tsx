import React, { useState, useEffect } from 'react';
import { Bell, RotateCw, Send, MessageSquare, Phone, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { DataTable, Column } from '../../components/admin/primitives/DataTable';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, EmptyState } from '../../components/admin/primitives/QueryStates';
import { apiService } from '../../services/apiService';

export const LogisticsNotificationsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outbox, setOutbox] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);

  const fetchNotificationLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [outboxData, subsData] = await Promise.allSettled([
        apiService.getOutbox(),
        apiService.getSubscribers(),
      ]);

      if (outboxData.status === 'fulfilled') setOutbox(outboxData.value || []);
      if (subsData.status === 'fulfilled') setSubscribers(subsData.value || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve notification logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationLogs();
  }, []);

  const outboxColumns: Column<any>[] = [
    {
      key: 'created_at',
      header: 'Dispatched At',
      render: (m) => (
        <span className="font-mono text-xs text-[var(--adm-ink-2)] tabular-nums">
          {m.created_at ? new Date(m.created_at).toLocaleTimeString('en-IN') : 'Unknown'}
        </span>
      ),
    },
    {
      key: 'to',
      header: 'Recipient',
      render: (m) => (
        <div className="text-[10px] text-[var(--adm-ink-3)] font-mono">{m.to || 'Unknown'}</div>
      ),
    },
    {
      key: 'channel',
      header: 'Dispatch Channel',
      render: (m) => (
        <span className="text-xs font-mono font-medium text-[var(--adm-ink-2)] uppercase">
          {m.channel || 'Unknown'}
        </span>
      ),
    },
    {
      key: 'body',
      header: 'Alert Content',
      render: (m) => (
        <span className="text-xs text-[var(--adm-ink)] truncate max-w-md block">
          {m.body || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Delivery State',
      render: (m) => {
        const s = m.status;
        if (s === 'SENT') return <StatusBadge tone="healthy" label="SENT (TWILIO)" />;
        if (s === 'SIMULATED') return <StatusBadge tone="neutral" label="SIMULATED" />;
        if (s === 'QUEUED_OFFLINE') return <StatusBadge tone="warning" label="QUEUED OFFLINE" />;
        return <StatusBadge tone="neutral" label={s || 'UNKNOWN'} />;
      },
    },
  ];

  const subscriberColumns: Column<any>[] = [
    {
      key: 'name',
      header: 'Stakeholder Name',
      render: (s) => <span className="font-medium text-xs text-[var(--adm-ink)]">{s.name}</span>,
    },
    {
      key: 'phone',
      header: 'Mobile Number',
      render: (s) => <span className="font-mono text-xs text-[var(--adm-ink-2)]">{s.phone}</span>,
    },
    {
      key: 'district',
      header: 'Covered District',
      render: (s) => <span className="text-xs font-medium text-[var(--adm-ink)]">{s.district}</span>,
    },
    {
      key: 'role',
      header: 'Operating Role',
      render: (s) => <span className="font-mono text-[11px] uppercase text-[var(--adm-primary)] font-bold">{s.role}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver & Authority Notification Dispatch Log"
        subtitle="Automated SMS and WhatsApp corridor hazard advisories relayed to convoys and regional authorities."
        action={
          <div className="flex items-center gap-2">
            <DataProvenanceBadge kind="LIVE" />
            <button
              onClick={fetchNotificationLogs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] text-xs font-semibold text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)]"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Refresh Outbox</span>
            </button>
          </div>
        }
      />

      {/* Outbox Table */}
      <SectionCard
        title="Dispatched Advisory Outbox"
        subtitle="Twilio SMS and WhatsApp notifications triggered by high-risk corridor conditions."
      >
        {loading ? (
          <LoadingState label="Loading notification outbox…" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchNotificationLogs} />
        ) : outbox.length === 0 ? (
          <EmptyState
            title="OUTBOX EMPTY"
            description="No advisory messages have been dispatched during the current operational session."
          />
        ) : (
          <DataTable columns={outboxColumns} data={outbox} keyExtractor={(m, idx) => m.id || idx} />
        )}
      </SectionCard>

      {/* Registered Subscribers */}
      <SectionCard
        title="Registered Transport & Authority Stakeholders"
        subtitle="Opt-in phonebook receiving emergency corridor hazard broadcasts."
      >
        {subscribers.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--adm-ink-3)] italic">
            No subscriber phonebook records found.
          </div>
        ) : (
          <DataTable columns={subscriberColumns} data={subscribers} keyExtractor={(s, idx) => s.phone || idx} />
        )}
      </SectionCard>
    </div>
  );
};
