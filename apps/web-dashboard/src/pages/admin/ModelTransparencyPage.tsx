import React from 'react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { MetricTile } from '../../components/admin/primitives/MetricTile';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, classifyError } from '../../components/admin/primitives/QueryStates';
import { useAsyncData } from '../../hooks/admin/useAsyncData';
import { adminApi } from '../../api/adminApi';

interface ModelInfo {
  model_name: string;
  metrics: { mae: number; r2: number; roc_auc: number };
  feature_importances: Record<string, number>;
}

const FEATURE_LABELS: Record<string, string> = {
  soil_moisture_pct: 'Soil moisture (%)',
  rainfall_mm_last_72h: 'Rainfall — last 72h (mm)',
  vibration_intensity: 'Ground vibration intensity',
  slope_angle_deg: 'Slope angle (°)',
  soil_porosity_index: 'Soil porosity index',
  vegetation_cover_pct: 'Vegetation cover (%)',
  distance_to_stream_km: 'Distance to stream (km)',
  historical_landslide_count: 'Historical landslide count',
  rainfall_mm_last_24h: 'Rainfall — last 24h (mm)',
  humidity_pct: 'Humidity (%)',
  temperature_c: 'Temperature (°C)',
  elevation_m: 'Elevation (m)',
  soil_type_encoded: 'Soil type',
  days_since_last_rainfall: 'Days since last rainfall',
};

export const ModelTransparencyPage: React.FC = () => {
  const { data: info, loading, error, refetch } = useAsyncData<ModelInfo>(() => adminApi.getModelInfo(), []);

  const sortedFeatures = info
    ? Object.entries(info.feature_importances).sort((a, b) => b[1] - a[1])
    : [];
  const maxImportance = sortedFeatures.length ? sortedFeatures[0][1] : 1;

  return (
    <div>
      <PageHeader
        title="Model Transparency"
        description="Real metrics and feature importances from the trained landslide risk model. Read-only — model deployment and rollback are not implemented in this system."
        action={<DataProvenanceBadge kind="LIVE" />}
      />

      {loading && <LoadingState label="Loading model metrics…" />}
      {!loading && error && <ErrorState message={classifyError(error).message} onRetry={refetch} />}
      {!loading && !error && info && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricTile label="Mean Absolute Error" value={info.metrics.mae.toFixed(2)} context="Risk score points (0–100 scale)" />
            <MetricTile label="R² Score" value={info.metrics.r2.toFixed(2)} context="Variance explained by the model" tone="healthy" />
            <MetricTile label="ROC-AUC" value={info.metrics.roc_auc.toFixed(2)} context="Classification separation" tone="healthy" />
          </div>

          <SectionCard title="Algorithm" description={info.model_name} />

          <SectionCard title="Feature Importances" description="Relative contribution of each input to the risk score">
            <div className="space-y-2.5">
              {sortedFeatures.map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--adm-ink-2)]">{FEATURE_LABELS[key] || key}</span>
                    <span className="font-medium tabular-nums text-[var(--adm-ink)]">{(value * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--adm-raised)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(value / maxImportance) * 100}%`, background: 'var(--adm-primary)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
};
