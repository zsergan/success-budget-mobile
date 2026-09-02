import type { AxiosError } from 'axios';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { showGlobalAlert } from '@components/Alert/AlertProvider/globalAlert';
import { BASE_API_URL, AUTH_TOKEN_KEY } from '@shared/constants';

export const ApiClient = () => {
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
      // A 401 means the token is gone/expired/revoked server-side; the auth
      // slice reset flips RootNavigator back to the sign-in stack.
      //
      // store and logoutMe are imported lazily here rather than at module
      // top level: every *.api.ts file constructs its own ApiClient()
      // eagerly at import time, and the store pulls in every domain slice
      // (which import their *.api.ts file in turn) -- a static import of
      // the store from this file closes that cycle back on itself. Which
      // module happens to "win" the race decides whether ApiClient is
      // still undefined when a slice needs it, so a static import here
      // is import-order-dependent and can break depending on which module
      // is loaded first. Deferring the import until the interceptor
      // actually runs sidesteps the cycle entirely.
      if (error.response?.status === 401) {
        const [{ default: store }, { logoutMe }] = await Promise.all([
          import('@redux/Store'),
          import('@redux/state/auth/thunks'),
        ]);

        store.dispatch(logoutMe());
      }

      if (error.response?.status === 429) {
        showGlobalAlert('Too many requests. Please wait a moment and try again.');
      }

      return Promise.reject(error);
    },
  );

  const get = <T>(url: string) => api.get<T>(url);

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
