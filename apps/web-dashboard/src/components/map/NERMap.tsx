import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, Polyline, useMap, useMapEvents } from 'react-leaflet';
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
  phone?: string;
  status: 'IN_TRANSIT' | 'DELAYED' | 'AT_RISK' | 'OFFLINE' | string;
  location: { lat: number; lng: number };
  origin: string;
  destination: string;
  cargo: string;
  speed_kmh?: number;
  eta?: string;
  eta_minutes?: number;
  remaining_distance_km?: number;
  route_label?: string;
  route_path_names?: string[];
  route_coordinates?: [number, number][];
  current_segment?: string;
  last_updated?: string;
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

export interface MapMedicalFacility {
  id: string;
  name: string;
  type: 'HOSPITAL' | 'OXYGEN_BANK' | 'TRAUMA_CENTER';
  district: string;
  lat: number;
  lng: number;
  contact: string;
}

export const DEFAULT_MEDICAL_FACILITIES: MapMedicalFacility[] = [
  {
    id: 'med-gmch',
    name: 'Gauhati Medical College & Hospital (GMCH)',
    type: 'HOSPITAL',
    district: 'Kamrup Metropolitan (Guwahati)',
    lat: 26.1558,
    lng: 91.7907,
    contact: '+91-361-2529457',
  },
  {
    id: 'med-smch',
    name: 'Silchar Medical College & Hospital (SMCH)',
    type: 'TRAUMA_CENTER',
    district: 'Cachar (Silchar)',
    lat: 24.8333,
    lng: 92.7789,
    contact: '+91-3842-240108',
  },
  {
    id: 'med-haflong',
    name: 'Haflong Civil Hospital & Emergency Depot',
    type: 'OXYGEN_BANK',
    district: 'Dima Hasao (Haflong)',
    lat: 25.1800,
    lng: 92.6800,
    contact: '+91-3673-236224',
  },
  {
    id: 'med-neigrihms',
    name: 'NEIGRIHMS Super-Specialty Hospital',
    type: 'TRAUMA_CENTER',
    district: 'East Khasi Hills (Shillong)',
    lat: 25.5941,
    lng: 91.9360,
    contact: '+91-364-2538025',
  },
  {
    id: 'med-trihms',
    name: 'Tomo Riba Institute (TRIHMS)',
    type: 'HOSPITAL',
    district: 'Papum Pare (Itanagar/Naharlagun)',
    lat: 27.1000,
    lng: 93.6800,
    contact: '+91-360-2244228',
  },
  {
    id: 'med-agartala',
    name: 'Agartala Govt Medical College & GB Pant Hospital',
    type: 'HOSPITAL',
    district: 'West Tripura (Agartala)',
    lat: 23.8315,
    lng: 91.2868,
    contact: '+91-381-2356701',
  },
  {
    id: 'med-amch',
    name: 'Assam Medical College (AMCH Dibrugarh)',
    type: 'TRAUMA_CENTER',
    district: 'Dibrugarh',
    lat: 27.4728,
    lng: 94.9120,
    contact: '+91-373-2300080',
  },
  {
    id: 'med-stnm',
    name: 'STNM Multi-Specialty Hospital',
    type: 'HOSPITAL',
    district: 'East Sikkim (Gangtok)',
    lat: 27.3314,
    lng: 88.6138,
    contact: '+91-3592-202944',
  },
];

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
  // Interactive click-to-pin real-life map additions
  onSetOriginFromMap?: (coords: [number, number]) => void;
  onSetDestinationFromMap?: (coords: [number, number]) => void;
  onReportLandslideFromMap?: (coords: [number, number]) => void;
  handoverLocations?: {
    id?: string;
    lat: number;
    lng: number;
    label: string;
    isSafePoint?: boolean;
    locationType?: string;
  }[];
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

