import type {
  CreateTransactionRequest,
  CreateTransactionResponse,
  ErrorResponse,
  Transaction,
  TransactionsCountResponse,
  UpdateTransactionRequest,
  UpdateTransactionResponse,
} from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import type { CreateTransactionResult, TransactionModel, UpdateTransactionResult } from '@api/models';
import { mapCreateTransactionResponse, mapTransaction, mapUpdateTransactionResponse } from '@api/models';
import type { SpaceArg } from '@redux/api/baseApi';
import { baseApi, spaceTags } from '@redux/api/baseApi';
import type { TransactionType } from '@shared/enums';

export interface TransactionsArg extends SpaceArg {
  from: string;
  to: string;
  transactionType?: TransactionType;
  categoryId?: number;
  walletId?: number;
}

export interface TransactionArg extends SpaceArg {
  transactionId: string;
}

// One key per user action, reused by every retry of it, so the server applies the action at most once.
interface IdempotentArg {
  idempotencyKey: string;
}

// The version the user saw; the server refuses the write if the record has moved on since.
interface VersionedArg extends TransactionArg, IdempotentArg {
  version: number;
}

export type CreateTransactionArg = SpaceArg & IdempotentArg & { data: CreateTransactionRequest };
export type UpdateTransactionArg = VersionedArg & { data: UpdateTransactionRequest };
export type DeleteTransactionArg = VersionedArg;

// Every caller builds the period the same way, so an equal period is one cache entry and one request.
export const periodArg = (spaceId: number, { from, to }: { from: Date; to: Date }): TransactionsArg => ({
  spaceId,
  from: from.toISOString(),
  to: to.toISOString(),
});

const listParams = ({ from, to, transactionType, categoryId, walletId }: TransactionsArg) => ({
  from,
  to,
  ...(transactionType && { transaction_type: transactionType }),
  ...(categoryId !== undefined && { category_id: categoryId }),
  ...(walletId !== undefined && { wallet_id: walletId }),
});

const writeHeaders = ({ idempotencyKey, version }: IdempotentArg & { version?: number }) => ({
  'Idempotency-Key': idempotencyKey,
  ...(version !== undefined && { 'If-Match': `"${version}"` }),
});

// These refusals show the cached record, wallet or category is already out of date.
const STALE_STATE_CODES: string[] = [
  ApiErrorCode.TRANSACTION_NOT_FOUND,
  ApiErrorCode.TRANSACTION_VERSION_CONFLICT,
  ApiErrorCode.WALLET_DELETED,
  ApiErrorCode.CATEGORY_ARCHIVED,
  ApiErrorCode.FORBIDDEN_WALLET,
  ApiErrorCode.FORBIDDEN_CATEGORY,
];

// A write changes balances, limit spending and each category's transaction count.
const invalidatesTransactionWrite = (_result: unknown, error: unknown, { spaceId }: SpaceArg) => {
  const code = (error as Partial<ErrorResponse> | undefined)?.code;

  return !error || (code !== undefined && STALE_STATE_CODES.includes(code))
    ? spaceTags(spaceId, 'Transactions', 'Wallets', 'Limits', 'Categories')
    : [];
};

export const transactionApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTransactions: build.query<TransactionModel[], TransactionsArg>({
      query: (arg) => ({ url: `/spaces/${arg.spaceId}/transactions`, params: listParams(arg) }),
      transformResponse: (response: Transaction[]) => response.map(mapTransaction),
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Transactions'),
    }),
    getTransactionsCount: build.query<number, TransactionsArg>({
      query: (arg) => ({ url: `/spaces/${arg.spaceId}/transactions/count`, params: listParams(arg) }),
      transformResponse: (response: TransactionsCountResponse) => response.count,
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Transactions'),
    }),
    getLatestTransaction: build.query<TransactionModel | null, SpaceArg>({
      query: ({ spaceId }) => ({ url: `/spaces/${spaceId}/transactions/latest` }),
      transformResponse: (response: Transaction | null) => (response ? mapTransaction(response) : null),
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Transactions'),
    }),
    getTransaction: build.query<TransactionModel, TransactionArg>({
      query: ({ spaceId, transactionId }) => ({ url: `/spaces/${spaceId}/transactions/${transactionId}` }),
      transformResponse: (response: Transaction) => mapTransaction(response),
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Transactions'),
    }),
    createTransaction: build.mutation<CreateTransactionResult, CreateTransactionArg>({
      query: ({ spaceId, data, ...arg }) => ({
        url: `/spaces/${spaceId}/transactions`,
        method: 'POST',
        body: data,
        headers: writeHeaders(arg),
      }),
      transformResponse: (response: CreateTransactionResponse) => mapCreateTransactionResponse(response),
      invalidatesTags: invalidatesTransactionWrite,
    }),
    updateTransaction: build.mutation<UpdateTransactionResult, UpdateTransactionArg>({
      query: ({ spaceId, transactionId, data, ...arg }) => ({
        url: `/spaces/${spaceId}/transactions/${transactionId}`,
        method: 'PATCH',
        body: data,
        headers: writeHeaders(arg),
      }),
      transformResponse: (response: UpdateTransactionResponse) => mapUpdateTransactionResponse(response),
      invalidatesTags: invalidatesTransactionWrite,
    }),
    deleteTransaction: build.mutation<null, DeleteTransactionArg>({
      query: ({ spaceId, transactionId, ...arg }) => ({
        url: `/spaces/${spaceId}/transactions/${transactionId}`,
        method: 'DELETE',
        headers: writeHeaders(arg),
      }),
      invalidatesTags: invalidatesTransactionWrite,
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useGetTransactionsCountQuery,
  useGetLatestTransactionQuery,
  useGetTransactionQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} = transactionApi;
