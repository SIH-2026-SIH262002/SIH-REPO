import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { SearchInput } from '../../components/admin/primitives/SearchInput';
import { DataTable, DataTableColumn } from '../../components/admin/primitives/DataTable';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { RoleBadge } from '../../components/admin/primitives/RoleBadge';
import { LoadingState, ErrorState, PermissionDeniedState, classifyError } from '../../components/admin/primitives/QueryStates';
import { inputBaseClass } from '../../components/admin/primitives/FormField';
import { useAsyncData } from '../../hooks/admin/useAsyncData';
import { adminApi } from '../../api/adminApi';
import { AdminUserRecord } from '../../types/admin';
import { UserRole } from '../../types/auth';

const ROLE_OPTIONS: (UserRole | 'ALL')[] = ['ALL', 'ADMIN', 'EMERGENCY_OPERATOR', 'LOGISTICS_OPERATOR', 'FIELD_OFFICER', 'DRIVER'];
const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED'] as const;

export const UserDirectoryPage: React.FC = () => {
  const { data: users, loading, error, refetch } = useAsyncData(() => adminApi.listUsers(), []);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<(UserRole | 'ALL')>('ALL');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('ALL');

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.metadata.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (u.metadata.fullName || '').toLowerCase().includes(q) ||
        u.identifier.toLowerCase().includes(q) ||
        (u.metadata.district || '').toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  const columns: DataTableColumn<AdminUserRecord>[] = [
    {
      key: 'name',
      header: 'Personnel',
      sortable: true,
      sortValue: (u) => (u.metadata.fullName || u.identifier).toLowerCase(),
      accessor: (u) => (
        <div>
          <div className="font-medium text-[var(--adm-ink)]">{u.metadata.fullName || '—'}</div>
          <div className="text-xs text-[var(--adm-ink-3)]">{u.identifier}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      sortValue: (u) => u.metadata.role,
      accessor: (u) => <RoleBadge role={u.metadata.role} />,
    },
    {
      key: 'district',
      header: 'District / Scope',
      sortable: true,
      sortValue: (u) => u.metadata.district || '',
      accessor: (u) => u.metadata.district || <span className="text-[var(--adm-ink-3)]">Global</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (u) => u.status,
      accessor: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: 'created',
      header: 'Provisioned',
      sortable: true,
      sortValue: (u) => u.created_at,
      accessor: (u) => (
        <span className="text-xs text-[var(--adm-ink-3)]">
          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      accessor: (u) => (
        <Link
          to={`/admin/users/${u.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--adm-primary)] hover:underline"
        >
          View record <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      ),
    },
  ];

  const provisionAction = (
    <Link
      to="/admin/users/provision"
      className="inline-flex items-center gap-1.5 rounded-[var(--adm-radius)] px-3.5 py-2 text-sm font-semibold text-white"
      style={{ background: 'var(--adm-primary)' }}
    >
      <UserPlus className="w-4 h-4" />
      Provision User
    </Link>
  );

  let body: React.ReactNode;
  if (loading) {
    body = <LoadingState label="Loading user directory…" />;
  } else if (error) {
    const { kind, message } = classifyError(error);
    body = kind === 'permission' ? <PermissionDeniedState message={message} /> : <ErrorState message={message} onRetry={refetch} />;
  } else {
    body = (
      <DataTable
        caption="Registered user accounts"
        columns={columns}
        rows={filtered}
        rowKey={(u) => u.id}
        emptyTitle={search || roleFilter !== 'ALL' || statusFilter !== 'ALL' ? 'No users match your filters.' : 'No users provisioned yet.'}
        emptyDescription={
          search || roleFilter !== 'ALL' || statusFilter !== 'ALL'
            ? 'Try clearing the search or filters.'
            : 'Provision the first operational account to get started.'
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="User Directory"
        description="All personnel provisioned to operate NER LogiSense, with role, district/scope, and account status."
        action={provisionAction}
      />

      <SectionCard noPadding>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-[var(--adm-border)]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, district…" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
            aria-label="Filter by role"
            className={`${inputBaseClass} sm:w-52`}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r === 'ALL' ? 'All roles' : r}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
            aria-label="Filter by status"
            className={`${inputBaseClass} sm:w-40`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All statuses' : s}
              </option>
            ))}
          </select>
          {!loading && !error && (
            <span className="sm:ml-auto text-xs text-[var(--adm-ink-3)] font-mono">
              {filtered.length} of {users?.length ?? 0} users
            </span>
          )}
        </div>
        {body}
      </SectionCard>
    </div>
  );
};
