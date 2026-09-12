import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '../../context/ThemeContext';

export interface MapSensorNode {
  node_key: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
  risk_score: number;
  category: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  soil_moisture_pct?: number;
  vibration_intensity?: number;
  rainfall_mm_last_24h?: number;
  rainfall_mm_last_72h?: number;
  slope_angle_deg?: number;
}

export interface MapVehicle {
  id: string;
  code: string;
  driver: string;
  status: 'IN_TRANSIT' | 'DELAYED' | 'AT_RISK' | 'OFFLINE';
  location: { lat: number; lng: number };
  origin: string;
  destination: string;
  cargo: string;
}

export interface MapRoutePath {
  route_id: string;
  label: string;
  total_distance_km: number;
  estimated_time_hr: number;
  status: 'SAFE' | 'CAUTION' | 'AVOID' | string;
  coordinates: [number, number][]; // [lat, lon]
  is_graphhopper?: boolean;
}

interface NERMapProps {
  sensors?: MapSensorNode[];
  vehicles?: MapVehicle[];
  selectedVehicle?: MapVehicle | null;
  onSelectVehicle?: (v: MapVehicle) => void;
  onSelectNode?: (nodeKey: string) => void;
  // GraphHopper & Multi-Routing additions
  routes?: MapRoutePath[];
  selectedRouteId?: string | null;
  onSelectRoute?: (routeId: string) => void;
  originCoords?: [number, number] | null;
  destinationCoords?: [number, number] | null;
  originName?: string | null;
  destinationName?: string | null;
  avoidCoords?: [number, number] | null;
  avoidName?: string | null;
}

// Center of North Eastern Region (Assam / Meghalaya / Central NER)
const NER_CENTER: [number, number] = [26.15, 92.93];

const MapFlyToController: React.FC<{ selectedVehicle?: MapVehicle | null }> = ({ selectedVehicle }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedVehicle && selectedVehicle.location) {
      map.flyTo([selectedVehicle.location.lat, selectedVehicle.location.lng], 9, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [selectedVehicle, map]);
  return null;
};

const MapRouteBoundsController: React.FC<{ routes?: MapRoutePath[] }> = ({ routes }) => {
  const map = useMap();
  useEffect(() => {
    if (routes && routes.length > 0 && routes[0].coordinates.length > 1) {
      try {
        const bounds = L.latLngBounds(routes[0].coordinates);
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 11, animate: true });
      } catch {
        // Safe fallback
      }
    }
  }, [routes, map]);
  return null;
};

