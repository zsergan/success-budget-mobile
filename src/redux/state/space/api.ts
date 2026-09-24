import type { CreateSpaceRequest, Space, SpaceSummary } from '@api/dto';
import { baseApi, invalidatesOnSuccess } from '@redux/api/baseApi';

export const spaceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSpaces: build.query<Space[], void>({
      query: () => ({ url: '/spaces' }),
      providesTags: ['Spaces'],
    }),
    createSpace: build.mutation<SpaceSummary, CreateSpaceRequest>({
      query: (data) => ({ url: '/spaces', method: 'POST', body: data }),
      invalidatesTags: invalidatesOnSuccess(() => ['Spaces']),
    }),
  }),
});

export const { useGetSpacesQuery } = spaceApi;
