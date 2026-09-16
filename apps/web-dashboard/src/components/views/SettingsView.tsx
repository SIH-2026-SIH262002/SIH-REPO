import React from 'react';
import { Settings, Sliders, Radio, Globe, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../common/LanguageSelector';

export const SettingsView: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-black tracking-wide">{t('settings.title', 'Protocol Invariants & System Diagnostics')}</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t('settings.subtitle', 'View P2P hardware invariants, WPC regulatory bands, and audit-controlled risk thresholds.')}
          </p>
        </div>
      </div>

      {/* Language Preference Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {t('settings.languageSectionTitle', 'Language Preference')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('settings.languageSectionSubtitle', 'Choose the display language for this device. Applies immediately across every module.')}
              </p>
            </div>
          </div>
        </div>

        <LanguageSelector variant="inline" className="pt-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Risk Threshold Config */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t('settings.riskThresholds', 'Risk Score Thresholds')}</span>
            </h3>
            <span className="text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded font-mono font-bold flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>{t('settings.emergencyOnly', 'EMERGENCY ONLY')}</span>
            </span>
          </div>

          <div className="space-y-2.5 opacity-75">
            <div>
              <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                <span>{t('settings.highRiskThreshold', 'HIGH Risk Threshold Score')}</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">50.0</span>
              </div>
              <input type="range" min="30" max="70" defaultValue="50" disabled className="w-full accent-amber-600 cursor-not-allowed" />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                <span>{t('settings.criticalRiskThreshold', 'SEVERE / CRITICAL Risk Threshold Score')}</span>
                <span className="font-mono font-bold text-rose-700 dark:text-rose-400">70.0</span>
              </div>
              <input type="range" min="60" max="90" defaultValue="70" disabled className="w-full accent-rose-600 cursor-not-allowed" />
            </div>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
            {t('settings.thresholdNotice', 'Threshold adjustments require Emergency Operator authentication. All modifications are appended to audit log.')}
          </p>
        </div>

        {/* Read-Only BLE & LoRa Hardware Diagnostics */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('settings.hardwareInvariants', 'P2P Protocol Invariants (Read-Only)')}</span>
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded font-bold">
              {t('settings.verified', 'VERIFIED')}
            </span>
          </div>

          <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>BLE GATT Service UUID:</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">0000FE-NER-0000-1000</span>
            </div>
            <div className="flex justify-between">
              <span>BLE Max MTU Payload:</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">247 bytes</span>
            </div>
            <div className="flex justify-between">
              <span>LoRa Frequency Band:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">865.0 MHz (WPC India ISM)</span>
            </div>
            <div className="flex justify-between">
              <span>Maximum Relay Hops:</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">5 Hops</span>
            </div>
            <div className="flex justify-between">
              <span>Packet Time-to-Live (TTL):</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">12.0 Hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

