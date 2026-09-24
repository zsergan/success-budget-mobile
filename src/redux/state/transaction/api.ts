import type { Transaction } from '@api/dto';
import type { TransactionModel } from '@api/models';
import { mapTransaction } from '@api/models';
import type { SpaceArg } from '@redux/api/baseApi';
import { baseApi } from '@redux/api/baseApi';

// Without a period the backend returns the current month (Home's recent activity).
export interface TransactionsArg extends SpaceArg {
  from?: string;
  to?: string;
}

export const transactionApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTransactions: build.query<TransactionModel[], TransactionsArg>({
      query: ({ spaceId, from, to }) => ({ url: `/spaces/${spaceId}/transactions`, params: { from, to } }),
      transformResponse: (response: Transaction[]) => response.map(mapTransaction),
      providesTags: (_result, _error, { spaceId }) => [{ type: 'Transactions', id: spaceId }],
    }),
    getLatestTransaction: build.query<TransactionModel | null, SpaceArg>({
      query: ({ spaceId }) => ({ url: `/spaces/${spaceId}/transactions/latest` }),
      transformResponse: (response: Transaction | null) => (response ? mapTransaction(response) : null),
      providesTags: (_result, _error, { spaceId }) => [{ type: 'Transactions', id: spaceId }],
    }),
  }),
});
