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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      setIsLoading(true);
      const storedToken = await secureStorage.getToken();
      const storedUser = await secureStorage.getUser();

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          setUser(storedUser);
        }
        // Background verify token & get updated user profile
        try {
          const freshUser = await authApi.getMe();
          setUser(freshUser);
          await secureStorage.setUser(freshUser);
        } catch (e) {
          console.warn('Failed to refresh user profile from backend on launch:', e);
        }
      }
    } catch (e) {
      console.warn('Error loading stored auth:', e);
    } finally {
      setIsLoading(false);
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
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const fresh = await authApi.getMe();
      setUser(fresh);
      await secureStorage.setUser(fresh);
    } catch (e) {
      console.warn('Failed to refresh user profile:', e);
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
