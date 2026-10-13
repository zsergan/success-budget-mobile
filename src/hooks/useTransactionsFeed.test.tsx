import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { ErrorResponse, TransactionFeedResponse } from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import { baseApi, spaceTags } from '@redux/api/baseApi';
import { createAppStore } from '@redux/Store';
import type { FeedSelection } from '@redux/state/transaction/api';
import { feedSelection } from '@redux/state/transaction/api';
import { feedDto, transactionDto } from '@redux/state/transaction/fixtures';
import useTransactionsFeed from './useTransactionsFeed';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

interface Sent {
  params: Record<string, unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

let sent: Sent[];

const period = { spaceId: 3, from: '2026-09-30T21:00:00.000Z', to: '2026-10-31T20:59:59.999Z' };
const october = feedSelection(period, { timeZone: 'Europe/Moscow' });

const page = (ids: string[], next: string | null = null, overrides: Partial<TransactionFeedResponse> = {}) =>
  feedDto(
    ids.map((id) => transactionDto({ id })),
    { page_info: { next_cursor: next, previous_cursor: null }, ...overrides },
  );

const flush = () => act(() => jest.runAllTimersAsync());

const answer = async (index: number, data: TransactionFeedResponse) => {
  sent[index].resolve({ data });
  await flush();
};

const refuse = async (index: number, data: Partial<ErrorResponse>) => {
  sent[index].reject({ response: { data: { path: '', timestamp: '', ...data } } });
  await flush();
};

const ids = (result: { current: { items: { id: string }[] } }) => result.current.items.map(({ id }) => id);

const renderFeed = (initial: { selection: FeedSelection; aroundId?: string }) => {
  const store = createAppStore();
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

  const rendered = renderHook(
    ({ selection, aroundId }: { selection: FeedSelection; aroundId?: string }) =>
      useTransactionsFeed(selection, { pageSize: 2, aroundId }),
    { wrapper, initialProps: initial },
  );

  return { ...rendered, store };
};

beforeEach(() => {
  jest.clearAllMocks();
  sent = [];
  mockedRequest.mockImplementation(
    ({ params }: { params: Record<string, unknown> }) =>
      new Promise((resolve, reject) => sent.push({ params, resolve, reject })),
  );
});

it('shows the first page with the server totals', async () => {
  const { result } = renderFeed({ selection: october });

  expect(result.current.isLoading).toBe(true);
  await answer(
    0,
    page(['a', 'b'], 'c1', {
      summary: { count: 3, income: '2500.00', expense: '1184.45' },
      day_totals: [{ date: '2026-10-03', net: '-31.50' }],
    }),
  );

  expect(ids(result)).toEqual(['a', 'b']);
  expect(result.current.summary).toEqual({ count: 3, income: '2500.00', expense: '1184.45' });
  expect(result.current.dayNets).toEqual({ '2026-10-03': '-31.50' });
  expect(result.current.hasNextPage).toBe(true);
  expect(sent[0].params).not.toHaveProperty('cursor');
});

it('asks for the next page once however often the list reaches its end', async () => {
  const { result } = renderFeed({ selection: october });
  await answer(0, page(['a', 'b'], 'c1'));

  act(() => {
    result.current.loadNextPage();
    result.current.loadNextPage();
  });
  act(() => result.current.loadNextPage());
  await flush();

  expect(sent).toHaveLength(2);
  expect(sent[1].params).toMatchObject({ cursor: 'c1' });
  expect(result.current.isLoadingNextPage).toBe(true);

  await answer(1, page(['b', 'c']));
  act(() => result.current.loadNextPage());

  expect(ids(result)).toEqual(['a', 'b', 'c']);
  expect(result.current.hasNextPage).toBe(false);
  expect(sent).toHaveLength(2);
});

it('does not ask again for a next page that failed until retried', async () => {
  const { result } = renderFeed({ selection: october });
  await answer(0, page(['a'], 'c1'));

  act(() => result.current.loadNextPage());
  await refuse(1, { statusCode: 500, message: 'Internal error' });
  act(() => result.current.loadNextPage());

  expect(sent).toHaveLength(2);
  expect(result.current.hasNextPageError).toBe(true);
  expect(result.current.hasRefreshError).toBe(false);
  expect(ids(result)).toEqual(['a']);

  act(() => result.current.retry());
  expect(sent[2].params).toMatchObject({ cursor: 'c1' });
});

it('reloads from the first page, keeping the rows until it arrives, and ignores a page of the old load', async () => {
  const { result } = renderFeed({ selection: october });
  await answer(0, page(['a', 'b'], 'c1'));
  act(() => result.current.loadNextPage());

  act(() => result.current.refresh());

  expect(sent[2].params).not.toHaveProperty('cursor');
  expect(result.current.isRefreshing).toBe(true);
  expect(ids(result)).toEqual(['a', 'b']);

  await answer(1, page(['c', 'd']));
  expect(ids(result)).toEqual(['a', 'b']);

  await answer(2, page(['z', 'a'], 'c2'));
  expect(ids(result)).toEqual(['z', 'a']);
  expect(result.current.isRefreshing).toBe(false);

  await waitFor(() => expect(result.current.hasNextPage).toBe(true));
});

it("never shows another selection's rows, even when its answer comes late", async () => {
  const { result, rerender } = renderFeed({ selection: october });
  await answer(0, page(['a']));

  const search = feedSelection(period, { q: 'coffee', timeZone: 'Europe/Moscow' });
  rerender({ selection: search });

  expect(result.current.isLoading).toBe(true);
  expect(result.current.items).toEqual([]);
  expect(sent[1].params).toMatchObject({ q: 'coffee' });

  rerender({ selection: feedSelection(period, { q: 'tea', timeZone: 'Europe/Moscow' }) });
  await answer(1, page(['coffee']));

  expect(result.current.items).toEqual([]);

  await answer(2, page(['tea']));
  expect(ids(result)).toEqual(['tea']);
});

it('starts again from the first page when the server rejects a cursor', async () => {
  const { result } = renderFeed({ selection: october });
  await answer(0, page(['a'], 'c1'));

  act(() => result.current.loadNextPage());
  await refuse(1, {
    statusCode: 400,
    code: ApiErrorCode.VALIDATION_FAILED,
    message: [{ field: 'cursor', error: 'cursor does not belong to this query' }],
  });

  expect(sent).toHaveLength(3);
  expect(sent[2].params).not.toHaveProperty('cursor');
  expect(ids(result)).toEqual(['a']);

  await answer(2, page(['b']));
  expect(ids(result)).toEqual(['b']);
});

it('opens around a record and falls back to the first page when it is not in the selection', async () => {
  const { result } = renderFeed({ selection: october, aroundId: 'x' });

  expect(sent[0].params).toMatchObject({ around_id: 'x' });
  await refuse(0, { statusCode: 404, code: ApiErrorCode.TRANSACTION_NOT_IN_FEED, message: 'Not in feed' });

  expect(sent[1].params).not.toHaveProperty('around_id');
  expect(result.current.hasError).toBe(false);

  await answer(1, page(['a']));
  expect(ids(result)).toEqual(['a']);
});

it('retries a failed first page around the same record', async () => {
  const { result } = renderFeed({ selection: october, aroundId: 'x' });
  await refuse(0, { statusCode: 500, message: 'Internal error' });

  expect(result.current.hasError).toBe(true);

  act(() => result.current.retry());
  expect(sent[1].params).toMatchObject({ around_id: 'x' });
  expect(result.current.isLoading).toBe(true);
});

it('loads the next page asked for while the loaded pages were refreshed, once that refresh ends', async () => {
  const { result, store } = renderFeed({ selection: october });
  await answer(0, page(['a'], 'c1'));

  act(() => {
    store.dispatch(baseApi.util.invalidateTags(spaceTags(3, 'Transactions')));
  });
  await flush();
  act(() => result.current.loadNextPage());
  expect(sent).toHaveLength(2);

  await answer(1, page(['a'], 'c2'));

  expect(sent).toHaveLength(3);
  expect(sent[2].params).toMatchObject({ cursor: 'c2' });
});

it('forgets an asked-for page once the selection changes', async () => {
  const { result, rerender, store } = renderFeed({ selection: october });
  await answer(0, page(['a'], 'c1'));

  act(() => {
    store.dispatch(baseApi.util.invalidateTags(spaceTags(3, 'Transactions')));
  });
  await flush();
  act(() => result.current.loadNextPage());
  rerender({ selection: feedSelection(period, { q: 'tea', timeZone: 'Europe/Moscow' }) });
  await answer(2, page(['tea'], 'c9'));
  await answer(1, page(['a'], 'c1'));

  expect(sent.map(({ params }) => params.cursor)).toEqual([undefined, undefined, undefined]);
});

it('retries a failed page with the same cursor and does not chain retries on its own', async () => {
  const { result } = renderFeed({ selection: october });
  await answer(0, page(['a'], 'c1'));

  act(() => result.current.loadNextPage());
  await flush();
  await refuse(1, { statusCode: 500, message: 'Internal error' });
  act(() => result.current.retry());
  await flush();
  await refuse(2, { statusCode: 500, message: 'Internal error' });
  act(() => result.current.loadNextPage());
  await flush();

  expect(sent.map(({ params }) => params.cursor)).toEqual([undefined, 'c1', 'c1']);
  expect(ids(result)).toEqual(['a']);
});
