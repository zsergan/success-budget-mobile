import type {
  CreateTransactionRequest,
  CreateTransactionResponse,
  ErrorResponse,
  Transaction,
  TransactionFeedResponse,
  TransactionOperationResponse,
  TransactionsCountResponse,
  UpdateTransactionRequest,
  UpdateTransactionResponse,
} from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import type {
  CreateTransactionResult,
  TransactionFeedPageModel,
  TransactionModel,
  UpdateTransactionResult,
} from '@api/models';
import {
  mapCreateTransactionResponse,
  mapTransaction,
  mapTransactionFeed,
  mapUpdateTransactionResponse,
} from '@api/models';
import type { SpaceArg } from '@redux/api/baseApi';
import { baseApi, spaceTags } from '@redux/api/baseApi';
import { getDeviceTimeZone } from '@redux/state/statistics/selectors';
import type { TransactionKind, TransactionType } from '@shared/enums';

export interface TransactionsArg extends SpaceArg {
  from: string;
  to: string;
  transactionType?: TransactionType;
  // Absent lists both regular transactions and starting balances.
  kind?: TransactionKind;
  categoryId?: number;
  walletId?: number;
}

// What the feed lists: one cursor belongs to exactly one selection.
export interface FeedSelection extends TransactionsArg {
  timeZone: string;
  q?: string;
}

// One cache entry per selection, page size and load generation; a new generation starts from a first page.
export interface TransactionsFeedArg {
  selection: FeedSelection;
  pageSize?: number;
  generation: string;
}

// Where a page starts: an earlier response's cursor, the page holding a record, or (empty) the newest record.
export interface FeedPageParam {
  cursor?: string;
  aroundId?: string;
}

export interface TransactionFeedPage extends TransactionFeedPageModel {
  // The order pages arrived in, so the newest copy of a record or a day total wins.
  sequence: number;
}

export interface TransactionArg extends SpaceArg {
  transactionId: string;
}

export interface TransactionOperationArg extends SpaceArg {
  operationId: string;
}

export interface CreateOperationStatus {
  status: TransactionOperationResponse['status'];
  // Null once the record is deleted.
  transaction: TransactionModel | null;
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

const listParams = ({ from, to, transactionType, kind, categoryId, walletId }: TransactionsArg) => ({
  from,
  to,
  ...(transactionType && { transaction_type: transactionType }),
  ...(kind && { kind }),
  ...(categoryId !== undefined && { category_id: categoryId }),
  ...(walletId !== undefined && { wallet_id: walletId }),
});

// Search text is trimmed and a blank one dropped, so equal searches are one selection.
export const feedSelection = (
  arg: TransactionsArg,
  { q, timeZone = getDeviceTimeZone() }: { q?: string; timeZone?: string } = {},
): FeedSelection => {
  const text = q?.trim();

  return { ...arg, timeZone, ...(text && { q: text }) };
};

export const feedSelectionKey = (selection: FeedSelection) =>
  JSON.stringify(
    Object.entries(selection)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b)),
  );

const feedParams = ({ selection, pageSize }: TransactionsFeedArg, { cursor, aroundId }: FeedPageParam) => ({
  ...listParams(selection),
  time_zone: selection.timeZone,
  ...(selection.q && { q: selection.q }),
  ...(pageSize !== undefined && { limit: pageSize }),
  ...(cursor && { cursor }),
  ...(aroundId && { around_id: aroundId }),
});

let receivedPages = 0;

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
    getTransactionsFeed: build.infiniteQuery<TransactionFeedPage, TransactionsFeedArg, FeedPageParam>({
      infiniteQueryOptions: {
        initialPageParam: {},
        getNextPageParam: ({ nextCursor }) => (nextCursor ? { cursor: nextCursor } : undefined),
        getPreviousPageParam: ({ previousCursor }) => (previousCursor ? { cursor: previousCursor } : undefined),
      },
      query: ({ queryArg, pageParam }) => ({
        url: `/spaces/${queryArg.selection.spaceId}/transactions/feed`,
        params: feedParams(queryArg, pageParam),
      }),
      transformResponse: (response: TransactionFeedResponse) => ({
        ...mapTransactionFeed(response),
        sequence: ++receivedPages,
      }),
      providesTags: (_result, _error, { selection }) => spaceTags(selection.spaceId, 'Transactions'),
      // A generation belongs to one hook mount, so an entry nobody reads is never read again.
      keepUnusedDataFor: 0,
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
    getTransactionOperation: build.query<CreateOperationStatus, TransactionOperationArg>({
      query: ({ spaceId, operationId }) => ({ url: `/spaces/${spaceId}/transactions/operations/${operationId}` }),
      transformResponse: ({ status, transaction }: TransactionOperationResponse) => ({
        status,
        transaction: transaction && mapTransaction(transaction),
      }),
      keepUnusedDataFor: 0,
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
  useGetTransactionsFeedInfiniteQuery,
  useGetTransactionsCountQuery,
  useGetLatestTransactionQuery,
  useGetTransactionQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} = transactionApi;
