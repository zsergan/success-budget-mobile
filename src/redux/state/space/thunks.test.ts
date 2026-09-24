import { createAppStore } from '@redux/Store';
import type { Space } from '@api/dto';
import { createSpace, getSpaces } from '@api/space.api';
import { SpaceType } from '@shared/enums';
import { loginMe, logoutMe } from '../auth/thunks';
import { fetchWallets } from '../wallet/thunks';
import { activateSpace, addSpace, fetchSpaces } from './thunks';

jest.mock('@api/space.api');

const mockedGetSpaces = jest.mocked(getSpaces);
const mockedCreateSpace = jest.mocked(createSpace);

const createTestStore = () => createAppStore();

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

describe('fetchSpaces race with a newer request or explicit selection', () => {
  const deferred = <T>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => (resolve = r));

    return { promise, resolve };
  };

  it('an obsolete spaces response must not undo a newer selection', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));

    const old = deferred<Space[]>();

    mockedGetSpaces.mockReturnValueOnce(old.promise).mockResolvedValueOnce([space({ id: 1 }), space({ id: 2 })]);

    const pending = store.dispatch(fetchSpaces());

    await store.dispatch(fetchSpaces());
    store.dispatch(activateSpace(2));

    old.resolve([space({ id: 1 })]);
    await pending;

    expect(store.getState().space.currentSpaceId).toBe(2);
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

describe('addSpace session guard', () => {
  it('activates the newly created space when the session is still active', async () => {
    const store = createTestStore();

    store.dispatch(loginMe.fulfilled('test-token', 'req-login', { email: 'a@b.com', password: 'password1' }));
    mockedCreateSpace.mockResolvedValue(space({ id: 7 }));
    mockedGetSpaces.mockResolvedValue([space({ id: 7 })]);

    await store.dispatch(addSpace({ name: 'New', currency_id: 1, type: SpaceType.PERSONAL }));

    expect(store.getState().space.currentSpaceId).toBe(7);
  });

  it('does not activate a space created by a request that outlived a logout', async () => {
    const store = createTestStore();

    store.dispatch(loginMe.fulfilled('test-token', 'req-login', { email: 'a@b.com', password: 'password1' }));

    let resolveCreate!: (value: Space) => void;
    mockedCreateSpace.mockReturnValue(new Promise((resolve) => (resolveCreate = resolve)));

    const pending = store.dispatch(addSpace({ name: 'New', currency_id: 1, type: SpaceType.PERSONAL }));

    store.dispatch(logoutMe.fulfilled(undefined, 'req-logout', undefined));
    resolveCreate(space({ id: 7 }));
    await pending;

    expect(store.getState().space.currentSpaceId).toBeNull();
    expect(mockedGetSpaces).not.toHaveBeenCalled();
  });
});
