/**
 * useAutoReroute
 * ---------------
 * Drop-in navigation brain for the "A -> Z via B/C/D, auto-avoid the
 * landslide-flagged leg" requirement.
 *
 * It does three jobs a map screen shouldn't have to know about:
 *   1. Fetches k candidate routes from the existing risk-aware planner
 *      (GET /api/routes/plan -> backend/app/services/routing_service.py),
 *      which already ranks routes SAFE < CAUTION < AVOID from live sensor risk.
 *   2. Listens on the backend's live sensor feed (WS /ws) for risk changes and,
 *      on any HIGH/SEVERE update or storm event, re-asks the planner whether
 *      the currently active route is still the best one. Falls back to a
 *      30s poll if the socket is ever unavailable, so rerouting still works
 *      even if the WS drops.
 *   3. Converts the winning route's node sequence into lat/lng coordinates
 *      ready to hand straight to a <Polyline coordinates={...}> on
 *      react-native-maps (or an equivalent MapLibre/webview layer) --
 *      whatever Anshuman's map component turns out to be.
 *
 * Usage in any map screen:
 *
 *   const {
 *     activeRoute, routeCoordinates, alternateRoutes,
 *     isRerouting, rerouteAlert, dismissRerouteAlert,
 *   } = useAutoReroute({ origin: 'GHY', destination: 'SLC', enabled: isNavigating });
 *
 *   <Polyline coordinates={routeCoordinates} strokeColor={
 *     activeRoute?.status === 'AVOID' ? 'red' : activeRoute?.status === 'CAUTION' ? 'orange' : 'green'
 *   } />
 *
 * NOTE ON SCOPE: the planner's graph is 18 towns / ~20 highway segments
 * (backend/app/graph_data.py), not turn-by-turn OSM geometry. The polyline
 * this hook returns is a waypoint-to-waypoint line through those towns --
 * correct for "avoid the dangerous corridor, take the other one" demo
 * behaviour, but not lane-level navigation. If real road-following polylines
 * are needed later, feed this hook's `activeRoute.path` node sequence as
 * waypoints into an OSM-based router (GraphHopper/OSRM/Valhalla) purely for
 * geometry -- keep this hook as the thing that decides WHICH towns to route
 * through.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '../api/client';
import { routesApi } from '../api/routes';

export type RouteStatus = 'SAFE' | 'CAUTION' | 'AVOID';

export interface RouteSegment {
  from: string;
  from_name: string;
  to: string;
  to_name: string;
  distance_km: number;
  time_hr: number;
  highway_ref: string;
  risk_score: number;
  category: string;
  storm_event: boolean;
  manually_flagged: boolean;
  flagged: boolean;
  blocked: boolean;
}

export interface PlannedRoute {
  route_id: string;
  label: string;
  path: string[]; // node keys, e.g. ["GHY", "NGP", "SHL"]
  path_names: string[];
  segments: RouteSegment[];
  total_distance_km: number;
  estimated_time_hr: number;
  max_segment_risk: number;
  status: RouteStatus;
  any_segment_blocked: boolean;
}

interface LatLng {
  latitude: number;
  longitude: number;
}

interface RerouteAlert {
  id: string;
  message: string;
  previousRoute: PlannedRoute;
  newRoute: PlannedRoute;
  createdAt: string;
}

interface UseAutoRerouteOptions {
  origin: string | null;
  destination: string | null;
  enabled?: boolean;
  /** How many candidate routes to request each replan. Higher = the active
   * route is more likely to still show up (with its current status) even
   * after it slips out of the top choices. */
  k?: number;
  /** Minimum ms between forced replans, to avoid hammering the API when a
   * burst of sensor_update ticks arrives over the socket. */
  replanCooldownMs?: number;
  /** Poll interval used as a safety net when the WS is unavailable. */
  pollIntervalMs?: number;
}

const STATUS_RANK: Record<RouteStatus, number> = { SAFE: 0, CAUTION: 1, AVOID: 2 };

function sameRoute(a: PlannedRoute | null, b: PlannedRoute | null): boolean {
  if (!a || !b) return a === b;
  return a.path.length === b.path.length && a.path.every((n, i) => n === b.path[i]);
}

function wsUrlFromApiBase(): string {
  const apiBase = (apiClient.defaults.baseURL as string) || 'http://10.0.2.2:8000';
  return apiBase.replace(/^http/i, 'ws').replace(/\/$/, '') + '/ws';
}

