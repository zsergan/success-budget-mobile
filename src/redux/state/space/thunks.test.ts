import type { Space } from '@api/dto';
import { createAppStore } from '@redux/Store';
import { SpaceType } from '@shared/enums';
import { loginMe, logoutMe } from '../auth/thunks';
import { baseApi } from '@redux/api/baseApi';
import { memberApi } from '../member/api';
import { profileApi } from '../profile/api';
import { spaceApi } from './api';
import { walletApi } from '../wallet/api';
import {
  acceptInviteAndSelect,
  activateSpace,
  createSpaceAndSelect,
  leaveCurrentSpace,
  loseSpaceAccess,
} from './thunks';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

const space = (overrides: Partial<Space>): Space => ({
  id: 1,
  name: 'Personal',
  type: SpaceType.PERSONAL,
  currency: { id: 1, code: 'USD', name: 'US Dollar' },
  role: 'owner',
  member_count: 1,
  created_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const signedInStore = () => {
  const store = createAppStore();

  store.dispatch(loginMe.fulfilled('test-token', 'req-login', { email: 'a@b.com', password: 'password1' }));

  return store;
};

beforeEach(() => jest.clearAllMocks());

describe('activateSpace', () => {
  it('is a no-op when the space is already active', () => {
    const store = createAppStore();

    store.dispatch(activateSpace(5));
    const afterFirst = store.getState().space;

    store.dispatch(activateSpace(5));

    expect(store.getState().space).toBe(afterFirst);
  });

  it('switches to a different space', () => {
    const store = createAppStore();

    store.dispatch(activateSpace(1));
    store.dispatch(activateSpace(2));

    expect(store.getState().space.currentSpaceId).toBe(2);
  });

  it('forgets the selection on logout', () => {
    const store = createAppStore();

    store.dispatch(activateSpace(1));
    store.dispatch(logoutMe.fulfilled(undefined, 'req-logout', undefined));

    expect(store.getState().space.currentSpaceId).toBeNull();
  });
});

describe('createSpaceAndSelect', () => {
  it('selects the created space and refreshes the list separately', async () => {
    const store = signedInStore();

    mockedRequest.mockImplementation(async ({ method }: { method: string }) => ({
      data: method === 'POST' ? space({ id: 7 }) : [space({ id: 1 }), space({ id: 7, type: SpaceType.GROUP })],
    }));

    await store.dispatch(createSpaceAndSelect({ name: 'New', currency_id: 1, type: SpaceType.GROUP }));

    expect(store.getState().space.currentSpaceId).toBe(7);
  });

  it('does not select a space created by a request that outlived its session', async () => {
    const store = signedInStore();
    let finishCreate: (value: unknown) => void = () => {};

    mockedRequest.mockReturnValueOnce(new Promise((resolve) => (finishCreate = resolve)));

    const pending = store.dispatch(createSpaceAndSelect({ name: 'New', currency_id: 1, type: SpaceType.GROUP }));

    store.dispatch(logoutMe.fulfilled(undefined, 'req-logout', undefined));
    store.dispatch(loginMe.fulfilled('token-2', 'req-login-2', { email: 'a@b.com', password: 'password1' }));
    finishCreate({ data: space({ id: 7 }) });

    await expect(pending).rejects.toBeDefined();
    expect(store.getState().space.currentSpaceId).toBeNull();
  });
});

describe('acceptInviteAndSelect', () => {
  it('selects the joined space by the id in the response', async () => {
    const store = signedInStore();

    store.dispatch(activateSpace(1));
    mockedRequest.mockResolvedValue({ data: space({ id: 55, type: SpaceType.GROUP }) });

    await store.dispatch(acceptInviteAndSelect('123456'));

    expect(store.getState().space.currentSpaceId).toBe(55);
  });

  it('keeps the current space when the accept fails', async () => {
    const store = signedInStore();

    store.dispatch(activateSpace(1));
    mockedRequest.mockRejectedValue({ response: { data: { statusCode: 404, message: 'Not found' } } });

    await expect(store.dispatch(acceptInviteAndSelect('000000'))).rejects.toMatchObject({ statusCode: 404 });
    expect(store.getState().space.currentSpaceId).toBe(1);
  });
});

describe('leaveCurrentSpace', () => {
  const leavingStore = () => {
    const store = signedInStore();

    store.dispatch(
      profileApi.util.upsertQueryEntries([
        { endpointName: 'getProfile', arg: undefined, value: { id: 777, email: 'me@example.com', name: 'Me' } },
      ]),
    );
    store.dispatch(
      spaceApi.util.upsertQueryEntries([
        {
          endpointName: 'getSpaces',
          arg: undefined,
          value: [space({ id: 10, type: SpaceType.GROUP }), space({ id: 20, type: SpaceType.PERSONAL })],
        },
      ]),
    );
    store.dispatch(activateSpace(10));

    return store;
  };

  it("leaves with the caller's own user id and selects a fallback right away", async () => {
    const store = leavingStore();

    mockedRequest.mockResolvedValue({ data: undefined });
    const result = await store.dispatch(leaveCurrentSpace());

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/spaces/10/members/777', method: 'DELETE' }),
    );
    expect(result).toEqual({ movedOff: true });
    expect(store.getState().space.currentSpaceId).toBe(20);
  });

  it('never refetches the members of the space it left', async () => {
    const store = leavingStore();

    mockedRequest.mockResolvedValue({ data: [] });
    await store.dispatch(memberApi.endpoints.getMembers.initiate({ spaceId: 10 }));
    mockedRequest.mockClear();
    mockedRequest.mockResolvedValue({ data: undefined });

    await store.dispatch(leaveCurrentSpace());
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));

    expect(mockedRequest).not.toHaveBeenCalledWith(expect.objectContaining({ url: '/spaces/10/members' }));
  });

  it('leaves the selection alone if the user switched away before the leave settled', async () => {
    const store = leavingStore();
    let finishLeave: (value: unknown) => void = () => {};

    mockedRequest.mockReturnValueOnce(new Promise((resolve) => (finishLeave = resolve)));
    const pending = store.dispatch(leaveCurrentSpace());

    store.dispatch(activateSpace(30));
    finishLeave({ data: undefined });

    await expect(pending).resolves.toEqual({ movedOff: false });
    expect(store.getState().space.currentSpaceId).toBe(30);
  });

  it('fails without a request when the profile is not loaded yet', async () => {
    const store = signedInStore();

    store.dispatch(activateSpace(10));

    await expect(store.dispatch(leaveCurrentSpace())).rejects.toBeInstanceOf(Error);
    expect(mockedRequest).not.toHaveBeenCalled();
  });
});

