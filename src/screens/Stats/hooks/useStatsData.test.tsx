import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { baseApi, spaceTags } from '@redux/api/baseApi';
import { activateSpace } from '@redux/state/space/thunks';
import { transactionApi } from '@redux/state/transaction/api';
import { createAppStore } from '@redux/Store';
import { TransactionType } from '@shared/enums';
import type { DateRange } from '@shared/utils';
import useStatsData, { STATS_STALE_AFTER_MS } from './useStatsData';
import { createTransactionResponseDto } from '@redux/state/transaction/fixtures';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

type Block = 'summary' | 'trend' | 'breakdown';

interface RequestConfig {
  url: string;
  method?: string;
  params?: Record<string, string | undefined>;
}

type Responder = (config: RequestConfig) => Promise<unknown>;

const SERVER_NOW = '2026-09-28T12:00:00.000Z';

let serverNow: string;
let expense: string;
let respond: Record<Block, Responder>;

const blockOf = (url: string) => url.split('/').pop() as Block;
const requestsTo = (block: Block) =>
  mockedRequest.mock.calls
    .map(([config]: [RequestConfig]) => config)
    .filter((config) => config.url.includes('/statistics/') && blockOf(config.url) === block);
const lastAsOf = (block: Block) => requestsTo(block).at(-1)?.params?.as_of;

const period = (config: RequestConfig) => ({
  type: config.params?.period,
  time_zone: config.params?.time_zone,
  as_of: config.params?.as_of ?? serverNow,
});

const money = (amount: string) => ({ amount, count: 1 });

const body = (config: RequestConfig) => {
  switch (blockOf(config.url)) {
    case 'summary':
      return { period: period(config), income: money('100.00'), expense: money(expense), label: config.url };
    case 'trend':
      return { period: period(config), totals: { income: money('100.00'), expense: money(expense) }, buckets: [] };
    default:
      return { period: period(config), total: money(expense) };
  }
};

const ok: Responder = (config) => Promise.resolve({ data: body(config) });
const serverError: Responder = () => Promise.reject({ response: { data: { statusCode: 500, message: 'boom' } } });
const hang: Responder = () => new Promise(() => {});

const september: DateRange = {
  from: new Date(2026, 8, 1),
  to: new Date(2026, 8, 30, 23, 59, 59, 999),
  preset: 'month',
};
const august: DateRange = { from: new Date(2026, 7, 1), to: new Date(2026, 7, 31, 23, 59, 59, 999), preset: 'month' };

const renderForSpace = (spaceId: number, range = september) => {
  const store = createAppStore();

  store.dispatch(activateSpace(spaceId));

  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const rendered = renderHook((props: { range: DateRange }) => useStatsData(props.range), {
    wrapper,
    initialProps: { range },
  });

  return { store, ...rendered };
};

const expenseOf = (data: unknown) => (data as { expense: { amount: string } } | undefined)?.expense.amount;

beforeEach(() => {
  jest.clearAllMocks();
  serverNow = SERVER_NOW;
  expense = '40.00';
  respond = { summary: ok, trend: ok, breakdown: ok };
  mockedRequest.mockImplementation((config: RequestConfig) => {
    if (config.url.includes('/statistics/')) return respond[blockOf(config.url)](config);
    if (config.method === 'POST') return Promise.resolve({ data: createTransactionResponseDto() });

    return Promise.resolve({ data: [] });
  });
});

afterEach(() => {
  jest.clearAllTimers();
});

const loaded = async (result: { current: ReturnType<typeof useStatsData> }) =>
  waitFor(() => {
    expect(result.current.summary.data).toBeDefined();
    expect(result.current.trend.data).toBeDefined();
    expect(result.current.breakdown.data).toBeDefined();
  });

describe('a load cycle', () => {
  it('sends one as_of, zone and period to all three blocks', async () => {
    const { result, unmount } = renderForSpace(1);

    expect(result.current.summary.isLoading).toBe(true);
    await loaded(result);

    const [summary] = requestsTo('summary');
    expect(summary.url).toBe('/spaces/1/statistics/summary');
    expect(summary.params).toMatchObject({ period: 'month', anchor_date: '2026-09-01' });
    expect(summary.params?.time_zone).toBeTruthy();
    expect(summary.params?.as_of).toMatch(/Z$/);
    expect(summary.params).not.toHaveProperty('cycleId');
    expect(requestsTo('trend')[0].params).toEqual(summary.params);
    expect(requestsTo('breakdown')[0].params).toEqual(summary.params);

    unmount();
  });

  it('keeps the as_of across re-renders', async () => {
    const { result, rerender, unmount } = renderForSpace(1);

    await loaded(result);
    rerender({ range: { ...september } });
    rerender({ range: { ...september } });

    expect(requestsTo('summary')).toHaveLength(1);

    unmount();
  });
});

