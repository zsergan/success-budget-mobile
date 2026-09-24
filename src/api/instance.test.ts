import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { showGlobalAlert } from '@components/Alert/AlertProvider/globalAlert';
import { createHttpClient } from './instance';
import { bindHttpSession } from './session';

jest.mock('expo-secure-store');
jest.mock('@components/Alert/AlertProvider/globalAlert', () => ({ showGlobalAlert: jest.fn() }));

const mockedGetItemAsync = jest.mocked(SecureStore.getItemAsync);
const mockedShowGlobalAlert = jest.mocked(showGlobalAlert);
const endSession = jest.fn();
let sessionKey = 0;

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

const sendAndFail = async (status: number, { beforeResponse }: { beforeResponse?: () => void } = {}) => {
  const { prepare, rejected } = interceptorsOf(createHttpClient());
  const config = await prepare({ headers: {} } as InternalAxiosRequestConfig);

  beforeResponse?.();

  const error = { response: { status }, config };

  await expect(rejected(error)).rejects.toBe(error);
};

beforeEach(() => {
  jest.clearAllMocks();
  sessionKey = 0;
  mockedGetItemAsync.mockResolvedValue('token');
  bindHttpSession({ getKey: () => sessionKey, end: endSession });
});

afterAll(() => bindHttpSession(null));

describe('401 handling', () => {
  it('ends the session that sent the request', async () => {
    await sendAndFail(401);

    expect(endSession).toHaveBeenCalledTimes(1);
  });

  it('does not end a newer session for a 401 from one that has since ended', async () => {
    await sendAndFail(401, { beforeResponse: () => (sessionKey += 1) });

    expect(endSession).not.toHaveBeenCalled();
  });

  it('treats a request as stale when the session ends while its token is being read', async () => {
    mockedGetItemAsync.mockImplementation(async () => {
      sessionKey += 1;

      return 'token';
    });

    await sendAndFail(401);

    expect(endSession).not.toHaveBeenCalled();
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

  it('stays silent for a request whose session has ended', async () => {
    await sendAndFail(429, { beforeResponse: () => (sessionKey += 1) });

    expect(mockedShowGlobalAlert).not.toHaveBeenCalled();
  });
});

it('passes other errors through without side effects', async () => {
  await sendAndFail(500);

  expect(endSession).not.toHaveBeenCalled();
  expect(mockedShowGlobalAlert).not.toHaveBeenCalled();
});
