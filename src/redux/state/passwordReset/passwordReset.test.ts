import { createAppStore } from '@redux/Store';
import { registerMe } from '@redux/state/auth/thunks';
import { passwordResetApi } from './api';
import { isAuthorizationUsable, isSameEmail } from './selectors';
import { passwordResetEmailEdited, passwordResetEnded, resetAuthorizationDiscarded } from './slice';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('@api/auth.api', () => ({
  ...jest.requireActual('@api/auth.api'),
  register: jest.fn(() => Promise.resolve({ email: 'signup@example.com' })),
}));

jest.useFakeTimers({ now: new Date('2026-10-15T09:00:00.000Z') });

const { requestPasswordReset, verifyPasswordReset, completePasswordReset } = passwordResetApi.endpoints;

const NOW = Date.now();

const rejectWith = (status: number, body: object = {}, headers: Record<string, string> = {}) =>
  mockedRequest.mockRejectedValueOnce({
    response: { status, data: { statusCode: status, message: 'Refused', ...body }, headers },
    config: { url: '/users/password-reset' },
  });

const requestFor = async (store: ReturnType<typeof createAppStore>, email: string) => {
  mockedRequest.mockResolvedValueOnce({ data: { message: 'Sent', resend_after_seconds: 60 } });
  await store.dispatch(requestPasswordReset.initiate({ email }, { track: false }));
};

const verifyFor = async (store: ReturnType<typeof createAppStore>, email: string) => {
  mockedRequest.mockResolvedValueOnce({ data: { reset_token: 'reset-token', expires_in_seconds: 600 } });
  await store.dispatch(verifyPasswordReset.initiate({ email, code: '042917' }, { track: false }));
};

beforeEach(() => jest.clearAllMocks());

afterEach(() => jest.clearAllTimers());

describe('passwordResetApi', () => {
  it('posts each step to its route with the contract’s body, and explains its own 429s', async () => {
    const store = createAppStore();

    mockedRequest.mockResolvedValue({ data: null });
    await store.dispatch(requestPasswordReset.initiate({ email: 'anna@kovalenko.co' }, { track: false }));
    await store.dispatch(
      verifyPasswordReset.initiate({ email: 'anna@kovalenko.co', code: '042917' }, { track: false }),
    );
    await store.dispatch(
      completePasswordReset.initiate({ reset_token: 'reset-token', password: 'sunny2026' }, { track: false }),
    );

    expect(mockedRequest.mock.calls.map(([config]) => [config.method, config.url, config.data])).toEqual([
      ['POST', '/users/password-reset/request', { email: 'anna@kovalenko.co' }],
      ['POST', '/users/password-reset/verify', { email: 'anna@kovalenko.co', code: '042917' }],
      ['POST', '/users/password-reset/complete', { reset_token: 'reset-token', password: 'sunny2026' }],
    ]);
    expect(mockedRequest.mock.calls.every(([config]) => config.isHandledRateLimit?.() === true)).toBe(true);
  });

  it('leaves no code, token or password in the API cache when untracked', async () => {
    const store = createAppStore();

    await requestFor(store, 'anna@kovalenko.co');
    await verifyFor(store, 'anna@kovalenko.co');
    mockedRequest.mockResolvedValueOnce({ data: null });
    await store.dispatch(
      completePasswordReset.initiate({ reset_token: 'reset-token', password: 'sunny2026' }, { track: false }),
    );

    expect(store.getState().api.mutations).toEqual({});
  });

  it('never signs in', async () => {
    const store = createAppStore();

    await requestFor(store, 'anna@kovalenko.co');
    await verifyFor(store, 'anna@kovalenko.co');
    mockedRequest.mockResolvedValueOnce({ data: null });
    await store.dispatch(
      completePasswordReset.initiate({ reset_token: 'reset-token', password: 'sunny2026' }, { track: false }),
    );

    expect(store.getState().auth).toMatchObject({ isSignedIn: false, userToken: null });
  });
});

