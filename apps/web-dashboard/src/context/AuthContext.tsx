import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User, LoginPayload, UpdateProfilePayload } from '../types/auth';
import { authApi } from '../api/authApi';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
  updateUserProfile: (payload: UpdateProfilePayload) => Promise<User>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const savedUserStr = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (!token) {
      // Dev bypass: skip the login screen by auto-authenticating as the demo Admin account.
      try {
        const data = await authApi.login({
          email: 'admin@nerlogisense.gov.in',
          password: 'password123',
        });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('sessionId', data.sessionId);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      } catch (err) {
        console.error('Dev auto-login bypass failed:', err);
      }
      setIsLoading(false);
      return;
    }

    try {
      if (savedUserStr) {
        setUser(JSON.parse(savedUserStr));
      }
      const freshUser = await authApi.getMe();
      setUser(freshUser);
      const isLocal = !!localStorage.getItem('accessToken');
      const storage = isLocal ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(freshUser));
    } catch (err) {
      console.error('Failed to initialize user session:', err);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initAuth();

    const handleLogoutEvent = () => {
      setUser(null);
    };
    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, [initAuth]);

  const login = async (payload: LoginPayload): Promise<User> => {
    const data = await authApi.login(payload);
    const { accessToken, refreshToken, sessionId, user: loggedUser } = data;

    const storage = payload.rememberMe ? localStorage : sessionStorage;
    storage.setItem('accessToken', accessToken);
    storage.setItem('refreshToken', refreshToken);
    storage.setItem('sessionId', sessionId);
    storage.setItem('user', JSON.stringify(loggedUser));

    setUser(loggedUser);
    return loggedUser;
  };

  const logout = async () => {
    const sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');
    if (sessionId) {
      try {
        await authApi.logout(sessionId);
      } catch (err) {
        console.warn('Logout session revocation failed or already expired:', err);
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user');
    sessionStorage.clear();
    setUser(null);
  };

  const updateUserProfile = async (payload: UpdateProfilePayload): Promise<User> => {
    const res = await authApi.updateProfile(payload);
    const updatedUser = res.user;
    setUser(updatedUser);
    const isLocal = !!localStorage.getItem('accessToken');
    const storage = isLocal ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authApi.getMe();
      setUser(freshUser);
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUserProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
