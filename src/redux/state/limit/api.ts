import type { GetLimitsResponse } from '@api/dto';
import type { LimitsModel } from '@api/models';
import { mapLimitsResponse } from '@api/models';
import type { SpaceArg } from '@redux/api/baseApi';
import { baseApi } from '@redux/api/baseApi';

export const limitApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLimits: build.query<LimitsModel, SpaceArg>({
      query: ({ spaceId }) => ({ url: `/spaces/${spaceId}/limits` }),
      transformResponse: (response: GetLimitsResponse) => mapLimitsResponse(response),
      providesTags: (_result, _error, { spaceId }) => [{ type: 'Limits', id: spaceId }],
    }),
  }),
});