const createHandoverLocationIcon = (isSafePoint: boolean) => {
  const bg = isSafePoint ? '#059669' : '#d97706';
  const symbol = isSafePoint ? '🛡️' : '📍';
  return L.divIcon({
    className: 'custom-handover-marker',
    html: `
      <div style="background-color: ${bg}; border: 2.5px solid #ffffff; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.4);">
        ${symbol}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Create SVG vehicle div icon
const createVehicleMarkerIcon = (status: string, isSelected: boolean = false) => {
  let color = '#10b981'; // Green
  if (status === 'DELAYED') color = '#f59e0b'; // Amber
  if (status === 'AT_RISK') color = '#ef4444'; // Red
  if (status === 'OFFLINE') color = '#64748b'; // Slate

  const selectedRing = isSelected ? `
    <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background-color: rgba(99, 102, 241, 0.35); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
    <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; border: 2.5px dashed #4f46e5; animation: spin 4s linear infinite;"></div>
  ` : '';

  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
        ${selectedRing}
        <div style="background-color: ${isSelected ? '#4f46e5' : color}; border: ${isSelected ? '3px' : '2px'} solid #ffffff; border-radius: 50%; width: ${isSelected ? '32px' : '28px'}; height: ${isSelected ? '32px' : '28px'}; display: flex; align-items: center; justify-content: center; color: #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.5); z-index: 10;">
          <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? '16' : '14'}" height="${isSelected ? '16' : '14'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14v10"/>
            <circle cx="7" cy="18" r="2"/>
            <circle cx="17" cy="18" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

// Create Medical & Emergency Facility Icon
const createMedicalMarkerIcon = (type: string) => {
  let bgColor = '#ef4444'; // Red for Hospital
  if (type === 'OXYGEN_BANK') bgColor = '#0284c7'; // Blue for Oxygen Depot
  if (type === 'TRAUMA_CENTER') bgColor = '#dc2626'; // Dark Red for Trauma Center

  return L.divIcon({
    className: 'custom-medical-marker',
    html: `
      <div style="background-color: ${bgColor}; border: 2px solid #ffffff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 14px; font-family: sans-serif; box-shadow: 0 4px 12px rgba(239,68,68,0.6);">
        ✚
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const MapClickCapture: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const NERMap: React.FC<NERMapProps> = React.memo(({
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
  onSetOriginFromMap,
  onSetDestinationFromMap,
  onReportLandslideFromMap,
  handoverLocations = [],
}) => {
  const { theme } = useTheme();
  const [showMedical, setShowMedical] = React.useState(true);
  const [clickedPoint, setClickedPoint] = React.useState<[number, number] | null>(null);

  // Strictly use MapmyIndia (Mappls) per project requirements
  const mapplsKey = (import.meta.env.VITE_MAPPLS_API_KEY || import.meta.env.VITE_MAP_API_KEY || '13c08b6e6270d3d28754bb1db21eecf9').trim();

  // Official MapmyIndia Survey of India compliant raster tile layer
  const tileUrl = `https://apis.mappls.com/advancedmaps/v1/${mapplsKey}/still_map/{z}/{x}/{y}.png`;
  const tileAttribution = '&copy; <a href="https://www.mapmyindia.com" target="_blank" rel="noreferrer">MapmyIndia Mappls | Survey of India</a>';

  const activeRouteId = selectedRouteId || (routes.length > 0 ? routes[0].route_id : null);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
      <MapContainer
        center={NER_CENTER}
        zoom={7}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
        preferCanvas={true}
      >
        <TileLayer
          url={tileUrl}
          attribution={tileAttribution}
          maxZoom={18}
          keepBuffer={4}
          updateWhenIdle={false}
          updateWhenZooming={false}
        />
        <MapFlyToController selectedVehicle={selectedVehicle} />
        <MapRouteBoundsController routes={routes} />
        <MapClickCapture onMapClick={(lat, lng) => setClickedPoint([lat, lng])} />

        {/* Interactive Click-on-Map Context Pin */}
        {clickedPoint && (
          <Marker position={clickedPoint} icon={createLandmarkIcon('📍', '#6366f1')}>
            <Popup className="custom-leaflet-popup">
              <div className="p-2 space-y-2 min-w-[190px]">
                <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 border-b pb-1 flex items-center justify-between">
                  <span>📍 Selected Map Pin</span>
                  <button onClick={() => setClickedPoint(null)} className="text-[10px] text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {clickedPoint[0].toFixed(4)}, {clickedPoint[1].toFixed(4)}
                </div>
                <div className="space-y-1.5 pt-1">
                  {onSetOriginFromMap && (
                    <button
                      onClick={() => {
                        onSetOriginFromMap(clickedPoint);
                        setClickedPoint(null);
                      }}
                      className="w-full text-[11px] font-bold py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition flex items-center justify-center gap-1"
                    >
                      🟢 Set as Origin (A)
                    </button>
                  )}
                  {onSetDestinationFromMap && (
                    <button
                      onClick={() => {
                        onSetDestinationFromMap(clickedPoint);
                        setClickedPoint(null);
                      }}
                      className="w-full text-[11px] font-bold py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition flex items-center justify-center gap-1"
                    >
                      🔵 Set as Destination (B)
                    </button>
                  )}
                  {onReportLandslideFromMap && (
                    <button
                      onClick={() => {
                        onReportLandslideFromMap(clickedPoint);
                        setClickedPoint(null);
                      }}
                      className="w-full text-[11px] font-bold py-1 bg-rose-600 hover:bg-rose-700 text-white rounded transition flex items-center justify-center gap-1"
                    >
                      🚨 Report Hazard Here
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

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

        {/* 6. Dedicated Route Polyline for Selected Vehicle */}
        {selectedVehicle && selectedVehicle.route_coordinates && selectedVehicle.route_coordinates.length >= 2 && (
          <React.Fragment key={`selected-vehicle-route-${selectedVehicle.id}`}>
            {/* Glowing Casing */}
            <Polyline
              positions={selectedVehicle.route_coordinates}
              pathOptions={{
                color: '#6366f1',
                weight: 8,
                opacity: 0.35,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Dashed Navigation Line */}
            <Polyline
              positions={selectedVehicle.route_coordinates}
              pathOptions={{
                color: '#4f46e5',
                weight: 4,
                opacity: 0.95,
                dashArray: '6, 8',
                lineCap: 'round',
              }}
            >
              <Tooltip sticky>
                <div className="text-[11px] font-sans">
                  <span className="font-extrabold block text-indigo-700">{selectedVehicle.code} Active Route</span>
                  <span>{selectedVehicle.route_label || `${selectedVehicle.origin} ➔ ${selectedVehicle.destination}`}</span>
                </div>
              </Tooltip>
            </Polyline>
            {/* Destination Flag Landmark */}
            <Marker
              position={selectedVehicle.route_coordinates[selectedVehicle.route_coordinates.length - 1]}
              icon={createLandmarkIcon('🏁', '#10b981')}
            >
              <Tooltip permanent direction="top" offset={[0, -14]}>
                <span className="font-bold text-[10px]">Destination: {selectedVehicle.destination}</span>
              </Tooltip>
            </Marker>
          </React.Fragment>
        )}

        {/* 7. Live GPS Tracked Vehicles */}
        {vehicles.map((v) => {
          const isSelected = selectedVehicle?.id === v.id;
          return (
            <Marker
              key={v.id}
              position={[v.location.lat, v.location.lng]}
              icon={createVehicleMarkerIcon(v.status, isSelected)}
              eventHandlers={{
                click: () => {
                  if (onSelectVehicle) onSelectVehicle(v);
                },
              }}
            >
              <Popup className="custom-leaflet-popup" minWidth={270}>
                <div className="p-2 space-y-2 text-slate-800 dark:text-slate-100 font-sans">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">{v.code}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">• {v.driver}</span>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                      v.status === 'AT_RISK' ? 'bg-rose-500 text-white' :
                      v.status === 'DELAYED' ? 'bg-amber-500 text-white' :
                      v.status === 'OFFLINE' ? 'bg-slate-500 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {v.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Destination & Origin Banner */}
                  <div className="bg-indigo-50/90 dark:bg-indigo-950/60 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">🎯 Headed To</span>
                      <span className="text-[9px] font-bold text-slate-400">From: {v.origin}</span>
                    </div>
                    <div className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span className="text-base leading-none">📍</span>
                      <span className="text-sm text-indigo-700 dark:text-indigo-300 font-extrabold">{v.destination}</span>
                    </div>
                  </div>

                  {/* Route Corridor */}
                  {v.route_label && (
                    <div className="space-y-0.5 text-[10px]">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">🛣️ Active Corridor Route</div>
                      <div className="font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[11px] leading-tight">
                        {v.route_label}
                      </div>
                    </div>
                  )}

                  {/* ETA & Distance & Speed Telemetry Grid */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-mono">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded">
                      <div className="text-[8px] text-slate-500 font-bold uppercase">⏱️ ETA</div>
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {v.eta || (v.eta_minutes ? `${Math.floor(v.eta_minutes / 60)}h ${v.eta_minutes % 60}m` : 'On Track')}
                      </div>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded">
                      <div className="text-[8px] text-slate-500 font-bold uppercase">📏 Distance</div>
                      <div className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                        {v.remaining_distance_km !== undefined ? `${v.remaining_distance_km} km` : '--'}
                      </div>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded">
                      <div className="text-[8px] text-slate-500 font-bold uppercase">⚡ Speed</div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {v.speed_kmh ? `${v.speed_kmh} km/h` : '45 km/h'}
                      </div>
                    </div>
                  </div>

                  {/* Driver & Cargo Details */}
                  <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px]">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>👤 Driver Contact:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{v.phone || '+91-99887-12345'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>📦 Cargo Payload:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{v.cargo}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 7. Nearby Medical & Emergency Facilities Layer */}
        {showMedical && DEFAULT_MEDICAL_FACILITIES.map((med) => (
          <Marker
            key={med.id}
            position={[med.lat, med.lng]}
            icon={createMedicalMarkerIcon(med.type)}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-2 space-y-1.5 min-w-[210px]">
                <div className="flex items-center justify-between border-b pb-1 font-sans">
                  <span className="font-black text-xs text-rose-700 dark:text-rose-400">
                    ✚ {med.name}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  District: {med.district}
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded text-[10px] text-slate-600 dark:text-slate-300">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">FACILITY CATEGORY</span>
                  {med.type.replace('_', ' ')}
                </div>
                <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 pt-1">
                  📞 Emergency Contact: {med.contact}
                </div>
                <div className="text-[9px] text-slate-400 italic pt-0.5 border-t border-slate-100 dark:border-slate-800">
                  Verified NER Healthcare Reference Directory
                </div>
              </div>
            </Popup>
            <Tooltip permanent={false} direction="top" offset={[0, -10]}>
              <span className="font-bold text-[10px] text-rose-600 uppercase">✚ {med.name}</span>
            </Tooltip>
          </Marker>
        ))}
        {/* 8. Safe & Staging Handover Locations Layer */}
        {handoverLocations && handoverLocations.map((hnd, idx) => (
          <Marker
            key={hnd.id || `hnd-${idx}`}
            position={[hnd.lat, hnd.lng]}
            icon={createHandoverLocationIcon(Boolean(hnd.isSafePoint))}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-2 space-y-1.5 min-w-[200px]">
                <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 border-b pb-1 flex items-center justify-between">
                  <span>{hnd.isSafePoint ? '🛡️ Safe Handover Point' : '📍 Current Vehicle Staging'}</span>
                </div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {hnd.label}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {hnd.lat.toFixed(4)}, {hnd.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
            <Tooltip permanent direction="top" offset={[0, -14]}>
              <span className="font-bold text-[10px]">{hnd.isSafePoint ? '🛡️ ' : ''}{hnd.label}</span>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* MapmyIndia Official Badge (Top Left) */}
      <div className="absolute top-3 left-3 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center space-x-2 text-[11px] font-bold">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-slate-800 dark:text-slate-100">🇮🇳 MapmyIndia Mappls</span>
        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-semibold">Survey of India</span>
      </div>

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
        <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setShowMedical(!showMedical)}
            className={`w-full text-[10px] font-bold px-2 py-1 rounded transition flex items-center justify-between ${
              showMedical
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            <span>🏥 Medical & O2 Depots</span>
            <span className="font-extrabold">{showMedical ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Floating Tactical Vehicle Journey HUD Dossier (Bottom Left) */}
      {selectedVehicle && (
        <div className="absolute bottom-4 left-4 z-[400] max-w-sm w-[350px] sm:w-[380px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-indigo-200 dark:border-indigo-900/70 shadow-2xl p-4 text-xs space-y-2.5 transition-all duration-300">
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shadow-inner">
                🚚
              </div>
              <div>
                <div className="font-mono font-black text-sm text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                  <span>{selectedVehicle.code}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[180px]">
                  {selectedVehicle.driver} • {selectedVehicle.phone || '+91-99887-12345'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                selectedVehicle.status === 'AT_RISK' ? 'bg-rose-500 text-white' :
                selectedVehicle.status === 'DELAYED' ? 'bg-amber-500 text-white' :
                selectedVehicle.status === 'OFFLINE' ? 'bg-slate-500 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {selectedVehicle.status.replace('_', ' ')}
              </span>
              {onSelectVehicle && (
                <button
                  onClick={() => onSelectVehicle(null as any)}
                  className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-xs transition"
                  title="Close dossier"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Destination & Headed To Banner */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/70 dark:to-blue-950/70 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
              <span className="font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <span>🎯</span> HEADED TO
              </span>
              <span className="truncate max-w-[150px]">From: <strong>{selectedVehicle.origin}</strong></span>
            </div>
            <div className="text-base font-black text-indigo-950 dark:text-indigo-100 tracking-tight flex items-center gap-1.5">
              <span>📍</span>
              <span className="text-indigo-600 dark:text-indigo-300 font-extrabold">{selectedVehicle.destination}</span>
            </div>
          </div>

          {/* Active Route Corridor & Stops */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span>🛣️ Active Corridor Route</span>
              {selectedVehicle.route_path_names && selectedVehicle.route_path_names.length > 0 && (
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold lowercase">
                  {selectedVehicle.route_path_names.length} stops
                </span>
              )}
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[11px] font-medium text-slate-800 dark:text-slate-200">
              {selectedVehicle.route_label || `${selectedVehicle.origin} ➔ ${selectedVehicle.destination}`}
            </div>
          </div>

          {/* Telemetry Metrics: ETA, Distance, Speed */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 p-2 rounded-xl">
              <div className="text-[8px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider">⏱️ ETA</div>
              <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                {selectedVehicle.eta || (selectedVehicle.eta_minutes ? `${Math.floor(selectedVehicle.eta_minutes / 60)}h ${selectedVehicle.eta_minutes % 60}m` : 'On Track')}
              </div>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 p-2 rounded-xl">
              <div className="text-[8px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider">📏 Distance</div>
              <div className="text-sm font-black text-indigo-700 dark:text-indigo-300">
                {selectedVehicle.remaining_distance_km !== undefined ? `${selectedVehicle.remaining_distance_km} km` : '--'}
              </div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 p-2 rounded-xl">
              <div className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wider">⚡ Speed</div>
              <div className="text-sm font-black text-slate-800 dark:text-slate-200">
                {selectedVehicle.speed_kmh ? `${selectedVehicle.speed_kmh} km/h` : '45 km/h'}
              </div>
            </div>
          </div>

          {/* Cargo Payload */}
          <div className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">📦 Payload:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[210px]" title={selectedVehicle.cargo}>
              {selectedVehicle.cargo}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
