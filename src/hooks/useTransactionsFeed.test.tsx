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
  signal?: AbortSignal;
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

// The rows the list reports on screen, top first.
let onScreen: string[];

const renderFeed = (initial: { selection: FeedSelection; aroundId?: string }) => {
  const store = createAppStore();
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

  const rendered = renderHook(
    ({ selection, aroundId }: { selection: FeedSelection; aroundId?: string }) =>
      useTransactionsFeed(selection, { pageSize: 2, aroundId, getVisibleIds: () => onScreen }),
    { wrapper, initialProps: initial },
  );

  return { ...rendered, store };
};

beforeEach(() => {
  jest.clearAllMocks();
  sent = [];
  onScreen = [];
  mockedRequest.mockImplementation(
    ({ params, signal }: { params: Record<string, unknown>; signal?: AbortSignal }) =>
      new Promise((resolve, reject) => sent.push({ params, signal, resolve, reject })),
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

const window = (ids: string[], next: string | null, previous: string | null, overrides = {}) =>
  page(ids, next, { page_info: { next_cursor: next, previous_cursor: previous }, ...overrides });

const changeHistory = async (store: ReturnType<typeof renderFeed>['store']) => {
  act(() => {
    store.dispatch(baseApi.util.invalidateTags(spaceTags(3, 'Transactions')));
  });
  await flush();
};

it('loads the next page asked for while a newer one loaded, once that one ends', async () => {
  const { result } = renderFeed({ selection: october, aroundId: 'b' });
  await answer(0, window(['b'], 'n1', 'p1'));

  act(() => result.current.loadPreviousPage());
  await flush();
  act(() => result.current.loadNextPage());
  expect(sent).toHaveLength(2);

  await answer(1, window(['a'], 'n0', null));

  expect(sent.map(({ params }) => params.cursor)).toEqual([undefined, 'p1', 'n1']);
});

it('forgets an asked-for page once the selection changes', async () => {
  const { result, rerender } = renderFeed({ selection: october, aroundId: 'b' });
  await answer(0, window(['b'], 'n1', 'p1'));

  act(() => result.current.loadPreviousPage());
  await flush();
  act(() => result.current.loadNextPage());
  rerender({ selection: feedSelection(period, { q: 'tea', timeZone: 'Europe/Moscow' }) });
  await answer(2, page(['tea'], 'c9'));

  expect(sent.map(({ params }) => params.cursor)).toEqual([undefined, 'p1', undefined]);
});

describe('after a change to the history', () => {
  it('replaces the whole window with one page around the topmost row, keeping the rows until it arrives', async () => {
    const { result, store } = renderFeed({ selection: october });
    await answer(0, page(['a', 'b'], 'c1', { summary: { count: 4, income: '0.00', expense: '10.00' } }));
    act(() => result.current.loadNextPage());
    await answer(1, window(['c', 'd'], 'c2', 'p1'));
    onScreen = ['c'];

    await changeHistory(store);

    expect(sent).toHaveLength(3);
    expect(sent[2].params).toMatchObject({ around_id: 'c' });
    expect(sent[2].params).not.toHaveProperty('cursor');
    expect(ids(result)).toEqual(['a', 'b', 'c', 'd']);

    await answer(2, window(['b', 'c'], 'c3', 'p2', { summary: { count: 5, income: '0.00', expense: '22.00' } }));

    expect(ids(result)).toEqual(['b', 'c']);
    expect(result.current.summary).toEqual({ count: 5, income: '0.00', expense: '22.00' });
    expect(result.current.hasPreviousPage).toBe(true);
    expect(sent).toHaveLength(3);
  });

  it('holds the window by the nearest surviving neighbour when the topmost row is gone', async () => {
    const { result, store } = renderFeed({ selection: october, aroundId: 'b' });
    await answer(0, window(['a', 'b', 'c'], 'n1', 'p1'));
    onScreen = ['b'];

    await changeHistory(store);
    await refuse(1, { statusCode: 404, code: ApiErrorCode.TRANSACTION_NOT_FOUND, message: 'Transaction not found' });
    await refuse(2, { statusCode: 404, code: ApiErrorCode.TRANSACTION_NOT_IN_FEED, message: 'Not in feed' });

    expect(sent.map(({ params }) => params.around_id)).toEqual(['b', 'b', 'c', 'a']);
    expect(ids(result)).toEqual(['a', 'b', 'c']);

    await answer(3, window(['a', 'x'], 'n2', 'p2'));

    expect(ids(result)).toEqual(['a', 'x']);
    expect(result.current.missedAroundId).toBeUndefined();
  });

  it('anchors on the topmost row still listed when a row on screen was already dropped', async () => {
    const { store } = renderFeed({ selection: october, aroundId: 'b' });
    await answer(0, window(['a', 'c', 'd'], 'n1', 'p1'));
    onScreen = ['b', 'c', 'd'];

    await changeHistory(store);

    expect(sent[1].params).toMatchObject({ around_id: 'c' });
  });

  it('reads the newest page again while the newest page is on screen', async () => {
    const { store } = renderFeed({ selection: october });
    await answer(0, page(['a', 'b'], 'c1'));
    onScreen = ['b'];

    await changeHistory(store);

    expect(sent[1].params).not.toHaveProperty('around_id');
    expect(sent[1].params).not.toHaveProperty('cursor');
  });

  it('waits for a page already loading, then replaces the window with it, not after it', async () => {
    const { result, store } = renderFeed({ selection: october });
    await answer(0, page(['a', 'b'], 'c1'));
    onScreen = ['a'];
    act(() => result.current.loadNextPage());
    await flush();

    await changeHistory(store);
    expect(sent).toHaveLength(2);

    await answer(1, window(['c'], 'c2', 'p1'));

    expect(sent[2].params).not.toHaveProperty('cursor');
    await answer(2, page(['z', 'a'], 'c9'));
    expect(ids(result)).toEqual(['z', 'a']);
  });
});

it('says when the record it was asked to open is gone, and opens the newest page instead', async () => {
  const { result } = renderFeed({ selection: october, aroundId: 'x' });
  await refuse(0, { statusCode: 404, code: ApiErrorCode.TRANSACTION_NOT_FOUND, message: 'Transaction not found' });

  expect(result.current.missedAroundId).toBe('x');
  expect(sent[1].params).not.toHaveProperty('around_id');

  await answer(1, page(['a']));
  expect(ids(result)).toEqual(['a']);
});

it('cancels the page still loading for a window a reload replaces, and never shows it', async () => {
  const { result } = renderFeed({ selection: october });
  await answer(0, page(['a', 'b'], 'c1'));
  act(() => result.current.loadNextPage());
  await flush();

  act(() => result.current.refresh());
  await flush();

  expect(sent[1].signal?.aborted).toBe(true);
  await answer(2, page(['a', 'b'], 'c1'));
  expect(ids(result)).toEqual(['a', 'b']);
});

it('never applies a late answer of an earlier search, even when the same search is sent again', async () => {
  const search = (q: string) => feedSelection(period, { q, timeZone: 'Europe/Moscow' });
  const { result, rerender } = renderFeed({ selection: search('a') });

  rerender({ selection: search('ab') });
  rerender({ selection: search('a') });
  await answer(2, page(['a-fresh']));
  await answer(0, page(['a-stale']));
  await answer(1, page(['ab']));

  expect(sent.map(({ params }) => params.q)).toEqual(['a', 'ab', 'a']);
  expect(ids(result)).toEqual(['a-fresh']);
});
