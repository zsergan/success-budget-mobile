import type {
  CreateCategoryRequest,
  DeleteCategoryResponse,
  GetCategoriesResponse,
  ReorderCategoriesRequest,
  UpdateCategoryRequest,
  Category,
} from './dto';
import { mapCategory } from './models';
import { ApiClient } from './instance';

const api = ApiClient();

export const getCategories = async () => {
  const response = await api.get<GetCategoriesResponse>('/categories');

  return {
    incomes: response.data.incomes.map(mapCategory),
    expenses: response.data.expenses.map(mapCategory),
    archived: response.data.archived.map(mapCategory),
  };
};

export const updateCategory = async (categoryId: number, data: UpdateCategoryRequest) => {
  const response = await api.put<Category>(`/categories/${categoryId}`, data);

  return mapCategory(response.data);
};

export const createCategory = async (data: CreateCategoryRequest) => {
  const response = await api.post<Category>('/categories', data);

  return mapCategory(response.data);
};

export const deleteCategory = async (categoryId: number) => {
  const response = await api.deleteRequest<DeleteCategoryResponse>(`/categories/${categoryId}`);

  return response.data;
};

export const reorderCategories = async (categoryIds: number[]) => {
  await api.put<void, ReorderCategoriesRequest>('/categories/reorder', { category_ids: categoryIds });
};