describe('block errors', () => {
  it('fails one block on its own and retries it with the same as_of', async () => {
    respond.trend = serverError;

    const { result, unmount } = renderForSpace(1);

    await waitFor(() => expect(result.current.trend.hasError).toBe(true));
    expect(result.current.summary.data).toBeDefined();
    expect(result.current.breakdown.data).toBeDefined();

    const asOf = lastAsOf('trend');
    respond.trend = ok;
    act(() => {
      result.current.trend.retry();
    });

    await waitFor(() => expect(result.current.trend.data).toBeDefined());
    expect(lastAsOf('trend')).toBe(asOf);
    expect(requestsTo('summary')).toHaveLength(1);

    unmount();
  });

  it('reports one screen-wide failure only when every block failed with nothing to show', async () => {
    respond.trend = serverError;
    respond.breakdown = serverError;

    const { result, unmount } = renderForSpace(1);

    await waitFor(() => expect(result.current.breakdown.hasError).toBe(true));
    await waitFor(() => expect(result.current.trend.hasError).toBe(true));
    expect(result.current.summary.data).toBeDefined();
    expect(result.current.loadFailed).toBe(false);

    unmount();

    respond.summary = () =>
      Promise.reject({ response: { data: { statusCode: 503, message: 'down', timestamp: SERVER_NOW } } });
    const failing = renderForSpace(2);
    await waitFor(() => expect(failing.result.current.loadFailed).toBe(true));
    expect(failing.result.current.loadError?.statusCode).toBe(503);
    expect(failing.result.current.accessDenied).toBe(false);

    respond = { summary: ok, trend: ok, breakdown: ok };
    act(() => failing.result.current.retryFailed());

    await loaded(failing.result);
    expect(failing.result.current.loadFailed).toBe(false);

    failing.unmount();
  });

  it('tells a refused space apart from a failure to retry', async () => {
    const forbidden: Responder = () =>
      Promise.reject({ response: { data: { statusCode: 403, message: 'Space does not exist' } } });
    respond = { summary: forbidden, trend: forbidden, breakdown: forbidden };

    const { result, unmount } = renderForSpace(1);

    await waitFor(() => expect(result.current.accessDenied).toBe(true));

    unmount();
  });
});

describe('refreshing the same period', () => {
  it('keeps the last figures, marked as updating, while the new cycle loads', async () => {
    const { result, unmount } = renderForSpace(1);

    await loaded(result);
    respond = { summary: hang, trend: hang, breakdown: hang };

    act(() => result.current.refresh());

    expect(expenseOf(result.current.summary.data)).toBe('40.00');
    expect(result.current.summary.isUpdating).toBe(true);
    expect(result.current.trend.isUpdating).toBe(true);
    expect(result.current.isUpdating).toBe(true);
    await waitFor(() => expect(requestsTo('summary')).toHaveLength(2));
    expect(lastAsOf('summary')).not.toBe(requestsTo('summary')[0].params?.as_of);

    unmount();
  });

  it('marks a block whose refresh failed instead of mixing it silently with new figures', async () => {
    const { result, unmount } = renderForSpace(1);

    await loaded(result);
    const firstAsOf = lastAsOf('summary');
    respond.trend = serverError;

    await act(async () => {
      jest.advanceTimersByTime(1);
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.trend.updateFailed).toBe(true));
    expect(result.current.trend.data).toBeDefined();
    expect(result.current.summary.isUpdating).toBe(false);
    expect(result.current.summary.updateFailed).toBe(false);
    expect(lastAsOf('summary')).not.toBe(firstAsOf);
    expect(result.current.updateFailed).toBe(true);

    respond.trend = ok;
    act(() => result.current.retryFailed());

    await waitFor(() => expect(result.current.updateFailed).toBe(false));
    expect(lastAsOf('trend')).toBe(lastAsOf('summary'));

    unmount();
  });
});

