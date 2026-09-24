import type { CreateLimitRequest, GetLimitsResponse, LimitEntity, UpdateLimitRequest } from '@api/dto';
import type { LimitsModel } from '@api/models';
import { mapLimitsResponse } from '@api/models';
import type { SpaceArg } from '@redux/api/baseApi';
import { baseApi, invalidatesOnSuccess, spaceTags } from '@redux/api/baseApi';

interface LimitArg extends SpaceArg {
  limitId: number;
}

// Every limit write can change which limit a category belongs to, shown on the category itself.
const limitWriteTags = (spaceId: number) => spaceTags(spaceId, 'Limits', 'Categories');

export const limitApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLimits: build.query<LimitsModel, SpaceArg>({
      query: ({ spaceId }) => ({ url: `/spaces/${spaceId}/limits` }),
      transformResponse: (response: GetLimitsResponse) => mapLimitsResponse(response),
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Limits'),
    }),
    createLimit: build.mutation<LimitEntity, SpaceArg & { data: CreateLimitRequest }>({
      query: ({ spaceId, data }) => ({ url: `/spaces/${spaceId}/limits`, method: 'POST', body: data }),
      invalidatesTags: invalidatesOnSuccess((_result, { spaceId }) => limitWriteTags(spaceId)),
    }),
    updateLimit: build.mutation<LimitEntity, LimitArg & { data: UpdateLimitRequest }>({
      query: ({ spaceId, limitId, data }) => ({
        url: `/spaces/${spaceId}/limits/${limitId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: invalidatesOnSuccess((_result, { spaceId }) => limitWriteTags(spaceId)),
    }),
    deleteLimit: build.mutation<void, LimitArg>({
      query: ({ spaceId, limitId }) => ({ url: `/spaces/${spaceId}/limits/${limitId}`, method: 'DELETE' }),
      invalidatesTags: invalidatesOnSuccess((_result, { spaceId }) => limitWriteTags(spaceId)),
    }),
  }),
});

export const { useGetLimitsQuery, useCreateLimitMutation, useUpdateLimitMutation, useDeleteLimitMutation } = limitApi;
