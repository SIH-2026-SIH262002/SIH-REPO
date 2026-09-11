import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../components/admin/primitives/PageHeader';
import { SectionCard } from '../../components/admin/primitives/SectionCard';
import { ROLE_INFO } from '../../types/admin';
import { UserRole } from '../../types/auth';

const ROLE_ORDER: UserRole[] = ['ADMIN', 'EMERGENCY_OPERATOR', 'LOGISTICS_OPERATOR', 'FIELD_OFFICER', 'DRIVER'];

/**
 * Read-only reference: what each canonical role means, who it represents,
 * its data scope, and its key access. Sourced verbatim from
 * docs/architecture/ROLE_MODEL.md. Role determines system capabilities --
 * this page exists so role assignment is never a "meaningless dropdown."
 */
export const RolesReferencePage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Roles & Access"
        description="The five canonical roles in NER LogiSense. Every account is provisioned with exactly one of these — role determines system capabilities and data scope."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ROLE_ORDER.map((roleKey) => {
          const info = ROLE_INFO[roleKey];
          return (
            <SectionCard key={roleKey}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-[var(--adm-primary-wash)] text-[var(--adm-primary)] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--adm-ink)]">{info.label}</h3>
                  <p className="text-xs text-[var(--adm-ink-3)]">{info.represents}</p>
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--adm-ink-3)]">
                    Operational responsibility
                  </dt>
                  <dd className="text-[var(--adm-ink-2)] mt-0.5">{info.responsibility}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--adm-ink-3)]">Scope</dt>
                  <dd className="text-[var(--adm-ink-2)] mt-0.5">{info.scope}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--adm-ink-3)]">
                    Key access
                  </dt>
                  <dd className="mt-1">
                    <ul className="space-y-1">
                      {info.keyAccess.map((item) => (
                        <li key={item} className="flex items-start gap-1.5 text-[var(--adm-ink-2)]">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--adm-primary)] shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
};
