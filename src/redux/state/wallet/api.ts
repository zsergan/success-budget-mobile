import type { WalletsOverviewResponse } from '@api/dto';
import type { SpaceArg } from '@redux/api/baseApi';
import { baseApi } from '@redux/api/baseApi';

export const walletApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getWallets: build.query<WalletsOverviewResponse, SpaceArg>({
      query: ({ spaceId }) => ({ url: `/spaces/${spaceId}/wallets` }),
      providesTags: (_result, _error, { spaceId }) => [{ type: 'Wallets', id: spaceId }],
    }),
  }),
});
