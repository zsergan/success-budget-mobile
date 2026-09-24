import type { Space } from '@api/dto';
import { createAppStore } from '@redux/Store';
import { SpaceType } from '@shared/enums';
import { loginMe, logoutMe } from '../auth/thunks';
import { activateSpace, createSpaceAndSelect } from './thunks';

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
  it('is a no-op when the space is already active -- no contextKey bump', () => {
    const store = createAppStore();

    store.dispatch(activateSpace(5));
    const afterFirst = store.getState().space;

    store.dispatch(activateSpace(5));

    expect(store.getState().space).toBe(afterFirst);
  });

  it('bumps contextKey when switching to a different space', () => {
    const store = createAppStore();

    store.dispatch(activateSpace(1));
    const keyBefore = store.getState().space.contextKey;

    store.dispatch(activateSpace(2));

    expect(store.getState().space.contextKey).toBe(keyBefore + 1);
    expect(store.getState().space.currentSpaceId).toBe(2);
  });

  it('never repeats a contextKey across a logout', () => {
    const store = createAppStore();

    store.dispatch(activateSpace(1));
    const keyBeforeLogout = store.getState().space.contextKey;

    store.dispatch(logoutMe.fulfilled(undefined, 'req-logout', undefined));

    expect(store.getState().space.currentSpaceId).toBeNull();

    store.dispatch(activateSpace(1));

    expect(store.getState().space.contextKey).toBeGreaterThan(keyBeforeLogout);
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
