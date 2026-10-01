import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { Transaction } from '@api/dto';
import { baseApi, spaceTags } from '@redux/api/baseApi';
import { activateSpace } from '@redux/state/space/thunks';
import { createAppStore } from '@redux/Store';
import { AppColor, TransactionType } from '@shared/enums';
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
  params?: { from?: string };
}

type Responder = (config: RequestConfig) => Promise<unknown>;

let respondRange: Responder;
let respondLatest: Responder;

const serverError = () => Promise.reject({ response: { data: { statusCode: 500, message: 'boom' } } });
const rows = (...ids: string[]) => Promise.resolve({ data: ids.map((id) => ({ ...dto, id })) });

const dto: Transaction = {
  id: 'tx-1',
  transaction_type: TransactionType.EXPENSE,
  amount: '10.00',
  timestamp: '2026-01-05T00:00:00.000Z',
  description: '',
  wallet: { id: 1, wallet_name: 'Cash', design: AppColor.SLATE },
  category: {
    id: 1,
    name: 'Food',
    transaction_type: TransactionType.EXPENSE,
    icon: 'Grocery',
    color: AppColor.SLATE,
    is_active: 1,
    transaction_count: 0,
    limit: null,
    archived_at: null,
  },
};

const january: DateRange = { from: new Date('2026-01-01'), to: new Date('2026-01-31'), preset: 'month' };
const february: DateRange = { from: new Date('2026-02-01'), to: new Date('2026-02-28'), preset: 'month' };

const renderForSpace = (spaceId: number, range = january) => {
  const store = createAppStore();

  store.dispatch(activateSpace(spaceId));

  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const rendered = renderHook((props: { range: DateRange }) => useTransactionsData(props), {
    wrapper,
    initialProps: { range },
  });

  return { store, ...rendered };
};

const latestCalls = () =>
  mockedRequest.mock.calls.filter(([config]: [RequestConfig]) => config.url.endsWith('/latest')).length;

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
  it('refetches the period and latest when history is invalidated for this space, keeping rows meanwhile', async () => {
    respondRange = () => rows('tx-1');

    const { store, result, unmount } = renderForSpace(1);

    await waitFor(() => expect(result.current.viewState).toBe('ready'));
    const latestBefore = latestCalls();

    act(() => {
      store.dispatch(baseApi.util.invalidateTags(spaceTags(1, 'Transactions')));
    });

    expect(result.current.viewState).toBe('ready');
    await waitFor(() => expect(latestCalls()).toBe(latestBefore + 1));

    unmount();
  });
});
