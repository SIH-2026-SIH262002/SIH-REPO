import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User, LoginPayload, UpdateProfilePayload, normalizeUserRole } from '../types/auth';
import { authApi } from '../api/authApi';

const normalizeUser = (u: User): User => ({
  ...u,
  role: normalizeUserRole(u.role),
});

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
      setIsLoading(false);
      return;
    }

    try {
      if (savedUserStr) {
        setUser(normalizeUser(JSON.parse(savedUserStr)));
      }
      const freshUser = await authApi.getMe();
      const normalized = normalizeUser(freshUser);
      setUser(normalized);
      const isLocal = !!localStorage.getItem('accessToken');
      const storage = isLocal ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(normalized));
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
    const normalizedUser = normalizeUser(loggedUser);

    const storage = payload.rememberMe ? localStorage : sessionStorage;
    storage.setItem('accessToken', accessToken);
    storage.setItem('refreshToken', refreshToken);
    storage.setItem('sessionId', sessionId);
    storage.setItem('user', JSON.stringify(normalizedUser));

    setUser(normalizedUser);
    return normalizedUser;
  };

  const logout = async () => {
    const sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user');
    sessionStorage.clear();
    setUser(null);

    if (sessionId) {
      authApi.logout(sessionId).catch((err) => {
        console.warn('Logout session revocation failed or already expired:', err);
      });
    }
  };

  const updateUserProfile = async (payload: UpdateProfilePayload): Promise<User> => {
    const res = await authApi.updateProfile(payload);
    const updatedUser = normalizeUser(res.user);
    setUser(updatedUser);
    const isLocal = !!localStorage.getItem('accessToken');
    const storage = isLocal ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authApi.getMe();
      setUser(normalizeUser(freshUser));
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
