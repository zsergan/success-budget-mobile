import type { CreateSpaceRequest, Space, SpaceSummary } from '@api/dto';
import { baseApi, invalidatesOnSuccess } from '@redux/api/baseApi';

// One key per logical creation, reused by every retry of the same body, so a lost answer never makes a second space.
export interface CreateSpaceArg {
  idempotencyKey: string;
  data: CreateSpaceRequest;
}

export const spaceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSpaces: build.query<Space[], void>({
      query: () => ({ url: '/spaces' }),
      providesTags: ['Spaces'],
    }),
    createSpace: build.mutation<SpaceSummary, CreateSpaceArg>({
      query: ({ idempotencyKey, data }) => ({
        url: '/spaces',
        method: 'POST',
        body: data,
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
      invalidatesTags: invalidatesOnSuccess(() => ['Spaces']),
    }),
  }),
});

export const { useGetSpacesQuery } = spaceApi;
