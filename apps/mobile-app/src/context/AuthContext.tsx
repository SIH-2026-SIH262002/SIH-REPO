import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { secureStorage } from '../services/secureStore';
import { authApi } from '../api/auth';
import { DEMO_TOKEN_PREFIX } from '../constants/demoUsers';
import { auth, db, signInAnonymously, doc, setDoc, getDoc, onSnapshot, serverTimestamp } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoSession: boolean;
  login: (identifier: string, password: str) => Promise<User>;
  loginDemo: (demoUser: User) => Promise<User>;
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

  // Real-time Firestore sync for active logged-in user
  useEffect(() => {
    if (!user?.userId) return;

    let unsubscribe: () => void = () => {};
    try {
      const userDocRef = doc(db, 'users', user.userId);
      unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const updatedUser: User = {
              ...user,
              fullName: data.name || data.fullName || user.fullName,
              role: data.role || user.role,
              district: data.district ?? user.district,
            };
            setUser(updatedUser);
            secureStorage.setUser(updatedUser).catch(() => {});
          }
        },
        (err) => {
          console.warn('Firestore user doc realtime listener notice:', err);
        }
      );
    } catch (e) {
      console.warn('Failed to subscribe to Firestore user doc:', e);
    }

    return () => {
      unsubscribe();
    };
  }, [user?.userId]);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await secureStorage.getToken();
      const storedUser = await secureStorage.getUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);

        if (!storedToken.startsWith(DEMO_TOKEN_PREFIX)) {
          try {
            const freshUser = await authApi.getMe();
            if (freshUser) {
              setUser(freshUser);
              await secureStorage.setUser(freshUser);
            }
          } catch (e) {
            // Keep stored session if backend is unreachable
          }
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

      // Sync user to Firestore
      try {
        await setDoc(
          doc(db, 'users', res.user.userId),
          {
            name: res.user.fullName,
            email: res.user.email,
            role: res.user.role,
            district: res.user.district || 'East Khasi Hills',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (fe) {
        console.warn('Firestore user sync warning:', fe);
      }

      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Demo Quick Login for Multi-Phone Hopping:
   * 1. Authenticates with Firebase backend anonymously.
   * 2. Writes shared role document to Firestore under users/{userId}.
   * 3. Stores session locally in SecureStore/AsyncStorage.
   * 4. Enables multi-phone hopping so Phone 1 can be Driver while Phone 2 is Field Officer.
   */
  const loginDemo = async (demoUser: User): Promise<User> => {
    setIsLoading(true);
    try {
      // 1. Generate unique device demo ID instantly
      const demoUid = `${demoUser.userId}-${Math.random().toString(36).substring(2, 8)}`;
      let activeUid = demoUid;

      // 2. Try anonymous Firebase auth with short 2s timeout
      try {
        const authPromise = signInAnonymously(auth);
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
        const fbCred = await Promise.race([authPromise, timeoutPromise]);
        if (fbCred && fbCred.user && fbCred.user.uid) {
          activeUid = fbCred.user.uid;
        }
      } catch (_authErr) {
        // Fallback to demoUid if Firebase Auth is unreachable
      }

      const activeUser: User = {
        ...demoUser,
        userId: activeUid,
      };

      const demoToken = `${DEMO_TOKEN_PREFIX}${activeUid}`;

      // 3. Write user & role info to Firestore in background (non-blocking)
      setDoc(
        doc(db, 'users', activeUid),
        {
          name: activeUser.fullName,
          email: activeUser.email,
          role: activeUser.role,
          district: activeUser.district || 'East Khasi Hills',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((fe) => console.warn('Firestore demo user save notice:', fe));

      // 4. Save session locally & update React AuthContext state instantly
      await secureStorage.setToken(demoToken);
      await secureStorage.setUser(activeUser);
      setToken(demoToken);
      setUser(activeUser);

      return activeUser;
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
        isAuthenticated: !!user && !!token,
        isDemoSession: !!token?.startsWith(DEMO_TOKEN_PREFIX),
        login,
        loginDemo,
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
