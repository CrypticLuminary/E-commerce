/**
 * API Client with JWT Token Management
 * Handles authentication, token refresh, and API requests
 */

import { AUTH_ENDPOINTS } from './api-config';

// Types
interface Tokens {
  access: string;
  refresh: string;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'customer' | 'vendor' | 'admin';
  phone?: string;
  is_active?: boolean;
  date_joined?: string;
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'ag_ecom_access_token';
const REFRESH_TOKEN_KEY = 'ag_ecom_refresh_token';
const USER_KEY = 'ag_ecom_user';

// Token management functions
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (tokens: Tokens): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setStoredUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Token refresh function
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(AUTH_ENDPOINTS.REFRESH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
      return data.access;
    } else {
      // Refresh token is invalid, clear tokens
      clearTokens();
      return null;
    }
  } catch (error) {
    clearTokens();
    return null;
  }
};

// API request function with automatic token refresh
interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  data?: unknown;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

export const apiRequest = async <T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> => {
  const { skipAuth = false, data, ...fetchOptions } = options;

  // If data is provided but body is not, stringify data for body
  if (data !== undefined && !fetchOptions.body) {
    fetchOptions.body = data instanceof FormData ? data : JSON.stringify(data);
  }

  // Set default headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Add authorization header if not skipping auth
  if (!skipAuth) {
    let token = getAccessToken();
    
    // If no token, try to refresh
    if (!token) {
      token = await refreshAccessToken();
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Handle FormData (for file uploads)
  if (fetchOptions.body instanceof FormData) {
    delete (headers as Record<string, string>)['Content-Type'];
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // If unauthorized, try to refresh token and retry
  if (response.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(url, {
        ...fetchOptions,
        headers,
      });
      
      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({}));
        throw new Error(error.detail || error.error || 'Request failed');
      }
      
      const retryText = await retryResponse.text();
      const retryData = retryText ? JSON.parse(retryText) : {};
      return { data: retryData as T, status: retryResponse.status };
    } else {
      // Token refresh failed, user needs to login again
      clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || Object.values(error)[0] || 'Request failed');
  }

  // Handle empty responses
  const text = await response.text();
  const responseData = text ? JSON.parse(text) : {};
  return { data: responseData as T, status: response.status };
};

// Convenience methods - these return unwrapped data for backward compatibility
export const api = {
  get: async <T>(url: string, options?: RequestOptions) => {
    const response = await apiRequest<T>(url, { ...options, method: 'GET' });
    return response.data;
  },
  
  post: async <T>(url: string, data?: unknown, options?: RequestOptions) => {
    const response = await apiRequest<T>(url, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    return response.data;
  },
  
  put: async <T>(url: string, data?: unknown, options?: RequestOptions) => {
    const response = await apiRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },
  
  patch: async <T>(url: string, data?: unknown, options?: RequestOptions) => {
    const response = await apiRequest<T>(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data;
  },
  
  delete: async <T>(url: string, options?: RequestOptions) => {
    const response = await apiRequest<T>(url, { ...options, method: 'DELETE' });
    return response.data;
  },
};

export type { Tokens, User };
