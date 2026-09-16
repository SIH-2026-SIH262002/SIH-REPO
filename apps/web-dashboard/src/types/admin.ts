import { UserRole } from './auth';

// Mirrors the response shape of the Express auth-service (backend/auth-service),
// the authoritative identity/lifecycle backend for the Admin Console. See
// docs/ADMIN_CONSOLE_IMPLEMENTATION_SPEC.md §C.1 -- do not confuse this with
// the flat `User` shape in types/auth.ts, which is the FastAPI/session shape.

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface AdminUserMetadata {
  fullName?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  organization?: string;
  district?: string;
  accountStatus?: AccountStatus;
}

export interface AdminUserRecord {
  id: string;
  identifier: string;
  is_active: boolean;
  status: AccountStatus;
  metadata: AdminUserMetadata;
  created_at: string;
  updated_at: string;
}

export interface ProvisionUserPayload {
  email: string;
  fullName: string;
  phone?: string;
  password: string;
  role: UserRole;
  district: string;
  organization?: string;
}

export interface SensorNode {
  node_key: string;
  sensor_node_id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lon: number;
  risk_score: number;
  occurrence_probability: number;
  category: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  storm_event: boolean;
  manual_flag: number | null;
  last_updated: string;
  [key: string]: unknown;
}

// Role reference content, sourced verbatim from
// docs/architecture/ROLE_MODEL.md -- never invented. Backs the Roles & Access
// Reference page and the role-briefing shown during provisioning/reassignment.
export interface RoleInfo {
  role: UserRole;
  label: string;
  represents: string;
  responsibility: string;
  scope: string;
  keyAccess: string[];
}

export const ROLE_INFO: Record<UserRole, RoleInfo> = {
  ADMIN: {
    role: 'ADMIN',
    label: 'Administrator',
    represents: 'IT Administrators, Disaster System Operations Engineers, Senior Governance Officers',
    responsibility:
      'System governance, identity lifecycle management, security configuration, and machine learning model lifecycle governance.',
    scope: 'Global — unrestricted access across all districts and system entities.',
    keyAccess: [
      'User provisioning & account lifecycle',
      'Role and district/scope assignment',
      'System-wide operational oversight',
      'ML model transparency (read-only)',
    ],
  },
  EMERGENCY_OPERATOR: {
    role: 'EMERGENCY_OPERATOR',
    label: 'Emergency Operator',
    represents: 'DDMA Control Officers, SDRF/NDRF Emergency Dispatch Commanders, BRO Control Room Operators',
    responsibility:
      'Emergency disaster command and emergency response management across regional transport corridors.',
    scope: 'District — restricted to the assigned operational district/state boundary.',
    keyAccess: [
      'Live SOS panic radar (district-scoped)',
      'Incident verification & impact chain',
      'Emergency corridor closures',
      'Rescue team dispatch coordination',
    ],
  },
  LOGISTICS_OPERATOR: {
    role: 'LOGISTICS_OPERATOR',
    label: 'Logistics Operator',
    represents: 'Regional Logistics Control Room Managers, Essential Supply Chain Controllers, Fleet Operations Managers',
    responsibility:
      'Continuous monitoring, route optimization, and delivery execution for commercial and essential commodity logistics fleets.',
    scope: 'Fleet / resource-scoped — restricted to assigned fleets, shipments, and supply hubs.',
    keyAccess: [
      'Fleet & shipment tracking',
      'AI route detour inspection & approval',
      'Supply gap intelligence & warehouse feeds',
      'Delivery confirmation',
    ],
  },
  FIELD_OFFICER: {
    role: 'FIELD_OFFICER',
    label: 'Field Officer',
    represents: 'Ground Highway Patrol Officers, DDMA Field Inspectors, Local Disaster First Responders',
    responsibility:
      'On-ground physical inspection, hazard evidence collection, and ground-truth verification across remote mountain corridors.',
    scope: 'Assigned — restricted to inspection tasks and incidents assigned to this officer or their local district.',
    keyAccess: [
      'Assigned field inspection tasks',
      'Hazard reporting with geotagged photo evidence',
      'Offline report sync',
    ],
  },
  DRIVER: {
    role: 'DRIVER',
    label: 'Driver',
    represents: 'Commercial Freight Drivers, Essential Supply Tanker Operators, Relief Supply Truck Drivers',
    responsibility:
      'Safe execution of assigned logistics transit, real-time telematics transmission, and emergency SOS panic trigger.',
    scope: 'Self — strictly restricted to resources assigned to this driver.',
    keyAccess: [
      'Assigned vehicle & shipment only',
      'Turn-by-turn route navigation',
      '1-tap SOS panic button',
      'En-route hazard reporting',
    ],
  },
};
