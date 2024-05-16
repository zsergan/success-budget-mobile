import type { LoginPayload, LoginResponse } from './dto';
import { ApiClient } from './instance';

const api = ApiClient();

export const login = async (payload: LoginPayload) => {
  const response = await api.post<LoginResponse>('/users/login', payload);

  return response.data;
};