const createLandmarkIcon = (label: string, color: string) => {
  return L.divIcon({
    className: 'custom-landmark-marker',
    html: `
      <div style="background-color: ${color}; border: 2.5px solid #ffffff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 12px; font-family: sans-serif; box-shadow: 0 4px 14px rgba(0,0,0,0.5);">
        ${label}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const createHazardIcon = () => {
  return L.divIcon({
    className: 'custom-hazard-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="background-color: #ef4444; border: 2px solid #ffffff; border-radius: 8px; padding: 4px; display: flex; align-items: center; justify-content: center; color: #ffffff; box-shadow: 0 4px 14px rgba(239,68,68,0.6);">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Create SVG vehicle div icon
const createVehicleMarkerIcon = (status: string) => {
  let color = '#10b981'; // Green
  if (status === 'DELAYED') color = '#f59e0b'; // Amber
  if (status === 'AT_RISK') color = '#ef4444'; // Red
  if (status === 'OFFLINE') color = '#64748b'; // Slate

  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; display: flex; items-center; justify-content: center; width: 32px; height: 32px;">
        <div style="background-color: ${color}; border: 2px solid #ffffff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14v10"/>
            <circle cx="7" cy="18" r="2"/>
            <circle cx="17" cy="18" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const NERMap: React.FC<NERMapProps> = ({
  sensors = [],
  vehicles = [],
  selectedVehicle,
  onSelectVehicle,
  onSelectNode,
  routes = [],
  selectedRouteId,
  onSelectRoute,
  originCoords,
  destinationCoords,
  originName,
  destinationName,
  avoidCoords,
  avoidName,
}) => {
  const { theme } = useTheme();

  // Choose Leaflet Map Tile Layer based on active Light vs Dark theme
  const tileUrl =
    theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const tileAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  const activeRouteId = selectedRouteId || (routes.length > 0 ? routes[0].route_id : null);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
      <MapContainer
        center={NER_CENTER}
        zoom={7}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
      >
        <TileLayer url={tileUrl} attribution={tileAttribution} maxZoom={18} />
        <MapFlyToController selectedVehicle={selectedVehicle} />
        <MapRouteBoundsController routes={routes} />

        {/* 1. GraphHopper & AI Rerouting Polyline Layers */}
        {routes.map((route, idx) => {
          const isSelected = route.route_id === activeRouteId;
          const isAvoid = route.status === 'AVOID';

          let strokeColor = '#3b82f6'; // Blue default
          if (isAvoid) {
            strokeColor = '#ef4444'; // Red blocked
          } else if (isSelected) {
            strokeColor = route.status === 'SAFE' ? '#10b981' : '#f59e0b';
          } else {
            strokeColor = idx === 1 ? '#8b5cf6' : '#f97316'; // Purple or Orange
          }

          return (
            <React.Fragment key={`route-${route.route_id}-${idx}`}>
              {/* Glow for selected route */}
              {isSelected && (
                <Polyline
                  positions={route.coordinates}
                  pathOptions={{
                    color: strokeColor,
                    weight: 12,
                    opacity: 0.25,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              )}

              {/* Main Corridor Polyline */}
              <Polyline
                positions={route.coordinates}
                pathOptions={{
                  color: strokeColor,
                  weight: isSelected ? 5.5 : 3.5,
                  opacity: isSelected ? 0.95 : 0.6,
                  dashArray: isSelected ? undefined : '6, 8',
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
                eventHandlers={{
                  click: () => {
                    if (onSelectRoute) onSelectRoute(route.route_id);
                  },
                }}
              >
                <Tooltip sticky>
                  <div className="text-[11px] font-sans">
                    <span className="font-extrabold block">{route.label}</span>
                    <span className="text-slate-500">
                      {route.total_distance_km} km • {route.estimated_time_hr} hrs
                    </span>
                    <span
                      className={`ml-1 font-bold ${
                        route.status === 'SAFE' ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      ({route.status})
                    </span>
                    {route.is_graphhopper && (
                      <span className="block text-[9px] text-indigo-500 font-bold">
                        ⚡ GraphHopper OSM Snapped
                      </span>
                    )}
                  </div>
                </Tooltip>
              </Polyline>
            </React.Fragment>
          );
        })}

        {/* 2. Route Origin Landmark Pin */}
        {originCoords && (
          <Marker position={originCoords} icon={createLandmarkIcon('A', '#10b981')}>
            <Tooltip permanent direction="top" offset={[0, -10]}>
              <span className="font-extrabold text-[10px] uppercase">
                Origin: {originName || 'A'}
              </span>
            </Tooltip>
          </Marker>
        )}

        {/* 3. Route Destination Landmark Pin */}
        {destinationCoords && (
          <Marker position={destinationCoords} icon={createLandmarkIcon('B', '#2563eb')}>
            <Tooltip permanent direction="top" offset={[0, -10]}>
              <span className="font-extrabold text-[10px] uppercase">
                Destination: {destinationName || 'B'}
              </span>
            </Tooltip>
          </Marker>
        )}

        {/* 4. Active Hazard / Roadblock Marker */}
        {avoidCoords && (
          <Marker position={avoidCoords} icon={createHazardIcon()}>
            <Tooltip permanent direction="bottom" offset={[0, 10]}>
              <span className="font-extrabold text-[10px] text-rose-600 uppercase">
                ROADBLOCK: {avoidName || 'Hazard Zone'}
              </span>
            </Tooltip>
            <Circle
              center={avoidCoords}
              radius={18000}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.35,
                weight: 2,
                dashArray: '4, 6',
              }}
            />
          </Marker>
        )}

        {/* 5. Sensor Nodes & ML Risk Heat Circles */}
        {sensors.map((sensor) => {
          let circleColor = '#10b981'; // Green (LOW)
          if (sensor.category === 'MODERATE' || (sensor.risk_score >= 25 && sensor.risk_score < 50))
            circleColor = '#f59e0b'; // Amber
          if (sensor.category === 'HIGH' || (sensor.risk_score >= 50 && sensor.risk_score < 70))
            circleColor = '#f97316'; // Orange
          if (sensor.category === 'SEVERE' || sensor.risk_score >= 70)
            circleColor = '#ef4444'; // Red

          const radiusMeters = 15000 + (sensor.risk_score || 20) * 150;

          return (
            <React.Fragment key={sensor.node_key}>
              <Circle
                center={[sensor.lat, sensor.lon]}
                radius={radiusMeters}
                pathOptions={{
                  color: circleColor,
                  fillColor: circleColor,
                  fillOpacity: sensor.category === 'SEVERE' ? 0.45 : 0.25,
                  weight: sensor.category === 'SEVERE' ? 3 : 1.5,
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-2 space-y-2 min-w-[200px]">
                    <div className="flex items-center justify-between border-b pb-1">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                        {sensor.name}
                      </span>
                      <span
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: circleColor }}
                      >
                        {sensor.category} ({sensor.risk_score}/100)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                      <div>
                        <span className="text-slate-500 block text-[9px]">MOISTURE</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {sensor.soil_moisture_pct?.toFixed(0) || '32'}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">24H RAIN</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {sensor.rainfall_mm_last_24h?.toFixed(0) || '12'}mm
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">VIBRATION</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {sensor.vibration_intensity?.toFixed(1) || '1.2'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">SLOPE</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {sensor.slope_angle_deg || '24'}°
                        </span>
                      </div>
                    </div>

                    {onSelectNode && (
                      <button
                        onClick={() => onSelectNode(sensor.node_key)}
                        className="w-full mt-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded transition"
                      >
                        Inspect AI Risk Details
                      </button>
                    )}
                  </div>
                </Popup>
                <Tooltip permanent={sensor.category === 'SEVERE'} direction="top" offset={[0, -10]}>
                  <span className="font-bold text-[10px] uppercase">{sensor.name}</span>
                </Tooltip>
              </Circle>
            </React.Fragment>
          );
        })}

        {/* 6. Live GPS Tracked Vehicles */}
        {vehicles.map((v) => (
          <Marker
            key={v.id}
            position={[v.location.lat, v.location.lng]}
            icon={createVehicleMarkerIcon(v.status)}
            eventHandlers={{
              click: () => {
                if (onSelectVehicle) onSelectVehicle(v);
              },
            }}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-1 space-y-1">
                <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span>{v.code} ({v.driver})</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
                    {v.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400">
                  Route: {v.origin} → {v.destination}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold truncate">
                  Cargo: {v.cargo}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Sleek Overlay Map Legend & Mode Badge */}
      <div className="absolute top-3 right-3 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-xs space-y-1.5">
        <div className="font-bold text-[11px] text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between gap-2">
          <span>GIS Network Legend</span>
          {routes.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold rounded">
              {routes[0]?.is_graphhopper ? '⚡ GraphHopper' : 'NetworkX'}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 text-[10px]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-600 dark:text-slate-300">LOW Risk / Recommended</span>
        </div>
        <div className="flex items-center space-x-2 text-[10px]">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-slate-600 dark:text-slate-300">MODERATE Risk (25-50)</span>
        </div>
        <div className="flex items-center space-x-2 text-[10px]">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="font-bold text-rose-600 dark:text-rose-400">HIGH / Blocked Detour</span>
        </div>
        {routes.length > 0 && (
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2 text-[10px]">
            <span className="w-3 h-1 bg-purple-500 rounded" />
            <span className="text-slate-600 dark:text-slate-300">Alternate Corridor</span>
          </div>
        )}
      </div>
    </div>
  );
};

