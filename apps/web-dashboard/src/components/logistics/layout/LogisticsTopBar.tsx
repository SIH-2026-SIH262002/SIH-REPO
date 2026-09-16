import React, { useState, useEffect } from 'react';
import { Menu, Radio, Clock, ShieldCheck } from 'lucide-react';
import { DataProvenanceBadge } from '../../admin/primitives/DataProvenanceBadge';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../../common/LanguageSelector';

interface LogisticsTopBarProps {
  onToggleSidebar: () => void;
}

export const LogisticsTopBar: React.FC<LogisticsTopBarProps> = ({ onToggleSidebar }) => {
  const { isConnected } = useWebSocket();
  const [timeStr, setTimeStr] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 border-b border-[var(--adm-border)] bg-[var(--adm-surface)] px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left: Mobile Toggle & Government Heading */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-[var(--adm-radius)] text-[var(--adm-ink-2)] hover:bg-[var(--adm-raised)]"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 text-[var(--adm-primary)] shrink-0 hidden sm:inline-block" />
          <div className="min-w-0">
            <h1 className="text-xs md:text-sm font-bold text-[var(--adm-ink)] tracking-tight truncate">
              {t('logistics.consoleTitle', 'Regional Fleet & Supply Operations')}
            </h1>
            <p className="text-[10px] text-[var(--adm-ink-3)] truncate hidden sm:block">
              {t('logistics.regionalOps', 'North Eastern Operations')} — {t('nav.logistics.brand', 'NER LOGISENSE')}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Language Selector, Telemetry Provenance, Connection Status & Live Clock */}
      <div className="flex items-center gap-3 shrink-0">
        <LanguageSelector variant="header" />

        <div className="flex items-center gap-1.5 hidden sm:flex">
          <DataProvenanceBadge kind="SIMULATED" compact />
          <span className="text-[10px] text-[var(--adm-ink-3)] font-mono">GPS TELEMETRY</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--adm-radius)] bg-[var(--adm-raised)] border border-[var(--adm-border)] text-[11px] font-mono text-[var(--adm-ink-2)]">
          <Radio
            className={`w-3 h-3 ${isConnected ? 'text-[var(--adm-healthy)] animate-pulse' : 'text-[var(--adm-warning)]'}`}
          />
          <span className="hidden md:inline font-semibold">
            {isConnected ? t('header.streamActive', 'STREAM ACTIVE') : t('header.polling', 'POLLING')}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--adm-ink-2)] bg-[var(--adm-raised)] px-2 py-1 rounded-[var(--adm-radius)] border border-[var(--adm-border)]">
          <Clock className="w-3 h-3 text-[var(--adm-ink-3)]" />
          <span className="tabular-nums">{timeStr}</span>
        </div>
      </div>
    </header>
  );
};

