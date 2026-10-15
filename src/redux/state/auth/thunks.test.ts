import * as SecureStore from 'expo-secure-store';

import { createAppStore } from '@redux/Store';
import { attemptFailed, attemptStarted } from '@redux/state/launch/actions';
import { login, register, verifyEmail } from '@api/auth.api';
import { AUTH_TOKEN_KEY } from '@shared/constants';
import type authReducer from './slice';
import { loginMe, logoutMe, readStoredSession, registerMe, verifyEmailMe } from './thunks';

jest.mock('@api/auth.api', () => ({
  ...jest.requireActual('@api/auth.api'),
  login: jest.fn(),
  register: jest.fn(),
  verifyEmail: jest.fn(),
}));
jest.mock('expo-secure-store');

const mockedLogin = jest.mocked(login);
const mockedRegister = jest.mocked(register);
const mockedVerifyEmail = jest.mocked(verifyEmail);
const mockedSetItemAsync = jest.mocked(SecureStore.setItemAsync);
const mockedGetItemAsync = jest.mocked(SecureStore.getItemAsync);
const mockedDeleteItemAsync = jest.mocked(SecureStore.deleteItemAsync);

const createTestStore = (preloadedState?: { auth: ReturnType<typeof authReducer> }) => createAppStore(preloadedState);

const errorResponse = {
  message: 'Invalid credentials',
  statusCode: 401,
  path: '/users/login',
  timestamp: '2026-01-01T00:00:00.000Z',
};

const axiosErrorFor = (data: unknown) => ({ response: { data } });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('loginMe', () => {
  it('stores the token and signs the user in on success', async () => {
    mockedLogin.mockResolvedValue('a-token');

    const store = createTestStore();
    const action = await store.dispatch(loginMe({ email: 'a@b.com', password: 'password1' }));

    expect(action.type).toBe('auth/loginMe/fulfilled');
    expect(mockedSetItemAsync).toHaveBeenCalledWith(AUTH_TOKEN_KEY, 'a-token');
    expect(store.getState().auth.isSignedIn).toBe(true);
    expect(store.getState().auth.userToken).toBe('a-token');
  });

  it('rejects with the server error body and does not sign the user in', async () => {
    mockedLogin.mockRejectedValue(axiosErrorFor(errorResponse));

    const store = createTestStore();
    const action = await store.dispatch(loginMe({ email: 'a@b.com', password: 'wrong' }));

    expect(action.type).toBe('auth/loginMe/rejected');
    expect(action.payload).toEqual(errorResponse);
    expect(mockedSetItemAsync).not.toHaveBeenCalled();
    expect(store.getState().auth.isSignedIn).toBe(false);
    expect(store.getState().auth.error).toEqual(errorResponse);
  });
});

describe('registerMe', () => {
  const registerPayload = { name: 'Alex', base_currency_id: 1, email: 'a@b.com', password: 'password1' };
  const profileResponse = { id: 1, email: 'a@b.com', name: 'Alex' };

  it('records the registered email on success without signing the user in yet', async () => {
    mockedRegister.mockResolvedValue(profileResponse);

    const store = createTestStore();
    const action = await store.dispatch(registerMe(registerPayload));

    expect(action.type).toBe('auth/registerMe/fulfilled');
    expect(store.getState().auth.userEmail).toBe('a@b.com');
    expect(store.getState().auth.isSignedIn).toBe(false);
  });

  it('rejects with the server error body, e.g. a duplicate email', async () => {
    const duplicateEmailError = {
      message: 'Email already registered',
      statusCode: 409,
      path: '/users/register',
      timestamp: '2026-01-01T00:00:00.000Z',
    };

    mockedRegister.mockRejectedValue(axiosErrorFor(duplicateEmailError));

    const store = createTestStore();
    const action = await store.dispatch(registerMe(registerPayload));

    expect(action.type).toBe('auth/registerMe/rejected');
    expect(action.payload).toEqual(duplicateEmailError);
    expect(store.getState().auth.error).toEqual(duplicateEmailError);
  });

  it('continues to verification when a parallel sign-up for the email is already sending the code', async () => {
    mockedRegister.mockRejectedValue(
      axiosErrorFor({
        message: 'A confirmation email was already requested, please try again shortly',
        code: 'CONFIRMATION_EMAIL_RATE_LIMITED',
        statusCode: 429,
        path: '/users/register',
        timestamp: '2026-01-01T00:00:00.000Z',
      }),
    );

    const store = createTestStore();
    const action = await store.dispatch(registerMe(registerPayload));

    expect(action.type).toBe('auth/registerMe/fulfilled');
    expect(store.getState().auth.userEmail).toBe('a@b.com');
    expect(store.getState().auth.error).toBeUndefined();
  });

  it('still rejects any other 429, such as the request throttle', async () => {
    const throttled = {
      message: 'ThrottlerException: Too Many Requests',
      statusCode: 429,
      path: '/users/register',
      timestamp: '2026-01-01T00:00:00.000Z',
    };

    mockedRegister.mockRejectedValue(axiosErrorFor(throttled));

    const store = createTestStore();
    const action = await store.dispatch(registerMe(registerPayload));

    expect(action.type).toBe('auth/registerMe/rejected');
    expect(store.getState().auth.userEmail).toBeNull();
  });
});

