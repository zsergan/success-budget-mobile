import type { GetCategoriesResponse } from '@api/dto';
import type { CategoriesModel } from '@api/models';
import { mapCategoriesResponse } from '@api/models';
import type { SpaceArg } from '@redux/api/baseApi';
import { baseApi } from '@redux/api/baseApi';

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCategories: build.query<CategoriesModel, SpaceArg>({
      query: ({ spaceId }) => ({ url: `/spaces/${spaceId}/categories` }),
      transformResponse: (response: GetCategoriesResponse) => mapCategoriesResponse(response),
      providesTags: (_result, _error, { spaceId }) => [{ type: 'Categories', id: spaceId }],
    }),
  }),
});
