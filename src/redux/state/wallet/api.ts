import type { CreateWalletRequest, CreateWalletResponse, UpdateWalletRequest, WalletsOverviewResponse } from '@api/dto';
import type { SpaceArg } from '@redux/api/baseApi';
import { baseApi, invalidatesOnSuccess, spaceTags } from '@redux/api/baseApi';

interface WalletArg extends SpaceArg {
  walletId: number;
}

export const walletApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getWallets: build.query<WalletsOverviewResponse, SpaceArg>({
      query: ({ spaceId }) => ({ url: `/spaces/${spaceId}/wallets` }),
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Wallets'),
    }),
    // A non-zero starting balance is recorded as a real transaction.
    createWallet: build.mutation<CreateWalletResponse, SpaceArg & { data: CreateWalletRequest }>({
      query: ({ spaceId, data }) => ({ url: `/spaces/${spaceId}/wallets`, method: 'POST', body: data }),
      invalidatesTags: invalidatesOnSuccess((result, { spaceId }) =>
        result.transaction ? spaceTags(spaceId, 'Wallets', 'Transactions') : spaceTags(spaceId, 'Wallets'),
      ),
    }),
    // History rows embed the wallet, and show it as null once it's deleted.
    updateWallet: build.mutation<void, WalletArg & { data: UpdateWalletRequest }>({
      query: ({ spaceId, walletId, data }) => ({
        url: `/spaces/${spaceId}/wallets/${walletId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: invalidatesOnSuccess((_result, { spaceId }) => spaceTags(spaceId, 'Wallets', 'Transactions')),
    }),
    deleteWallet: build.mutation<void, WalletArg>({
      query: ({ spaceId, walletId }) => ({ url: `/spaces/${spaceId}/wallets/${walletId}`, method: 'DELETE' }),
      invalidatesTags: invalidatesOnSuccess((_result, { spaceId }) => spaceTags(spaceId, 'Wallets', 'Transactions')),
    }),
  }),
});

export const { useGetWalletsQuery, useCreateWalletMutation, useUpdateWalletMutation, useDeleteWalletMutation } =
  walletApi;
