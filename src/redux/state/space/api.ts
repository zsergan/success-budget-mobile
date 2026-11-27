import type { CreateSpaceRequest, Space, SpaceSummary } from '@api/dto';
import { baseApi, invalidatesOnSuccess, spaceTags } from '@redux/api/baseApi';

// One key per logical creation, reused by every retry of the same body, so a lost answer never makes a second space.
export interface CreateSpaceArg {
  idempotencyKey: string;
  data: CreateSpaceRequest;
}

export interface UpdateSpaceCurrencyArg {
  spaceId: number;
  currencyId: number;
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
    // Relabels the space: amounts keep their numbers. Statistics carry the currency, so they reload with it.
    updateSpaceCurrency: build.mutation<SpaceSummary, UpdateSpaceCurrencyArg>({
      query: ({ spaceId, currencyId }) => ({
        url: `/spaces/${spaceId}/currency`,
        method: 'PATCH',
        body: { currency_id: currencyId },
      }),
      invalidatesTags: invalidatesOnSuccess((_result, { spaceId }) => [
        'Spaces',
        ...spaceTags(spaceId, 'Transactions'),
      ]),
    }),
  }),
});

export const { useGetSpacesQuery, useUpdateSpaceCurrencyMutation } = spaceApi;
