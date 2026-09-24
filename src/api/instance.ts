import type { AxiosError, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { showGlobalAlert } from '@components/Alert/AlertProvider/globalAlert';
import { BASE_API_URL, AUTH_TOKEN_KEY } from '@shared/constants';

// Every client built here shares the same auth, 401 and 429 handling -- the
// thin *.api.ts wrappers and the RTK Query base query both go through it.
export const createHttpClient = () => {
  const api = axios.create({ baseURL: BASE_API_URL });

  api.interceptors.request.use(
    async (config) => {
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
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        // A 401 from a request sent under a token the user has since
        // replaced (logged out and back in, or another 401 already forced
        // a logout) must not end that newer session -- only log out if the
        // token this specific request carried is still the one currently
        // stored.
        const requestAuth = error.config?.headers?.Authorization;
        const requestToken = typeof requestAuth === 'string' ? requestAuth.replace(/^Bearer /, '') : undefined;
        const currentToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

        if (requestToken && requestToken === currentToken) {
          // Lazy import: a static one here would close a load-order-dependent
          // import cycle back through Store.ts into this same file.
          const [{ default: store }, { logoutMe }] = await Promise.all([
            import('@redux/Store'),
            import('@redux/state/auth/thunks'),
          ]);

          store.dispatch(logoutMe());
        }
      }

      if (error.response?.status === 429) {
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

  const post = <T, U = unknown>(url: string, data: U) => api.post<T>(url, data);

  const put = <T, U = unknown>(url: string, data?: U) => api.put<T>(url, data);

  const deleteRequest = <T>(url: string) => api.delete<T>(url);

  return {
    get,
    post,
    put,
    deleteRequest,
  };
};
