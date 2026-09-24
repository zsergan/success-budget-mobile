import type { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { createHttpClient } from './instance';

jest.mock('expo-secure-store');

const mockedDispatch = jest.fn();
const mockedLogoutMe = jest.fn(() => ({ type: 'auth/logoutMe/pending' }));

jest.mock('@redux/Store', () => ({
  __esModule: true,
  default: { dispatch: (...args: unknown[]) => mockedDispatch(...args) },
}));

jest.mock('@redux/state/auth/thunks', () => ({
  logoutMe: () => mockedLogoutMe(),
}));

const mockedGetItemAsync = jest.mocked(SecureStore.getItemAsync);

const rejectedHandlerOf = (instance: AxiosInstance) => {
  const handlers = instance.interceptors.response.handlers!;

  return handlers[handlers.length - 1]!.rejected!;
};

const unauthorizedError = (token: string) => ({
  response: { status: 401 },
  config: { headers: { Authorization: `Bearer ${token}` } },
});

beforeEach(() => jest.clearAllMocks());

// The matching-token ("do log out") branch goes through instance.ts's
// lazy `await import('@redux/Store')` -- a real dynamic import, kept lazy
// on purpose to avoid a load-order cycle through Store.ts. Jest's Node/CJS
// environment can't execute that without --experimental-vm-modules, which
// this project doesn't enable, so only the skip branches (which return
// before ever reaching the import) are exercised here.
describe('401 handling', () => {
  it('does not log out a newer session for a 401 that belongs to a replaced token', async () => {
    mockedGetItemAsync.mockResolvedValue('new-token');

    const instance = createHttpClient();
    const rejected = rejectedHandlerOf(instance);

    await rejected(unauthorizedError('stale-token')).catch(() => {});

    expect(mockedLogoutMe).not.toHaveBeenCalled();
    expect(mockedDispatch).not.toHaveBeenCalled();
  });

  it('does not log out when the user has already logged out (no current token at all)', async () => {
    mockedGetItemAsync.mockResolvedValue(null);

    const instance = createHttpClient();
    const rejected = rejectedHandlerOf(instance);

    await rejected(unauthorizedError('stale-token')).catch(() => {});

    expect(mockedLogoutMe).not.toHaveBeenCalled();
  });

  it('still rejects the original error when skipping the stale-token logout', async () => {
    mockedGetItemAsync.mockResolvedValue('new-token');

    const instance = createHttpClient();
    const rejected = rejectedHandlerOf(instance);
    const error = unauthorizedError('stale-token');

    await expect(rejected(error)).rejects.toBe(error);
  });

  it('rejects a non-401 error without touching SecureStore', async () => {
    const instance = createHttpClient();
    const rejected = rejectedHandlerOf(instance);
    const error = { response: { status: 500 }, config: { headers: {} } };

    await expect(rejected(error)).rejects.toBe(error);
    expect(mockedGetItemAsync).not.toHaveBeenCalled();
  });
});
