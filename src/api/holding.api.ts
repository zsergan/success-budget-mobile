import type { GetHoldingsResponse } from '@api/dto';
import { ApiClient } from './instance';

const api = ApiClient();

export const getHoldings = async () => {
  const response = await api.get<GetHoldingsResponse[]>('/holdings');

  return response.data;
};