describe('switching scope', () => {
  it("drops the previous period's figures in the same render", async () => {
    const { result, rerender, unmount } = renderForSpace(1);

    await loaded(result);
    respond = { summary: hang, trend: hang, breakdown: hang };

    rerender({ range: august });

    expect(result.current.summary.data).toBeUndefined();
    expect(result.current.summary.isLoading).toBe(true);
    expect(result.current.trend.data).toBeUndefined();
    expect(result.current.breakdown.data).toBeUndefined();
    expect(result.current.isUpdating).toBe(false);

    unmount();
  });

  it("drops the previous space's figures in the same render", async () => {
    const { store, result, unmount } = renderForSpace(1);

    await loaded(result);
    respond = { summary: hang, trend: hang, breakdown: hang };

    act(() => {
      store.dispatch(activateSpace(2));
    });

    expect(result.current.summary.data).toBeUndefined();
    expect(result.current.trend.data).toBeUndefined();
    expect(result.current.breakdown.data).toBeUndefined();
    await waitFor(() => expect(requestsTo('summary').at(-1)?.url).toBe('/spaces/2/statistics/summary'));

    unmount();
  });
  it('never shows a late answer for the previous space or period', async () => {
    const late: ((value: unknown) => void)[] = [];
    const deferred: Responder = (config) =>
      config.url.startsWith('/spaces/1/') || config.params?.anchor_date === '2026-09-01'
        ? new Promise((resolve) => late.push(() => resolve({ data: { ...body(config), label: 'late' } })))
        : ok(config);
    respond = { summary: deferred, trend: deferred, breakdown: deferred };

    const { store, result, rerender, unmount } = renderForSpace(1);

    rerender({ range: august });
    act(() => {
      store.dispatch(activateSpace(2));
    });
    await loaded(result);

    await act(async () => late.forEach((resolve) => resolve(undefined)));

    expect(late.length).toBeGreaterThan(0);
    expect((result.current.summary.data as { label?: string }).label).toBe('/spaces/2/statistics/summary');

    unmount();
  });
});

describe('control sums', () => {
  it('reloads every block once with a new as_of when the sums disagree, then shows what it gets', async () => {
    respond.breakdown = (config) => Promise.resolve({ data: { ...body(config), total: money('999.00') } });

    const { result, unmount } = renderForSpace(1);

    await waitFor(() => expect(requestsTo('summary')).toHaveLength(2));
    await loaded(result);
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    const [first, second] = requestsTo('summary');
    expect(second.params?.as_of).not.toBe(first.params?.as_of);
    expect(requestsTo('trend')).toHaveLength(2);
    expect(requestsTo('breakdown')).toHaveLength(2);
    expect(result.current.isUpdating).toBe(false);

    unmount();
  });
});

// The device clock runs ahead of the server's, so its as_of lies in the server's future.
const rejectAsOf: Responder = (config) =>
  config.params?.as_of && config.params.as_of > serverNow
    ? Promise.reject({ response: { data: { statusCode: 400, message: [{ field: 'as_of', error: 'future' }] } } })
    : ok(config);

const createTransaction = (store: ReturnType<typeof createAppStore>) =>
  act(async () => {
    await store.dispatch(
      transactionApi.endpoints.createTransaction.initiate({
        spaceId: 1,
        idempotencyKey: 'key-1',
        data: {
          wallet_id: 1,
          category_id: 1,
          transaction_type: TransactionType.EXPENSE,
          amount: '15.00',
          timestamp: SERVER_NOW,
        },
      }),
    );
  });

