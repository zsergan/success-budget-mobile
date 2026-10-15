import { CanceledError } from 'axios';

import { getErrorMessage, NETWORK_ERROR_MESSAGE, RATE_LIMITED_MESSAGE } from '@shared/utils/error';
import { getRejectValue } from './createAppAsyncThunk';

const errorBody = {
  message: 'Too many requests',
  path: '/spaces/1/invites',
  statusCode: 429,
  timestamp: '2026-01-01',
};

const PROXY_PAGE = '<html><body><h1>503 Service Temporarily Unavailable</h1><hr>nginx/1.25.3</body></html>';

const httpError = (status: number, data: unknown, headers: Record<string, string> = {}) => ({
  response: { status, data, headers },
  config: { url: '/spaces' },
});

const axiosErrorWithHeaders = (headers: Record<string, string>) => httpError(429, errorBody, headers);

afterEach(() => jest.restoreAllMocks());

describe('getRejectValue', () => {
  it('returns a truthy synthetic error for a network failure with no response, not undefined', () => {
    const result = getRejectValue({});

    expect(result).not.toBeUndefined();
    expect(result.statusCode).toBe(0);
    expect(result.message).toBe(NETWORK_ERROR_MESSAGE);
  });

  it('passes the body through unchanged when there is no Retry-After header', () => {
    expect(getRejectValue(axiosErrorWithHeaders({}))).toEqual(errorBody);
  });

  it('parses a delay-seconds Retry-After header into retryAfterMs', () => {
    const result = getRejectValue(axiosErrorWithHeaders({ 'retry-after': '120' }));

    expect(result).toEqual({ ...errorBody, retryAfterMs: 120_000 });
  });

  it('parses an HTTP-date Retry-After header into retryAfterMs', () => {
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-01-01T00:00:00.000Z'));

    const result = getRejectValue(axiosErrorWithHeaders({ 'retry-after': 'Thu, 01 Jan 2026 00:00:30 GMT' }));

    expect(result).toEqual({ ...errorBody, retryAfterMs: 30_000 });
  });

  it('ignores a malformed Retry-After header rather than throwing', () => {
    expect(getRejectValue(axiosErrorWithHeaders({ 'retry-after': 'not-a-value' }))).toEqual(errorBody);
  });

  it('clamps a Retry-After date already in the past to zero', () => {
    const result = getRejectValue(axiosErrorWithHeaders({ 'retry-after': 'Thu, 01 Jan 2020 00:00:00 GMT' }));

    expect(result).toEqual({ ...errorBody, retryAfterMs: 0 });
  });
});

describe('an API error body', () => {
  it('keeps its code, request id and field errors', () => {
    const body = {
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      error: 'Bad Request',
      requestId: 'req-42',
      message: [{ field: 'amount', error: 'Must be positive' }],
      path: '/spaces/1/transactions',
      timestamp: '2026-01-01T00:00:00.000Z',
    };

    expect(getRejectValue(httpError(400, body))).toEqual(body);
  });

  it('takes the status from the response, not from the body', () => {
    expect(getRejectValue(httpError(503, { ...errorBody, statusCode: 200 })).statusCode).toBe(503);
  });
});

describe('a response without the API’s body', () => {
  it.each([
    ['a proxy’s HTML page', 503, PROXY_PAGE],
    ['an empty string', 502, ''],
    ['no body', 503, undefined],
    ['a null body', 502, null],
    ['some other JSON', 503, { error: 'upstream connect error', details: { trace: 'at proxy.js:12' } }],
    ['a body with the wrong field types', 500, { statusCode: '500', message: { stack: 'Error at db.js:1' } }],
  ])('is still a server error for %s, with a message of the app’s own', (_, status, body) => {
    const result = getRejectValue(httpError(status, body));

    expect(result).toMatchObject({ statusCode: status, path: '/spaces' });
    expect(result.transport).toBeUndefined();
    expect(getErrorMessage(result)).toBe('Something went wrong on our end. Please try again later.');
    expect(JSON.stringify(result)).not.toMatch(/nginx|html|proxy\.js|db\.js|upstream/);
  });

  it('gives a 4xx proxy page a generic message, never its text', () => {
    const result = getRejectValue(httpError(413, '<html><body>413 Request Entity Too Large</body></html>'));

    expect(result.statusCode).toBe(413);
    expect(getErrorMessage(result)).toBe('Something went wrong. Please try again.');
  });

  it('keeps Retry-After on a 429 with an empty body', () => {
    const result = getRejectValue(httpError(429, '', { 'retry-after': '7' }));

    expect(result).toMatchObject({ statusCode: 429, retryAfterMs: 7000, message: RATE_LIMITED_MESSAGE });
  });

  it('keeps an HTTP-date Retry-After on a 429 with some other JSON', () => {
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-01-01T00:00:00.000Z'));

    const result = getRejectValue(
      httpError(429, { error: 'rate_limited' }, { 'retry-after': 'Thu, 01 Jan 2026 00:00:45 GMT' }),
    );

    expect(result).toMatchObject({ statusCode: 429, retryAfterMs: 45_000, message: RATE_LIMITED_MESSAGE });
  });
});

describe('a request with no response', () => {
  it.each([
    ['no connection', { code: 'ERR_NETWORK', message: 'Network Error' }, 'network'],
    ['a timeout', { code: 'ECONNABORTED', message: 'timeout of 20000ms exceeded' }, 'timeout'],
    ['a socket timeout', { code: 'ETIMEDOUT', message: 'timeout' }, 'timeout'],
    ['a cancellation', new CanceledError('canceled'), 'canceled'],
    ['an error from outside the network', new Error('Keystore is corrupted'), 'network'],
  ] as const)('tells %s apart', (_, error, transport) => {
    expect(getRejectValue(error)).toMatchObject({ statusCode: 0, transport, message: NETWORK_ERROR_MESSAGE });
  });
});
