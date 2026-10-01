import type { CreateTransactionRequest, CreateTransactionResponse, Transaction } from '@api/dto';
import type { TransactionModel } from '@api/models';
import { mapTransaction } from '@api/models';
import type { SpaceArg } from '@redux/api/baseApi';
import { baseApi, invalidatesOnSuccess, spaceTags } from '@redux/api/baseApi';
import type { TransactionType } from '@shared/enums';

export interface TransactionsArg extends SpaceArg {
  from: string;
  to: string;
  transactionType?: TransactionType;
  categoryId?: number;
  walletId?: number;
}

// Every caller builds the period the same way, so an equal period is one cache entry and one request.
export const periodArg = (spaceId: number, { from, to }: { from: Date; to: Date }): TransactionsArg => ({
  spaceId,
  from: from.toISOString(),
  to: to.toISOString(),
});

export const transactionApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTransactions: build.query<TransactionModel[], TransactionsArg>({
      query: ({ spaceId, from, to, transactionType, categoryId, walletId }) => ({
        url: `/spaces/${spaceId}/transactions`,
        params: {
          from,
          to,
          ...(transactionType && { transaction_type: transactionType }),
          ...(categoryId !== undefined && { category_id: categoryId }),
          ...(walletId !== undefined && { wallet_id: walletId }),
        },
      }),
      transformResponse: (response: Transaction[]) => response.map(mapTransaction),
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Transactions'),
    }),
    getLatestTransaction: build.query<TransactionModel | null, SpaceArg>({
      query: ({ spaceId }) => ({ url: `/spaces/${spaceId}/transactions/latest` }),
      transformResponse: (response: Transaction | null) => (response ? mapTransaction(response) : null),
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Transactions'),
    }),
    // Changes balances, limit spending and each category's transaction count.
    createTransaction: build.mutation<CreateTransactionResponse, SpaceArg & { data: CreateTransactionRequest }>({
      query: ({ spaceId, data }) => ({ url: `/spaces/${spaceId}/transactions`, method: 'POST', body: data }),
      invalidatesTags: invalidatesOnSuccess((_result, { spaceId }) =>
        spaceTags(spaceId, 'Transactions', 'Wallets', 'Limits', 'Categories'),
      ),
    }),
  }),
});

export const { useGetTransactionsQuery, useGetLatestTransactionQuery, useCreateTransactionMutation } = transactionApi;
