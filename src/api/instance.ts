import type { AxiosError, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { showGlobalAlert } from '@components/Alert/AlertProvider/globalAlert';
import { BASE_API_URL, AUTH_TOKEN_KEY } from '@shared/constants';

import { endHttpSession, getHttpSessionKey } from './session';

declare module 'axios' {
  interface AxiosRequestConfig {
    // A caller that handles this 429 body itself keeps the generic alert quiet.
    isHandledRateLimit?: (body: unknown) => boolean;
  }

  interface InternalAxiosRequestConfig {
    sessionKey?: number;
  }
}

// Sign-in/up (auth.api.ts) and the RTK Query base query share this auth, 401 and 429 handling.
export const createHttpClient = () => {
  const api = axios.create({ baseURL: BASE_API_URL });

  api.interceptors.request.use(
    async (config) => {
      // Captured before the token read, so a logout during it marks the request stale.
      config.sessionKey = getHttpSessionKey();

      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const status = error.response?.status;
      const isSessionCurrent = error.config?.sessionKey === getHttpSessionKey();

      if (status === 401 && isSessionCurrent && error.config?.headers?.Authorization) {
        endHttpSession();
      }

      if (status === 429 && isSessionCurrent && !error.config?.isHandledRateLimit?.(error.response?.data)) {
        showGlobalAlert('Too many requests. Please wait a moment and try again.');
      }

      return Promise.reject(error);
    },
  );

  return api;
};

export const ApiClient = () => {
  const api = createHttpClient();

  const get = <T>(url: string, config?: AxiosRequestConfig) => api.get<T>(url, config);

  const post = <T, U = unknown>(url: string, data: U, config?: AxiosRequestConfig) => api.post<T>(url, data, config);

  const put = <T, U = unknown>(url: string, data?: U) => api.put<T>(url, data);

  const deleteRequest = <T>(url: string) => api.delete<T>(url);

  return {
    get,
    post,
    put,
    deleteRequest,
  };
};
