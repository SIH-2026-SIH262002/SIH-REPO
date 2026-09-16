import React, { useState } from 'react';
import { UserCheck, UserX, Lock, Save } from 'lucide-react';
import { SectionCard } from '../primitives/SectionCard';
import { ConfirmDialog } from '../primitives/ConfirmDialog';
import { RoleSelectorWithBriefing } from './RoleSelectorWithBriefing';
import { DistrictScopeSelector } from './DistrictScopeSelector';
import { classifyError } from '../primitives/QueryStates';
import { adminApi } from '../../../api/adminApi';
import { AdminUserRecord, AccountStatus, ROLE_INFO } from '../../../types/admin';
import { UserRole } from '../../../types/auth';

interface AccountLifecyclePanelProps {
  user: AdminUserRecord;
  isSelf: boolean;
  onChanged: (updated: AdminUserRecord) => void;
}

type PendingAction =
  | { kind: 'status'; value: AccountStatus }
  | { kind: 'role'; value: UserRole }
  | { kind: 'district'; value: string }
  | null;

/**
 * Account lifecycle actions: suspend/reactivate/deactivate, role change,
 * district change. Every action is server-enforced (role/district validated,
 * self-protection and last-Administrator protection applied on the backend,
 * not just here) -- this panel's job is to make the consequence explicit
 * before the request is sent, never to be the only guard.
 */
export const AccountLifecyclePanel: React.FC<AccountLifecyclePanelProps> = ({ user, isSelf, onChanged }) => {
  const [roleDraft, setRoleDraft] = useState<UserRole | ''>(user.metadata.role);
  const [districtDraft, setDistrictDraft] = useState<string>(user.metadata.district || '');
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const displayName = user.metadata.fullName || user.identifier;

  const runAction = async () => {
    if (!pending) return;
    setBusy(true);
    setActionError(null);
    try {
      let result;
      if (pending.kind === 'status') result = await adminApi.updateUserStatus(user.id, pending.value);
      else if (pending.kind === 'role') result = await adminApi.updateUserRole(user.id, pending.value);
      else result = await adminApi.updateUserDistrict(user.id, pending.value);
      onChanged(result.user);
      setPending(null);
    } catch (err) {
      const { message } = classifyError(err);
      setActionError(message);
      setPending(null);
    } finally {
      setBusy(false);
    }
  };

  if (isSelf) {
    return (
      <SectionCard title="Account Lifecycle">
        <p className="text-sm text-[var(--adm-ink-2)]">
          You cannot suspend, deactivate, or change the role of your own account. Ask another Administrator to make
          this change.
        </p>
      </SectionCard>
    );
  }

  return (
    <>
      <SectionCard title="Account Lifecycle" description="Status, role, and district changes take effect immediately.">
        {actionError && (
          <p role="alert" className="mb-4 text-sm font-medium" style={{ color: 'var(--adm-critical)' }}>
            {actionError}
          </p>
        )}

        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--adm-ink-3)] mb-2">
              Account status
            </h3>
            <div className="flex flex-wrap gap-2">
              {user.status !== 'ACTIVE' && (
                <button
                  onClick={() => setPending({ kind: 'status', value: 'ACTIVE' })}
                  className="inline-flex items-center gap-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--adm-raised)]"
                  style={{ color: 'var(--adm-healthy)' }}
                >
                  <UserCheck className="w-3.5 h-3.5" /> Reactivate
                </button>
              )}
              {user.status === 'ACTIVE' && (
                <button
                  onClick={() => setPending({ kind: 'status', value: 'SUSPENDED' })}
                  className="inline-flex items-center gap-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--adm-raised)]"
                  style={{ color: 'var(--adm-warning)' }}
                >
                  <UserX className="w-3.5 h-3.5" /> Suspend
                </button>
              )}
              {user.status !== 'DEACTIVATED' && (
                <button
                  onClick={() => setPending({ kind: 'status', value: 'DEACTIVATED' })}
                  className="inline-flex items-center gap-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] px-3 py-1.5 text-xs font-semibold text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)]"
                >
                  <Lock className="w-3.5 h-3.5" /> Deactivate
                </button>
              )}
            </div>
          </div>

          <div className="pt-5 border-t border-[var(--adm-border)]">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--adm-ink-3)] mb-2">
              Reassign role
            </h3>
            <RoleSelectorWithBriefing value={roleDraft} onChange={setRoleDraft} />
            <button
              onClick={() => roleDraft && setPending({ kind: 'role', value: roleDraft })}
              disabled={!roleDraft || roleDraft === user.metadata.role}
              className="mt-2 inline-flex items-center gap-1.5 rounded-[var(--adm-radius)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
              style={{ background: 'var(--adm-primary)' }}
            >
              <Save className="w-3.5 h-3.5" /> Update Role
            </button>
          </div>

          <div className="pt-5 border-t border-[var(--adm-border)]">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--adm-ink-3)] mb-2">
              Reassign district / scope
            </h3>
            <DistrictScopeSelector value={districtDraft} onChange={setDistrictDraft} />
            <button
              onClick={() => districtDraft && setPending({ kind: 'district', value: districtDraft })}
              disabled={!districtDraft || districtDraft === user.metadata.district}
              className="mt-2 inline-flex items-center gap-1.5 rounded-[var(--adm-radius)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
              style={{ background: 'var(--adm-primary)' }}
            >
              <Save className="w-3.5 h-3.5" /> Update District
            </button>
          </div>
        </div>
      </SectionCard>

      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.kind === 'status'
            ? `${pending.value === 'ACTIVE' ? 'Reactivate' : pending.value === 'SUSPENDED' ? 'Suspend' : 'Deactivate'} account`
            : pending?.kind === 'role'
            ? 'Change role'
            : 'Change district / scope'
        }
        destructive={pending?.kind === 'status' && pending.value !== 'ACTIVE'}
        fields={[
          { label: 'User', value: displayName },
          { label: 'Current role', value: ROLE_INFO[user.metadata.role]?.label || user.metadata.role },
          { label: 'Current district', value: user.metadata.district || 'Global' },
        ]}
        consequence={
          pending?.kind === 'status'
            ? pending.value === 'ACTIVE'
              ? `${displayName} will regain the ability to sign in.`
              : `This will immediately prevent ${displayName} from accessing the system.`
            : pending?.kind === 'role'
            ? `${displayName}'s permissions will change to ${pending ? ROLE_INFO[pending.value as UserRole].label : ''} immediately.`
            : `${displayName}'s operational scope will change to ${pending?.kind === 'district' ? pending.value : ''}.`
        }
        confirmLabel={
          pending?.kind === 'status' ? (pending.value === 'ACTIVE' ? 'Reactivate User' : pending.value === 'SUSPENDED' ? 'Suspend User' : 'Deactivate User') : 'Confirm Change'
        }
        busy={busy}
        onConfirm={runAction}
        onCancel={() => setPending(null)}
      />
    </>
  );
};
