import { createAppStore } from '@redux/Store';
import { TransactionType } from '@shared/enums';
import type { StatisticsArg } from './api';
import { statisticsApi } from './api';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

// RTK Query batches store notifications on an animation frame, which would otherwise fire after teardown.
jest.useFakeTimers();

const arg: StatisticsArg = {
  spaceId: 1,
  cycleId: 1,
  query: { period: 'month', time_zone: 'UTC', anchor_date: '2026-09-01', as_of: '2026-09-28T09:41:00.000Z' },
};

const { getStatisticsSummary, getStatisticsTrend, getStatisticsBreakdown } = statisticsApi.endpoints;

beforeEach(() => {
  jest.clearAllMocks();
  mockedRequest.mockResolvedValue({ data: {} });
});

afterEach(() => {
  jest.clearAllTimers();
});

describe('statisticsApi', () => {
  it('sends the transaction type to breakdown only', async () => {
    const store = createAppStore();

    await store.dispatch(getStatisticsSummary.initiate(arg));
    await store.dispatch(getStatisticsTrend.initiate(arg));
    await store.dispatch(getStatisticsBreakdown.initiate({ ...arg, transactionType: TransactionType.INCOME }));

    expect(mockedRequest.mock.calls.map(([config]) => config.params)).toEqual([
      arg.query,
      arg.query,
      { ...arg.query, transaction_type: 'income' },
    ]);
  });

  it('keeps expense and income in separate cache entries', async () => {
    const store = createAppStore();
    const expense = { ...arg, transactionType: TransactionType.EXPENSE };
    const income = { ...arg, transactionType: TransactionType.INCOME };

    await store.dispatch(getStatisticsBreakdown.initiate(expense));
    await store.dispatch(getStatisticsBreakdown.initiate(income));
    await store.dispatch(getStatisticsBreakdown.initiate(expense));

    expect(mockedRequest).toHaveBeenCalledTimes(2);
    expect(mockedRequest.mock.calls.map(([config]) => config.params.transaction_type)).toEqual(['expense', 'income']);
  });
});
