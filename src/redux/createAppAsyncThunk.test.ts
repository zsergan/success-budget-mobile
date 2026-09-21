import { getRejectValue } from './createAppAsyncThunk';

const errorBody = {
  message: 'Too many requests',
  path: '/spaces/1/invites',
  statusCode: 429,
  timestamp: '2026-01-01',
};

const axiosErrorWithHeaders = (headers: Record<string, string>) => ({
  response: { data: errorBody, headers },
});

describe('getRejectValue', () => {
  it('returns undefined for a network failure with no response', () => {
    expect(getRejectValue({})).toBeUndefined();
  });

  it('passes the body through unchanged when there is no Retry-After header', () => {
    expect(getRejectValue(axiosErrorWithHeaders({}))).toEqual(errorBody);
  });

  it('parses a delay-seconds Retry-After header into retryAfterMs', () => {
    const result = getRejectValue(axiosErrorWithHeaders({ 'retry-after': '120' }));

    expect(result).toEqual({ ...errorBody, retryAfterMs: 120_000 });
  });

  it('parses an HTTP-date Retry-After header into retryAfterMs', () => {
    const now = Date.parse('2026-01-01T00:00:00.000Z');

    jest.spyOn(Date, 'now').mockReturnValue(now);

    const result = getRejectValue(axiosErrorWithHeaders({ 'retry-after': 'Thu, 01 Jan 2026 00:00:30 GMT' }));

    expect(result).toEqual({ ...errorBody, retryAfterMs: 30_000 });

    jest.restoreAllMocks();
  });

  it('ignores a malformed Retry-After header rather than throwing', () => {
    expect(getRejectValue(axiosErrorWithHeaders({ 'retry-after': 'not-a-value' }))).toEqual(errorBody);
  });

  it('clamps a Retry-After date already in the past to zero', () => {
    const result = getRejectValue(axiosErrorWithHeaders({ 'retry-after': 'Thu, 01 Jan 2020 00:00:00 GMT' }));

    expect(result).toEqual({ ...errorBody, retryAfterMs: 0 });
  });
});
