import type {
  CreateTransactionRequest,
  ErrorResponse,
  Transaction,
  TransactionAssigneesResponse,
  TransactionFeedResponse,
  TransactionOperationResponse,
  TransactionsCountResponse,
  TransactionWriteResponse,
  UpdateTransactionRequest,
} from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import type {
  AssignmentKey,
  TransactionAssigneesModel,
  TransactionFeedPageModel,
  TransactionModel,
  TransactionWriteResult,
} from '@api/models';
import { mapTransaction, mapTransactionAssignees, mapTransactionFeed } from '@api/models';
import type { HttpRequest } from '@redux/api/baseQuery';
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
  // Absent lists every assignment.
  assignment?: AssignmentKey;
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

export interface TransactionsCountArg extends TransactionsArg {
  q?: string;
}

// Home's activity: the newest records of the month it shows.
export interface RecentTransactionsArg extends SpaceArg {
  timeZone: string;
  from: string;
  to: string;
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

const listParams = ({ from, to, transactionType, kind, categoryId, assignment }: TransactionsArg) => ({
  from,
  to,
  ...(transactionType && { transaction_type: transactionType }),
  ...(kind && { kind }),
  ...(categoryId !== undefined && { category_id: categoryId }),
  ...(assignment && { assignment }),
});

// Every transaction route is on `/api/v2`: records belong to the space and carry an author and an assignment.
const v2 = (request: HttpRequest): HttpRequest => ({ ...request, apiVersion: 2 });

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

// One short page and no more: the month's totals come from statistics, never from these rows.
export const RECENT_TRANSACTIONS_LIMIT = 3;

// Built like `periodArg`, so Home and the early fetch for it share one entry for the same month.
export const recentArg = (spaceId: number, range: { from: Date; to: Date }): RecentTransactionsArg => ({
  spaceId,
  timeZone: getDeviceTimeZone(),
  from: range.from.toISOString(),
  to: range.to.toISOString(),
});

// Pages kept per feed entry; scrolling further drops the farthest page and reads it again by cursor on the way back.
export const FEED_MAX_PAGES = 10;

let receivedPages = 0;
let revision = 0;

const writeHeaders = ({ idempotencyKey, version }: IdempotentArg & { version?: number }) => ({
  'Idempotency-Key': idempotencyKey,
  ...(version !== undefined && { 'If-Match': `"${version}"` }),
});

// These refusals show the cached record, category or member list is already out of date.
const STALE_STATE_CODES: string[] = [
  ApiErrorCode.TRANSACTION_NOT_FOUND,
  ApiErrorCode.TRANSACTION_VERSION_CONFLICT,
  ApiErrorCode.CATEGORY_ARCHIVED,
  ApiErrorCode.FORBIDDEN_CATEGORY,
  ApiErrorCode.ASSIGNEE_NOT_MEMBER,
];

// A write changes history under both its old and new assignment, limit spending and each category's count. Tags are
// per space, so every list, filter and statistics cycle of the space reads again, whatever selection it shows.
export const TRANSACTION_WRITE_TAGS = ['Transactions', 'Limits', 'Categories'] as const;

const invalidatesTransactionWrite = (_result: unknown, error: unknown, { spaceId }: SpaceArg) => {
  const code = (error as Partial<ErrorResponse> | undefined)?.code;

  if (code === ApiErrorCode.ASSIGNEE_NOT_MEMBER) return spaceTags(spaceId, ...TRANSACTION_WRITE_TAGS, 'Members');

  return !error || (code !== undefined && STALE_STATE_CODES.includes(code))
    ? spaceTags(spaceId, ...TRANSACTION_WRITE_TAGS)
    : [];
};

export const transactionApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRecentTransactions: build.query<TransactionFeedPageModel, RecentTransactionsArg>({
      query: ({ spaceId, timeZone, from, to }) =>
        v2({
          url: `/spaces/${spaceId}/transactions/feed`,
          params: { from, to, time_zone: timeZone, limit: RECENT_TRANSACTIONS_LIMIT },
        }),
      transformResponse: (response: TransactionFeedResponse) => mapTransactionFeed(response),
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Transactions'),
    }),
    getTransactionsFeed: build.infiniteQuery<TransactionFeedPage, TransactionsFeedArg, FeedPageParam>({
      infiniteQueryOptions: {
        initialPageParam: {},
        maxPages: FEED_MAX_PAGES,
        getNextPageParam: ({ nextCursor }) => (nextCursor ? { cursor: nextCursor } : undefined),
        getPreviousPageParam: ({ previousCursor }) => (previousCursor ? { cursor: previousCursor } : undefined),
      },
      query: ({ queryArg, pageParam }) =>
        v2({
          url: `/spaces/${queryArg.selection.spaceId}/transactions/feed`,
          params: feedParams(queryArg, pageParam),
        }),
      transformResponse: (response: TransactionFeedResponse) => ({
        ...mapTransactionFeed(response),
        sequence: ++receivedPages,
      }),
      // No tags: a change starts a new generation through getTransactionsRevision rather than every page again.
      // A generation belongs to one hook mount, so an entry nobody reads is never read again; removing it also
      // aborts a page it still loads.
      keepUnusedDataFor: 0,
    }),
    // A local counter with no request: each invalidation of the space's history gives a new value.
    getTransactionsRevision: build.query<number, SpaceArg>({
      queryFn: () => ({ data: ++revision }),
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Transactions'),
    }),
    getTransactionsCount: build.query<number, TransactionsCountArg>({
      query: (arg) =>
        v2({
          url: `/spaces/${arg.spaceId}/transactions/count`,
          params: { ...listParams(arg), ...(arg.q && { q: arg.q }) },
        }),
      transformResponse: (response: TransactionsCountResponse) => response.count,
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Transactions'),
    }),
    getLatestTransaction: build.query<TransactionModel | null, SpaceArg>({
      query: ({ spaceId }) => v2({ url: `/spaces/${spaceId}/transactions/latest` }),
      transformResponse: (response: Transaction | null) => (response ? mapTransaction(response) : null),
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Transactions'),
    }),
    getTransaction: build.query<TransactionModel, TransactionArg>({
      query: ({ spaceId, transactionId }) => v2({ url: `/spaces/${spaceId}/transactions/${transactionId}` }),
      transformResponse: (response: Transaction) => mapTransaction(response),
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Transactions'),
    }),
    getTransactionOperation: build.query<CreateOperationStatus, TransactionOperationArg>({
      query: ({ spaceId, operationId }) => v2({ url: `/spaces/${spaceId}/transactions/operations/${operationId}` }),
      transformResponse: ({ status, transaction }: TransactionOperationResponse) => ({
        status,
        transaction: transaction && mapTransaction(transaction),
      }),
      keepUnusedDataFor: 0,
    }),
    // History's "Assigned to" filter: current members, former members with records, and whether any deleted account
    // has records. Joining, leaving and reassigning all change it.
    getTransactionAssignees: build.query<TransactionAssigneesModel, SpaceArg>({
      query: ({ spaceId }) => v2({ url: `/spaces/${spaceId}/transactions/assignees` }),
      transformResponse: (response: TransactionAssigneesResponse) => mapTransactionAssignees(response),
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Transactions', 'Members'),
    }),
    createTransaction: build.mutation<TransactionWriteResult, CreateTransactionArg>({
      query: ({ spaceId, data, ...arg }) =>
        v2({ url: `/spaces/${spaceId}/transactions`, method: 'POST', body: data, headers: writeHeaders(arg) }),
      transformResponse: ({ transaction }: TransactionWriteResponse) => ({ transaction: mapTransaction(transaction) }),
      invalidatesTags: invalidatesTransactionWrite,
    }),
    updateTransaction: build.mutation<TransactionWriteResult, UpdateTransactionArg>({
      query: ({ spaceId, transactionId, data, ...arg }) =>
        v2({
          url: `/spaces/${spaceId}/transactions/${transactionId}`,
          method: 'PATCH',
          body: data,
          headers: writeHeaders(arg),
        }),
      transformResponse: ({ transaction }: TransactionWriteResponse) => ({ transaction: mapTransaction(transaction) }),
      invalidatesTags: invalidatesTransactionWrite,
    }),
    deleteTransaction: build.mutation<null, DeleteTransactionArg>({
      query: ({ spaceId, transactionId, ...arg }) =>
        v2({ url: `/spaces/${spaceId}/transactions/${transactionId}`, method: 'DELETE', headers: writeHeaders(arg) }),
      invalidatesTags: invalidatesTransactionWrite,
    }),
  }),
});

export const {
  useGetRecentTransactionsQuery,
  useGetTransactionsFeedInfiniteQuery,
  useGetTransactionsRevisionQuery,
  useGetTransactionsCountQuery,
  useGetLatestTransactionQuery,
  useGetTransactionQuery,
  useGetTransactionAssigneesQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} = transactionApi;
