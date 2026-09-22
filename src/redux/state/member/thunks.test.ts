import { configureStore } from '@reduxjs/toolkit';

import type { Space } from '@api/dto';
import * as memberApi from '@api/member.api';
import { getSpaces } from '@api/space.api';
import { SpaceType } from '@shared/enums';
import authReducer from '../auth/slice';
import { loginMe, logoutMe } from '../auth/thunks';
import categoryReducer from '../category/slice';
import currencyReducer from '../currency/slice';
import limitReducer from '../limit/slice';
import profileReducer from '../profile/slice';
import { activateSpace } from '../space/thunks';
import spaceReducer from '../space/slice';
import transactionReducer from '../transaction/slice';
import walletReducer from '../wallet/slice';
import { fetchProfile } from '../profile/thunks';
import memberReducer from './slice';
import { acceptInvite, inviteMember, leaveSpace, removeMember } from './thunks';

jest.mock('@api/member.api');
jest.mock('@api/space.api');

const mockedRemoveMember = jest.mocked(memberApi.removeMember);
const mockedAcceptInvite = jest.mocked(memberApi.acceptInvite);
const mockedInviteMember = jest.mocked(memberApi.inviteMember);
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

// Every thunk under test here only ever runs while signed in -- these
// thunks' own isSessionActive guards would otherwise treat a test store
// (which starts signed out, like a fresh app launch) as a logged-out
// session and silently skip their space-activation side effects.
const createTestStore = () => {
  const store = configureStore({ reducer: testReducer });

  store.dispatch(loginMe.fulfilled('test-token', 'req-login', { email: 'me@example.com', password: 'password1' }));

  return store;
};

const createTestStoreAsUser = (profileId: number) => {
  const store = createTestStore();

  store.dispatch(fetchProfile.pending('req-profile', undefined));
  store.dispatch(
    fetchProfile.fulfilled({ id: profileId, email: 'me@example.com', name: 'Me' }, 'req-profile', undefined),
  );

  return store;
};

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
    mockedGetSpaces.mockResolvedValue([space({ id: 20, type: SpaceType.PERSONAL })]);

    await store.dispatch(leaveSpace());

    expect(mockedRemoveMember).toHaveBeenCalledWith(10, 777);
  });

  it('does not fetchMembers for the space just left -- it activates the fallback instead', async () => {
    const store = createTestStoreAsUser(777);

    store.dispatch(activateSpace(10));
    mockedRemoveMember.mockResolvedValue(undefined);
    mockedGetSpaces.mockResolvedValue([space({ id: 20, type: SpaceType.PERSONAL })]);

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

  it('invalidates the left space immediately even when the follow-up GET spaces fails', async () => {
    const store = createTestStoreAsUser(777);

    store.dispatch(activateSpace(10));
    mockedRemoveMember.mockResolvedValue(undefined);
    mockedGetSpaces.mockRejectedValue({ response: { data: { statusCode: 500 } } });

    await store.dispatch(leaveSpace());

    expect(store.getState().space.currentSpaceId).not.toBe(10);
  });

  it('does not touch the current space if the user already switched away before the DELETE resolved', async () => {
    const store = createTestStoreAsUser(777);

    store.dispatch(activateSpace(10));

    let resolveRemove!: () => void;
    mockedRemoveMember.mockReturnValue(new Promise((resolve) => (resolveRemove = () => resolve(undefined))));
    mockedGetSpaces.mockResolvedValue([space({ id: 30, type: SpaceType.GROUP })]);

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
    mockedGetSpaces.mockResolvedValue([space({ id: 10, type: SpaceType.GROUP, member_count: 2 })]);

    await store.dispatch(removeMember(42));

    expect(mockedRemoveMember).toHaveBeenCalledWith(10, 42);
    expect(store.getState().space.currentSpaceId).toBe(10);
  });
});

describe('acceptInvite', () => {
  it('activates the space by the id in the response, not by diffing the space list', async () => {
    const store = createTestStore();

    mockedAcceptInvite.mockResolvedValue(space({ id: 55, type: SpaceType.GROUP }) as never);
    mockedGetSpaces.mockResolvedValue([space({ id: 55, type: SpaceType.GROUP })]);

    await store.dispatch(acceptInvite('ABC123'));

    expect(store.getState().space.currentSpaceId).toBe(55);
  });

  it('still resolves as fulfilled when the accept succeeds but the follow-up spaces refresh fails', async () => {
    const store = createTestStore();

    mockedAcceptInvite.mockResolvedValue(space({ id: 55, type: SpaceType.GROUP }) as never);
    mockedGetSpaces.mockRejectedValue({ response: { data: { statusCode: 500 } } });

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
