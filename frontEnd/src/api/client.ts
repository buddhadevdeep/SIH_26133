import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { handleMockRequest } from '@/mock/mockAdapter';
import { ApiResponse, ApiErrorResponse } from '@/types/api';

const isMockEnabled = import.meta.env.VITE_USE_MOCK === 'true';
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Auth Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('healthconnect_token') || localStorage.getItem('sanjeevani_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors & format responses
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Centralized 401 Token Expiry Handler
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('healthconnect_refresh_token') || localStorage.getItem('sanjeevani_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
          const newAccessToken = res.data.data.accessToken;
          localStorage.setItem('healthconnect_token', newAccessToken);
          localStorage.setItem('sanjeevani_token', newAccessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return apiClient(originalRequest);
        } catch {
          // Token refresh failed - clean session
          localStorage.removeItem('healthconnect_token');
          localStorage.removeItem('healthconnect_user');
          localStorage.removeItem('sanjeevani_token');
          localStorage.removeItem('sanjeevani_user');
          window.dispatchEvent(new Event('auth:expired'));
        }
      }
    }

    // Human-readable status mapping (Section 21 error handling)
    let userFriendlyMessage = 'An unexpected error occurred. Please try again.';
    const status = error.response?.status;

    if (error.code === 'ECONNABORTED' || !error.response) {
      userFriendlyMessage = 'Network connection timed out. Please check your internet connection.';
    } else if (status === 400) {
      userFriendlyMessage = error.response.data?.message || 'Invalid request parameters.';
    } else if (status === 401) {
      userFriendlyMessage = 'Your session has expired. Please sign in again.';
    } else if (status === 403) {
      userFriendlyMessage = 'Access denied. You do not have permissions for this healthcare resource.';
    } else if (status === 404) {
      userFriendlyMessage = error.response.data?.message || 'Requested healthcare record not found.';
    } else if (status === 409) {
      userFriendlyMessage = error.response.data?.message || 'Conflict in record status. Please refresh.';
    } else if (status === 422) {
      userFriendlyMessage = error.response.data?.message || 'Validation failed for the submitted medical form.';
    } else if (status === 429) {
      userFriendlyMessage = 'Too many requests. Please wait a moment before trying again.';
    } else if (status && status >= 500) {
      userFriendlyMessage = 'Healthcare server error. Emergency services are unaffected. Please retry shortly.';
    }

    return Promise.reject({
      success: false,
      message: userFriendlyMessage,
      statusCode: status,
      originalError: error,
    });
  }
);

// Wrapper method supporting both Mock adapter and live Backend endpoints seamlessly
export async function apiRequest<T = unknown>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  data?: unknown
): Promise<ApiResponse<T>> {
  if (isMockEnabled) {
    try {
      const mockResult = await handleMockRequest(url, method, data);
      if (mockResult) {
        return mockResult as ApiResponse<T>;
      }
    } catch (e) {
      console.warn('Mock request fallback failed, passing to live endpoint', e);
    }
  }

  const isRead = method === 'GET' || method === 'DELETE';

  try {
    const response = await apiClient.request<ApiResponse<T>>({
      url,
      method,
      params: isRead ? data : undefined,
      data: !isRead ? data : undefined,
    });

    // Check if the response returned an HTML document (typical on Vercel SPA rewrites when backend is on separate domain)
    if (
      typeof response.data === 'string' &&
      ((response.data as string).trim().startsWith('<!DOCTYPE html') ||
       (response.data as string).trim().startsWith('<html'))
    ) {
      const fallbackResult = await handleMockRequest(url, method, data);
      if (fallbackResult) {
        return fallbackResult as ApiResponse<T>;
      }
    }

    return response.data;
  } catch (error) {
    // Gracefully fallback to mock adapter if live server is temporarily unreachable or returning network/CORS error on Vercel
    try {
      const fallbackResult = await handleMockRequest(url, method, data);
      if (fallbackResult) {
        return fallbackResult as ApiResponse<T>;
      }
    } catch {
      // ignore
    }
    throw error;
  }
}
