import React, { useState, useEffect } from 'react';
import { PackageCheck, CheckCircle2, RotateCw, AlertTriangle, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { DataTable, Column } from '../../components/admin/primitives/DataTable';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, EmptyState } from '../../components/admin/primitives/QueryStates';
import { ConfirmDialog } from '../../components/admin/primitives/ConfirmDialog';
import { apiService } from '../../services/apiService';

export const LogisticsDeliveriesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [confirmingVehicle, setConfirmingVehicle] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchDeliveries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getVehicles();
      setVehicles(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load delivery lifecycle records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleExecuteConfirmation = async () => {
    if (!confirmingVehicle) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    const vehicleId = confirmingVehicle.id || confirmingVehicle.code;
    try {
      const result = await apiService.confirmDelivery(vehicleId);
      setActionSuccess(`Delivery for vehicle ${vehicleId} confirmed successfully by Logistics Operator.`);
      setConfirmingVehicle(null);
      await fetchDeliveries();
    } catch (err: any) {
      setActionError(
        `Delivery confirmation failed — backend did not confirm the operation: ${
          err?.response?.data?.detail || err?.message || 'Server error'
        }`
      );
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'deliveryId',
      header: 'Delivery / Vehicle',
      render: (v) => (
        <div>
          <div className="font-mono font-bold text-[var(--adm-primary)]">{v.code || v.id}</div>
          <div className="text-[10px] text-[var(--adm-ink-3)] font-mono">DEL-{v.id || v.code}</div>
        </div>
      ),
    },
    {
      key: 'cargo',
      header: 'Commodity Payload',
      render: (v) => (
        <span className="text-xs font-semibold text-[var(--adm-ink)]">
          {v.cargo || v.cargo_type || 'Essential Medical Rations'}
        </span>
      ),
    },
    {
      key: 'destination',
      header: 'Destination Hub',
      render: (v) => (
        <div>
          <div className="font-medium text-[var(--adm-ink)]">{v.destination_name || v.destination || 'Unknown'}</div>
          <div className="text-[10px] text-[var(--adm-ink-3)]">From: {v.origin_name || v.origin || 'Unknown'}</div>
        </div>
      ),
    },
    {
      key: 'driver',
      header: 'Assigned Driver',
      render: (v) => v.driver || v.driver_name || 'Driver Unit',
    },
    {
      key: 'status',
      header: 'Delivery State',
      render: (v) => {
        const dStatus = v.delivery_status || (v.status === 'COMPLETED' ? 'CONFIRMED_DELIVERED' : 'IN_TRANSIT');
        if (dStatus === 'CONFIRMED_DELIVERED') {
          return <StatusBadge tone="healthy" label="DELIVERY CONFIRMED" />;
        }
        if (dStatus === 'DELIVERED_PENDING_CONFIRMATION' || v.status === 'DELIVERED') {
          return <StatusBadge tone="warning" label="PENDING OPERATOR CONFIRMATION" />;
        }
        if (dStatus.includes('DELAYED')) {
          return <StatusBadge tone="critical" label="DELAYED BY LANDSLIDE" />;
        }
        return <StatusBadge tone="healthy" label="IN TRANSIT" />;
      },
    },
    {
      key: 'actions',
      header: 'Operator Action',
      align: 'right',
      render: (v) => {
        const isDelivered = v.delivery_status === 'CONFIRMED_DELIVERED' || v.status === 'COMPLETED';
        if (isDelivered) {
          return (
            <span className="text-xs text-[var(--adm-healthy)] font-medium flex items-center justify-end gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirmed</span>
            </span>
          );
        }
        return (
          <button
            onClick={() => setConfirmingVehicle(v)}
            className="px-2.5 py-1 text-xs font-semibold bg-[var(--adm-primary)] text-white rounded-[var(--adm-radius)] hover:bg-[var(--adm-primary-dark)] transition shadow-xs"
          >
            Confirm Delivery
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Verification & Chain of Custody"
        subtitle="Final delivery sign-off, receiver proof verification, and transport lifecycle audit trails."
        action={
          <div className="flex items-center gap-2">
            <DataProvenanceBadge kind="LIVE" />
            <button
              onClick={fetchDeliveries}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] text-xs font-semibold text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)]"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Refresh Deliveries</span>
            </button>
          </div>
        }
      />

      {/* Success or Error Banners */}
      {actionSuccess && (
        <div className="p-3 bg-[var(--adm-healthy-bg)] border border-[var(--adm-healthy)] text-[var(--adm-healthy)] rounded-[var(--adm-radius)] text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccess}</span>
          </span>
          <button onClick={() => setActionSuccess(null)} className="underline text-xs">Dismiss</button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-[var(--adm-critical-bg)] border border-[var(--adm-critical)] text-[var(--adm-critical)] rounded-[var(--adm-radius)] text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{actionError}</span>
          </span>
          <button onClick={() => setActionError(null)} className="underline text-xs">Dismiss</button>
        </div>
      )}

      <SectionCard title="Active In-Transit & Pending Deliveries" subtitle="Consignments requiring receipt verification.">
        {loading ? (
          <LoadingState label="Loading deliveries…" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchDeliveries} />
        ) : vehicles.length === 0 ? (
          <EmptyState
            title="NO PENDING DELIVERIES"
            description="There are currently no active deliveries recorded in the system."
          />
        ) : (
          <DataTable columns={columns} data={vehicles} keyExtractor={(v) => v.id || v.code} />
        )}
      </SectionCard>

      {/* Real Confirmation Dialog */}
      {confirmingVehicle && (
        <ConfirmDialog
          open={!!confirmingVehicle}
          title="Confirm Consignment Delivery"
          description={`Are you sure you want to confirm final delivery for vehicle ${
            confirmingVehicle.code || confirmingVehicle.id
          } carrying ${confirmingVehicle.cargo || confirmingVehicle.cargo_type || 'Essential Cargo'}? This will mark the consignment as DELIVERED in the persistent audit log.`}
          confirmLabel={actionLoading ? 'Confirming with backend…' : 'Authorize & Sign-Off'}
          tone="primary"
          onConfirm={handleExecuteConfirmation}
          onCancel={() => setConfirmingVehicle(null)}
        />
      )}
    </div>
  );
};
