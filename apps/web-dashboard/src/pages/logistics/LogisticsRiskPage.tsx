import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, RotateCw, Activity, ArrowRight, Truck, Package, Clock } from 'lucide-react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { StatusBadge } from '../../components/admin/primitives/StatusBadge';
import { DataProvenanceBadge } from '../../components/admin/primitives/DataProvenanceBadge';
import { LoadingState, ErrorState, EmptyState } from '../../components/admin/primitives/QueryStates';
import { apiService } from '../../services/apiService';

export const LogisticsRiskPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [impactChain, setImpactChain] = useState<any | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getReports();
      setReports(data || []);
      if (data && data.length > 0) {
        handleSelectIncident(data[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load regional hazard incidents.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIncident = async (inc: any) => {
    setSelectedIncident(inc);
    setImpactLoading(true);
    try {
      const chain = await apiService.getIncidentImpactChain(inc.id);
      setImpactChain(chain);
    } catch (err) {
      setImpactChain(null);
    } finally {
      setImpactLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logistics Risk & Corridor Impact Chain"
        subtitle="Translate regional landslide hazards into affected highway corridors, in-transit fleet exposure, and downstream delivery disruption."
        action={
          <div className="flex items-center gap-2">
            <DataProvenanceBadge kind="LIVE" />
            <button
              onClick={fetchIncidents}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] text-xs font-semibold text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)]"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Refresh Hazards</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Road Hazards List */}
        <SectionCard
          title="Active Regional Hazards"
          subtitle="Landslide & weather alerts along transport corridors."
        >
          {loading ? (
            <LoadingState label="Loading hazard reports…" />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchIncidents} />
          ) : reports.length === 0 ? (
            <EmptyState title="NO ACTIVE HAZARDS" description="No road incidents reported along primary logistics corridors." />
          ) : (
            <div className="divide-y divide-[var(--adm-border)]">
              {reports.map((r) => {
                const isSelected = selectedIncident?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectIncident(r)}
                    className={`w-full text-left p-3 rounded-[var(--adm-radius)] transition flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-[var(--adm-primary-wash)] border border-[var(--adm-primary)]'
                        : 'hover:bg-[var(--adm-raised)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--adm-ink)] truncate">{r.title || 'Road Hazard'}</span>
                      <StatusBadge
                        tone={r.severity === 'CRITICAL' ? 'critical' : r.severity === 'HIGH' ? 'warning' : 'neutral'}
                        label={r.severity || 'MODERATE'}
                      />
                    </div>
                    <div className="text-[11px] text-[var(--adm-ink-2)] flex items-center justify-between">
                      <span>Location: {r.district || r.node_key || 'Cachar'}</span>
                      <span className="font-mono text-[10px] text-[var(--adm-ink-3)]">ID: #{r.id}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Right Column (2 cols): Downstream Operational Impact Chain */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Operational Impact Chain & Decision Support"
            subtitle="Incident → Corridor → Vehicle/Journey → Delivery Consequence."
          >
            {impactLoading ? (
              <LoadingState label="Computing corridor impact chain…" />
            ) : !selectedIncident ? (
              <EmptyState title="SELECT AN INCIDENT" description="Select a hazard from the left column to view logistics impact." />
            ) : !impactChain ? (
              <div className="py-8 text-center text-xs text-[var(--adm-ink-3)] italic">
                No downstream vehicle impact detected for this incident location.
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Impact Summary Banner */}
                <div className="p-3.5 bg-[var(--adm-raised)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--adm-ink)]">
                      Logistics Disruption Assessment: {impactChain.district}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--adm-ink-3)]">
                      Freshness: {impactChain.data_freshness_seconds || 5}s
                    </span>
                  </div>
                  <p className="text-xs text-[var(--adm-ink-2)] leading-relaxed">
                    {impactChain.supply_impact}
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-[var(--adm-border)]">
                    <span className="font-semibold text-[var(--adm-ink)]">Recommended Action:</span>
                    <span className="px-2 py-0.5 font-bold font-mono text-[11px] bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded">
                      {impactChain.recommended_action}
                    </span>
                  </div>
                </div>

                {/* Affected Highway Corridors */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--adm-ink-3)]">
                    Affected Highway Corridors ({impactChain.affected_corridors?.length || 0})
                  </span>
                  {impactChain.affected_corridors?.length === 0 ? (
                    <div className="p-2.5 bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded text-xs text-[var(--adm-ink-3)] italic">
                      No connecting highways currently obstructed.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {impactChain.affected_corridors?.map((cor: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[var(--adm-primary)]">{cor.highway_ref}</span>
                            <span className="text-[10px] font-mono font-bold text-[var(--adm-critical)]">
                              Risk: {cor.risk_score}/100
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--adm-ink-2)] mt-0.5">{cor.segment}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Affected Fleet Convoys */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--adm-ink-3)]">
                    Vehicles En-Route ({impactChain.affected_vehicles?.length || 0})
                  </span>
                  {impactChain.affected_vehicles?.length === 0 ? (
                    <div className="p-2.5 bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded text-xs text-[var(--adm-ink-3)] italic">
                      No fleet convoys currently scheduled along this specific corridor segment.
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--adm-border)] border border-[var(--adm-border)] rounded-[var(--adm-radius)] overflow-hidden">
                      {impactChain.affected_vehicles?.map((v: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-[var(--adm-surface)] flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-[var(--adm-primary)] mr-2">{v.code || v.vehicle_id}</span>
                            <span className="text-xs text-[var(--adm-ink-2)]">({v.driver || 'Driver'})</span>
                            <div className="text-[11px] text-[var(--adm-ink-3)]">Cargo: {v.cargo}</div>
                          </div>
                          <StatusBadge tone="warning" label="POTENTIAL DETOUR" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
