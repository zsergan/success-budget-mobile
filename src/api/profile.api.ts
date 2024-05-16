import type { ProfileResponse } from '@api/dto';
import { ApiClient } from './instance';

const api = ApiClient();

export const getProfile = async () => {
  const response = await api.get<ProfileResponse>('/users/profile');

  return response.data;
};
