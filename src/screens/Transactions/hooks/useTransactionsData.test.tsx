import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react-native';

import * as transactionApi from '@api/transaction.api';
import authReducer from '@redux/state/auth/slice';
import categoryReducer from '@redux/state/category/slice';
import currencyReducer from '@redux/state/currency/slice';
import limitReducer from '@redux/state/limit/slice';
import memberReducer from '@redux/state/member/slice';
import profileReducer from '@redux/state/profile/slice';
import { activateSpace } from '@redux/state/space/thunks';
import spaceReducer from '@redux/state/space/slice';
import transactionReducer from '@redux/state/transaction/slice';
import walletReducer from '@redux/state/wallet/slice';
import type { DateRange } from '@shared/utils';
import useTransactionsData from './useTransactionsData';

jest.mock('@api/transaction.api');

const mockedGetTransactions = jest.mocked(transactionApi.getTransactions);
const mockedGetLatestTransaction = jest.mocked(transactionApi.getLatestTransaction);

const testReducer = {
  auth: authReducer,
  category: categoryReducer,
  currency: currencyReducer,
  limit: limitReducer,
  member: memberReducer,
  profile: profileReducer,
  space: spaceReducer,
  transaction: transactionReducer,
  wallet: walletReducer,
};

const createTestStore = () => configureStore({ reducer: testReducer });

const range: DateRange = { from: new Date('2026-01-01'), to: new Date('2026-01-31'), preset: 'month' };

const wrapperFor = (store: ReturnType<typeof createTestStore>) => {
  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

  return Wrapper;
};

beforeEach(() => jest.clearAllMocks());

describe('useTransactionsData viewState', () => {
  it('leaves loading forever if only isLoadingRange is watched -- regression guard for the empty-range/failed-latest case', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));
    mockedGetTransactions.mockResolvedValue([]);
    mockedGetLatestTransaction.mockRejectedValue({ response: { data: { statusCode: 500 } } });

    const { result, unmount } = renderHook(() => useTransactionsData({ range }), { wrapper: wrapperFor(store) });

    await waitFor(() => expect(store.getState().transaction.isLoadingLatest).toBe(false));
    await waitFor(() => expect(store.getState().transaction.isLoadingRange).toBe(false));
    await waitFor(() => expect(result.current.viewState).not.toBe('loading'));

    expect(result.current.viewState).toBe('latestError');

    unmount();
  });

  it('shows latestError (not trueEmpty) for a genuine network failure with no HTTP response at all', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));
    mockedGetTransactions.mockResolvedValue([]);
    // A real network failure (offline, DNS, timeout) has no `.response` at
    // all -- unlike a 500, which still carries one.
    mockedGetLatestTransaction.mockRejectedValue({ message: 'Network Error', code: 'ERR_NETWORK' });

    const { result, unmount } = renderHook(() => useTransactionsData({ range }), { wrapper: wrapperFor(store) });

    await waitFor(() => expect(result.current.viewState).not.toBe('loading'));

    expect(result.current.viewState).toBe('latestError');

    unmount();
  });

  it('shows trueEmpty once an empty range and a confirmed-empty latest both settle', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));
    mockedGetTransactions.mockResolvedValue([]);
    mockedGetLatestTransaction.mockResolvedValue(null);

    const { result, unmount } = renderHook(() => useTransactionsData({ range }), { wrapper: wrapperFor(store) });

    await waitFor(() => expect(result.current.viewState).toBe('trueEmpty'));

    unmount();
  });

  it('shows rangeError, not a false empty state, when the range request itself fails', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));
    mockedGetTransactions.mockRejectedValue({ response: { data: { statusCode: 500 } } });
    mockedGetLatestTransaction.mockResolvedValue(null);

    const { result, unmount } = renderHook(() => useTransactionsData({ range }), { wrapper: wrapperFor(store) });

    await waitFor(() => expect(result.current.viewState).toBe('rangeError'));

    unmount();
  });

  it('stays ready on a non-empty range even if latest fails', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));
    mockedGetTransactions.mockResolvedValue([{ id: 'tx-1' } as never]);
    mockedGetLatestTransaction.mockRejectedValue({ response: { data: { statusCode: 500 } } });

    const { result, unmount } = renderHook(() => useTransactionsData({ range }), { wrapper: wrapperFor(store) });

    await waitFor(() => expect(result.current.viewState).toBe('ready'));

    unmount();
  });
});
