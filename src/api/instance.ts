import type { AxiosError } from 'axios';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { showGlobalAlert } from '@components/Alert/AlertProvider/globalAlert';
import store from '@redux/Store';
import { logoutMe } from '@redux/state/auth/thunks';
import { BASE_API_URL_LOCAL, AUTH_TOKEN_KEY } from '@/shared/constants';

export const ApiClient = () => {
  const api = axios.create({ baseURL: BASE_API_URL_LOCAL });

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
    (error: AxiosError) => {
      // A 401 means the token is gone/expired/revoked server-side; the auth
      // slice reset flips RootNavigator back to the sign-in stack.
      if (error.response?.status === 401) {
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
