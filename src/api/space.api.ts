import type { Space } from './dto';
import { ApiClient } from './instance';

const api = ApiClient();

export const getSpaces = async () => {
  const response = await api.get<Space[]>('/spaces');

  return response.data;
};
