import type { CreateCategoryRequest, GetCategoriesResponse, UpdateCategoryRequest, Category } from './dto';
import { ApiClient } from './instance';

const api = ApiClient();

export const getCategories = async () => {
  const response = await api.get<GetCategoriesResponse>('/categories');

  return response.data;
};

export const updateCategory = async (categoryId: number, data: UpdateCategoryRequest) => {
  const response = await api.put(`/categories/${categoryId}`, data);

  return response.data;
};

export const createCategory = async (data: CreateCategoryRequest) => {
  const response = await api.post<Category>('/categories', data);

  return response.data;
};

export const moveCategoryForward = async (categoryId: number) => {
  const response = await api.put<void>(`/categories/move-forward/${categoryId}`);

  return response.data;
};
