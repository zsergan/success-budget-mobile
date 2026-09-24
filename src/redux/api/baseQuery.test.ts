import type { BaseQueryApi } from '@reduxjs/toolkit/query';

import { httpBaseQuery } from './baseQuery';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

const apiWithSession = (sessionKeys: number[]) => {
  const getState = jest.fn();

  sessionKeys.forEach((sessionKey) => getState.mockReturnValueOnce({ auth: { sessionKey } }));
  getState.mockReturnValue({ auth: { sessionKey: sessionKeys[sessionKeys.length - 1] } });

  return { signal: new AbortController().signal, getState } as unknown as BaseQueryApi;
};

beforeEach(() => jest.clearAllMocks());

describe('httpBaseQuery', () => {
  it('sends the request through the shared client with the abort signal and returns its data', async () => {
    const api = apiWithSession([1]);

    mockedRequest.mockResolvedValue({ data: { ok: true } });

    const result = await httpBaseQuery(
      { url: '/spaces/1/transactions', params: { from: '2026-01-01T00:00:00.000Z' } },
      api,
      {},
    );

    expect(mockedRequest).toHaveBeenCalledWith({
      url: '/spaces/1/transactions',
      method: 'GET',
      data: undefined,
      params: { from: '2026-01-01T00:00:00.000Z' },
      signal: api.signal,
    });
    expect(result).toEqual({ data: { ok: true } });
  });

  it('turns an empty body into null so RTK Query accepts it as a result', async () => {
    mockedRequest.mockResolvedValue({ data: undefined });

    const result = await httpBaseQuery({ url: '/x', method: 'PUT' }, apiWithSession([1]), {});

    expect(result).toEqual({ data: null });
  });

  it('returns the backend error body with Retry-After parsed', async () => {
    const body = { message: 'Too many', statusCode: 429, path: '/x', timestamp: 't' };

    mockedRequest.mockRejectedValue({ response: { data: body, headers: { 'retry-after': '30' } } });

    const result = await httpBaseQuery({ url: '/x' }, apiWithSession([1]), {});

    expect(result).toEqual({ error: { ...body, retryAfterMs: 30000 } });
  });

  it('turns a request with no response into a network error instead of an empty result', async () => {
    mockedRequest.mockRejectedValue(new Error('Network Error'));

    const result = await httpBaseQuery({ url: '/x' }, apiWithSession([1]), {});

    expect(result.error).toMatchObject({ statusCode: 0 });
    expect(result.error?.isStale).toBeUndefined();
  });

  it('reports a success that lands after the session ended as a stale error, not data', async () => {
    mockedRequest.mockResolvedValue({ data: { ok: true } });

    const result = await httpBaseQuery({ url: '/x' }, apiWithSession([1, 2]), {});

    expect(result.data).toBeUndefined();
    expect(result.error).toMatchObject({ isStale: true });
  });

  it('marks a failure that lands after the session ended as stale', async () => {
    mockedRequest.mockRejectedValue({ response: { data: { message: 'x', statusCode: 500 } } });

    const result = await httpBaseQuery({ url: '/x' }, apiWithSession([1, 2]), {});

    expect(result.error).toMatchObject({ isStale: true });
  });
});
