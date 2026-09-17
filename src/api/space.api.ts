import type { CreateSpaceRequest, Space } from './dto';
import { ApiClient } from './instance';

const api = ApiClient();

export const getSpaces = async () => {
  const response = await api.get<Space[]>('/spaces');

  return response.data;
};

export const createSpace = async (data: CreateSpaceRequest) => {
  const response = await api.post<Space>('/spaces', data);

  return response.data;
};

export const deleteSpace = async (spaceId: number) => {
  await api.deleteRequest(`/spaces/${spaceId}`);
};
