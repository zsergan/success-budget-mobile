import type { Space } from '@api/dto';
import { createAppStore } from '@redux/Store';
import { SpaceType } from '@shared/enums';
import { spaceApi } from './api';
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
