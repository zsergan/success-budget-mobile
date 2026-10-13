import type { Space } from '@api/dto';
import { createAppStore } from '@redux/Store';
import { SpaceType } from '@shared/enums';
import { spaceApi } from './api';
import { categoryApi } from '@redux/state/category/api';
import { walletApi } from '@redux/state/wallet/api';
import { feedSelection, transactionApi } from '@redux/state/transaction/api';
import { activateSpace } from './thunks';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

const space = (id: number, type = SpaceType.GROUP): Space => ({
  id,
  name: `Space ${id}`,
  type,
  currency: { id: 1, code: 'USD', name: 'US Dollar' },
  role: 'owner',
  member_count: 1,
  created_at: '2026-01-01T00:00:00.000Z',
});

const respondWith = (spaces: Space[]) => mockedRequest.mockResolvedValue({ data: spaces });

const loadSpaces = (store: ReturnType<typeof createAppStore>) =>
  store.dispatch(spaceApi.endpoints.getSpaces.initiate(undefined, { forceRefetch: true }));

beforeEach(() => jest.clearAllMocks());

describe('space selection from the spaces list', () => {
  it('picks the personal space when none is selected', async () => {
    const store = createAppStore();

    respondWith([space(2), space(1, SpaceType.PERSONAL)]);
    await loadSpaces(store);

    expect(store.getState().space.currentSpaceId).toBe(1);
  });

  it('picks the lowest id when there is no personal space', async () => {
    const store = createAppStore();

    respondWith([space(5), space(3)]);
    await loadSpaces(store);

    expect(store.getState().space.currentSpaceId).toBe(3);
  });

  it('selects nothing, without an error, for an empty list', async () => {
    const store = createAppStore();

    respondWith([]);
    const result = await loadSpaces(store);

    expect(result.isSuccess).toBe(true);
    expect(store.getState().space.currentSpaceId).toBeNull();
  });

  it('keeps a selection that is still in a fresher list', async () => {
    const store = createAppStore();

    store.dispatch(activateSpace(2));
    jest.advanceTimersByTime(1);
    respondWith([space(1, SpaceType.PERSONAL), space(2)]);
    await loadSpaces(store);

    expect(store.getState().space.currentSpaceId).toBe(2);
  });

  it('moves off a selected space that a fresher list no longer contains', async () => {
    const store = createAppStore();

    store.dispatch(activateSpace(9));
    jest.advanceTimersByTime(1);
    respondWith([space(1, SpaceType.PERSONAL), space(2)]);
    await loadSpaces(store);

    expect(store.getState().space.currentSpaceId).toBe(1);
  });

  it('never lets a list requested before the selection undo it (e.g. a space created just now)', async () => {
    const store = createAppStore();
    let finishOldList: (value: unknown) => void = () => {};

    mockedRequest.mockReturnValueOnce(new Promise((resolve) => (finishOldList = resolve)));
    const oldList = loadSpaces(store);

    jest.advanceTimersByTime(1);
    store.dispatch(activateSpace(7));
    finishOldList({ data: [space(1, SpaceType.PERSONAL)] });
    await oldList;

    expect(store.getState().space.currentSpaceId).toBe(7);
  });
});

describe('a read or a write refused for a space', () => {
  const setUp = async () => {
    const store = createAppStore();

    respondWith([space(1), space(2, SpaceType.PERSONAL)]);
    await loadSpaces(store);
    store.dispatch(activateSpace(1));
    jest.advanceTimersByTime(1);
    // The spaces list asked for again never answers here: nothing may wait for it.
    mockedRequest.mockImplementation(({ url }: { url: string }) => (url === '/spaces' ? new Promise(() => {}) : null));

    return store;
  };

  const refuseRead = (store: ReturnType<typeof createAppStore>, code: string) => {
    mockedRequest.mockImplementationOnce(() =>
      Promise.reject({ response: { data: { statusCode: 403, code, message: code } } }),
    );
    return store.dispatch(walletApi.endpoints.getWallets.initiate({ spaceId: 1 }, { forceRefetch: true }));
  };

  it('ends the space at once on FORBIDDEN_SPACE: its data, its place in the list and the selection', async () => {
    const store = await setUp();

    await refuseRead(store, 'FORBIDDEN_SPACE');

    expect(store.getState().space.currentSpaceId).toBe(2);
    expect(
      spaceApi.endpoints.getSpaces
        .select()(store.getState())
        .data?.map(({ id }) => id),
    ).toEqual([2]);
    expect(walletApi.endpoints.getWallets.select({ spaceId: 1 })(store.getState()).data).toBeUndefined();
  });

  it('ends the space at once when a write is refused with FORBIDDEN_SPACE, and only then', async () => {
    const store = await setUp();
    const refuseWrite = (code: string) => {
      mockedRequest.mockImplementationOnce(() =>
        Promise.reject({ response: { data: { statusCode: 403, code, message: code } } }),
      );
      return store.dispatch(categoryApi.endpoints.reorderCategories.initiate({ spaceId: 1, categoryIds: [1, 2] }));
    };

    mockedRequest.mockClear();
    await refuseWrite('FORBIDDEN_CATEGORY');
    expect(store.getState().space.currentSpaceId).toBe(1);
    expect(mockedRequest).not.toHaveBeenCalledWith(expect.objectContaining({ url: '/spaces' }));

    await refuseWrite('FORBIDDEN_SPACE');
    expect(store.getState().space.currentSpaceId).toBe(2);
  });

  it('ends the space when a page of its history is refused with FORBIDDEN_SPACE, and drops the pages', async () => {
    const store = await setUp();
    const feedArg = {
      selection: feedSelection({ spaceId: 1, from: '2026-01-01T00:00:00.000Z', to: '2026-01-31T23:59:59.999Z' }),
      generation: 'g1',
    };

    mockedRequest.mockImplementationOnce(() =>
      Promise.reject({ response: { data: { statusCode: 403, code: 'FORBIDDEN_SPACE', message: 'FORBIDDEN_SPACE' } } }),
    );
    await store.dispatch(transactionApi.endpoints.getTransactionsFeed.initiate(feedArg));

    expect(store.getState().space.currentSpaceId).toBe(2);
    expect(transactionApi.endpoints.getTransactionsFeed.select(feedArg)(store.getState()).status).toBe('uninitialized');
  });

  it('only asks for the spaces list again on any other 403', async () => {
    const store = await setUp();

    await refuseRead(store, 'FORBIDDEN_WALLET');

    expect(store.getState().space.currentSpaceId).toBe(1);
    expect(mockedRequest).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/spaces' }));
  });
});