describe('a rejected as_of', () => {
  beforeEach(() => {
    respond = { summary: rejectAsOf, trend: rejectAsOf, breakdown: rejectAsOf };
  });

  it("repeats without as_of and gives the other blocks summary's echoed one", async () => {
    const { result, unmount } = renderForSpace(1);

    await loaded(result);

    expect(requestsTo('summary').at(-1)?.params?.as_of).toBeUndefined();
    expect(lastAsOf('trend')).toBe(SERVER_NOW);
    expect(lastAsOf('breakdown')).toBe(SERVER_NOW);

    unmount();
  });

  it("asks again on every new cycle and runs the other blocks on the new answer's as_of", async () => {
    const { store, result, unmount } = renderForSpace(1);

    await loaded(result);
    const summaryCalls = requestsTo('summary').length;

    serverNow = '2026-09-28T12:05:00.000Z';
    expense = '55.00';
    await createTransaction(store);

    await waitFor(() => expect(expenseOf(result.current.summary.data)).toBe('55.00'));
    await waitFor(() => expect(lastAsOf('breakdown')).toBe(serverNow));
    expect(requestsTo('summary')).toHaveLength(summaryCalls + 1);
    expect(requestsTo('summary').at(-1)?.params?.as_of).toBeUndefined();
    expect(lastAsOf('trend')).toBe(serverNow);

    await act(async () => {
      jest.advanceTimersByTime(STATS_STALE_AFTER_MS);
    });
    serverNow = '2026-09-28T12:06:00.000Z';
    act(() => result.current.refreshIfStale());

    await waitFor(() => expect(lastAsOf('trend')).toBe(serverNow));
    expect(requestsTo('summary')).toHaveLength(summaryCalls + 2);
    expect(lastAsOf('breakdown')).toBe(serverNow);

    unmount();
  });

  it('keeps the previous figures, marked as updating, until the new summary answers', async () => {
    const { store, result, unmount } = renderForSpace(1);

    await loaded(result);
    respond.summary = hang;
    await createTransaction(store);

    await waitFor(() => expect(result.current.isUpdating).toBe(true));
    expect(result.current.summary.data).toBeDefined();
    expect(result.current.trend.isUpdating).toBe(true);
    expect(result.current.breakdown.isUpdating).toBe(true);

    unmount();
  });

  it('retries a failed block on its own, with the as_of its cycle got', async () => {
    const { result, unmount } = renderForSpace(1);

    await loaded(result);
    const summaryCalls = requestsTo('summary').length;
    respond.trend = serverError;
    serverNow = '2026-09-28T12:05:00.000Z';
    await act(async () => {
      jest.advanceTimersByTime(STATS_STALE_AFTER_MS);
    });
    act(() => result.current.refresh());

    await waitFor(() => expect(result.current.trend.updateFailed).toBe(true));
    respond.trend = rejectAsOf;
    serverNow = '2026-09-28T12:06:00.000Z';
    act(() => {
      result.current.trend.retry();
    });

    await waitFor(() => expect(result.current.trend.updateFailed).toBe(false));
    expect(lastAsOf('trend')).toBe('2026-09-28T12:05:00.000Z');
    expect(requestsTo('summary')).toHaveLength(summaryCalls + 1);

    unmount();
  });

  it('reloads once when the sums disagree, still on the server clock', async () => {
    respond.breakdown = (config) =>
      rejectAsOf(config).then(() => ({ data: { ...body(config), total: money('999.00') } }));

    const { result, unmount } = renderForSpace(1);

    await loaded(result);
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    const summaries = requestsTo('summary');
    expect(summaries).toHaveLength(3);
    expect(summaries.slice(1).map((config) => config.params?.as_of)).toEqual([undefined, undefined]);
    expect(requestsTo('breakdown').filter((config) => config.params?.as_of === SERVER_NOW)).toHaveLength(2);
    await waitFor(() => expect(result.current.isUpdating).toBe(false));

    unmount();
  });
});

describe('after a mutation', () => {
  it('starts a new cycle once a transaction is created in this space', async () => {
    const { store, result, unmount } = renderForSpace(1);

    await loaded(result);
    expense = '55.00';

    await act(async () => {
      await store.dispatch(
        transactionApi.endpoints.createTransaction.initiate({
          spaceId: 1,
          idempotencyKey: 'key-1',
          data: {
            wallet_id: 1,
            category_id: 1,
            transaction_type: TransactionType.EXPENSE,
            amount: '15.00',
            timestamp: SERVER_NOW,
          },
        }),
      );
    });

    await waitFor(() => expect(expenseOf(result.current.summary.data)).toBe('55.00'));
    expect(requestsTo('summary')).toHaveLength(2);

    unmount();
  });

  it('does not reload after a failed mutation', async () => {
    const { store, result, unmount } = renderForSpace(1);

    await loaded(result);
    mockedRequest.mockImplementationOnce(() =>
      Promise.reject({ response: { data: { statusCode: 500, message: 'boom' } } }),
    );

    await act(async () => {
      await store.dispatch(
        transactionApi.endpoints.createTransaction.initiate({
          spaceId: 1,
          idempotencyKey: 'key-1',
          data: {
            wallet_id: 1,
            category_id: 1,
            transaction_type: TransactionType.EXPENSE,
            amount: '15.00',
            timestamp: SERVER_NOW,
          },
        }),
      );
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(requestsTo('summary')).toHaveLength(1);

    unmount();
  });

  it('ignores data changes in another space', async () => {
    const { store, result, unmount } = renderForSpace(1);

    await loaded(result);

    act(() => {
      store.dispatch(baseApi.util.invalidateTags(spaceTags(2, 'Transactions', 'Wallets', 'Categories')));
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(requestsTo('summary')).toHaveLength(1);

    unmount();
  });
});

describe('refreshIfStale', () => {
  it('reloads only a cycle older than the staleness window', async () => {
    const { result, unmount } = renderForSpace(1);

    await loaded(result);

    act(() => result.current.refreshIfStale());
    expect(requestsTo('summary')).toHaveLength(1);

    await act(async () => {
      jest.advanceTimersByTime(STATS_STALE_AFTER_MS);
    });
    act(() => result.current.refreshIfStale());

    await waitFor(() => expect(requestsTo('summary')).toHaveLength(2));

    unmount();
  });
});
