import type { Currency } from './dto';
import { ApiClient } from './instance';

const api = ApiClient();

export const getCurrencies = async () => {
  const response = await api.get<Currency[]>('/currencies');

  return response.data;
};
