import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMap } from 'react-leaflet';
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

interface NERMapProps {
  sensors?: MapSensorNode[];
  vehicles?: MapVehicle[];
  selectedVehicle?: MapVehicle | null;
  onSelectVehicle?: (v: MapVehicle) => void;
  onSelectNode?: (nodeKey: string) => void;
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
}) => {
  const { theme } = useTheme();

  // Choose Leaflet Map Tile Layer based on active Light vs Dark theme
  const tileUrl =
    theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const tileAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

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

        {/* Sensor Nodes & ML Risk Heat Circles */}
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

        {/* Live GPS Tracked Vehicles */}
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
        <div className="font-bold text-[11px] text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1">
          GIS Risk Heat Legend
        </div>
        <div className="flex items-center space-x-2 text-[10px]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-600 dark:text-slate-300">LOW (&lt;25)</span>
        </div>
        <div className="flex items-center space-x-2 text-[10px]">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-slate-600 dark:text-slate-300">MODERATE (25-50)</span>
        </div>
        <div className="flex items-center space-x-2 text-[10px]">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span className="text-slate-600 dark:text-slate-300">HIGH (50-70)</span>
        </div>
        <div className="flex items-center space-x-2 text-[10px]">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="font-bold text-rose-600 dark:text-rose-400">SEVERE (&gt;70)</span>
        </div>
      </div>
    </div>
  );
};
