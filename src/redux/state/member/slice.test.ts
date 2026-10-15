import { createAppStore } from '@redux/Store';
import { INVITE_RATE_LIMIT_COOLDOWN_MS } from '@shared/constants';
import { loginMe, logoutMe } from '../auth/thunks';
import { activateSpace } from '../space/thunks';
import { memberApi } from './api';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

const rateLimited = (headers: Record<string, string> = {}) => ({
  response: {
    status: 429,
    data: { message: 'Too many requests', statusCode: 429, path: '/spaces/1/invites', timestamp: '' },
    headers,
  },
});

const signedInStore = () => {
  const store = createAppStore();

  store.dispatch(loginMe.fulfilled('token', 'req-login', { email: 'me@example.com', password: 'password1' }));
  store.dispatch(activateSpace(1));

  return store;
};

const invite = (store: ReturnType<typeof createAppStore>) =>
  store.dispatch(memberApi.endpoints.inviteMember.initiate({ spaceId: 1, email: 'a@b.com' }));

beforeEach(() => jest.clearAllMocks());

describe('invite cooldown', () => {
  it('starts from the Retry-After of a 429', async () => {
    const store = signedInStore();

    mockedRequest.mockRejectedValue(rateLimited({ 'retry-after': '30' }));
    await invite(store);

    expect(store.getState().member.inviteCooldownUntil).toBe(Date.now() + 30_000);
  });

  it('falls back to the fixed window when a 429 has no Retry-After', async () => {
    const store = signedInStore();

    mockedRequest.mockRejectedValue(rateLimited());
    await invite(store);

    expect(store.getState().member.inviteCooldownUntil).toBe(Date.now() + INVITE_RATE_LIMIT_COOLDOWN_MS);
  });

  it('ignores a failure other than 429', async () => {
    const store = signedInStore();

    mockedRequest.mockRejectedValue({ response: { status: 400, data: { message: 'Bad email', statusCode: 400 } } });
    await invite(store);

    expect(store.getState().member.inviteCooldownUntil).toBeNull();
  });

  it('is cleared by a successful invite', async () => {
    const store = signedInStore();

    mockedRequest.mockRejectedValueOnce(rateLimited());
    await invite(store);
    mockedRequest.mockResolvedValueOnce({ data: { id: 1, email: 'a@b.com', expires_at: '', code: '123456' } });
    await invite(store);

    expect(store.getState().member.inviteCooldownUntil).toBeNull();
  });

  it('survives a space switch -- the rate limit is not scoped to one space', async () => {
    const store = signedInStore();

    mockedRequest.mockRejectedValue(rateLimited());
    await invite(store);
    store.dispatch(activateSpace(2));

    expect(store.getState().member.inviteCooldownUntil).not.toBeNull();
  });

  it('is cleared on logout, and a 429 that outlived the session does not start one', async () => {
    const store = signedInStore();
    let failInvite: (reason: unknown) => void = () => {};

    mockedRequest.mockReturnValueOnce(new Promise((_, reject) => (failInvite = reject)));
    const pending = invite(store);

    store.dispatch(logoutMe.fulfilled(undefined, 'req-logout', undefined));
    store.dispatch(loginMe.fulfilled('token-2', 'req-login-2', { email: 'me@example.com', password: 'password1' }));
    failInvite(rateLimited());
    await pending;

    expect(store.getState().member.inviteCooldownUntil).toBeNull();
  });
});
