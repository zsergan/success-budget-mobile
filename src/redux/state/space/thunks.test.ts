import { configureStore } from '@reduxjs/toolkit';

import type { Space } from '@api/dto';
import { getSpaces } from '@api/space.api';
import { SpaceType } from '@shared/enums';
import authReducer from '../auth/slice';
import { logoutMe } from '../auth/thunks';
import categoryReducer from '../category/slice';
import currencyReducer from '../currency/slice';
import limitReducer from '../limit/slice';
import memberReducer from '../member/slice';
import profileReducer from '../profile/slice';
import transactionReducer from '../transaction/slice';
import walletReducer from '../wallet/slice';
import { fetchWallets } from '../wallet/thunks';
import spaceReducer from './slice';
import { activateSpace, fetchSpaces } from './thunks';

jest.mock('@api/space.api');

const mockedGetSpaces = jest.mocked(getSpaces);

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

const currency = { id: 1, code: 'USD', name: 'US Dollar' };

const space = (overrides: Partial<Space>): Space => ({
  id: 1,
  name: 'Personal',
  type: SpaceType.PERSONAL,
  currency,
  role: 'owner',
  member_count: 1,
  created_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('activateSpace', () => {
  it('is a no-op when the space is already active -- no contextKey bump, no dependent-slice reset', () => {
    const store = createTestStore();

    store.dispatch(activateSpace(5));
    const afterFirst = store.getState().space;

    store.dispatch(activateSpace(5));
    const afterSecond = store.getState().space;

    expect(afterSecond.contextKey).toBe(afterFirst.contextKey);
    expect(afterSecond.currentSpaceId).toBe(5);
  });

  it('bumps contextKey and clears wallets when switching to a different space', () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));
    store.dispatch(fetchWallets.pending('req-space-1', undefined));
    store.dispatch(
      fetchWallets.fulfilled(
        { total_balance: 500, total_balance_currency: 'USD', delta_percent: 0, wallets: [{ id: 1 } as never] },
        'req-space-1',
        undefined,
      ),
    );

    expect(store.getState().wallet.wallets).toHaveLength(1);

    const keyBefore = store.getState().space.contextKey;

    store.dispatch(activateSpace(2));

    expect(store.getState().space.contextKey).toBe(keyBefore + 1);
    expect(store.getState().space.currentSpaceId).toBe(2);
    expect(store.getState().wallet.wallets).toEqual([]);
  });

  it('ignores a fulfilled response for the previous space that arrives after the switch', () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));
    store.dispatch(fetchWallets.pending('req-space-1', undefined));

    // Switch away before the space-1 request resolves.
    store.dispatch(activateSpace(2));

    store.dispatch(
      fetchWallets.fulfilled(
        { total_balance: 999, total_balance_currency: 'USD', delta_percent: 0, wallets: [{ id: 1 } as never] },
        'req-space-1',
        undefined,
      ),
    );

    expect(store.getState().wallet.wallets).toEqual([]);
    expect(store.getState().wallet.totalBalance).toBe(0);
  });

  it('preserves hasLoaded across a switch so the app-wide bootstrap loader does not reappear', () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));
    store.dispatch(fetchWallets.pending('req-1', undefined));
    store.dispatch(
      fetchWallets.fulfilled(
        { total_balance: 0, total_balance_currency: 'USD', delta_percent: 0, wallets: [] },
        'req-1',
        undefined,
      ),
    );

    expect(store.getState().wallet.hasLoaded).toBe(true);

    store.dispatch(activateSpace(2));

    expect(store.getState().wallet.hasLoaded).toBe(true);
    expect(store.getState().wallet.isLoading).toBe(true);
  });
});

describe('fetchSpaces fallback selection', () => {
  it('keeps the current space selected (no reset) when it is still in the list', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));
    const keyBefore = store.getState().space.contextKey;

    mockedGetSpaces.mockResolvedValue([space({ id: 1 }), space({ id: 2, type: SpaceType.GROUP })]);

    await store.dispatch(fetchSpaces());

    expect(store.getState().space.currentSpaceId).toBe(1);
    expect(store.getState().space.contextKey).toBe(keyBefore);
  });

  it('falls back to the personal space when the current one is gone', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(99));

    mockedGetSpaces.mockResolvedValue([
      space({ id: 2, type: SpaceType.GROUP }),
      space({ id: 1, type: SpaceType.PERSONAL }),
    ]);

    await store.dispatch(fetchSpaces());

    expect(store.getState().space.currentSpaceId).toBe(1);
  });

  it('falls back to the lowest id when there is no personal space at all', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(99));

    mockedGetSpaces.mockResolvedValue([
      space({ id: 5, type: SpaceType.GROUP }),
      space({ id: 3, type: SpaceType.GROUP }),
    ]);

    await store.dispatch(fetchSpaces());

    expect(store.getState().space.currentSpaceId).toBe(3);
  });

  it('selects no space (null), not an error, for a genuinely empty list', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(99));

    mockedGetSpaces.mockResolvedValue([]);

    const action = await store.dispatch(fetchSpaces());

    expect(action.type).toBe('space/fetchSpaces/fulfilled');
    expect(store.getState().space.currentSpaceId).toBeNull();
  });
});

describe('logout / login contextKey uniqueness', () => {
  it('never repeats a contextKey across a logout, even after resetting other fields', () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));
    const keyBeforeLogout = store.getState().space.contextKey;

    store.dispatch(logoutMe.fulfilled(undefined, 'req-logout', undefined));

    expect(store.getState().space.currentSpaceId).toBeNull();
    expect(store.getState().space.contextKey).toBeGreaterThan(keyBeforeLogout);

    store.dispatch(activateSpace(1));

    expect(store.getState().space.contextKey).toBeGreaterThan(keyBeforeLogout);
  });
});
