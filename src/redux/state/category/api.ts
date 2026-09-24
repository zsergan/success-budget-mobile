import type {
  Category,
  CreateCategoryRequest,
  DeleteCategoryResponse,
  GetCategoriesResponse,
  UpdateCategoryRequest,
} from '@api/dto';
import type { CategoriesModel, CategoryModel } from '@api/models';
import { mapCategoriesResponse, mapCategory } from '@api/models';
import type { SpaceArg } from '@redux/api/baseApi';
import { baseApi, spaceTags } from '@redux/api/baseApi';

interface CategoryArg extends SpaceArg {
  categoryId: number;
}

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCategories: build.query<CategoriesModel, SpaceArg>({
      query: ({ spaceId }) => ({ url: `/spaces/${spaceId}/categories` }),
      transformResponse: (response: GetCategoriesResponse) => mapCategoriesResponse(response),
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Categories'),
    }),
    createCategory: build.mutation<CategoryModel, SpaceArg & { data: CreateCategoryRequest }>({
      query: ({ spaceId, data }) => ({ url: `/spaces/${spaceId}/categories`, method: 'POST', body: data }),
      transformResponse: (response: Category) => mapCategory(response),
      invalidatesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Categories'),
    }),
    // Covers archive/restore too: archiving unlinks the category from its limit.
    updateCategory: build.mutation<CategoryModel, CategoryArg & { data: UpdateCategoryRequest }>({
      query: ({ spaceId, categoryId, data }) => ({
        url: `/spaces/${spaceId}/categories/${categoryId}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: Category) => mapCategory(response),
      invalidatesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Categories', 'Limits', 'Transactions'),
    }),
    deleteCategory: build.mutation<DeleteCategoryResponse, CategoryArg>({
      query: ({ spaceId, categoryId }) => ({ url: `/spaces/${spaceId}/categories/${categoryId}`, method: 'DELETE' }),
      invalidatesTags: (result, _error, { spaceId }) =>
        result?.archived === false
          ? spaceTags(spaceId, 'Categories', 'Limits')
          : spaceTags(spaceId, 'Categories', 'Limits', 'Transactions'),
    }),
    reorderCategories: build.mutation<void, SpaceArg & { categoryIds: number[] }>({
      query: ({ spaceId, categoryIds }) => ({
        url: `/spaces/${spaceId}/categories/reorder`,
        method: 'PUT',
        body: { category_ids: categoryIds },
      }),
      invalidatesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Categories'),
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useReorderCategoriesMutation,
} = categoryApi;
