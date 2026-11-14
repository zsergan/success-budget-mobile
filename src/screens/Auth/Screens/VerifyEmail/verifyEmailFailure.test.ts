import type { ErrorResponse } from '@api/dto';
import { getVerifyEmailFailure } from './verifyEmailFailure';

const NOW = 1_000_000;

const api = (statusCode: number, code?: string, extra: Partial<ErrorResponse> = {}) =>
  getVerifyEmailFailure(
    {
      reason: 'api',
      error: { message: 'From the server', path: '/users/verify-email', timestamp: '', statusCode, code, ...extra },
    },
    NOW,
  );

describe('getVerifyEmailFailure', () => {
  it('shows nothing for an attempt that was left behind or cancelled', () => {
    expect(getVerifyEmailFailure({ reason: 'abandoned' })).toBeNull();
    expect(api(0, undefined, { transport: 'canceled' })).toBeNull();
  });

  it('tells a wrong code from one that can no longer be used', () => {
    expect(api(400, 'INVALID_CREDENTIALS')).toEqual({ kind: 'codeInvalid' });
    expect(api(404, 'NOT_FOUND')).toEqual({ kind: 'codeUnusable', reason: 'missing' });
    expect(api(429, 'TOO_MANY_ATTEMPTS')).toEqual({ kind: 'codeUnusable', reason: 'attempts' });
  });

  it('counts a request throttle from Retry-After when the server sent one', () => {
    expect(api(429, 'TOO_MANY_REQUESTS', { retryAfterMs: 30_000 })).toEqual({
      kind: 'rateLimited',
      retryAt: NOW + 30_000,
    });
    expect(api(429)).toEqual({ kind: 'rateLimited', retryAt: undefined });
  });

  it('keeps network and service failures apart from anything about the code', () => {
    expect(api(0, undefined, { transport: 'network' })).toEqual({ kind: 'connection' });
    expect(api(503)).toEqual({ kind: 'server' });
  });

  it('names an already verified email and a session this device couldn’t save', () => {
    expect(api(409, 'EMAIL_ALREADY_VERIFIED')).toEqual({ kind: 'alreadyVerified' });
    expect(getVerifyEmailFailure({ reason: 'sessionNotSaved' })).toEqual({ kind: 'sessionNotSaved' });
  });

  it('passes on the server’s words for any other refusal', () => {
    expect(api(400, 'VALIDATION_FAILED')).toEqual({ kind: 'refused', message: 'From the server' });
  });
});
