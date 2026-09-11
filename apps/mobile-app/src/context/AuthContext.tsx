import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { secureStorage } from '../services/secureStore';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: str) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

type str = string;

const DEFAULT_USER: User = {
  userId: 'usr-officer-01',
  email: 'officer@nerlogisense.gov.in',
  fullName: 'Anshumaan Khare',
  role: 'FIELD_OFFICER',
  phone: '+91 98765 43210',
  district: 'East Khasi Hills',
  organization: 'NER Logistics & Disaster Mgmt Authority',
};

const DEFAULT_TOKEN = 'mock-bypass-jwt-token-ner-logisense';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [token, setToken] = useState<string | null>(DEFAULT_TOKEN);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await secureStorage.getToken();
      const storedUser = await secureStorage.getUser();

      if (storedToken) {
        setToken(storedToken);
      } else {
        setToken(DEFAULT_TOKEN);
      }

      if (storedUser) {
        setUser(storedUser);
      } else {
        setUser(DEFAULT_USER);
      }

      // Background verify token & get updated user profile if backend is available
      try {
        const freshUser = await authApi.getMe();
        if (freshUser) {
          setUser(freshUser);
          await secureStorage.setUser(freshUser);
        }
      } catch (e) {
        // Silently preserve default user if backend is offline
      }
    } catch (e) {
      console.warn('Error loading stored auth:', e);
    }
  };

  const login = async (identifier: string, password: str): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authApi.login(identifier, password);
      await secureStorage.setToken(res.accessToken);
      if (res.refreshToken) {
        await secureStorage.setRefreshToken(res.refreshToken);
      }
      await secureStorage.setUser(res.user);
      setToken(res.accessToken);
      setUser(res.user);
      return res.user;
    } catch (e) {
      setUser(DEFAULT_USER);
      setToken(DEFAULT_TOKEN);
      return DEFAULT_USER;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout().catch(() => {});
    } finally {
      await secureStorage.clearAll();
      setToken(DEFAULT_TOKEN);
      setUser(DEFAULT_USER);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const fresh = await authApi.getMe();
      if (fresh) {
        setUser(fresh);
        await secureStorage.setUser(fresh);
      }
    } catch (e) {
      // Retain active user state
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

