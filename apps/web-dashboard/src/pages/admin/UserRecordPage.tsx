import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building2 } from 'lucide-react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { RoleBadge } from '../../components/admin/primitives/RoleBadge';
import { LoadingState, ErrorState, EmptyState, classifyError } from '../../components/admin/primitives/QueryStates';
import { AccountLifecyclePanel } from '../../components/admin/users/AccountLifecyclePanel';
import { useAsyncData } from '../../hooks/admin/useAsyncData';
import { useAuth } from '../../hooks/useAuth';
import { adminApi } from '../../api/adminApi';
import { AdminUserRecord, ROLE_INFO } from '../../types/admin';

export const UserRecordPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { data: users, loading, error, refetch } = useAsyncData(() => adminApi.listUsers(), []);
  const [record, setRecord] = useState<AdminUserRecord | null>(null);

  const target = record || users?.find((u) => u.id === userId) || null;

  const backLink = (
    <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--adm-primary)] hover:underline">
      <ArrowLeft className="w-4 h-4" /> Back to directory
    </Link>
  );

  if (loading) {
    return (
      <div>
        <PageHeader title="User Record" action={backLink} />
        <LoadingState label="Loading user record…" />
      </div>
    );
  }

  if (error) {
    const { message } = classifyError(error);
    return (
      <div>
        <PageHeader title="User Record" action={backLink} />
        <ErrorState message={message} onRetry={refetch} />
      </div>
    );
  }

  if (!target) {
    return (
      <div>
        <PageHeader title="User Record" action={backLink} />
        <EmptyState title="User not found." description="This account may have been removed, or the link is incorrect." />
      </div>
    );
  }

  const isSelf = String(currentUser?.id) === target.id;
  const roleInfo = ROLE_INFO[target.metadata.role];

  return (
    <div>
      <PageHeader title={target.metadata.fullName || target.identifier} action={backLink} eyebrow="User Record" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <SectionCard>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <RoleBadge role={target.metadata.role} />
              <StatusBadge status={target.status} />
              {isSelf && (
                <span className="text-xs font-semibold text-[var(--adm-ink-3)] uppercase tracking-wide">
                  (You)
                </span>
              )}
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-[var(--adm-ink-3)]" />
                <div>
                  <dt className="text-xs text-[var(--adm-ink-3)]">Email</dt>
                  <dd className="text-[var(--adm-ink)]">{target.metadata.email || target.identifier}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 text-[var(--adm-ink-3)]" />
                <div>
                  <dt className="text-xs text-[var(--adm-ink-3)]">Phone</dt>
                  <dd className="text-[var(--adm-ink)]">{target.metadata.phone || '—'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 mt-0.5 text-[var(--adm-ink-3)]" />
                <div>
                  <dt className="text-xs text-[var(--adm-ink-3)]">Organization</dt>
                  <dd className="text-[var(--adm-ink)]">{target.metadata.organization || '—'}</dd>
                </div>
              </div>
              <div>
                <dt className="text-xs text-[var(--adm-ink-3)]">Provisioned</dt>
                <dd className="text-[var(--adm-ink)]">
                  {target.created_at ? new Date(target.created_at).toLocaleString() : '—'}
                </dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard title="Access Summary" description={`What ${roleInfo?.label || target.metadata.role} can do`}>
            <div className="text-sm text-[var(--adm-ink-2)] space-y-2">
              <p>{roleInfo?.responsibility}</p>
              <p>
                <span className="font-semibold text-[var(--adm-ink)]">Scope: </span>
                {roleInfo?.scope}
              </p>
              <ul className="mt-1 ml-4 list-disc">
                {roleInfo?.keyAccess.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </div>
          </SectionCard>
        </div>

        <div>
          <AccountLifecyclePanel user={target} isSelf={isSelf} onChanged={(updated) => setRecord(updated)} />
        </div>
      </div>
    </div>
  );
};
