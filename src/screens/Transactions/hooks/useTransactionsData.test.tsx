import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { Transaction, TransactionFeedResponse } from '@api/dto';
import { baseApi, spaceTags } from '@redux/api/baseApi';
import { activateSpace } from '@redux/state/space/thunks';
import { feedDto } from '@redux/state/transaction/fixtures';
import { createAppStore } from '@redux/Store';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import type { HistoryFilter } from '@shared/types';
import type { DateRange } from '@shared/utils';
import useTransactionsData from './useTransactionsData';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

interface RequestConfig {
  url: string;
  params?: { from?: string; to?: string; transaction_type?: string; category_id?: number; cursor?: string };
}

type Responder = (config: RequestConfig) => Promise<unknown>;

let respondRange: Responder;
let respondLatest: Responder;

const serverError = () => Promise.reject({ response: { data: { statusCode: 500, message: 'boom' } } });
const rows = (...ids: string[]) => Promise.resolve({ data: feedDto(ids.map((id) => ({ ...dto, id }))) });
const feed = (data: TransactionFeedResponse) => Promise.resolve({ data });

const STAMPS = { created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' };

const dto: Transaction = {
  id: 'tx-1',
  kind: TransactionKind.REGULAR,
  transaction_type: TransactionType.EXPENSE,
  amount: '10.00',
  timestamp: '2026-01-05T00:00:00.000Z',
  description: null,
  version: 1,
  wallet: { id: 1, wallet_name: 'Cash', design: AppColor.SLATE, ...STAMPS },
  category: {
    id: 1,
    name: 'Food',
    transaction_type: TransactionType.EXPENSE,
    icon: 'Grocery',
    color: AppColor.SLATE,
    is_active: 1,
    is_archived: false,
    ...STAMPS,
  },
};

const january: DateRange = { from: new Date('2026-01-01'), to: new Date('2026-01-31'), preset: 'month' };
const february: DateRange = { from: new Date('2026-02-01'), to: new Date('2026-02-28'), preset: 'month' };

const renderForSpace = (spaceId: number, range = january) => {
  const store = createAppStore();

  store.dispatch(activateSpace(spaceId));

  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const rendered = renderHook(
    (props: { range: DateRange; filter?: HistoryFilter | null }) =>
      useTransactionsData({ range: props.range, filter: props.filter ?? null }),
    { wrapper, initialProps: { range } as { range: DateRange; filter?: HistoryFilter | null } },
  );

  return { store, ...rendered };
};

const callsTo = (suffix: string) =>
  mockedRequest.mock.calls.filter(([config]: [RequestConfig]) => config.url.endsWith(suffix)).length;
const latestCalls = () => callsTo('/latest');

beforeEach(() => {
  jest.clearAllMocks();
  respondRange = () => rows();
  respondLatest = () => Promise.resolve({ data: null });
  mockedRequest.mockImplementation((config: RequestConfig) =>
    config.url.endsWith('/latest') ? respondLatest(config) : respondRange(config),
  );
});

describe('useTransactionsData viewState', () => {
  it('shows latestError when the period is empty and latest fails', async () => {
    respondLatest = serverError;

    const { result, unmount } = renderForSpace(1);

    await waitFor(() => expect(result.current.viewState).toBe('latestError'));

    unmount();
  });

  it('shows latestError (not trueEmpty) for a network failure with no HTTP response at all', async () => {
    respondLatest = () => Promise.reject(new Error('Network Error'));

    const { result, unmount } = renderForSpace(1);

    await waitFor(() => expect(result.current.viewState).toBe('latestError'));

    unmount();
  });

  it('shows trueEmpty once an empty period and a confirmed-empty latest both settle', async () => {
    const { result, unmount } = renderForSpace(1);

    await waitFor(() => expect(result.current.viewState).toBe('trueEmpty'));

    unmount();
  });

  it('shows rangeError, not a false empty state, when the period request fails', async () => {
    respondRange = serverError;

    const { result, unmount } = renderForSpace(1);

    await waitFor(() => expect(result.current.viewState).toBe('rangeError'));

    unmount();
  });

  it('stays ready on a non-empty period even if latest fails', async () => {
    respondRange = () => rows('tx-1');
    respondLatest = serverError;

    const { result, unmount } = renderForSpace(1);

    await waitFor(() => expect(result.current.viewState).toBe('ready'));

    unmount();
  });
});

describe('a Stats filter', () => {
  const filter: HistoryFilter = {
    spaceId: 1,
    name: 'Food',
    from: '2026-08-31T21:00:00.000Z',
    to: '2026-09-30T09:15:42.123Z',
    transactionType: TransactionType.EXPENSE,
    kind: TransactionKind.REGULAR,
    categoryId: 1,
  };

  it("asks for the filter's own bounds instead of the period and skips the latest check", async () => {
    respondRange = () => rows('tx-1');

    const { result, rerender, unmount } = renderForSpace(1);
    await waitFor(() => expect(result.current.viewState).toBe('ready'));
    mockedRequest.mockClear();

    rerender({ range: january, filter });
    await waitFor(() => expect(result.current.viewState).toBe('ready'));

    expect(mockedRequest).toHaveBeenCalledTimes(1);
    expect(mockedRequest.mock.calls[0][0].params).toEqual({
      from: filter.from,
      to: filter.to,
      transaction_type: TransactionType.EXPENSE,
      kind: TransactionKind.REGULAR,
      category_id: 1,
      time_zone: expect.any(String),
    });

    unmount();
  });

  it('reports no matches rather than an empty account', async () => {
    const { result, rerender, unmount } = renderForSpace(1);
    await waitFor(() => expect(result.current.viewState).toBe('trueEmpty'));
    mockedRequest.mockClear();

    rerender({ range: january, filter });

    await waitFor(() => expect(result.current.viewState).toBe('noMatches'));
    expect(latestCalls()).toBe(0);

    unmount();
  });
});

describe('switching arguments', () => {
  it("never shows the previous period's rows while the new one loads", async () => {
    respondRange = (config) => (config.params?.from?.startsWith('2026-01') ? rows('jan') : new Promise(() => {}));

    const { result, rerender, unmount } = renderForSpace(1);

    await waitFor(() => expect(result.current.transactions.map(({ id }) => id)).toEqual(['jan']));

    rerender({ range: february });

    expect(result.current.viewState).toBe('loading');
    expect(result.current.transactions).toEqual([]);

    unmount();
  });

  it("never shows the previous space's rows while the new space loads", async () => {
    respondRange = (config) => (config.url.startsWith('/spaces/1/') ? rows('space-1') : new Promise(() => {}));

    const { store, result, unmount } = renderForSpace(1);

    await waitFor(() => expect(result.current.transactions.map(({ id }) => id)).toEqual(['space-1']));

    act(() => {
      store.dispatch(activateSpace(2));
    });

    expect(result.current.viewState).toBe('loading');
    expect(result.current.transactions).toEqual([]);

    unmount();
  });
});

describe('invalidation', () => {
  it('refetches the period when history is invalidated for this space, keeping rows meanwhile', async () => {
    respondRange = () => rows('tx-1');

    const { store, result, unmount } = renderForSpace(1);

    await waitFor(() => expect(result.current.viewState).toBe('ready'));
    const feedBefore = callsTo('/feed');

    act(() => {
      store.dispatch(baseApi.util.invalidateTags(spaceTags(1, 'Transactions')));
    });

    expect(result.current.viewState).toBe('ready');
    await waitFor(() => expect(callsTo('/feed')).toBe(feedBefore + 1));

    unmount();
  });
});

describe('deleting the last record of a period', () => {
  it('waits for the next latest record instead of pointing to the deleted one', async () => {
    let resolveLatest: (value: unknown) => void = () => {};
    respondRange = () => rows('tx-1');
    respondLatest = () => Promise.resolve({ data: dto });

    const { store, result, unmount } = renderForSpace(1);
    await waitFor(() => expect(result.current.viewState).toBe('ready'));

    respondRange = () => rows();
    respondLatest = () =>
      new Promise((resolve) => {
        resolveLatest = resolve;
      });
    act(() => {
      store.dispatch(baseApi.util.invalidateTags(spaceTags(1, 'Transactions')));
    });

    await waitFor(() => expect(result.current.transactions).toEqual([]));
    expect(result.current.viewState).toBe('loading');

    await act(async () => resolveLatest({ data: null }));
    await waitFor(() => expect(result.current.viewState).toBe('trueEmpty'));

    unmount();
  });
});

describe('a period larger than one page', () => {
  const at = (id: string, day: number, hour: number) =>
    ({ ...dto, id, timestamp: new Date(2026, 0, day, hour).toISOString() }) as Transaction;
  const key = (day: number) => `2026-01-${String(day).padStart(2, '0')}`;
  const summary = { count: 4, income: '98765432109876543.21', expense: '1184.45' };

  it('shows the server totals and asks for latest only when the period is empty', async () => {
    respondRange = () =>
      feed(
        feedDto([at('a', 6, 12)], {
          summary,
          day_totals: [{ date: key(6), net: '-31.50' }],
          page_info: { next_cursor: 'c1', previous_cursor: null },
        }),
      );

    const { result, unmount } = renderForSpace(1);
    await waitFor(() => expect(result.current.viewState).toBe('ready'));

    expect(result.current.income).toBe('98765432109876543.21');
    expect(result.current.expense).toBe('1184.45');
    expect(result.current.sections.map(({ key: day, total }) => [day, total])).toEqual([[key(6), '-31.50']]);
    expect(result.current.hasNextPage).toBe(true);
    expect(latestCalls()).toBe(0);

    unmount();
  });

  it('keeps a day split between two pages in one section with the total both pages agree on', async () => {
    respondRange = (config) =>
      config.params?.cursor
        ? feed(
            feedDto([at('c', 6, 9), at('d', 5, 9)], {
              summary,
              day_totals: [
                { date: key(6), net: '-40.00' },
                { date: key(5), net: '0.00' },
              ],
            }),
          )
        : feed(
            feedDto([at('a', 7, 9), at('b', 6, 18)], {
              summary,
              day_totals: [
                { date: key(7), net: '12.00' },
                { date: key(6), net: '-40.00' },
              ],
              page_info: { next_cursor: 'c1', previous_cursor: null },
            }),
          );

    const { result, unmount } = renderForSpace(1);
    await waitFor(() => expect(result.current.viewState).toBe('ready'));
    const firstSixth = result.current.sections[1].total;

    act(() => result.current.loadNextPage());
    await waitFor(() => expect(result.current.transactions).toHaveLength(4));

    expect(firstSixth).toBe('-40.00');
    expect(
      result.current.sections.map(({ key: day, total, items }) => [day, total, items.map(({ id }) => id)]),
    ).toEqual([
      [key(7), '12.00', ['a']],
      [key(6), '-40.00', ['b', 'c']],
      [key(5), '0.00', ['d']],
    ]);
    expect(result.current.hasNextPage).toBe(false);

    unmount();
  });
});