describe('verifyEmailMe', () => {
  it('stores the token and signs the user in on a successful code', async () => {
    mockedVerifyEmail.mockResolvedValue('a-token');

    const store = createTestStore();
    const action = await store.dispatch(verifyEmailMe({ email: 'a@b.com', code: '123456' }));

    expect(action.type).toBe('auth/verifyEmailMe/fulfilled');
    expect(mockedSetItemAsync).toHaveBeenCalledWith(AUTH_TOKEN_KEY, 'a-token');
    expect(store.getState().auth.isSignedIn).toBe(true);
  });

  it('rejects with the server error body on an invalid code', async () => {
    const invalidCodeError = {
      message: 'Invalid or expired code',
      statusCode: 400,
      path: '/users/verify-email',
      timestamp: '2026-01-01T00:00:00.000Z',
    };

    mockedVerifyEmail.mockRejectedValue(axiosErrorFor(invalidCodeError));

    const store = createTestStore();
    const action = await store.dispatch(verifyEmailMe({ email: 'a@b.com', code: '000000' }));

    expect(action.type).toBe('auth/verifyEmailMe/rejected');
    expect(action.payload).toEqual(invalidCodeError);
    expect(store.getState().auth.isSignedIn).toBe(false);
    expect(store.getState().auth.error).toEqual(invalidCodeError);
  });

  it('keeps an already verified account out of the auth error, so no screen alerts it as a failure', async () => {
    mockedVerifyEmail.mockRejectedValue(
      axiosErrorFor({
        message: 'Email is already verified',
        statusCode: 409,
        path: '/users/verify-email',
        timestamp: '2026-01-01T00:00:00.000Z',
      }),
    );

    const store = createTestStore();
    const action = await store.dispatch(verifyEmailMe({ email: 'a@b.com', code: '123456' }));

    expect(action.type).toBe('auth/verifyEmailMe/rejected');
    expect(mockedSetItemAsync).not.toHaveBeenCalled();
    expect(store.getState().auth.isSignedIn).toBe(false);
    expect(store.getState().auth.error).toBeUndefined();
  });
});

describe('readStoredSession', () => {
  it('signs the user in when a token is already stored', async () => {
    mockedGetItemAsync.mockResolvedValue('a-token');

    const store = createTestStore();
    await store.dispatch(readStoredSession({ attempt: 1 }));

    expect(store.getState().auth.storedSession).toBe('read');
    expect(store.getState().auth.isSignedIn).toBe(true);
    expect(store.getState().auth.userToken).toBe('a-token');
  });

  it('reads as signed out when no token is stored', async () => {
    mockedGetItemAsync.mockResolvedValue(null);

    const store = createTestStore();
    await store.dispatch(readStoredSession({ attempt: 1 }));

    expect(store.getState().auth.storedSession).toBe('read');
    expect(store.getState().auth.isSignedIn).toBe(false);
  });

  it('fails instead of reading as signed out when SecureStore throws, and reads again on the next attempt', async () => {
    mockedGetItemAsync.mockRejectedValueOnce(new Error('Keystore is corrupted'));

    const store = createTestStore();
    const action = await store.dispatch(readStoredSession({ attempt: 1 }));

    expect(action.type).toBe('auth/readStoredSession/rejected');
    expect(store.getState().auth.storedSession).toBe('failed');
    expect(mockedDeleteItemAsync).not.toHaveBeenCalled();

    mockedGetItemAsync.mockResolvedValueOnce('a-token');
    await store.dispatch(readStoredSession({ attempt: 1 }));

    expect(store.getState().auth.isSignedIn).toBe(true);
  });
});

