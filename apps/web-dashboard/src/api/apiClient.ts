import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// This client talks to the Express auth-service (identity, sessions, and the
// Admin Console's user directory/lifecycle) -- NOT the FastAPI operational
// gateway (see services/apiService.ts for that). Two separate backends, two
// separate base URLs; do not collapse them into one env var.
const API_BASE_URL = (import.meta as any).env?.VITE_AUTH_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Response Interceptor: Auto Refresh Token on 401
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: any) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refreshToken =
          localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
        const sessionId =
          localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');

        if (!refreshToken || !sessionId) {
          throw new Error('No refresh token available');
        }

        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
          sessionId,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data;

        const isLocal = !!localStorage.getItem('accessToken');
        const storage = isLocal ? localStorage : sessionStorage;

        storage.setItem('accessToken', newAccessToken);
        if (newRefreshToken) {
          storage.setItem('refreshToken', newRefreshToken);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;

        // Clear local storage and dispatch logout event
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('sessionId');
        localStorage.removeItem('user');
        sessionStorage.clear();

        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

