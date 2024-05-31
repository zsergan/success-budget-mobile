import type { LoginPayload, ProfileResponse, RegisterPayload, VerifyEmailPayload } from './dto';
import { ApiClient } from './instance';

const api = ApiClient();

export const login = async (payload: LoginPayload) => {
  const response = await api.post<string>('/users/login', payload);

  return response.data;
};

export const register = async (payload: RegisterPayload) => {
  const response = await api.post<ProfileResponse>('/users/register', payload);

  return response.data;
};

export const verifyEmail = async (payload: VerifyEmailPayload) => {
  const response = await api.post<string>('/users/verify-email', payload);

  return response.data;
};
