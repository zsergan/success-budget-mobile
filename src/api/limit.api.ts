import type { CreateLimitRequest, GetLimitsResponse, LimitEntity, UpdateLimitRequest } from './dto';
import { mapLimitsResponse } from './models';
import { ApiClient } from './instance';

const api = ApiClient();

export const getLimits = async (spaceId: number) => {
  const response = await api.get<GetLimitsResponse>(`/spaces/${spaceId}/limits`);

  return mapLimitsResponse(response.data);
};

export const createLimit = async (spaceId: number, data: CreateLimitRequest) => {
  const response = await api.post<LimitEntity>(`/spaces/${spaceId}/limits`, data);

  return response.data;
};

export const updateLimit = async (spaceId: number, limitId: number, data: UpdateLimitRequest) => {
  const response = await api.put<LimitEntity>(`/spaces/${spaceId}/limits/${limitId}`, data);

  return response.data;
};

export const deleteLimit = async (spaceId: number, limitId: number) => {
  await api.deleteRequest(`/spaces/${spaceId}/limits/${limitId}`);
};
