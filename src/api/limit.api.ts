import type { Limit, GetLimitsResponse, CreateLimitRequest, UpdateLimitRequest } from './dto';
import { ApiClient } from './instance';

const api = ApiClient();

export const getLimits = async () => {
  const response = await api.get<GetLimitsResponse>('/limits');

  return response.data;
};

export const createLimit = async (data: CreateLimitRequest) => {
  const response = await api.post<Limit>('/limits', data);

  return response.data;
};

export const updateLimit = async (limitId: number, data: UpdateLimitRequest) => {
  const response = await api.put<Limit>(`/limits/${limitId}`, data);

  return response.data;
};
