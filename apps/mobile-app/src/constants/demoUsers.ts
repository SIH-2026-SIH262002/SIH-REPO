/**
 * Demo Quick Login accounts — SIH demonstration / development only. These
 * authenticate locally with a mock token and never touch the real backend,
 * so no real password is ever stored or checked for them. Do not use this
 * path for production authentication.
 */
import { User } from '../types';

export interface DemoAccount {
  id: string;
  label: string;
  user: User;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'demo-field-officer',
    label: 'Field Officer',
    user: {
      userId: 'demo-field-officer',
      fullName: 'Demo Field Officer',
      email: 'demo-field-officer@nerlogisense.gov.in',
      role: 'FIELD_OFFICER',
      district: 'East Khasi Hills',
      organization: 'NER Logistics & Disaster Mgmt Authority',
    },
  },
  {
    id: 'demo-driver',
    label: 'Driver',
    user: {
      userId: 'demo-driver',
      fullName: 'Demo Driver',
      email: 'demo-driver@nerlogisense.gov.in',
      role: 'DRIVER',
      district: 'Kamrup Metro',
      organization: 'NER Logistics & Disaster Mgmt Authority',
    },
  },
  {
    id: 'demo-local-user',
    label: 'Local User',
    user: {
      userId: 'demo-local-user',
      fullName: 'Demo Local User',
      email: 'demo-local-user@nerlogisense.gov.in',
      role: 'LOCAL_USER',
      district: 'Shillong',
      organization: '',
    },
  },
  {
    id: 'demo-admin',
    label: 'Admin',
    user: {
      userId: 'demo-admin',
      fullName: 'Demo Admin',
      email: 'demo-admin@nerlogisense.gov.in',
      role: 'ADMIN',
      district: '',
      organization: 'NER Logistics & Disaster Mgmt Authority',
    },
  },
];

export const DEMO_TOKEN_PREFIX = 'demo-mock-token-';
