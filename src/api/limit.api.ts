import type { CreateLimitRequest, GetLimitsResponse, LimitEntity, UpdateLimitRequest } from './dto';
import { mapLimitsResponse } from './models';
import { ApiClient } from './instance';

const api = ApiClient();

export const getLimits = async () => {
  const response = await api.get<GetLimitsResponse>('/limits');

  return mapLimitsResponse(response.data);
};

export const createLimit = async (data: CreateLimitRequest) => {
  const response = await api.post<LimitEntity>('/limits', data);

  return response.data;
};

export const updateLimit = async (limitId: number, data: UpdateLimitRequest) => {
  const response = await api.put<LimitEntity>(`/limits/${limitId}`, data);

  return response.data;
};

export const deleteLimit = async (limitId: number) => {
  await api.deleteRequest(`/limits/${limitId}`);
};
