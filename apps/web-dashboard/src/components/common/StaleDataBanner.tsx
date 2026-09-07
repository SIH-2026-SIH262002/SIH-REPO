import React from 'react';
import { AlertCircle, RefreshCw, Radio, CheckCircle2 } from 'lucide-react';

interface DataHealthItem {
  name: string;
  status: 'LIVE' | 'STALE' | 'OFFLINE';
  lastUpdatedMinutesAgo: number;
}

interface StaleDataBannerProps {
  items?: DataHealthItem[];
  onRefresh?: () => void;
}

export const StaleDataBanner: React.FC<StaleDataBannerProps> = ({
  items = [
    { name: 'Vehicle Telemetry', status: 'LIVE', lastUpdatedMinutesAgo: 0 },
    { name: 'Shipment Stream', status: 'LIVE', lastUpdatedMinutesAgo: 0 },
    { name: 'Incident Feed', status: 'LIVE', lastUpdatedMinutesAgo: 2 },
    { name: 'Weather Sensors', status: 'STALE', lastUpdatedMinutesAgo: 11 },
  ],
  onRefresh,
}) => {
  const staleItems = items.filter((i) => i.status === 'STALE' || i.status === 'OFFLINE');
  if (staleItems.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-2.5 px-4 text-xs font-sans flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-2">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <div>
          <span className="font-bold text-amber-950">System Telemetry Warning: </span>
          <span className="text-amber-800 font-mono">
            {staleItems.map((s) => `${s.name} (${s.lastUpdatedMinutesAgo} min old)`).join(', ')}
          </span>
        </div>
      </div>

      <button
        onClick={onRefresh}
        className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 shrink-0"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Refresh Feeds</span>
      </button>
    </div>
  );
};
