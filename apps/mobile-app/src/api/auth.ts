import { apiClient } from './client';
import { LoginResponse, User } from '../types';

export const authApi = {
  login: async (identifier: string, password: str): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', {
      identifier,
      email: identifier.includes('@') ? identifier : undefined,
      phone: !identifier.includes('@') ? identifier : undefined,
      password,
    });
    return response.data;
  },

  register: async (payload: {
    email: string;
    fullName: string;
    phone?: string;
    password: str;
    role?: string;
    district?: string;
  }): Promise<{ message: string; user: User }> => {
    const response = await apiClient.post('/api/auth/register', payload);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/auth/me');
    return response.data;
  },

  logout: async (sessionId?: string): Promise<void> => {
    await apiClient.post('/api/auth/logout', { sessionId });
  }
};

type str = string;
