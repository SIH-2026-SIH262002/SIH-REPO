export type UserRole =
  | 'ADMIN'
  | 'EMERGENCY_OPERATOR'
  | 'LOGISTICS_OPERATOR'
  | 'FIELD_OFFICER'
  | 'DRIVER'
  | 'SUPER_ADMIN'
  | 'DISTRICT_AUTHORITY';

export function normalizeUserRole(role?: string): UserRole {
  if (!role) return 'FIELD_OFFICER';
  const uRole = role.toUpperCase();
  if (uRole === 'SUPER_ADMIN') return 'ADMIN';
  if (uRole === 'DISTRICT_AUTHORITY') return 'EMERGENCY_OPERATOR';
  const canonicals: UserRole[] = ['ADMIN', 'EMERGENCY_OPERATOR', 'LOGISTICS_OPERATOR', 'FIELD_OFFICER', 'DRIVER'];
  if (canonicals.includes(uRole as UserRole)) {
    return uRole as UserRole;
  }
  return 'FIELD_OFFICER';
}

export interface User {
  id: string | number;
  fullName: string;
  email: string;
  phone?: string;
  username?: string;
  identifier?: string;
  role: UserRole;
  roles?: string[];
  permissions?: string[];
  organization?: string;
  district?: string;
  is_active?: boolean;
  created_at?: string;
}


export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  sessionId?: string;
  expiresIn?: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface LoginPayload {
  email?: string;
  phone?: string;
  identifier?: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  organization?: string;
  district?: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  organization?: string;
  district?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordPayload {
  email?: string;
  phone?: string;
  identifier?: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export const NER_DISTRICTS = [
  // Assam
  'Guwahati (Kamrup Metro)',
  'Dibrugarh',
  'Silchar (Cachar)',
  'Jorhat',
  'Tezpur (Sonitpur)',
  // Meghalaya
  'Shillong (East Khasi Hills)',
  'Tura (West Garo Hills)',
  // Manipur
  'Imphal East',
  'Imphal West',
  'Churachandpur',
  // Nagaland
  'Kohima',
  'Dimapur',
  // Mizoram
  'Aizawl',
  'Lunglei',
  // Tripura
  'Agartala (West Tripura)',
  // Arunachal Pradesh
  'Itanagar (Papum Pare)',
  'Tawang',
  // Sikkim
  'Gangtok'
] as const;
