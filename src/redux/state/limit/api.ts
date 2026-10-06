import type { CreateLimitRequest, GetLimitsResponse, LimitEntity, UpdateLimitRequest } from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import type { LimitsModel } from '@api/models';
import { mapLimitsResponse } from '@api/models';
import type { SpaceArg } from '@redux/api/baseApi';
import { baseApi, invalidatesOnSuccess, spaceTags } from '@redux/api/baseApi';
import { isApiError } from '@shared/utils/error';

interface LimitArg extends SpaceArg {
  limitId: number;
}

// Every limit write can change which limit a category belongs to, shown on the category itself.
const limitWriteTags = (spaceId: number) => spaceTags(spaceId, 'Limits', 'Categories');

// A category archived elsewhere rejects the write and proves both lists stale, so they refresh for the next pick.
const invalidatesCategoryWrite = (_result: unknown, error: unknown, { spaceId }: SpaceArg) =>
  !error || isApiError(error, 400, ApiErrorCode.CATEGORY_ARCHIVED) ? limitWriteTags(spaceId) : [];

export const limitApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLimits: build.query<LimitsModel, SpaceArg>({
      query: ({ spaceId }) => ({ url: `/spaces/${spaceId}/limits` }),
      transformResponse: (response: GetLimitsResponse) => mapLimitsResponse(response),
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Limits'),
    }),
    createLimit: build.mutation<LimitEntity, SpaceArg & { data: CreateLimitRequest }>({
      query: ({ spaceId, data }) => ({ url: `/spaces/${spaceId}/limits`, method: 'POST', body: data }),
      invalidatesTags: invalidatesCategoryWrite,
    }),
    updateLimit: build.mutation<LimitEntity, LimitArg & { data: UpdateLimitRequest }>({
      query: ({ spaceId, limitId, data }) => ({
        url: `/spaces/${spaceId}/limits/${limitId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: invalidatesCategoryWrite,
    }),
    deleteLimit: build.mutation<void, LimitArg>({
      query: ({ spaceId, limitId }) => ({ url: `/spaces/${spaceId}/limits/${limitId}`, method: 'DELETE' }),
      invalidatesTags: invalidatesOnSuccess((_result, { spaceId }) => limitWriteTags(spaceId)),
    }),
  }),
});

export const { useGetLimitsQuery, useCreateLimitMutation, useUpdateLimitMutation, useDeleteLimitMutation } = limitApi;
