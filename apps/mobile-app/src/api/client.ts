import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { secureStorage } from '../services/secureStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await secureStorage.getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Error reading token for request interceptor:', e);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Error formatting and 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized (401) response received.');
      // Auto clear tokens if access is unauthorized
      await secureStorage.clearAll();
    }
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error: any): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      return typeof detail === 'string' ? detail : JSON.stringify(detail);
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please check your connection to the server.';
    }
    if (!error.response) {
      return 'Network error. Please verify the backend is running and server IP is accessible.';
    }
  }
  return error?.message || 'An unexpected error occurred. Please try again.';
};
