import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { CommandHeader } from '../components/layout/CommandHeader';
import { Sidebar } from '../components/layout/Sidebar';
import { NERMap, MapSensorNode, MapVehicle } from '../components/map/NERMap';
import { AIRoutePlannerView } from '../components/views/AIRoutePlannerView';
import { MLRiskPlaygroundView } from '../components/views/MLRiskPlaygroundView';
import { EmergencySOSView } from '../components/views/EmergencySOSView';
import { FieldView } from '../components/views/FieldView';
import { VehiclesView } from '../components/views/VehiclesView';
import { ShipmentsView } from '../components/views/ShipmentsView';
import { NotificationsOutboxView } from '../components/views/NotificationsOutboxView';
import { SettingsView } from '../components/views/SettingsView';

// Role Specific Dashboard Views
// Note: ADMIN and EMERGENCY_OPERATOR no longer render views here.
// Admin Console lives at /admin/* (routes/AdminRoutes.tsx).
// Emergency Operator Command Console lives at /emergency/* (routes/EmergencyRoutes.tsx).
// Logistics Operator lives at /logistics/* (routes/LogisticsRoutes.tsx).
import { FieldOfficerDashboardView } from '../components/dashboard/roles/FieldOfficerDashboardView';
import { DriverDashboardView } from '../components/dashboard/roles/DriverDashboardView';

import { apiService } from '../services/apiService';
import { voiceService } from '../services/voiceService';
import { exportUtils } from '../utils/exportUtils';
import { FileText, Volume2, Radio } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { UserRole } from '../types/auth';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // If user is LOGISTICS_OPERATOR, redirect to dedicated /logistics command console
  if (user?.role === 'LOGISTICS_OPERATOR') {
    return <Navigate to="/logistics" replace />;
  }

  // If user is EMERGENCY_OPERATOR, redirect to dedicated /emergency command console
  if (user?.role === 'EMERGENCY_OPERATOR') {
    return <Navigate to="/emergency" replace />;
  }

  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang] = useState('EN');
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Authoritative Role from Backend Identity Context
  const activeRole: UserRole = user?.role || 'EMERGENCY_OPERATOR';

  // Live WebSocket Connection
  const { isConnected, lastEvent } = useWebSocket();

  // Sensors & Vehicles Data State
  const [sensors, setSensors] = useState<MapSensorNode[]>([]);
  const [vehicles, setVehicles] = useState<MapVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<MapVehicle | null>(null);

  // Initial REST API fetch
  useEffect(() => {
    const initFetch = async () => {
      try {
        const [rawSensors, rawVehicles] = await Promise.allSettled([
          apiService.getSensors(),
          apiService.getVehicles(),
        ]);
        if (rawSensors.status === 'fulfilled' && Array.isArray(rawSensors.value)) {
          setSensors(rawSensors.value);
        }
        if (rawVehicles.status === 'fulfilled' && Array.isArray(rawVehicles.value)) {
          setVehicles(
            rawVehicles.value.map((v: any) => ({
              id: v.id || v.code,
              code: v.code || v.id,
              driver: v.driver || v.driver_name || 'Driver',
              status: v.status as any,
              location: { lat: v.lat || 26.15, lng: v.lon || 92.93 },
              origin: v.origin_name || v.origin || 'Guwahati',
              destination: v.destination_name || v.destination || 'Silchar',
              cargo: v.cargo || v.cargo_type || 'Essential Supplies',
            }))
          );
        }
      } catch (err) {
        console.warn('Backend REST fetch offline, operating in simulated live mode');
      }
    };
    initFetch();
  }, []);

  // Listen to WebSocket Delta Events
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.kind === 'sensor_update' && lastEvent.data) {
      const updated = lastEvent.data;
      setSensors((prev) =>
        prev.map((s) => (s.node_key.toUpperCase() === updated.node_key.toUpperCase() ? { ...s, ...updated } : s))
      );
    }

    if (lastEvent.kind === 'alert' && lastEvent.data) {
      const alertData = lastEvent.data;
      if (voiceEnabled) {
        voiceService.speakAlert(alertData.message || 'Critical landslide warning detected', lang as any);
      }
    }
  }, [lastEvent, voiceEnabled, lang]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Header with Read-Only Informational Identity Context */}
      <CommandHeader lang={lang} onLanguageChange={setLang} />

      {/* Action Utility Subheader Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-bold">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
            <span className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
              {isConnected ? 'LIVE WEBSOCKET STREAM CONNECTED' : 'OFFLINE TELEMETRY SIMULATION'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Voice Announcement Toggle */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`px-3 py-1 rounded-lg border text-xs font-bold transition flex items-center space-x-1.5 ${
              voiceEnabled
                ? 'bg-indigo-950 border-indigo-800 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title="Toggle Web Speech API Voice Announcements"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice Alerts: {voiceEnabled ? 'ON 🔊' : 'OFF 🔇'}</span>
          </button>

          {/* Executive PDF Report Generator */}
          <button
            onClick={() => exportUtils.generateExecutiveSummaryPDF()}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition flex items-center space-x-1.5 shadow-sm"
            title="Generate NDMA Executive Summary PDF Report"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF Report</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden max-w-[1920px] w-full mx-auto">
        {/* Role-Aware Navigation Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Primary Content Module Surface */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {activeRole === 'FIELD_OFFICER' && <FieldOfficerDashboardView />}
              {activeRole === 'DRIVER' && <DriverDashboardView />}

              {/* GIS Interactive Tactical Map Overlay */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      GIS Tactical Landslide & Logistics Spatial Radar
                    </h2>
                    <p className="text-xs text-slate-400">
                      Real-time spatial monitoring of 18 sensor nodes, vehicle telemetry, and disaster hazard polygons across North Eastern India.
                    </p>
                  </div>
                </div>

                <div className="h-[550px] w-full rounded-xl overflow-hidden border border-slate-800">
                  <NERMap
                    sensors={sensors}
                    vehicles={vehicles}
                    selectedVehicle={selectedVehicle}
                    onSelectVehicle={setSelectedVehicle}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'route-planner' && <AIRoutePlannerView />}
          {activeTab === 'risk' && <MLRiskPlaygroundView />}
          {activeTab === 'sos' && <EmergencySOSView />}
          {activeTab === 'field' && <FieldView />}
          {activeTab === 'vehicles' && <VehiclesView />}
          {activeTab === 'shipments' && <ShipmentsView />}
          {activeTab === 'notifications' && <NotificationsOutboxView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};
