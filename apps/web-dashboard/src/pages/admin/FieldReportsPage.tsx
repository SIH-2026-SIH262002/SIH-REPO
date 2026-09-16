import React, { useState } from 'react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { DataTable, DataTableColumn } from '../../components/admin/primitives/DataTable';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, classifyError } from '../../components/admin/primitives/QueryStates';
import { useAsyncData } from '../../hooks/admin/useAsyncData';
import { adminApi } from '../../api/adminApi';
import { MEDIA_BASE_URL } from '../../services/apiService';

interface FieldReport {
  id: string;
  reporter_name: string;
  phone: string;
  incident_type: string;
  description: string;
  lat: number;
  lon: number;
  nearest_node: string;
  nearest_node_name: string;
  photo_path: string | null;
  captured_at?: string;
  created_at: string;
}

const photoUrl = (photoPath: string) => `${MEDIA_BASE_URL}${photoPath}`;

const PhotoLightbox: React.FC<{ report: FieldReport; onClose: () => void }> = ({ report, onClose }) => (
  <div
    role="dialog"
    aria-modal="true"
    onClick={onClose}
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(2,6,23,0.85)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'var(--adm-surface, #0f172a)',
        borderRadius: 12,
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}
    >
      <img
        src={photoUrl(report.photo_path!)}
        alt={`Field evidence submitted by ${report.reporter_name}`}
        style={{ display: 'block', maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }}
      />
      <div style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--adm-ink-2, #cbd5e1)' }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{report.reporter_name} &middot; {report.incident_type.replace(/_/g, ' ')}</div>
        <div>GPS: {report.lat.toFixed(6)}°, {report.lon.toFixed(6)}°</div>
        <div>Captured: {report.captured_at ? new Date(report.captured_at).toLocaleString() : '—'}</div>
        <div>Nearest node: {report.nearest_node_name}</div>
        {report.description ? <div style={{ marginTop: 6 }}>{report.description}</div> : null}
      </div>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'rgba(15,23,42,0.8)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 8,
          width: 32,
          height: 32,
          cursor: 'pointer',
        }}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  </div>
);

export const FieldReportsPage: React.FC = () => {
  const { data: reports, loading, error, refetch } = useAsyncData<FieldReport[]>(() => adminApi.getReports(), []);
  const [lightboxReport, setLightboxReport] = useState<FieldReport | null>(null);

  const columns: DataTableColumn<FieldReport>[] = [
    {
      key: 'evidence',
      header: 'Evidence',
      accessor: (r) =>
        r.photo_path ? (
          <button
            onClick={() => setLightboxReport(r)}
            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
            aria-label="View geotagged photo"
          >
            <img
              src={photoUrl(r.photo_path)}
              alt={`Field evidence thumbnail from ${r.reporter_name}`}
              style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--adm-border, #334155)' }}
            />
          </button>
        ) : (
          <span className="text-xs text-[var(--adm-ink-3)]">None</span>
        ),
    },
    { key: 'reporter', header: 'Reporter', sortable: true, sortValue: (r) => r.reporter_name, accessor: (r) => r.reporter_name },
    { key: 'incident', header: 'Incident Type', accessor: (r) => r.incident_type.replace(/_/g, ' ') },
    { key: 'node', header: 'Nearest Node', sortable: true, sortValue: (r) => r.nearest_node_name, accessor: (r) => r.nearest_node_name },
    { key: 'description', header: 'Description', accessor: (r) => <span className="text-xs">{r.description || '—'}</span> },
    {
      key: 'gps',
      header: 'GPS',
      accessor: (r) => <span className="text-xs font-mono">{r.lat.toFixed(4)}°, {r.lon.toFixed(4)}°</span>,
    },
    {
      key: 'captured',
      header: 'Captured (device)',
      sortable: true,
      sortValue: (r) => r.captured_at || r.created_at,
      accessor: (r) => (
        <span className="text-xs text-[var(--adm-ink-3)]">
          {r.captured_at ? new Date(r.captured_at).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Submitted',
      sortable: true,
      sortValue: (r) => r.created_at,
      accessor: (r) => <span className="text-xs text-[var(--adm-ink-3)]">{new Date(r.created_at).toLocaleString()}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Field Reports"
        description="Ground-truth incident reports submitted by Field Officers and Drivers, with geotagged photo evidence. A confirmed report overrides the AI risk score for its nearest node to SEVERE (95.0)."
        action={<DataProvenanceBadge kind="LIVE" />}
      />
      <SectionCard noPadding>
        {loading ? (
          <LoadingState label="Loading field reports…" />
        ) : error ? (
          <ErrorState message={classifyError(error).message} onRetry={refetch} />
        ) : (
          <DataTable
            caption="Field incident reports"
            columns={columns}
            rows={reports || []}
            rowKey={(r) => r.id}
            emptyTitle="No field reports found."
            emptyDescription="No Field Officer or Driver has submitted a ground-truth incident report yet."
          />
        )}
      </SectionCard>
      {lightboxReport && <PhotoLightbox report={lightboxReport} onClose={() => setLightboxReport(null)} />}
    </div>
  );
};
