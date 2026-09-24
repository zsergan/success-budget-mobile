import type {
  CreateCategoryRequest,
  DeleteCategoryResponse,
  GetCategoriesResponse,
  ReorderCategoriesRequest,
  UpdateCategoryRequest,
  Category,
} from './dto';
import { mapCategoriesResponse, mapCategory } from './models';
import { ApiClient } from './instance';

const api = ApiClient();

export const getCategories = async (spaceId: number) => {
  const response = await api.get<GetCategoriesResponse>(`/spaces/${spaceId}/categories`);

  return mapCategoriesResponse(response.data);
};

export const updateCategory = async (spaceId: number, categoryId: number, data: UpdateCategoryRequest) => {
  const response = await api.put<Category>(`/spaces/${spaceId}/categories/${categoryId}`, data);

  return mapCategory(response.data);
};

export const createCategory = async (spaceId: number, data: CreateCategoryRequest) => {
  const response = await api.post<Category>(`/spaces/${spaceId}/categories`, data);

  return mapCategory(response.data);
};

export const deleteCategory = async (spaceId: number, categoryId: number) => {
  const response = await api.deleteRequest<DeleteCategoryResponse>(`/spaces/${spaceId}/categories/${categoryId}`);

  return response.data;
};

export const reorderCategories = async (spaceId: number, categoryIds: number[]) => {
  await api.put<void, ReorderCategoriesRequest>(`/spaces/${spaceId}/categories/reorder`, {
    category_ids: categoryIds,
  });
};
