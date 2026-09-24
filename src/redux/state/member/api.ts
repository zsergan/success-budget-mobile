import type { SpaceMember } from '@api/dto';
import type { SpaceArg } from '@redux/api/baseApi';
import { baseApi } from '@redux/api/baseApi';

export const memberApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMembers: build.query<SpaceMember[], SpaceArg>({
      query: ({ spaceId }) => ({ url: `/spaces/${spaceId}/members` }),
      providesTags: (_result, _error, { spaceId }) => [{ type: 'Members', id: spaceId }],
    }),
  }),
});
