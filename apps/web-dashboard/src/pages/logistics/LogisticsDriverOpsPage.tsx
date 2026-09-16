import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  AlertTriangle,
  ArrowRightLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Phone,
  Truck,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Plus,
  Send,
  Navigation,
  MapPin,
  FileCheck,
  KeyRound,
  Lock,
} from 'lucide-react';
import {
  driverOpsApi,
  DriverProfile,
  AssistanceRequest,
  TripHandover,
  CandidateDriver,
} from '../../api/driverOpsApi';

export const LogisticsDriverOpsPage: React.FC = () => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'drivers' | 'assistance' | 'handover'>('drivers');
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequest[]>([]);
  const [handovers, setHandovers] = useState<TripHandover[]>([]);
  const [selectedHandover, setSelectedHandover] = useState<TripHandover | null>(null);
  const [candidates, setCandidates] = useState<CandidateDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & search
  const [driverSearch, setDriverSearch] = useState('');
  const [assistanceStatusFilter, setAssistanceStatusFilter] = useState('ALL');

  // Modals & form states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showInitiateHandoverModal, setShowInitiateHandoverModal] = useState(false);
  const [activeActionId, setActiveActionId] = useState<number | null>(null);

  // Modal input fields
  const [dispatchActionText, setDispatchActionText] = useState('');
  const [cancelReasonText, setCancelReasonText] = useState('');

  // Register form
  const [newUsername, setNewUsername] = useState('');
  const [newLicenseNumber, setNewLicenseNumber] = useState('');
  const [newLicenseCategory, setNewLicenseCategory] = useState('TRANS_HEAVY');
  const [newBaseDepot, setNewBaseDepot] = useState('Guwahati Central Hub');
  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newEmergencyPhone, setNewEmergencyPhone] = useState('');

  // Handover initiation form
  const [initShipmentId, setInitShipmentId] = useState('');
  const [initVehicleCode, setInitVehicleCode] = useState('');
  const [initLocationType, setInitLocationType] = useState<'CURRENT_VEHICLE_LOCATION' | 'SAFE_HANDOVER_POINT'>('SAFE_HANDOVER_POINT');
  const [initLocationName, setInitLocationName] = useState('Haflong Mountain Safe Staging Point');
  const [initNotes, setInitNotes] = useState('');

  // Handover complete checklist
  const [sealVerified, setSealVerified] = useState(false);
  const [keysTransferred, setKeysTransferred] = useState(false);
  const [inspectionPassed, setInspectionPassed] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [driversData, assistanceData, handoversData] = await Promise.all([
        driverOpsApi.getDrivers().catch(() => []),
        driverOpsApi.getAssistanceRequests().catch(() => []),
        driverOpsApi.getHandovers(true).catch(() => []),
      ]);
      setDrivers(driversData);
      setAssistanceRequests(assistanceData);
      setHandovers(handoversData);

      if (handoversData.length > 0 && !selectedHandover) {
        setSelectedHandover(handoversData[0]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch driver operations data');
    } finally {
      setLoading(false);
    }
  }, [selectedHandover]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load candidate drivers when a handover is selected
  useEffect(() => {
    if (selectedHandover && selectedHandover.status !== 'COMPLETED' && selectedHandover.status !== 'CANCELLED') {
      driverOpsApi.getCandidates(selectedHandover.id)
        .then(setCandidates)
        .catch(() => setCandidates([]));
    } else {
      setCandidates([]);
    }
  }, [selectedHandover]);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Actions
  const handleRegisterDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await driverOpsApi.registerDriver({
        username: newUsername,
        licenseNumber: newLicenseNumber,
        licenseCategory: newLicenseCategory,
        baseDepot: newBaseDepot,
        emergencyContactName: newEmergencyName,
        emergencyContactPhone: newEmergencyPhone,
      });
      showNotification('Driver registered and operational profile created successfully!');
      setShowRegisterModal(false);
      setNewUsername('');
      setNewLicenseNumber('');
      fetchData();
    } catch (err: any) {
      showNotification(err.response?.data?.message || err.message || 'Failed to register driver', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledgeAssistance = async (id: number) => {
    try {
      await driverOpsApi.acknowledgeAssistance(id);
      showNotification(`Assistance request #${id} acknowledged.`);
      fetchData();
    } catch (err: any) {
      showNotification(err.response?.data?.message || err.message || 'Failed to acknowledge', true);
    }
  };

  const handleDispatchAssistance = async () => {
    if (!activeActionId || !dispatchActionText.trim()) return;
    try {
      setIsSubmitting(true);
      await driverOpsApi.dispatchAssistance(activeActionId, dispatchActionText);
      showNotification(`Assistance dispatched for request #${activeActionId}`);
      setShowDispatchModal(false);
      setDispatchActionText('');
      setActiveActionId(null);
      fetchData();
    } catch (err: any) {
      showNotification(err.response?.data?.message || err.message || 'Dispatch failed', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAssistance = async () => {
    if (!activeActionId || !cancelReasonText.trim()) return;
    try {
      setIsSubmitting(true);
      await driverOpsApi.cancelAssistance(activeActionId, cancelReasonText);
      showNotification(`Assistance request #${activeActionId} cancelled.`);
      setShowCancelModal(false);
      setCancelReasonText('');
      setActiveActionId(null);
      fetchData();
    } catch (err: any) {
      showNotification(err.response?.data?.message || err.message || 'Cancellation failed', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitiateHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    const shipmentIdNum = parseInt(initShipmentId, 10);
    if (!shipmentIdNum) {
      showNotification('Valid Shipment ID is required', true);
      return;
    }
    try {
      setIsSubmitting(true);
      const created = await driverOpsApi.initiateHandover({
        shipmentId: shipmentIdNum,
        vehicleCode: initVehicleCode || undefined,
        handoverLocationType: initLocationType,
        handoverLocationName: initLocationName,
        handoverNotes: initNotes,
      });
      showNotification(`Trip handover #${created.handoverNumber} initiated.`);
      setShowInitiateHandoverModal(false);
      setInitShipmentId('');
      setInitVehicleCode('');
      setInitNotes('');
      setActiveTab('handover');
      setSelectedHandover(created);
      fetchData();
    } catch (err: any) {
      showNotification(err.response?.data?.message || err.message || 'Handover initiation failed', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignReplacement = async (replacementDriverId: number) => {
    if (!selectedHandover) return;
    try {
      setIsSubmitting(true);
      const updated = await driverOpsApi.assignReplacement(selectedHandover.id, replacementDriverId);
      setSelectedHandover(updated);
      showNotification(`Replacement driver assigned. Handover status updated.`);
      fetchData();
    } catch (err: any) {
      showNotification(err.response?.data?.message || err.message || 'Assignment failed', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteHandover = async () => {
    if (!selectedHandover) return;
    if (!sealVerified || !keysTransferred || !inspectionPassed) {
      showNotification('All 3 verification checklist items are mandatory before completing transfer.', true);
      return;
    }
    try {
      setIsSubmitting(true);
      const updated = await driverOpsApi.completeHandover(selectedHandover.id, {
        cargoSealVerified: sealVerified,
        keysTransferred: keysTransferred,
        vehicleInspectionPassed: inspectionPassed,
        notes: handoverNotes,
      });
      setSelectedHandover(updated);
      showNotification(`✅ Trip Handover #${updated.handoverNumber} atomically completed! Vehicle & Shipment re-assigned. Delivery resumed.`);
      setSealVerified(false);
      setKeysTransferred(false);
      setInspectionPassed(false);
      setHandoverNotes('');
      fetchData();
    } catch (err: any) {
      showNotification(err.response?.data?.message || err.message || 'Handover completion failed', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats calculation
  const totalDrivers = drivers.length;
  const onTripDrivers = drivers.filter(d => d.operationalStatus === 'ON_TRIP').length;
  const openAssistance = assistanceRequests.filter(r => r.status === 'OPEN' || r.status === 'ASSISTANCE_DISPATCHED').length;
  const pendingHandovers = handovers.filter(h => h.status !== 'COMPLETED' && h.status !== 'CANCELLED').length;

  const filteredDrivers = drivers.filter(d => {
    const q = driverSearch.toLowerCase();
    return (
      d.user?.fullName?.toLowerCase().includes(q) ||
      d.user?.username?.toLowerCase().includes(q) ||
      d.licenseNumber?.toLowerCase().includes(q) ||
      d.baseDepot?.toLowerCase().includes(q)
    );
  });

  const filteredAssistance = assistanceRequests.filter(r => {
    if (assistanceStatusFilter === 'OPEN') return r.status === 'OPEN' || r.status === 'ACKNOWLEDGED';
    if (assistanceStatusFilter === 'DISPATCHED') return r.status === 'ASSISTANCE_DISPATCHED';
    if (assistanceStatusFilter === 'RESOLVED') return r.status === 'RESOLVED';
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Notifications */}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500 text-rose-600 dark:text-rose-400 p-3.5 rounded-xl flex items-center justify-between text-sm shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs hover:underline font-bold">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-xl flex items-center justify-between text-sm shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs hover:underline font-bold">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            {t('driverOps.title', 'Driver Safety & Trip Continuity')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('driverOps.subtitle', 'Mission-critical driver lifecycle, emergency assistance coordination, and risk-aware trip handover')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('driverOps.refresh', 'Refresh')}
          </button>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {t('driverOps.registerDriver', 'Register Driver')}
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('driverOps.totalDrivers', 'Total Drivers')}</div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">{totalDrivers}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('driverOps.onTrip', 'On Active Trip')}</div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">{onTripDrivers}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('driverOps.openAssistance', 'Assistance Requests')}</div>
            <div className="text-xl font-black text-rose-600">{openAssistance}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('driverOps.pendingHandovers', 'Pending Handovers')}</div>
            <div className="text-xl font-black text-amber-600">{pendingHandovers}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4 text-sm font-bold">
        <button
          onClick={() => setActiveTab('drivers')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'drivers'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          {t('driverOps.tabDrivers', 'Driver Registry')}
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800">{totalDrivers}</span>
        </button>

        <button
          onClick={() => setActiveTab('assistance')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'assistance'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          {t('driverOps.tabAssistance', 'Assistance Queue')}
          {openAssistance > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black">{openAssistance}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('handover')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'handover'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          {t('driverOps.tabHandover', 'Safe Trip Handover')}
          {pendingHandovers > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black">{pendingHandovers}</span>
          )}
        </button>
      </div>

      {/* ─── TAB 1: DRIVER REGISTRY ─── */}
      {activeTab === 'drivers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                placeholder={t('driverOps.searchDrivers', 'Search drivers by name, username, license or depot...')}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Driver</th>
                    <th className="p-3.5">Licence</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Fitness</th>
                    <th className="p-3.5">Assigned Vehicle</th>
                    <th className="p-3.5">Base Depot</th>
                    <th className="p-3.5">Emergency Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                  {filteredDrivers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        {loading ? 'Loading driver profiles...' : 'No drivers matching criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredDrivers.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{d.user?.fullName || d.user?.username}</div>
                          <div className="text-[10px] text-slate-400 font-mono">@{d.user?.username} • ID #{d.id}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{d.licenseNumber}</div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
                            {d.licenseCategory}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.operationalStatus === 'ON_TRIP' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' :
                            d.operationalStatus === 'ACTIVE' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                            d.operationalStatus === 'HANDOVER_REQUIRED' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 animate-pulse' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600'
                          }`}>
                            {d.operationalStatus}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.fitnessStatus === 'FIT' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                            d.fitnessStatus === 'UNABLE_TO_CONTINUE' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' :
                            'bg-amber-100 dark:bg-amber-950 text-amber-700'
                          }`}>
                            {d.fitnessStatus}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold">
                          {d.assignedVehicleCode ? (
                            <span className="text-slate-900 dark:text-slate-100 flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-indigo-500" />
                              {d.assignedVehicleCode}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">Unassigned</span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300">{d.baseDepot || 'N/A'}</td>
                        <td className="p-3.5 text-[11px]">
                          <div>{d.emergencyContactName || 'N/A'}</div>
                          <div className="text-slate-400 font-mono text-[10px]">{d.emergencyContactPhone}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: ASSISTANCE QUEUE ─── */}
      {activeTab === 'assistance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs font-bold">
              {['ALL', 'OPEN', 'DISPATCHED', 'RESOLVED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setAssistanceStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-xl border transition ${
                    assistanceStatusFilter === f
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssistance.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                No assistance requests found.
              </div>
            ) : (
              filteredAssistance.map((r) => (
                <div
                  key={r.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-slate-100">{r.requestNumber}</span>
                        {r.sosEventId && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-600 text-white font-black animate-pulse">
                            SOS LINKED #{r.sosEventId}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                        Driver: <strong className="text-slate-700 dark:text-slate-200">{r.driver?.user?.fullName || r.driver?.user?.username}</strong> ({r.driver?.user?.phoneNumber || 'N/A'})
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        r.severity === 'CRITICAL' ? 'bg-rose-500 text-white' :
                        r.severity === 'HIGH' ? 'bg-amber-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {r.severity}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'OPEN' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' :
                        r.status === 'ASSISTANCE_DISPATCHED' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' :
                        r.status === 'RESOLVED' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{r.category.replace(/_/g, ' ')}</span>
                      {r.vehicleCode && <span className="text-[10px] text-slate-400 font-mono">• Vehicle: {r.vehicleCode}</span>}
                    </div>
                    {r.operationalNotes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 pl-5 italic">
                        "{r.operationalNotes}"
                      </p>
                    )}
                    {r.locationDescription && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 pl-5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {r.locationDescription}
                      </div>
                    )}
                  </div>

                  {r.dispatchedAction && (
                    <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-2.5 rounded-xl text-xs space-y-0.5">
                      <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Dispatched Action:</div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-200">{r.dispatchedAction}</p>
                    </div>
                  )}

                  {/* Operational Action Controls */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {r.status === 'OPEN' && (
                      <button
                        onClick={() => handleAcknowledgeAssistance(r.id)}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
                      >
                        Acknowledge
                      </button>
                    )}

                    {r.status !== 'RESOLVED' && r.status !== 'CANCELLED' && (
                      <>
                        <button
                          onClick={() => {
                            setActiveActionId(r.id);
                            setShowDispatchModal(true);
                          }}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          Dispatch Aid
                        </button>
                        <button
                          onClick={() => {
                            setInitShipmentId(String(r.shipmentId || ''));
                            setInitVehicleCode(r.vehicleCode || '');
                            setInitNotes(`Originated from Assistance Request #${r.requestNumber}`);
                            setShowInitiateHandoverModal(true);
                          }}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition flex items-center gap-1"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          Handover Trip
                        </button>
                        <button
                          onClick={() => {
                            setActiveActionId(r.id);
                            setShowCancelModal(true);
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: SAFE TRIP HANDOVER ─── */}
      {activeTab === 'handover' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Safe Trip Continuity & Replacement Matching
              </h2>
              <p className="text-xs text-slate-400">
                Determines replacement drivers using real GraphHopper road ETAs and corridor risk evaluations.
              </p>
            </div>
            <button
              onClick={() => setShowInitiateHandoverModal(true)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Initiate New Handover
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Active Handover Queue */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Handovers</h3>
              {handovers.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-center text-xs text-slate-400">
                  No handovers recorded. Click "Initiate New Handover" to begin.
                </div>
              ) : (
                handovers.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHandover(h)}
                    className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                      selectedHandover?.id === h.id
                        ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xs text-slate-900 dark:text-slate-100">{h.handoverNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        h.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                        h.status === 'ACCEPTED' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {h.status}
                      </span>
                    </div>

                    <div className="text-xs font-sans">
                      <div>Vehicle: <strong>{h.vehicleCode}</strong> • Shipment #{h.shipmentId}</div>
                      <div className="text-[11px] text-slate-500">
                        Original: {h.originalDriver?.user?.fullName || h.originalDriver?.user?.username}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {h.handoverLocationName}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right: Selected Handover Workspace */}
            <div className="lg:col-span-2 space-y-6">
              {selectedHandover ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                  {/* Handover summary banner */}
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                          Handover Workspace: {selectedHandover.handoverNumber}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold">
                          Vehicle {selectedHandover.vehicleCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Staging Location: <strong>{selectedHandover.handoverLocationName}</strong> ({selectedHandover.handoverLocationType})
                      </p>
                    </div>
                    {selectedHandover.replacementDriver && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded-xl text-xs">
                        <span className="text-[10px] uppercase font-bold text-emerald-600 block">Assigned Replacement</span>
                        <strong className="text-emerald-800 dark:text-emerald-200">
                          {selectedHandover.replacementDriver.user?.fullName} (@{selectedHandover.replacementDriver.user?.username})
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Section A: Candidate Replacement Drivers */}
                  {selectedHandover.status !== 'COMPLETED' && selectedHandover.status !== 'CANCELLED' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Navigation className="w-3.5 h-3.5 text-indigo-500" />
                          Ranked Candidate Drivers (Real GraphHopper ETA)
                        </h4>
                        <span className="text-[10px] text-slate-400 italic">Sorted by fastest & lowest route hazard</span>
                      </div>

                      {candidates.length === 0 ? (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-xs text-slate-400">
                          No eligible available drivers found within corridor radius.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                          {candidates.map((cand, idx) => (
                            <div key={cand.driverId} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 dark:text-slate-100">
                                    #{idx + 1} {cand.fullName || cand.username}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                                    {cand.licenseCategory}
                                  </span>
                                  <span className="text-[10px] text-slate-400">Depot: {cand.baseDepot || 'N/A'}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-3">
                                  <span>🛣️ Road Distance: <strong>{cand.distanceKm} km</strong></span>
                                  <span>
                                    ⏱️ ETA: <strong className="text-indigo-600 dark:text-indigo-400">{cand.etaMinutes ? `${cand.etaMinutes} min` : 'Est. pending'}</strong>
                                  </span>
                                  <span>Hazard: <strong className={cand.riskLevel === 'CRITICAL' ? 'text-rose-600' : 'text-emerald-600'}>{cand.riskLevel}</strong></span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleAssignReplacement(cand.driverId)}
                                disabled={isSubmitting || selectedHandover.replacementDriver?.id === cand.driverId}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                  selectedHandover.replacementDriver?.id === cand.driverId
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                              >
                                {selectedHandover.replacementDriver?.id === cand.driverId ? 'Assigned' : 'Assign Driver'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Section B: Atomic Handover Completion Checklist */}
                  {selectedHandover.status !== 'COMPLETED' && selectedHandover.status !== 'CANCELLED' && (
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          Mandatory Handover Verification Checklist
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          All 3 verifications must pass to execute the atomic database transaction and resume delivery.
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sealVerified}
                            onChange={(e) => setSealVerified(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>1. Cargo seal numbers matched & tamper-evident seal confirmed intact</span>
                        </label>

                        <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={keysTransferred}
                            onChange={(e) => setKeysTransferred(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                          <span>2. Vehicle ignition keys, fuel card & telematics units transferred</span>
                        </label>

                        <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={inspectionPassed}
                            onChange={(e) => setInspectionPassed(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>3. Brakes, tires & radiator walkaround physical inspection verified</span>
                        </label>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={handoverNotes}
                          onChange={(e) => setHandoverNotes(e.target.value)}
                          placeholder="Optional operational transfer notes..."
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>

                      <button
                        onClick={handleCompleteHandover}
                        disabled={isSubmitting || !sealVerified || !keysTransferred || !inspectionPassed || !selectedHandover.replacementDriver}
                        className={`w-full py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-sm ${
                          sealVerified && keysTransferred && inspectionPassed && selectedHandover.replacementDriver
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Complete Handover & Resume Delivery (Atomic Transfer)
                      </button>
                    </div>
                  )}

                  {selectedHandover.status === 'COMPLETED' && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Handover Completed Successfully
                      </div>
                      <p>
                        Trip for Vehicle <strong>{selectedHandover.vehicleCode}</strong> was atomically transferred to replacement driver <strong>{selectedHandover.replacementDriver?.user?.fullName}</strong>. Delivery has resumed.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 rounded-2xl text-center text-slate-400 text-xs">
                  Select a handover request from the left column to view replacement matching workspace.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: REGISTER DRIVER ─── */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Register Authentic Driver Profile
            </h3>
            <form onSubmit={handleRegisterDriver} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300">Driver Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. driver"
                  className="w-full p-2.5 mt-1 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300">Commercial License Number</label>
                <input
                  type="text"
                  required
                  value={newLicenseNumber}
                  onChange={(e) => setNewLicenseNumber(e.target.value)}
                  placeholder="e.g. AS-01-2022-0049281"
                  className="w-full p-2.5 mt-1 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300">Category</label>
                  <select
                    value={newLicenseCategory}
                    onChange={(e) => setNewLicenseCategory(e.target.value)}
                    className="w-full p-2.5 mt-1 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="TRANS_HEAVY">TRANS_HEAVY</option>
                    <option value="HMV">HMV</option>
                    <option value="HAZMAT">HAZMAT</option>
                    <option value="LIGHT_COMMERCIAL">LIGHT_COMMERCIAL</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300">Base Depot</label>
                  <input
                    type="text"
                    value={newBaseDepot}
                    onChange={(e) => setNewBaseDepot(e.target.value)}
                    className="w-full p-2.5 mt-1 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300">Emergency Contact</label>
                  <input
                    type="text"
                    value={newEmergencyName}
                    onChange={(e) => setNewEmergencyName(e.target.value)}
                    placeholder="Contact Name"
                    className="w-full p-2.5 mt-1 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300">Contact Phone</label>
                  <input
                    type="text"
                    value={newEmergencyPhone}
                    onChange={(e) => setNewEmergencyPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full p-2.5 mt-1 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl border font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DISPATCH AID ─── */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Dispatch Operational Assistance
            </h3>
            <div className="text-xs space-y-3">
              <label className="font-bold text-slate-600 dark:text-slate-300">
                Specify Emergency Units & Route Action:
              </label>
              <textarea
                rows={3}
                value={dispatchActionText}
                onChange={(e) => setDispatchActionText(e.target.value)}
                placeholder="e.g. Dispatched recovery tow truck and mechanic team from Haflong Depot..."
                className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
              />
              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 rounded-xl border font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDispatchAssistance}
                  disabled={isSubmitting || !dispatchActionText.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Confirm Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CANCEL ASSISTANCE ─── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-rose-600">
              Cancel Assistance Request
            </h3>
            <div className="text-xs space-y-3">
              <p className="text-slate-500">
                Mandatory operational justification required to cancel an open or dispatched request:
              </p>
              <textarea
                rows={3}
                value={cancelReasonText}
                onChange={(e) => setCancelReasonText(e.target.value)}
                placeholder="e.g. Driver resolved flat tire with onboard spare; convoy resuming..."
                className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
              />
              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 rounded-xl border font-bold text-slate-600 hover:bg-slate-100"
                >
                  Keep Active
                </button>
                <button
                  type="button"
                  onClick={handleCancelAssistance}
                  disabled={isSubmitting || !cancelReasonText.trim()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: INITIATE HANDOVER ─── */}
      {showInitiateHandoverModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Initiate Safe Trip Handover
            </h3>
            <form onSubmit={handleInitiateHandover} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300">Shipment ID</label>
                <input
                  type="number"
                  required
                  value={initShipmentId}
                  onChange={(e) => setInitShipmentId(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full p-2.5 mt-1 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300">Vehicle Code (Optional)</label>
                <input
                  type="text"
                  value={initVehicleCode}
                  onChange={(e) => setInitVehicleCode(e.target.value)}
                  placeholder="e.g. NER-07"
                  className="w-full p-2.5 mt-1 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300">Handover Location Strategy</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setInitLocationType('SAFE_HANDOVER_POINT');
                      setInitLocationName('Haflong Mountain Safe Staging Point');
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      initLocationType === 'SAFE_HANDOVER_POINT'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    🛡️ Safe Staging Point
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInitLocationType('CURRENT_VEHICLE_LOCATION');
                      setInitLocationName('Current Roadside Location');
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      initLocationType === 'CURRENT_VEHICLE_LOCATION'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    📍 Current Location
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300">Location Description</label>
                <input
                  type="text"
                  value={initLocationName}
                  onChange={(e) => setInitLocationName(e.target.value)}
                  className="w-full p-2.5 mt-1 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowInitiateHandoverModal(false)}
                  className="px-4 py-2 rounded-xl border font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Start Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