describe('passwordReset slice', () => {
  it('starts a challenge for the requested address with the server’s cooldown', async () => {
    const store = createAppStore();

    await requestFor(store, 'anna@kovalenko.co');

    expect(store.getState().passwordReset).toEqual({
      email: 'anna@kovalenko.co',
      resendAvailableAt: NOW + 60_000,
      authorization: null,
    });
  });

  it('moves the cooldown to Retry-After when a resend for the same address is refused', async () => {
    const store = createAppStore();

    await requestFor(store, 'anna@kovalenko.co');
    rejectWith(429, { code: 'PASSWORD_RESET_RATE_LIMITED' }, { 'retry-after': '1800' });
    await store.dispatch(requestPasswordReset.initiate({ email: 'ANNA@kovalenko.co' }, { track: false }));

    expect(store.getState().passwordReset.resendAvailableAt).toBe(NOW + 1_800_000);
  });

  it('keeps the challenge when a request for another address is refused', async () => {
    const store = createAppStore();

    await requestFor(store, 'anna@kovalenko.co');
    rejectWith(429, { code: 'TOO_MANY_REQUESTS' }, { 'retry-after': '30' });
    await store.dispatch(requestPasswordReset.initiate({ email: 'other@example.com' }, { track: false }));

    expect(store.getState().passwordReset).toMatchObject({
      email: 'anna@kovalenko.co',
      resendAvailableAt: NOW + 60_000,
    });
  });

  it('holds the reset authorization in memory with its expiry', async () => {
    const store = createAppStore();

    await requestFor(store, 'anna@kovalenko.co');
    await verifyFor(store, 'anna@kovalenko.co');

    expect(store.getState().passwordReset.authorization).toEqual({ token: 'reset-token', expiresAt: NOW + 600_000 });
  });

  it('ignores an authorization for an address the flow has moved away from', async () => {
    const store = createAppStore();

    await requestFor(store, 'anna@kovalenko.co');
    await verifyFor(store, 'other@example.com');

    expect(store.getState().passwordReset.authorization).toBeNull();
  });

  it('drops the authorization when the code is used up or the authorization is refused', async () => {
    const store = createAppStore();

    await requestFor(store, 'anna@kovalenko.co');
    await verifyFor(store, 'anna@kovalenko.co');
    rejectWith(400, { code: 'PASSWORD_RESET_CODE_UNUSABLE' });
    await store.dispatch(
      verifyPasswordReset.initiate({ email: 'anna@kovalenko.co', code: '000000' }, { track: false }),
    );

    expect(store.getState().passwordReset.authorization).toBeNull();

    await verifyFor(store, 'anna@kovalenko.co');
    rejectWith(400, { code: 'PASSWORD_RESET_AUTHORIZATION_INVALID' });
    await store.dispatch(
      completePasswordReset.initiate({ reset_token: 'reset-token', password: 'sunny2026' }, { track: false }),
    );

    expect(store.getState().passwordReset.authorization).toBeNull();
  });

  it('keeps the authorization when only the password was refused', async () => {
    const store = createAppStore();

    await requestFor(store, 'anna@kovalenko.co');
    await verifyFor(store, 'anna@kovalenko.co');
    rejectWith(400, { code: 'VALIDATION_FAILED' });
    await store.dispatch(
      completePasswordReset.initiate({ reset_token: 'reset-token', password: 'sunny' }, { track: false }),
    );

    expect(store.getState().passwordReset.authorization).not.toBeNull();
  });

  it('drops the used authorization once the password is set', async () => {
    const store = createAppStore();

    await requestFor(store, 'anna@kovalenko.co');
    await verifyFor(store, 'anna@kovalenko.co');
    mockedRequest.mockResolvedValueOnce({ data: null });
    await store.dispatch(
      completePasswordReset.initiate({ reset_token: 'reset-token', password: 'sunny2026' }, { track: false }),
    );

    expect(store.getState().passwordReset.authorization).toBeNull();
  });

  it('a new accepted request ends the previous authorization', async () => {
    const store = createAppStore();

    await requestFor(store, 'anna@kovalenko.co');
    await verifyFor(store, 'anna@kovalenko.co');
    await requestFor(store, 'anna@kovalenko.co');

    expect(store.getState().passwordReset.authorization).toBeNull();
  });

  it('clears the code’s state when the email changes, and keeps it when only its case does', async () => {
    const store = createAppStore();

    await requestFor(store, 'anna@kovalenko.co');
    await verifyFor(store, 'anna@kovalenko.co');

    store.dispatch(passwordResetEmailEdited(' Anna@Kovalenko.co'));
    expect(store.getState().passwordReset.email).toBe('anna@kovalenko.co');

    store.dispatch(passwordResetEmailEdited('anna@kovalenko.c'));
    expect(store.getState().passwordReset).toEqual({ email: null, resendAvailableAt: null, authorization: null });
  });

  it('discards the authorization or the whole flow on request', async () => {
    const store = createAppStore();

    await requestFor(store, 'anna@kovalenko.co');
    await verifyFor(store, 'anna@kovalenko.co');

    store.dispatch(resetAuthorizationDiscarded());
    expect(store.getState().passwordReset).toMatchObject({ email: 'anna@kovalenko.co', authorization: null });

    store.dispatch(passwordResetEnded());
    expect(store.getState().passwordReset).toEqual({ email: null, resendAvailableAt: null, authorization: null });
  });

  it('stays apart from registration’s address', async () => {
    const store = createAppStore();

    await store.dispatch(
      registerMe({ email: 'signup@example.com', password: 'sunny2026', name: 'Anna', base_currency_id: 1 }),
    );
    await requestFor(store, 'anna@kovalenko.co');
    await verifyFor(store, 'anna@kovalenko.co');
    store.dispatch(passwordResetEnded());

    expect(store.getState().auth.userEmail).toBe('signup@example.com');
    expect(store.getState().auth.error).toBeUndefined();
  });
});

describe('selectors', () => {
  it('compares addresses as the backend does', () => {
    expect(isSameEmail('Anna@Kovalenko.co ', 'anna@kovalenko.co')).toBe(true);
    expect(isSameEmail(null, 'anna@kovalenko.co')).toBe(false);
  });

  it('treats an authorization as usable only before it expires', () => {
    expect(isAuthorizationUsable({ expiresAt: 2000 }, 1999)).toBe(true);
    expect(isAuthorizationUsable({ expiresAt: 2000 }, 2000)).toBe(false);
    expect(isAuthorizationUsable(null)).toBe(false);
  });
});
