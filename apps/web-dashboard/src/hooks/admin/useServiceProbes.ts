import { useEffect, useState } from 'react';
import { apiClient as authClient } from '../../api/apiClient';
import { adminApi } from '../../api/adminApi';

export type ProbeStatus = 'checking' | 'ok' | 'degraded' | 'down';

export interface ServiceProbe {
  key: string;
  name: string;
  status: ProbeStatus;
  latencyMs?: number;
  detail?: string;
}

const timed = async (fn: () => Promise<unknown>): Promise<{ ok: boolean; ms: number; detail?: string }> => {
  const start = performance.now();
  try {
    await fn();
    return { ok: true, ms: Math.round(performance.now() - start) };
  } catch (err: any) {
    return {
      ok: false,
      ms: Math.round(performance.now() - start),
      detail: err?.response ? `HTTP ${err.response.status}` : 'Unreachable',
    };
  }
};

/**
 * Real liveness probes only -- never a fabricated percentage or a made-up
 * "PostGIS pool" number (spec §7/§B: NOT IMPLEMENTED infra telemetry is
 * omitted entirely, not stubbed). Each row here is a genuine HTTP round-trip.
 */
export function useServiceProbes() {
  const [probes, setProbes] = useState<ServiceProbe[]>([
    { key: 'gateway', name: 'FastAPI Gateway (operational data)', status: 'checking' },
    { key: 'auth', name: 'Auth Service (identity & lifecycle)', status: 'checking' },
    { key: 'ml', name: 'ML Risk Service', status: 'checking' },
    { key: 'ws', name: 'Live Telemetry WebSocket', status: 'checking' },
  ]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const gateway = await timed(() => adminApi.getHealth());
      const auth = await timed(() => authClient.get('/auth/me'));
      const ml = await timed(() => adminApi.getFeatureImportance());

      const wsUrl = (import.meta.env.VITE_WS_URL as string) || 'ws://localhost:8000/ws';
      const wsResult = await new Promise<{ ok: boolean; ms: number; detail?: string }>((resolve) => {
        const start = performance.now();
        let settled = false;
        try {
          const ws = new WebSocket(wsUrl);
          const timer = setTimeout(() => {
            if (!settled) {
              settled = true;
              ws.close();
              resolve({ ok: false, ms: Math.round(performance.now() - start), detail: 'Timed out' });
            }
          }, 4000);
          ws.onopen = () => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              ws.close();
              resolve({ ok: true, ms: Math.round(performance.now() - start) });
            }
          };
          ws.onerror = () => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              resolve({ ok: false, ms: Math.round(performance.now() - start), detail: 'Connection failed' });
            }
          };
        } catch {
          resolve({ ok: false, ms: 0, detail: 'Unsupported' });
        }
      });

      if (cancelled) return;
      setProbes([
        {
          key: 'gateway',
          name: 'FastAPI Gateway (operational data)',
          status: gateway.ok ? 'ok' : 'down',
          latencyMs: gateway.ms,
          detail: gateway.detail,
        },
        {
          key: 'auth',
          name: 'Auth Service (identity & lifecycle)',
          // /auth/me with no token correctly 401s -- that still proves the
          // service is up and enforcing auth, which is the point of the probe.
          status: auth.ok || auth.detail === 'HTTP 401' ? 'ok' : 'down',
          latencyMs: auth.ms,
          detail: auth.ok ? undefined : auth.detail,
        },
        {
          key: 'ml',
          name: 'ML Risk Service',
          status: ml.ok ? 'ok' : 'down',
          latencyMs: ml.ms,
          detail: ml.detail,
        },
        {
          key: 'ws',
          name: 'Live Telemetry WebSocket',
          status: wsResult.ok ? 'ok' : 'down',
          latencyMs: wsResult.ms,
          detail: wsResult.detail,
        },
      ]);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return probes;
}