export function useAutoReroute({
  origin,
  destination,
  enabled = true,
  k = 5,
  replanCooldownMs = 5000,
  pollIntervalMs = 30000,
}: UseAutoRerouteOptions) {
  const [activeRoute, setActiveRoute] = useState<PlannedRoute | null>(null);
  const [alternateRoutes, setAlternateRoutes] = useState<PlannedRoute[]>([]);
  const [nodeCoords, setNodeCoords] = useState<Record<string, LatLng>>({});
  const [isRerouting, setIsRerouting] = useState(false);
  const [rerouteAlert, setRerouteAlert] = useState<RerouteAlert | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeRouteRef = useRef<PlannedRoute | null>(null);
  const lastReplanAtRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    activeRouteRef.current = activeRoute;
  }, [activeRoute]);

  // Fetch node lat/lon once so we can turn a path (node key list) into a polyline.
  useEffect(() => {
    let cancelled = false;
    routesApi
      .getNodes()
      .then((nodes: Array<{ key: string; lat: number; lon: number }>) => {
        if (cancelled) return;
        const map: Record<string, LatLng> = {};
        for (const n of nodes) map[n.key] = { latitude: n.lat, longitude: n.lon };
        setNodeCoords(map);
      })
      .catch(() => {
        /* non-fatal: polyline just won't render until nodes are fetched */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const replan = useCallback(
    async (force = false) => {
      if (!enabled || !origin || !destination) return;
      const now = Date.now();
      if (!force && now - lastReplanAtRef.current < replanCooldownMs) return;
      lastReplanAtRef.current = now;

      try {
        setIsRerouting(true);
        const result = await routesApi.planRoute(origin, destination, k);
        const routes: PlannedRoute[] = result.routes || [];
        if (routes.length === 0) {
          setError('No route found between origin and destination.');
          return;
        }

        const best = routes[0]; // already sorted SAFE < CAUTION < AVOID, then time
        const current = activeRouteRef.current;

        if (!current) {
          // First plan of this navigation session.
          setActiveRoute(best);
          setAlternateRoutes(routes.slice(1));
          return;
        }

        // Find how the CURRENTLY driven path is faring right now (it may have
        // fallen out of the top-k, in which case treat it as worst-case AVOID).
        const currentLive = routes.find((r) => sameRoute(r, current));
        const currentStatus: RouteStatus = currentLive?.status ?? 'AVOID';

        const shouldSwitch =
          !sameRoute(best, current) &&
          (currentStatus === 'AVOID' || STATUS_RANK[best.status] < STATUS_RANK[currentStatus]);

        if (shouldSwitch) {
          const dangerSegment = (currentLive ?? current).segments.find((s) => s.blocked || s.flagged);
          setRerouteAlert({
            id: `REROUTE-${now}`,
            message: dangerSegment
              ? `⚠️ Landslide risk detected near ${dangerSegment.from_name} → ${dangerSegment.to_name}. Rerouting via ${best.path_names.join(' → ')}.`
              : `⚠️ Current route degraded to ${currentStatus}. Rerouting via ${best.path_names.join(' → ')}.`,
            previousRoute: currentLive ?? current,
            newRoute: best,
            createdAt: new Date().toISOString(),
          });
          setActiveRoute(best);
          setAlternateRoutes(routes.filter((r) => !sameRoute(r, best)));
        } else if (currentLive) {
          // Keep the same route but refresh its live risk numbers.
          setActiveRoute(currentLive);
          setAlternateRoutes(routes.filter((r) => !sameRoute(r, currentLive)));
        }
        setError(null);
      } catch (e: any) {
        setError(e?.message || 'Failed to (re)plan route.');
      } finally {
        setIsRerouting(false);
      }
    },
    [enabled, origin, destination, k, replanCooldownMs]
  );

  // Initial plan + whenever origin/destination changes.
  useEffect(() => {
    activeRouteRef.current = null;
    setActiveRoute(null);
    setAlternateRoutes([]);
    setRerouteAlert(null);
    if (enabled && origin && destination) {
      replan(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, enabled]);

  // Live trigger: backend sensor feed. Any HIGH/SEVERE update or storm event
  // near the corridor is a cheap signal to "go re-ask the planner" -- the
  // planner itself (not this hook) is the source of truth on which segments
  // are actually blocked.
  useEffect(() => {
    if (!enabled || !origin || !destination) return;

    let stopped = false;

    function connect() {
      if (stopped) return;
      try {
        const socket = new WebSocket(wsUrlFromApiBase());
        wsRef.current = socket;

        socket.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data);
            const category = msg?.data?.category;
            const stormEvent = msg?.data?.storm_event;
            if (msg?.kind === 'alert' || category === 'HIGH' || category === 'SEVERE' || stormEvent) {
              replan(true);
            }
          } catch {
            /* ignore malformed frame */
          }
        };
        socket.onerror = () => {
          /* let onclose handle reconnect */
        };
        socket.onclose = () => {
          if (!stopped) setTimeout(connect, 4000); // simple backoff-and-retry
        };
      } catch {
        // WebSocket unsupported/blocked -- polling fallback below still runs.
      }
    }

    connect();

    // Safety net: even with a healthy socket, re-check periodically in case
    // an event was missed (app backgrounded, socket silently stalled, etc).
    pollRef.current = setInterval(() => replan(false), pollIntervalMs);

    return () => {
      stopped = true;
      wsRef.current?.close();
      wsRef.current = null;
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, origin, destination, pollIntervalMs, replan]);

  const routeCoordinates: LatLng[] = useMemo(() => {
    if (!activeRoute) return [];
    return activeRoute.path.map((key) => nodeCoords[key]).filter(Boolean) as LatLng[];
  }, [activeRoute, nodeCoords]);

  const dismissRerouteAlert = useCallback(() => setRerouteAlert(null), []);

  return {
    activeRoute,
    alternateRoutes,
    routeCoordinates,
    isRerouting,
    rerouteAlert,
    dismissRerouteAlert,
    error,
    /** Manual "recheck now" escape hatch, e.g. a pull-to-refresh on the map. */
    replanNow: () => replan(true),
  };
}
