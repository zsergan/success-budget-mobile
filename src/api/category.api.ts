import type { GetCategoriesResponse } from './dto';
import { ApiClient } from './instance';

const api = ApiClient();

export const getCategories = async () => {
  const response = await api.get<GetCategoriesResponse>('/categories');

  return response.data;
};
