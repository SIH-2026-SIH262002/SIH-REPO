import { apiClient } from './client';
import { Vehicle } from '../types';

export const DUMMY_VEHICLES: Vehicle[] = [
  {
    id: 'AS-01-HC-4092',
    driver_name: 'Demo Driver (Ramesh Kumar)',
    phone: '+91 98765 43210',
    lat: 26.1445,
    lon: 91.7362,
    status: 'EN_ROUTE',
    current_route: 'Guwahati → Shillong Corridor (NH-6)',
    speed_kmh: 42,
    destination: 'Shillong Central Relief Hub',
    cargo_type: 'Emergency Food & Medical Supplies',
    last_updated: new Date().toISOString(),
  },
  {
    id: 'ML-05-EV-1102',
    driver_name: 'Demo Field Officer (Tenzing Norgay)',
    phone: '+91 98123 45678',
    lat: 25.5788,
    lon: 91.8933,
    status: 'EMERGENCY',
    current_route: 'Sonapur Tunnel Bypass (NH-44)',
    speed_kmh: 15,
    destination: 'Sonapur Disaster Zone',
    cargo_type: 'Rapid Sensor Deployment Kit',
    last_updated: new Date().toISOString(),
  },
  {
    id: 'TR-01-FT-8831',
    driver_name: 'Bikramjit Sharma',
    phone: '+91 94361 22334',
    lat: 23.8315,
    lon: 91.2868,
    status: 'IDLE',
    current_route: 'Agartala Supply Line',
    speed_kmh: 0,
    destination: 'Dharmanagar Depot',
    cargo_type: 'Potable Water & Fuel Tanker',
    last_updated: new Date().toISOString(),
  },
  {
    id: 'MZ-01-LOG-5524',
    driver_name: 'Lalthantluanga',
    phone: '+91 98620 99881',
    lat: 23.7271,
    lon: 92.7176,
    status: 'DELAYED',
    current_route: 'Aizawl Mountain Pass',
    speed_kmh: 28,
    destination: 'Lunglei Distribution Node',
    cargo_type: 'Heavy Excavation & Rescue Gear',
    last_updated: new Date().toISOString(),
  },
  {
    id: 'AS-25-DC-9011',
    driver_name: 'Dr. Ananya Roy',
    phone: '+91 97060 11223',
    lat: 24.8333,
    lon: 92.7789,
    status: 'EN_ROUTE',
    current_route: 'Silchar Corridor (NH-37)',
    speed_kmh: 58,
    destination: 'Haflong Hospital Base',
    cargo_type: 'First Aid & Vaccine Cold Chain',
    last_updated: new Date().toISOString(),
  },
];

export const vehiclesApi = {
  getVehicles: async (): Promise<Vehicle[]> => {
    try {
      const response = await apiClient.get<Vehicle[]>('/api/vehicles');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return DUMMY_VEHICLES;
    } catch (_err) {
      return DUMMY_VEHICLES;
    }
  },
};

