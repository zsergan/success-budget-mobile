import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as memberApi from '@api/member.api';
import * as spaceApi from '@api/space.api';
import authReducer from '@redux/state/auth/slice';
import categoryReducer from '@redux/state/category/slice';
import currencyReducer from '@redux/state/currency/slice';
import limitReducer from '@redux/state/limit/slice';
import memberReducer from '@redux/state/member/slice';
import { fetchProfile } from '@redux/state/profile/thunks';
import profileReducer from '@redux/state/profile/slice';
import { activateSpace } from '@redux/state/space/thunks';
import spaceReducer from '@redux/state/space/slice';
import transactionReducer from '@redux/state/transaction/slice';
import walletReducer from '@redux/state/wallet/slice';
import useMemberActions from './useMemberActions';

jest.mock('@api/member.api');
jest.mock('@api/space.api');

const mockedAddAlert = jest.fn();

jest.mock('@hooks', () => ({
  useAlert: () => ({ addAlert: mockedAddAlert }),
}));

const mockedRemoveMember = jest.mocked(memberApi.removeMember);
const mockedGetSpaces = jest.mocked(spaceApi.getSpaces);

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

const createTestStore = () => {
  const store = configureStore({ reducer: testReducer });

  store.dispatch(activateSpace(10));
  store.dispatch(fetchProfile.fulfilled({ id: 777, email: 'me@example.com', name: 'Me' }, 'req', undefined));

  return store;
};

const wrapperFor = (store: ReturnType<typeof createTestStore>) => {
  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

  return Wrapper;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetSpaces.mockResolvedValue([]);
});

describe('useMemberActions confirm()', () => {
  it('sends only one DELETE for two confirm() calls fired before the next render', async () => {
    const store = createTestStore();
    let resolveRemove!: () => void;

    mockedRemoveMember.mockReturnValue(new Promise((resolve) => (resolveRemove = () => resolve(undefined))));

    const { result } = renderHook(() => useMemberActions({ onLeft: jest.fn() }), { wrapper: wrapperFor(store) });

    act(() => {
      result.current.requestAction({ kind: 'remove', userId: 42, label: 'Alex' });
    });

    // Two calls in the same synchronous block, before any state update from
    // the first has been committed -- simulates a fast double tap.
    act(() => {
      void result.current.confirm();
      void result.current.confirm();
    });

    resolveRemove();
    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(mockedRemoveMember).toHaveBeenCalledTimes(1);
  });

  it('does not navigate (onLeft) if the space changed before a successful leave settled', async () => {
    const store = createTestStore();
    const onLeft = jest.fn();
    let resolveRemove!: () => void;

    mockedRemoveMember.mockReturnValue(new Promise((resolve) => (resolveRemove = () => resolve(undefined))));

    const { result } = renderHook(() => useMemberActions({ onLeft }), { wrapper: wrapperFor(store) });

    act(() => {
      result.current.requestAction({ kind: 'leave' });
    });

    let confirmPromise!: Promise<void>;

    act(() => {
      confirmPromise = result.current.confirm();
    });

    act(() => {
      store.dispatch(activateSpace(20));
    });

    resolveRemove();
    await act(() => confirmPromise);

    expect(onLeft).not.toHaveBeenCalled();
  });
});
