'use client';

/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  api, 
  setTokens, 
  clearTokens, 
  getStoredUser, 
  setStoredUser,
  getAccessToken 
} from '@/lib/api-client';
import { AUTH_ENDPOINTS, CART_ENDPOINTS } from '@/lib/api-config';
import { User, Cart } from '@/lib/types';
import { getGuestCart, clearGuestCart } from '@/lib/utils';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: 'customer' | 'vendor';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = getAccessToken();
      const storedUser = getStoredUser();
      
      if (accessToken && storedUser) {
        setUser(storedUser);
        setToken(accessToken);
        
        // Verify token is still valid by fetching profile
        try {
          const profile = await api.get<User>(AUTH_ENDPOINTS.PROFILE);
          setUser(profile);
          setStoredUser(profile);
        } catch {
          // Token is invalid
          clearTokens();
          setUser(null);
          setToken(null);
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    const response = await api.post<{
      user: User;
      access: string;
      refresh: string;
    }>(AUTH_ENDPOINTS.LOGIN, { email, password }, { skipAuth: true });

    setTokens({ access: response.access, refresh: response.refresh });
    setStoredUser(response.user);
    setUser(response.user);
    setToken(response.access);

    // Merge guest cart into user cart
    const guestCart = getGuestCart();
    if (guestCart.length > 0) {
      try {
        await api.post(CART_ENDPOINTS.MERGE, { items: guestCart });
        clearGuestCart();
      } catch (error) {
        console.error('Failed to merge guest cart:', error);
      }
    }
  };

  // Register function
  const register = async (data: RegisterData) => {
    const response = await api.post<{
      user: User;
      tokens: { access: string; refresh: string };
    }>(AUTH_ENDPOINTS.REGISTER, data, { skipAuth: true });

    setTokens(response.tokens);
    setStoredUser(response.user);
    setUser(response.user);
    setToken(response.tokens.access);

    // Merge guest cart
    const guestCart = getGuestCart();
    if (guestCart.length > 0) {
      try {
        await api.post(CART_ENDPOINTS.MERGE, { items: guestCart });
        clearGuestCart();
      } catch (error) {
        console.error('Failed to merge guest cart:', error);
      }
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('ag_ecom_refresh_token');
      if (refreshToken) {
        await api.post(AUTH_ENDPOINTS.LOGOUT, { refresh: refreshToken });
      }
    } catch {
      // Ignore logout errors
    } finally {
      clearTokens();
      setUser(null);
      setToken(null);
    }
  };

  // Update profile function
  const updateProfile = async (data: Partial<User>) => {
    const updatedUser = await api.patch<User>(AUTH_ENDPOINTS.PROFILE, data);
    setStoredUser(updatedUser);
    setUser(updatedUser);
  };

  // Refresh user data from server
  const refreshUser = async () => {
    try {
      const profile = await api.get<User>(AUTH_ENDPOINTS.PROFILE);
      setStoredUser(profile);
      setUser(profile);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
