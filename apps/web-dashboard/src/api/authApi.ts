import { apiClient } from './apiClient';
import {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  UpdateProfilePayload,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  User,
} from '../types/auth';

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', {
      email: payload.email,
      phone: payload.phone,
      identifier: payload.identifier || payload.email || payload.phone,
      password: payload.password,
    });
    return response.data;
  },

  register: async (payload: RegisterPayload): Promise<{ message: string; user: User }> => {
    const response = await apiClient.post('/api/auth/register', payload);
    return response.data;
  },

  logout: async (sessionId: string): Promise<void> => {
    await apiClient.post('/api/auth/logout', { sessionId });
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/auth/me');
    return response.data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<{ message: string; user: User }> => {
    const response = await apiClient.put('/api/auth/profile', payload);
    return response.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    const response = await apiClient.post('/api/auth/change-password', payload);
    return response.data;
  },

  forgotPassword: async (payload: ForgotPasswordPayload): Promise<{ message: string }> => {
    const response = await apiClient.post('/api/auth/forgot-password', payload);
    return response.data;
  },

  resetPassword: async (payload: ResetPasswordPayload): Promise<{ message: string }> => {
    const response = await apiClient.post('/api/auth/reset-password', payload);
    return response.data;
  },

  getAllUsers: async (): Promise<{ users: User[] }> => {
    const response = await apiClient.get<{ users: User[] }>('/api/auth/users');
    return response.data;
  },
};
