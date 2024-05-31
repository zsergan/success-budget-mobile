import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { BASE_API_URL_DEV, AUTH_TOKEN_KEY } from '@/shared/constants';

export const ApiClient = () => {
  const api = axios.create({ baseURL: BASE_API_URL_DEV });

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

  const get = <T>(url: string) => api.get<T>(url);

  const post = <T, U = unknown>(url: string, data: U) => api.post<T>(url, data);

  const put = <T, U = unknown>(url: string, data: U) => api.put<T>(url, data);

  const deleteRequest = <T>(url: string) => api.delete<T>(url);

  return {
    get,
    post,
    put,
    deleteRequest,
  };
};
