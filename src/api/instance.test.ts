import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { showGlobalAlert } from '@components/Alert/AlertProvider/globalAlert';
import { createAppStore } from '@redux/Store';
import { loginMe, logoutMe } from '@redux/state/auth/thunks';
import type { ErrorResponse } from './dto';
import { getRejectValue } from './errors';
import { createHttpClient, REQUEST_TIMEOUT_MS } from './instance';
import { bindHttpSession } from './session';

jest.mock('expo-secure-store');
jest.mock('@components/Alert/AlertProvider/globalAlert', () => ({ showGlobalAlert: jest.fn() }));

const mockedGetItemAsync = jest.mocked(SecureStore.getItemAsync);
const mockedShowGlobalAlert = jest.mocked(showGlobalAlert);
const endSession = jest.fn();
let sessionKey = 0;
let isLaunching = false;

const interceptorsOf = (instance: AxiosInstance) => {
  const requestHandlers = instance.interceptors.request.handlers!;
  const responseHandlers = instance.interceptors.response.handlers!;

  return {
    prepare: requestHandlers[requestHandlers.length - 1]!.fulfilled! as (
      config: InternalAxiosRequestConfig,
    ) => Promise<InternalAxiosRequestConfig>,
    rejected: responseHandlers[responseHandlers.length - 1]!.rejected!,
  };
};

interface SendOptions {
  beforeResponse?: () => void;
  body?: unknown;
  isHandledRateLimit?: (error: ErrorResponse) => boolean;
}

const sendAndFail = async (status: number, { beforeResponse, body, isHandledRateLimit }: SendOptions = {}) => {
  const { prepare, rejected } = interceptorsOf(createHttpClient());
  const config = await prepare({ headers: {}, isHandledRateLimit } as InternalAxiosRequestConfig);

  beforeResponse?.();

  const error = { response: { status, data: body }, config };

  await expect(rejected(error)).rejects.toBe(error);
};

beforeEach(() => {
  jest.clearAllMocks();
  sessionKey = 0;
  mockedGetItemAsync.mockResolvedValue('token');
  isLaunching = false;
  bindHttpSession({ getKey: () => sessionKey, end: endSession, isLaunching: () => isLaunching });
});

afterAll(() => bindHttpSession(null));

describe('401 handling', () => {
  it('cancels a queued request whose session ended before the interceptor ran', async () => {
    const { prepare } = interceptorsOf(createHttpClient());
    sessionKey = 1;
    await expect(prepare({ headers: {}, sessionKey: 0 } as InternalAxiosRequestConfig)).rejects.toMatchObject({
      code: 'ERR_CANCELED',
    });
    expect(mockedGetItemAsync).not.toHaveBeenCalled();
  });
  it('ends the session that sent the request', async () => {
    await sendAndFail(401);

    expect(endSession).toHaveBeenCalledTimes(1);
  });

  it('does not end a newer session for a 401 from one that has since ended', async () => {
    await sendAndFail(401, { beforeResponse: () => (sessionKey += 1) });

    expect(endSession).not.toHaveBeenCalled();
  });

  it('cancels a request before sending when the session ends while its token is being read', async () => {
    mockedGetItemAsync.mockImplementation(async () => {
      sessionKey += 1;

      return 'token';
    });

    const { prepare } = interceptorsOf(createHttpClient());
    await expect(prepare({ headers: {} } as InternalAxiosRequestConfig)).rejects.toMatchObject({
      code: 'ERR_CANCELED',
    });

    expect(endSession).not.toHaveBeenCalled();
  });

  it('ends the session on a 401 whose body is a proxy page', async () => {
    await sendAndFail(401, { body: '<html><body>401 Authorization Required</body></html>' });

    expect(endSession).toHaveBeenCalledTimes(1);
  });

  it('does not end the session for a 401 from a request sent without a token', async () => {
    mockedGetItemAsync.mockResolvedValue(null);

    await sendAndFail(401);

    expect(endSession).not.toHaveBeenCalled();
  });
});

describe('429 handling', () => {
  it('alerts for a request of the current session', async () => {
    await sendAndFail(429);

    expect(mockedShowGlobalAlert).toHaveBeenCalledTimes(1);
  });

  it('leaves a 429 during the launch to the launch screen', async () => {
    isLaunching = true;
    await sendAndFail(429);

    expect(mockedShowGlobalAlert).not.toHaveBeenCalled();
  });

  it('stays silent for a request whose session has ended', async () => {
    await sendAndFail(429, { beforeResponse: () => (sessionKey += 1) });

    expect(mockedShowGlobalAlert).not.toHaveBeenCalled();
  });

  it('leaves a 429 the caller handles to the caller, and alerts for any other', async () => {
    const isHandledRateLimit = jest.fn(({ code }: { code?: string }) => code === 'CODE_ALREADY_SENT');
    const apiError = (code: string) => ({
      statusCode: 429,
      code,
      message: 'Too many requests',
      path: '',
      timestamp: '',
    });

    await sendAndFail(429, { body: apiError('CODE_ALREADY_SENT'), isHandledRateLimit });

    expect(mockedShowGlobalAlert).not.toHaveBeenCalled();

    await sendAndFail(429, { body: apiError('TOO_MANY_REQUESTS'), isHandledRateLimit });
    await sendAndFail(429, { body: '<html>429 Too Many Requests</html>', isHandledRateLimit });

    expect(mockedShowGlobalAlert).toHaveBeenCalledTimes(2);
    // The caller judges the normalized error: the status comes from the response, whatever the body.
    expect(isHandledRateLimit).toHaveBeenLastCalledWith(expect.objectContaining({ statusCode: 429 }));
  });
});

it('passes other errors through without side effects', async () => {
  await sendAndFail(500);

  expect(endSession).not.toHaveBeenCalled();
  expect(mockedShowGlobalAlert).not.toHaveBeenCalled();
});

it('neither ends the session nor alerts for a request with no response', async () => {
  const { prepare, rejected } = interceptorsOf(createHttpClient());
  const config = await prepare({ headers: {} } as InternalAxiosRequestConfig);
  const error = { code: 'ERR_NETWORK', message: 'Network Error', config };

  await expect(rejected(error)).rejects.toBe(error);
  expect(endSession).not.toHaveBeenCalled();
  expect(mockedShowGlobalAlert).not.toHaveBeenCalled();
});

describe('a late response after a logout and a new login', () => {
  const signIn = (store: ReturnType<typeof createAppStore>, token: string) =>
    store.dispatch(loginMe.fulfilled(token, 'req-login', { email: 'a@b.com', password: 'password1' }));

  it.each([401, 429])('leaves the new session alone on a %i', async (status) => {
    const store = createAppStore();
    const end = jest.fn();

    bindHttpSession({ getKey: () => store.getState().auth.sessionKey, end, isLaunching: () => false });
    signIn(store, 'token-1');

    await sendAndFail(status, {
      beforeResponse: () => {
        store.dispatch(logoutMe.fulfilled(undefined, 'req-logout'));
        signIn(store, 'token-2');
      },
    });

    expect(end).not.toHaveBeenCalled();
    expect(mockedShowGlobalAlert).not.toHaveBeenCalled();
    expect(store.getState().auth.isSignedIn).toBe(true);
  });
});

it('gives up on a request after the timeout, as on a lost connection', () => {
  const timedOut = { code: 'ECONNABORTED', message: 'timeout of 20000ms exceeded', config: {} };

  expect(createHttpClient().defaults.timeout).toBe(REQUEST_TIMEOUT_MS);
  expect(getRejectValue(timedOut)).toMatchObject({ statusCode: 0 });
});
