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
import { AdminDashboardView } from '../components/dashboard/roles/AdminDashboardView';
import { LogisticsOperatorView } from '../components/dashboard/roles/LogisticsOperatorView';
import { EmergencyOperatorView } from '../components/dashboard/roles/EmergencyOperatorView';
import { FieldOfficerDashboardView } from '../components/dashboard/roles/FieldOfficerDashboardView';
import { DriverDashboardView } from '../components/dashboard/roles/DriverDashboardView';

// Operational Intelligence Components for Logistics Operator Command Center
import { OperationalToolbar } from '../components/dashboard/OperationalToolbar';
import { SupplyGapIntelligencePanel } from '../components/dashboard/SupplyGapIntelligencePanel';
import { AIReasoningPanel } from '../components/dashboard/AIReasoningPanel';
import { RecoveryPredictionCard } from '../components/dashboard/RecoveryPredictionCard';

import { apiService } from '../services/apiService';
import { voiceService } from '../services/voiceService';
import { exportUtils } from '../utils/exportUtils';
import { FileText, Volume2, Radio } from 'lucide-react';
import { MOCK_VEHICLES } from '../data/mockData';
import { UserRole } from '../types/auth';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang] = useState('EN');
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Authoritative Role from Backend Identity Context
  const activeRole: UserRole = user?.role || 'LOGISTICS_OPERATOR';

  // Live WebSocket Connection
  const { isConnected, lastEvent } = useWebSocket();

  // Sensors & Vehicles Data State
  const [sensors, setSensors] = useState<MapSensorNode[]>([
    { node_key: 'GUWAHATI', name: 'Guwahati', district: 'Kamrup Metro', lat: 26.14, lon: 91.73, risk_score: 12, category: 'LOW' },
    { node_key: 'SHILLONG', name: 'Shillong', district: 'East Khasi Hills', lat: 25.57, lon: 91.88, risk_score: 22, category: 'LOW' },
    { node_key: 'SILCHAR', name: 'Silchar', district: 'Cachar', lat: 24.83, lon: 92.77, risk_score: 78, category: 'SEVERE', soil_moisture_pct: 88, rainfall_mm_last_24h: 120, vibration_intensity: 4.5, slope_angle_deg: 32 },
    { node_key: 'IMPHAL', name: 'Imphal', district: 'Imphal West', lat: 24.81, lon: 93.93, risk_score: 35, category: 'MODERATE' },
    { node_key: 'KOHIMA', name: 'Kohima', district: 'Kohima', lat: 25.67, lon: 94.1, risk_score: 42, category: 'MODERATE' },
    { node_key: 'AIZAWL', name: 'Aizawl', district: 'Aizawl', lat: 23.73, lon: 92.71, risk_score: 55, category: 'HIGH' },
    { node_key: 'AGARTALA', name: 'Agartala', district: 'West Tripura', lat: 23.83, lon: 91.28, risk_score: 18, category: 'LOW' },
    { node_key: 'ITANAGAR', name: 'Itanagar', district: 'Papum Pare', lat: 27.08, lon: 93.6, risk_score: 48, category: 'MODERATE' },
    { node_key: 'GANGTOK', name: 'Gangtok', district: 'East Sikkim', lat: 27.33, lon: 88.61, risk_score: 62, category: 'HIGH' },
  ]);

  const [vehicles, setVehicles] = useState<MapVehicle[]>(
    MOCK_VEHICLES.map((v) => ({
      id: v.id,
      code: v.code,
      driver: v.driverName,
      status: v.status as any,
      location: { lat: v.location.lat, lng: v.location.lng },
      origin: v.origin,
      destination: v.destination,
      cargo: v.cargoDescription,
    }))
  );

  const [selectedVehicle, setSelectedVehicle] = useState<MapVehicle | null>(null);

  // Initial REST API fetch
  useEffect(() => {
    const initFetch = async () => {
      try {
        const rawSensors = await apiService.getSensors();
        if (Array.isArray(rawSensors) && rawSensors.length > 0) {
          setSensors(rawSensors);
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
              {/* Authoritative Role Dashboard View */}
              {activeRole === 'ADMIN' && <AdminDashboardView />}

              {activeRole === 'LOGISTICS_OPERATOR' && (
                <div className="space-y-6">
                  {/* Logistics Operational Command Center Workflow */}
                  <OperationalToolbar />
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <LogisticsOperatorView />
                    </div>
                    <div className="space-y-6">
                      <SupplyGapIntelligencePanel />
                      <AIReasoningPanel />
                      <RecoveryPredictionCard />
                    </div>
                  </div>
                </div>
              )}

              {activeRole === 'EMERGENCY_OPERATOR' && <EmergencyOperatorView />}
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
