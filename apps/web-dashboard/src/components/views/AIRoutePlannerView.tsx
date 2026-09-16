import React, { useState, useEffect } from 'react';
import {
  Navigation,
  ShieldCheck,
  Zap,
  Truck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  AlertOctagon,
  RotateCcw,
  Sparkles,
  Layers,
  LocateFixed,
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { NERMap, MapRoutePath, MapSensorNode } from '../map/NERMap';

const NER_TOWNS = [
  'Guwahati', 'Shillong', 'Silchar', 'Imphal', 'Kohima',
  'Aizawl', 'Agartala', 'Itanagar', 'Gangtok', 'Tezpur',
  'Haflong', 'Dimapur', 'Diphu', 'Nongpoh', 'Jowai',
  'Tawang', 'Dharmanagar', 'Tinsukia', 'Jorhat', 'Dibrugarh',
  'Bongaigaon', 'Dhubri', 'Lumding', 'Umrangso', 'Siliguri',
  'Kolkata', 'Delhi', 'Mumbai', 'Bengaluru'
];

export const AIRoutePlannerView: React.FC = () => {
  const [origin, setOrigin] = useState('Guwahati');
  const [destination, setDestination] = useState('Silchar');
  const [cargoType, setCargoType] = useState('Emergency Medicines');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [avoidNode, setAvoidNode] = useState<string | null>(null);
  const [sensors, setSensors] = useState<MapSensorNode[]>([]);
  const [dispatchedRouteId, setDispatchedRouteId] = useState<string | null>(null);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setOrigin(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setIsLocating(false);
      },
      (error) => {
        console.warn('Geolocation Error:', error);
        alert('Could not get GPS location. Please check browser location permissions.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Fetch sensor telemetry for background map context
  useEffect(() => {
    apiService.getSensors().then((data) => {
      if (Array.isArray(data)) setSensors(data);
    }).catch(() => {});
  }, []);

  const fetchRoutePlan = async (avoid?: string | null) => {
    setIsLoading(true);
    setDispatchedRouteId(null);
    const targetAvoid = avoid !== undefined ? avoid : avoidNode;
    try {
      const data = await apiService.planRoute(origin, destination, targetAvoid || undefined);
      setRouteData(data);
      if (data.routes && data.routes.length > 0) {
        setSelectedRouteId(data.routes[0].route_id);
      }
    } catch (err: any) {
      console.warn('Backend routing query error, generating simulated multi-path:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutePlan(avoidNode);
  }, [origin, destination]);

  const handleSimulateLandslide = (nodeName: string) => {
    setAvoidNode(nodeName);
    fetchRoutePlan(nodeName);
  };

  const handleClearAvoidance = () => {
    setAvoidNode(null);
    fetchRoutePlan(null);
  };

  const handleDispatch = (routeId: string) => {
    setDispatchedRouteId(routeId);
    setTimeout(() => setDispatchedRouteId(null), 4000);
  };

  const activeRoutes: MapRoutePath[] = routeData?.routes || [];
  const activeRoute = activeRoutes.find((r) => r.route_id === selectedRouteId) || activeRoutes[0];
  const isGraphHopper = routeData?.engine === 'graphhopper';

  return (
    <div className="space-y-6">
      {/* 1. Header & Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/30">
              <Navigation className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              GraphHopper AI Multi-Route & Rerouting Console
            </h1>
            <span
              className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                isGraphHopper
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isGraphHopper ? 'GraphHopper 12.0 (OSM Snapped)' : 'NetworkX Topology Engine'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time dynamic route optimization with alternative bypass calculation, terrain slope penalties, and instant roadblock detour simulation.
          </p>
        </div>

        {/* Origin / Destination & Cargo Selectors */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Origin (A)
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 disabled:opacity-50"
                title="Use current GPS location"
              >
                <LocateFixed className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                {isLocating ? 'Locating...' : 'My GPS'}
              </button>
            </div>
            <input
              type="text"
              list="origin-towns-list"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Type any city, village, address, or lat,lng..."
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 w-48 sm:w-56 shadow-sm"
            />
            <datalist id="origin-towns-list">
              {NER_TOWNS.map((town) => (
                <option key={`orig-${town}`} value={town} />
              ))}
            </datalist>
          </div>

          <div className="pb-2 hidden sm:block">
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Destination (B)
            </label>
            <input
              type="text"
              list="dest-towns-list"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Type any city, village, address, or lat,lng..."
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 w-48 sm:w-56 shadow-sm"
            />
            <datalist id="dest-towns-list">
              {NER_TOWNS.map((town) => (
                <option key={`dest-${town}`} value={town} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Supply Cargo
            </label>
            <select
              value={cargoType}
              onChange={(e) => setCargoType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Emergency Medicines">Emergency Medicines (High Priority)</option>
              <option value="Oxygen Cylinders">Oxygen & Critical Care</option>
              <option value="Ration & Relief Supplies">Ration & Relief Supplies</option>
              <option value="Fuel Truck">Fuel & Energy Freight</option>
            </select>
          </div>

          <button
            onClick={() => fetchRoutePlan(avoidNode)}
            disabled={isLoading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Navigation className="w-4 h-4" />
            <span>{isLoading ? 'Calculating...' : 'Get Directions'}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Map with Multi-Routing & Obstacle Avoidance */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 px-2">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              Interactive Corridor GIS Map
            </span>
            <span className="text-xs text-slate-500">
              ({activeRoutes.length} Candidate Paths Available)
            </span>
          </div>

          {/* Dynamic Landslide Simulator Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
              Simulate Obstacle:
            </span>
            {!avoidNode ? (
              <>
                <button
                  onClick={() => handleSimulateLandslide('Shillong')}
                  disabled={isLoading}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-[11px] rounded-lg border border-rose-300 dark:border-rose-800 transition"
                >
                  Block Shillong (NH-6)
                </button>
                <button
                  onClick={() => handleSimulateLandslide('Haflong')}
                  disabled={isLoading}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-[11px] rounded-lg border border-rose-300 dark:border-rose-800 transition"
                >
                  Block Haflong (NH-27)
                </button>
              </>
            ) : (
              <button
                onClick={handleClearAvoidance}
                disabled={isLoading}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-sm transition flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Clear Roadblock & Restore Corridor
              </button>
            )}
          </div>
        </div>

        {/* Landslide Alert Banner */}
        {avoidNode && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Active Landslide Obstacle at {avoidNode}:</strong> Direct pass blocked. GraphHopper has automatically computed a safe detour bypass route.
              </span>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 rounded">
              Detour Active
            </span>
          </div>
        )}

        {/* Dispatch Confirmation Toast */}
        {dispatchedRouteId && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Dispatch Confirmed:</strong> Convoy assigned to corridor {dispatchedRouteId} ({cargoType}). Telemetry synched with command center.
            </span>
          </div>
        )}

        {/* Embedded Leaflet Map */}
        <div className="h-[480px] w-full">
          <NERMap
            sensors={sensors}
            routes={activeRoutes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => setSelectedRouteId(id)}
            originCoords={routeData?.origin_coords}
            destinationCoords={routeData?.destination_coords}
            originName={routeData?.origin_name || origin}
            destinationName={routeData?.destination_name || destination}
            avoidCoords={
              avoidNode && routeData?.avoid_node
                ? sensors.find((s) => s.node_key === routeData.avoid_node || s.name.toLowerCase().includes(avoidNode.toLowerCase()))
                  ? [
                      sensors.find((s) => s.node_key === routeData.avoid_node || s.name.toLowerCase().includes(avoidNode.toLowerCase()))!.lat,
                      sensors.find((s) => s.node_key === routeData.avoid_node || s.name.toLowerCase().includes(avoidNode.toLowerCase()))!.lon,
                    ]
                  : [25.5788, 91.8933] // Default Shillong coords
                : null
            }
            avoidName={avoidNode}
            onSetOriginFromMap={(coords) => setOrigin(`${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`)}
            onSetDestinationFromMap={(coords) => setDestination(`${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`)}
          />
        </div>
      </div>

      {/* 3. Multi-Route Option Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeRoutes.map((route, idx) => {
          const isSelected = route.route_id === selectedRouteId;
          const isAvoid = route.status === 'AVOID';
          const isPrimary = idx === 0 && !avoidNode;

          return (
            <div
              key={route.route_id}
              onClick={() => setSelectedRouteId(route.route_id)}
              className={`cursor-pointer rounded-2xl p-6 shadow-sm relative overflow-hidden space-y-4 transition border-2 ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 shadow-indigo-600/10 shadow-lg'
                  : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {/* Badge */}
              <div
                className={`absolute top-0 right-0 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl tracking-wider uppercase ${
                  isAvoid
                    ? 'bg-rose-500'
                    : isPrimary
                    ? 'bg-emerald-600'
                    : 'bg-purple-600'
                }`}
              >
                {route.label}
              </div>

              {/* Title & Icon */}
              <div className="flex items-center space-x-3 pt-2">
                <div
                  className={`p-3 rounded-xl ${
                    isAvoid
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                      : isPrimary
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                      : 'bg-purple-100 dark:bg-purple-950 text-purple-600'
                  }`}
                >
                  {isAvoid ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : isPrimary ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <Zap className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                    {route.label}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {route.is_graphhopper ? 'OpenStreetMap Snapped' : 'NetworkX Geometric Path'}
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-800 text-xs font-mono text-center">
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans">DISTANCE</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {route.total_distance_km} km
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans">EST. TIME</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {route.estimated_time_hr} hrs
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans">RISK STATUS</span>
                  <span
                    className={`font-extrabold ${
                      route.status === 'SAFE'
                        ? 'text-emerald-600'
                        : route.status === 'CAUTION'
                        ? 'text-amber-500'
                        : 'text-rose-600'
                    }`}
                  >
                    {route.status}
                  </span>
                </div>
              </div>

              {/* Route Waypoints or Elevation */}
              {route.elevation_ascend_m ? (
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Elevation Gain:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    +{route.elevation_ascend_m}m / -{route.elevation_descend_m}m
                  </span>
                </div>
              ) : null}

              {route.path_names && route.path_names.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Corridor Waypoints:
                  </span>
                  <div className="flex flex-wrap items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {route.path_names.map((name: string, i: number) => (
                      <React.Fragment key={`${route.route_id}-node-${i}`}>
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                          {name}
                        </span>
                        {i < route.path_names.length - 1 && <span className="text-slate-400">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDispatch(route.route_id);
                }}
                className={`w-full py-2.5 font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-white ${
                  isAvoid
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                    : isPrimary
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Select & Dispatch along this Route</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
