import React, { useState } from 'react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { FormField, inputBaseClass } from '../../components/admin/primitives/FormField';
import { classifyError } from '../../components/admin/primitives/QueryStates';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/authApi';

export const AccountPage: React.FC = () => {
  const { user, updateUserProfile, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      await updateUserProfile({ fullName, phone, organization });
      await refreshUser();
      setProfileMessage({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: classifyError(err).message });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSaving(true);
    setPwMessage(null);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setPwMessage({ type: 'success', text: 'Password updated.' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPwMessage({ type: 'error', text: classifyError(err).message });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="My Account" description="Your own profile — Administrators manage other accounts from the User Directory." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Profile">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <FormField label="Full name">
              {(p) => <input {...p} type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputBaseClass} />}
            </FormField>
            <FormField label="Phone">
              {(p) => <input {...p} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputBaseClass} />}
            </FormField>
            <FormField label="Organization">
              {(p) => <input {...p} type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} className={inputBaseClass} />}
            </FormField>
            <FormField label="Email" hint="Contact an Administrator to change your email.">
              {(p) => <input {...p} type="email" value={user?.email || ''} disabled className={inputBaseClass} />}
            </FormField>
            <FormField label="Role" hint="Only another Administrator can change your role.">
              {(p) => <input {...p} type="text" value={user?.role || ''} disabled className={inputBaseClass} />}
            </FormField>

            {profileMessage && (
              <p className="text-sm font-medium" style={{ color: profileMessage.type === 'success' ? 'var(--adm-healthy)' : 'var(--adm-critical)' }}>
                {profileMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={profileSaving}
              className="rounded-[var(--adm-radius)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'var(--adm-primary)' }}
            >
              {profileSaving ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Change Password">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <FormField label="Current password" required>
              {(p) => <input {...p} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputBaseClass} />}
            </FormField>
            <FormField label="New password" required hint="At least 8 characters.">
              {(p) => <input {...p} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputBaseClass} />}
            </FormField>

            {pwMessage && (
              <p className="text-sm font-medium" style={{ color: pwMessage.type === 'success' ? 'var(--adm-healthy)' : 'var(--adm-critical)' }}>
                {pwMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={pwSaving || !currentPassword || newPassword.length < 8}
              className="rounded-[var(--adm-radius)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'var(--adm-primary)' }}
            >
              {pwSaving ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
};
