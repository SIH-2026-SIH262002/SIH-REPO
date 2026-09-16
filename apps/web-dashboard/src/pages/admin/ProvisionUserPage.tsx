import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { FormField, inputBaseClass } from '../../components/admin/primitives/FormField';
import { ConfirmDialog } from '../../components/admin/primitives/ConfirmDialog';
import { RoleSelectorWithBriefing } from '../../components/admin/users/RoleSelectorWithBriefing';
import { DistrictScopeSelector } from '../../components/admin/users/DistrictScopeSelector';
import { classifyError } from '../../components/admin/primitives/QueryStates';
import { adminApi } from '../../api/adminApi';
import { ROLE_INFO } from '../../types/admin';
import { UserRole } from '../../types/auth';

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole | '';
  district: string;
  organization: string;
}

const INITIAL: FormState = { fullName: '', email: '', phone: '', password: '', role: '', district: '', organization: '' };

/**
 * Admin-only account provisioning. There is no self-registration in NER
 * LogiSense (docs/architecture/FRONTEND_ROLE_CONTRACT.md #3) -- this is the
 * only path a new operational account can come from.
 */
export const ProvisionUserPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ email: string; role: UserRole } | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!form.fullName.trim()) errors.fullName = 'Full name is required.';
    if (!form.email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address.';
    if (!form.password || form.password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (!form.role) errors.role = 'Select a role.';
    if (!form.district) errors.district = 'Select a district.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReviewClick = () => {
    setSubmitError(null);
    if (validate()) setConfirmOpen(true);
  };

  const handleConfirmProvision = async () => {
    if (!form.role) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await adminApi.provisionUser({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        role: form.role,
        district: form.district,
        organization: form.organization.trim() || undefined,
      });
      setSuccess({ email: form.email.trim(), role: form.role });
      setConfirmOpen(false);
      setForm(INITIAL);
    } catch (err) {
      const { message } = classifyError(err);
      setSubmitError(message);
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div>
        <PageHeader title="Provision User" />
        <SectionCard className="max-w-lg mx-auto text-center py-10">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--adm-healthy)' }} />
          <h2 className="text-base font-semibold text-[var(--adm-ink)]">Account provisioned</h2>
          <p className="text-sm text-[var(--adm-ink-2)] mt-1">
            <strong>{success.email}</strong> has been created as{' '}
            <strong>{ROLE_INFO[success.role].label}</strong> and can now sign in.
          </p>
          <div className="flex justify-center gap-2 mt-5">
            <button
              onClick={() => setSuccess(null)}
              className="rounded-[var(--adm-radius)] border border-[var(--adm-border)] px-4 py-2 text-sm font-semibold text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)]"
            >
              Provision another
            </button>
            <button
              onClick={() => navigate('/admin/users')}
              className="rounded-[var(--adm-radius)] px-4 py-2 text-sm font-semibold text-white"
              style={{ background: 'var(--adm-primary)' }}
            >
              Go to User Directory
            </button>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Provision User"
        description="All accounts are created here by an authorized Administrator. There is no public self-registration."
      />

      <SectionCard className="max-w-2xl" title="Personnel & Access Details">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleReviewClick();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full name" required error={fieldErrors.fullName}>
              {(p) => (
                <input
                  {...p}
                  type="text"
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className={inputBaseClass}
                />
              )}
            </FormField>

            <FormField label="Email" required error={fieldErrors.email}>
              {(p) => (
                <input
                  {...p}
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="name@nerlogisense.gov.in"
                  className={inputBaseClass}
                />
              )}
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Phone" hint="Optional">
              {(p) => (
                <input
                  {...p}
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+91XXXXXXXXXX"
                  className={inputBaseClass}
                />
              )}
            </FormField>

            <FormField label="Organization" hint="Optional">
              {(p) => (
                <input
                  {...p}
                  type="text"
                  value={form.organization}
                  onChange={(e) => set('organization', e.target.value)}
                  placeholder="e.g. Meghalaya Disaster Management Authority"
                  className={inputBaseClass}
                />
              )}
            </FormField>
          </div>

          <FormField label="Temporary password" required error={fieldErrors.password} hint="At least 8 characters. The user should change this after first sign-in.">
            {(p) => (
              <input
                {...p}
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                className={inputBaseClass}
              />
            )}
          </FormField>

          <FormField label="Assigned role" required error={fieldErrors.role}>
            {(p) => (
              <RoleSelectorWithBriefing
                {...p}
                value={form.role}
                onChange={(role) => set('role', role)}
              />
            )}
          </FormField>

          <FormField label="Assigned district / scope" required error={fieldErrors.district}>
            {(p) => (
              <DistrictScopeSelector {...p} value={form.district} onChange={(d) => set('district', d)} />
            )}
          </FormField>

          {submitError && (
            <p role="alert" className="text-sm font-medium" style={{ color: 'var(--adm-critical)' }}>
              {submitError}
            </p>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="rounded-[var(--adm-radius)] px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: 'var(--adm-primary)' }}
            >
              Review & Provision Account
            </button>
          </div>
        </form>
      </SectionCard>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm account provisioning"
        fields={[
          { label: 'Name', value: form.fullName },
          { label: 'Email', value: form.email },
          { label: 'Role', value: form.role ? ROLE_INFO[form.role].label : '' },
          { label: 'District / Scope', value: form.district },
        ]}
        consequence={`This will create an active account that can sign in immediately as ${
          form.role ? ROLE_INFO[form.role].label : 'the selected role'
        }.`}
        confirmLabel="Create account"
        busy={submitting}
        onConfirm={handleConfirmProvision}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};