describe('a stored-session read that is no longer current', () => {
  let settleRead: { resolve: (token: string | null) => void; reject: (error: Error) => void };

  // Nothing aborts these reads, as nothing stops the native read itself: the state alone must ignore them.
  const startRead = (store: ReturnType<typeof createTestStore>, attempt = 1) => {
    mockedGetItemAsync.mockImplementationOnce(
      () => new Promise((resolve, reject) => (settleRead = { resolve, reject })),
    );

    return store.dispatch(readStoredSession({ attempt }));
  };

  const settleLate = async (
    store: ReturnType<typeof createTestStore>,
    read: Promise<unknown>,
    token: string | null,
  ) => {
    const before = store.getState().auth;

    settleRead.resolve(token);
    await read;

    expect(store.getState().auth).toEqual(before);
  };

  it('changes nothing once its attempt has timed out', async () => {
    const store = createTestStore();
    const read = startRead(store);

    store.dispatch(attemptFailed({ attempt: 1, failure: 'storage' }));

    expect(store.getState().auth.storedSession).toBe('failed');
    await settleLate(store, read, 'old-token');
    expect(store.getState().auth.isSignedIn).toBe(false);
  });

  it('changes nothing once a newer attempt has read the session', async () => {
    const store = createTestStore();
    const read = startRead(store);

    store.dispatch(attemptStarted({ attempt: 2, startedAt: 0 }));
    mockedGetItemAsync.mockResolvedValueOnce(null);
    await store.dispatch(readStoredSession({ attempt: 2 }));

    await settleLate(store, read, 'old-token');
    expect(store.getState().auth).toMatchObject({ isSignedIn: false, userToken: null, storedSession: 'read' });
  });

  it('cannot fail a session a newer read restored', async () => {
    const store = createTestStore();
    const read = startRead(store);

    store.dispatch(attemptStarted({ attempt: 2, startedAt: 0 }));
    mockedGetItemAsync.mockResolvedValueOnce('a-token');
    await store.dispatch(readStoredSession({ attempt: 2 }));

    const before = store.getState().auth;

    settleRead.reject(new Error('Keystore is corrupted'));
    await read;

    expect(store.getState().auth).toEqual(before);
    expect(store.getState().auth.storedSession).toBe('read');
  });

  it('changes nothing after a logout', async () => {
    const store = createTestStore();
    const read = startRead(store);

    await store.dispatch(logoutMe());

    await settleLate(store, read, 'old-token');
    expect(store.getState().auth.isSignedIn).toBe(false);
  });

  it('cannot replace or end a session signed in since', async () => {
    mockedLogin.mockResolvedValue('new-token');

    const store = createTestStore();
    const read = startRead(store);

    await store.dispatch(loginMe({ email: 'me@example.com', password: 'secret' }));

    await settleLate(store, read, null);
    expect(store.getState().auth).toMatchObject({ isSignedIn: true, userToken: 'new-token', sessionKey: 0 });
  });
});

describe('logoutMe', () => {
  it('clears the session even if SecureStore fails to delete the token', async () => {
    mockedDeleteItemAsync.mockRejectedValue(new Error('Keystore is corrupted'));

    const store = createTestStore({
      auth: {
        storedSession: 'read',
        storedSessionRead: null,
        isSignedIn: true,
        userToken: 'a-token',
        userEmail: null,
        sessionKey: 0,
      },
    });

    const action = await store.dispatch(logoutMe());

    expect(action.type).toBe('auth/logoutMe/fulfilled');
    expect(store.getState().auth.isSignedIn).toBe(false);
    expect(store.getState().auth.userToken).toBeNull();
  });

  it('bumps sessionKey so a stale request from before logout can be told apart from a new one', async () => {
    const store = createTestStore({
      auth: {
        storedSession: 'read',
        storedSessionRead: null,
        isSignedIn: true,
        userToken: 'a-token',
        userEmail: null,
        sessionKey: 3,
      },
    });

    await store.dispatch(logoutMe());

    expect(store.getState().auth.sessionKey).toBe(4);
  });
});
