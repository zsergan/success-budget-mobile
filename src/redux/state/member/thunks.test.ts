import { createAppStore } from '@redux/Store';
import type { Space } from '@api/dto';
import * as memberApi from '@api/member.api';
import { SpaceType } from '@shared/enums';
import { loginMe, logoutMe } from '../auth/thunks';
import { activateSpace } from '../space/thunks';
import { profileApi } from '../profile/api';
import { spaceApi } from '../space/api';
import { acceptInvite, inviteMember, leaveSpace, removeMember } from './thunks';

jest.mock('@api/member.api');

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

const mockedRemoveMember = jest.mocked(memberApi.removeMember);
const mockedAcceptInvite = jest.mocked(memberApi.acceptInvite);
const mockedInviteMember = jest.mocked(memberApi.inviteMember);

// Every thunk under test here only ever runs while signed in -- these
// thunks' own isSessionActive guards would otherwise treat a test store
// (which starts signed out, like a fresh app launch) as a logged-out
// session and silently skip their space-activation side effects.
const createTestStore = () => {
  const store = createAppStore();

  store.dispatch(loginMe.fulfilled('test-token', 'req-login', { email: 'me@example.com', password: 'password1' }));

  return store;
};

const createTestStoreAsUser = (profileId: number) => {
  const store = createTestStore();

  store.dispatch(
    profileApi.util.upsertQueryEntries([
      { endpointName: 'getProfile', arg: undefined, value: { id: profileId, email: 'me@example.com', name: 'Me' } },
    ]),
  );

  return store;
};

const seedSpaces = (store: ReturnType<typeof createAppStore>, spaces: Space[]) =>
  store.dispatch(spaceApi.util.upsertQueryEntries([{ endpointName: 'getSpaces', arg: undefined, value: spaces }]));

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

describe('leaveSpace', () => {
  it('calls removeMember with the caller own user id, not a membership id', async () => {
    const store = createTestStoreAsUser(777);

    store.dispatch(activateSpace(10));
    mockedRemoveMember.mockResolvedValue(undefined);
    seedSpaces(store, [space({ id: 20, type: SpaceType.PERSONAL })]);

    await store.dispatch(leaveSpace());

    expect(mockedRemoveMember).toHaveBeenCalledWith(10, 777);
  });

  it('does not fetchMembers for the space just left -- it selects the fallback instead', async () => {
    const store = createTestStoreAsUser(777);

    store.dispatch(activateSpace(10));
    mockedRemoveMember.mockResolvedValue(undefined);
    seedSpaces(store, [space({ id: 20, type: SpaceType.PERSONAL })]);

    await store.dispatch(leaveSpace());

    expect(store.getState().space.currentSpaceId).toBe(20);
    expect(store.getState().member.members).toEqual([]);
  });

  it('rejects without calling the API when there is no profile id yet', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(10));

    const action = await store.dispatch(leaveSpace());

    expect(action.type).toBe('member/leaveSpace/rejected');
    expect(mockedRemoveMember).not.toHaveBeenCalled();
  });

  it('moves off the left space even with no other space cached yet', async () => {
    const store = createTestStoreAsUser(777);

    store.dispatch(activateSpace(10));
    mockedRemoveMember.mockResolvedValue(undefined);

    await store.dispatch(leaveSpace());

    expect(store.getState().space.currentSpaceId).not.toBe(10);
  });

  it('does not touch the current space if the user already switched away before the DELETE resolved', async () => {
    const store = createTestStoreAsUser(777);

    store.dispatch(activateSpace(10));

    let resolveRemove!: () => void;
    mockedRemoveMember.mockReturnValue(new Promise((resolve) => (resolveRemove = () => resolve(undefined))));
    seedSpaces(store, [space({ id: 30, type: SpaceType.GROUP })]);

    const pending = store.dispatch(leaveSpace());

    store.dispatch(activateSpace(30));
    resolveRemove();
    await pending;

    expect(store.getState().space.currentSpaceId).toBe(30);
  });
});

describe('removeMember (owner removes someone else)', () => {
  it('leaves the current space active and refreshes members + spaces', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(10));
    mockedRemoveMember.mockResolvedValue(undefined);
    seedSpaces(store, [space({ id: 10, type: SpaceType.GROUP, member_count: 2 })]);

    await store.dispatch(removeMember(42));

    expect(mockedRemoveMember).toHaveBeenCalledWith(10, 42);
    expect(store.getState().space.currentSpaceId).toBe(10);
  });
});

describe('acceptInvite', () => {
  it('activates the space by the id in the response, not by diffing the space list', async () => {
    const store = createTestStore();

    mockedAcceptInvite.mockResolvedValue(space({ id: 55, type: SpaceType.GROUP }) as never);
    seedSpaces(store, [space({ id: 55, type: SpaceType.GROUP })]);

    await store.dispatch(acceptInvite('ABC123'));

    expect(store.getState().space.currentSpaceId).toBe(55);
  });

  it('resolves as fulfilled without waiting for the spaces list', async () => {
    const store = createTestStore();

    mockedAcceptInvite.mockResolvedValue(space({ id: 55, type: SpaceType.GROUP }) as never);

    const action = await store.dispatch(acceptInvite('ABC123'));

    expect(action.type).toBe('member/acceptInvite/fulfilled');
    expect(store.getState().space.currentSpaceId).toBe(55);
  });

  it('rejects when the accept call itself fails, without touching the current space', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));
    mockedAcceptInvite.mockRejectedValue({ response: { data: { statusCode: 404 } } });

    const action = await store.dispatch(acceptInvite('BADCODE'));

    expect(action.type).toBe('member/acceptInvite/rejected');
    expect(store.getState().space.currentSpaceId).toBe(1);
  });
});

describe('inviteMember', () => {
  it('marks a 429 that outlived a logout as stale, so it cannot set a cooldown a future session inherits', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));

    let rejectInvite!: (reason: unknown) => void;
    mockedInviteMember.mockReturnValue(new Promise((_resolve, reject) => (rejectInvite = reject)));

    const pending = store.dispatch(inviteMember('a@b.com'));

    store.dispatch(logoutMe.fulfilled(undefined, 'req-logout', undefined));
    rejectInvite({
      response: {
        data: { message: 'Too many requests', statusCode: 429, path: '/spaces/1/invites', timestamp: '' },
        headers: {},
      },
    });
    await pending;

    expect(store.getState().member.inviteCooldownUntil).toBeNull();
  });

  it('still sets a cooldown from a 429 within the same session', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));
    mockedInviteMember.mockRejectedValue({
      response: {
        data: { message: 'Too many requests', statusCode: 429, path: '/spaces/1/invites', timestamp: '' },
        headers: {},
      },
    });

    await store.dispatch(inviteMember('a@b.com'));

    expect(store.getState().member.inviteCooldownUntil).not.toBeNull();
  });
});
