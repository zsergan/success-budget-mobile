import type { AxiosError, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { showGlobalAlert } from '@components/Alert/AlertProvider/globalAlert';
import { BASE_API_URL, AUTH_TOKEN_KEY } from '@shared/constants';

import { endHttpSession, getHttpSessionKey, isHttpSessionLaunching } from './session';

declare module 'axios' {
  interface AxiosRequestConfig {
    sessionKey?: number;
    // A caller that handles this 429 body itself keeps the generic alert quiet.
    isHandledRateLimit?: (body: unknown) => boolean;
  }
}

// A request with no answer by then fails like a lost connection; a write it carried may still have applied.
export const REQUEST_TIMEOUT_MS = 20_000;

// Sign-in/up (auth.api.ts) and the RTK Query base query share this auth, 401 and 429 handling.
export const createHttpClient = () => {
  const api = axios.create({ baseURL: BASE_API_URL, timeout: REQUEST_TIMEOUT_MS });

  api.interceptors.request.use(
    async (config) => {
      // Captured before the token read, so a logout during it marks the request stale.
      config.sessionKey ??= getHttpSessionKey();

      if (config.sessionKey !== getHttpSessionKey()) {
        throw new axios.CanceledError('The request’s session has ended.', config);
      }

      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

      if (config.sessionKey !== getHttpSessionKey()) {
        throw new axios.CanceledError('The request’s session has ended.', config);
      }

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

      if (
        status === 429 &&
        isSessionCurrent &&
        !isHttpSessionLaunching() &&
        !error.config?.isHandledRateLimit?.(error.response?.data)
      ) {
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
