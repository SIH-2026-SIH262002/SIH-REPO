import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/authApi';
import { NER_DISTRICTS } from '../types/auth';
import {
  User as UserIcon,
  Shield,
  MapPin,
  Lock,
  Edit,
  Save,
  CheckCircle,
  AlertCircle,
  Key,
  LogOut,
} from 'lucide-react';
import { Navbar } from '../components/common/Navbar';

export const ProfilePage: React.FC = () => {
  const { user, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const [activeTab, setActiveTab] = useState<'info' | 'edit' | 'password'>('info');

  // Edit Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [district, setDistrict] = useState(user?.district || NER_DISTRICTS[0]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [updateErr, setUpdateErr] = useState<string | null>(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<string | null>(null);
  const [passErr, setPassErr] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMsg(null);
    setUpdateErr(null);

    setIsUpdating(true);

    try {
      await updateUserProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        organization: organization.trim(),
        district,
      });
      setUpdateMsg('Profile updated successfully!');
      setActiveTab('info');
    } catch (err: any) {
      setUpdateErr(err.response?.data?.error || err.message || 'Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    setPassErr(null);

    if (!currentPassword) {
      setPassErr('Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPassErr('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassErr('Passwords do not match');
      return;
    }

    setIsChangingPass(true);

    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setPassMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassErr(err.response?.data?.error || err.message || 'Failed to change password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 w-full flex-1">
        {/* Header Banner */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-emerald-500 shadow-md">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900">{user.fullName || 'Operational User'}</h1>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {user.role}
                </span>
                {user.district && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span>{user.district}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Terminate Session</span>
          </button>
        </div>

        {/* Messages */}
        {updateMsg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center space-x-2 text-emerald-700 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{updateMsg}</span>
          </div>
        )}

        {passMsg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center space-x-2 text-emerald-700 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-2 bg-white p-1.5 rounded-lg border border-slate-200 mb-6 shadow-xs">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'info'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('edit')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'edit'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'password'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Security & Password</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-3 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>ACCOUNT & OPERATIONAL IDENTITY</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1">Full Name</span>
                <span className="text-slate-900 font-semibold text-sm">{user.fullName || '—'}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1">Email Address</span>
                <span className="text-slate-900 font-semibold text-sm">{user.email}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1">Phone Number</span>
                <span className="text-slate-900 font-semibold text-sm">{user.phone || 'Not specified'}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1">Platform Role</span>
                <span className="text-emerald-700 font-bold text-sm tracking-wide">{user.role}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1">Organization / Department</span>
                <span className="text-slate-900 font-semibold text-sm">{user.organization || 'General NER Logistics'}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1">Assigned NER District</span>
                <span className="text-slate-900 font-semibold text-sm">{user.district || 'All North-Eastern Region'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-3 mb-5 flex items-center space-x-2">
              <Edit className="w-4 h-4 text-emerald-600" />
              <span>UPDATE PROFILE INFORMATION</span>
            </h2>

            {updateErr && (
              <div className="mb-4 bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-center space-x-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{updateErr}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Organization / Department</label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Assigned NER District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {NER_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{isUpdating ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-3 mb-5 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>CHANGE PASSWORD</span>
            </h2>

            {passErr && (
              <div className="mb-4 bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-center space-x-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passErr}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                >
                  {isChangingPass ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
