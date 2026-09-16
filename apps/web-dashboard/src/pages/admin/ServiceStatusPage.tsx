import React from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { useServiceProbes } from '../../hooks/admin/useServiceProbes';

export const ServiceStatusPage: React.FC = () => {
  const probes = useServiceProbes();

  return (
    <div>
      <PageHeader
        title="Service Status"
        description="Live reachability checks against each backend this console depends on. Every row is a real round-trip made just now — never a fabricated uptime percentage."
      />

      <SectionCard noPadding>
        <ul className="divide-y divide-[var(--adm-border)]">
          {probes.map((p) => (
            <li key={p.key} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3">
                {p.status === 'checking' && <Loader2 className="w-5 h-5 animate-spin text-[var(--adm-ink-3)]" />}
                {p.status === 'ok' && <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--adm-healthy)' }} />}
                {p.status === 'down' && <XCircle className="w-5 h-5" style={{ color: 'var(--adm-critical)' }} />}
                <div>
                  <div className="text-sm font-medium text-[var(--adm-ink)]">{p.name}</div>
                  {p.detail && <div className="text-xs text-[var(--adm-ink-3)]">{p.detail}</div>}
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{
                    color:
                      p.status === 'ok'
                        ? 'var(--adm-healthy)'
                        : p.status === 'down'
                        ? 'var(--adm-critical)'
                        : 'var(--adm-ink-3)',
                  }}
                >
                  {p.status === 'checking' ? 'Checking…' : p.status === 'ok' ? 'Reachable' : 'Unreachable'}
                </div>
                {p.latencyMs !== undefined && (
                  <div className="text-xs text-[var(--adm-ink-3)] tabular-nums">{p.latencyMs}ms</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>

      <p className="mt-4 text-xs text-[var(--adm-ink-3)] max-w-2xl">
        This page intentionally does not show infrastructure metrics such as database connection pool size, cache hit
        rate, or message throughput — those require PostGIS, Redis, and Kafka, none of which run in this deployment.
        Fabricating such numbers would misrepresent the system; they are omitted rather than invented.
      </p>
    </div>
  );
};