describe('a request from before a logout and a new login', () => {
  const oldResponses = {
    success: (value: unknown) => ({ data: value }),
    failure: () => {
      throw { response: { data: { statusCode: 500, message: 'Server error' } } };
    },
  };

  // Holds the request open until the next session has signed in and picked space 99.
  const settleInNextSession = async <T>(
    store: ReturnType<typeof createAppStore>,
    start: () => Promise<T>,
    response: () => unknown,
  ) => {
    let finish: () => void = () => {};

    mockedRequest.mockReturnValueOnce(
      new Promise((resolve, reject) => {
        finish = () => {
          try {
            resolve(response());
          } catch (error) {
            reject(error);
          }
        };
      }),
    );

    const pending = start();

    await store.dispatch(logoutMe());
    store.dispatch(loginMe.fulfilled('token-2', 'req-login-2', { email: 'a@b.com', password: 'password1' }));
    store.dispatch(activateSpace(99));
    finish();

    return pending;
  };

  it.each(Object.entries(oldResponses))('does not select a space created by it (%s)', async (_, respond) => {
    const store = signedInStore();

    await expect(
      settleInNextSession(
        store,
        () => store.dispatch(createSpaceAndSelect({ name: 'New', currency_id: 1, type: SpaceType.GROUP })),
        () => respond(space({ id: 7 })),
      ),
    ).rejects.toBeDefined();
    expect(store.getState().space.currentSpaceId).toBe(99);
  });

  it.each(Object.entries(oldResponses))('does not select a space joined by it (%s)', async (_, respond) => {
    const store = signedInStore();

    await expect(
      settleInNextSession(
        store,
        () => store.dispatch(acceptInviteAndSelect('123456')),
        () => respond(space({ id: 55 })),
      ),
    ).rejects.toBeDefined();
    expect(store.getState().space.currentSpaceId).toBe(99);
  });

  it.each(Object.entries(oldResponses))(
    'does not move the next session off its space on leave (%s)',
    async (_, respond) => {
      const store = signedInStore();

      store.dispatch(
        profileApi.util.upsertQueryEntries([
          { endpointName: 'getProfile', arg: undefined, value: { id: 777, email: 'me@example.com', name: 'Me' } },
        ]),
      );
      store.dispatch(activateSpace(10));

      await expect(
        settleInNextSession(
          store,
          () => store.dispatch(leaveCurrentSpace()),
          () => respond(undefined),
        ),
      ).rejects.toBeDefined();
      expect(store.getState().space.currentSpaceId).toBe(99);
    },
  );
});

describe('loseSpaceAccess', () => {
  it("drops the lost space's cached data and moves to a space the refreshed list still has", async () => {
    const store = signedInStore();
    const overview = { total_balance: 0, total_balance_currency: 'USD', delta_percent: 0, wallets: [] };

    mockedRequest.mockResolvedValue({ data: [space({ id: 10, type: SpaceType.GROUP }), space({ id: 20 })] });
    store.dispatch(spaceApi.endpoints.getSpaces.initiate());
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
    store.dispatch(activateSpace(10));
    store.dispatch(
      walletApi.util.upsertQueryEntries([
        { endpointName: 'getWallets', arg: { spaceId: 10 }, value: overview },
        { endpointName: 'getWallets', arg: { spaceId: 20 }, value: overview },
      ]),
    );

    mockedRequest.mockResolvedValue({ data: [space({ id: 20 })] });
    jest.advanceTimersByTime(1);
    store.dispatch(loseSpaceAccess(10));

    expect(walletApi.endpoints.getWallets.select({ spaceId: 10 })(store.getState()).data).toBeUndefined();
    expect(walletApi.endpoints.getWallets.select({ spaceId: 20 })(store.getState()).data).toBe(overview);

    await jest.runOnlyPendingTimersAsync();
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
    expect(store.getState().space.currentSpaceId).toBe(20);
  });
});
