import type { ErrorResponse } from '@api/dto';
import { getPasswordResetFailure } from './passwordResetFailure';

const error = (statusCode: number, extra: Partial<ErrorResponse> = {}): ErrorResponse => ({
  statusCode,
  message: 'Refused by the server',
  path: '/users/password-reset/verify',
  timestamp: 't',
  ...extra,
});

describe('getPasswordResetFailure', () => {
  it('maps the recovery error codes', () => {
    expect(getPasswordResetFailure(error(400, { code: 'PASSWORD_RESET_CODE_INVALID' }))).toEqual({
      kind: 'codeInvalid',
    });
    expect(getPasswordResetFailure(error(400, { code: 'PASSWORD_RESET_CODE_UNUSABLE' }))).toEqual({
      kind: 'codeUnusable',
    });
    expect(getPasswordResetFailure(error(400, { code: 'PASSWORD_RESET_AUTHORIZATION_INVALID' }))).toEqual({
      kind: 'authorizationInvalid',
    });
  });

  it('counts the wait of either 429 from its Retry-After', () => {
    expect(
      getPasswordResetFailure(error(429, { code: 'PASSWORD_RESET_RATE_LIMITED', retryAfterMs: 60_000 }), 1000),
    ).toEqual({ kind: 'rateLimited', retryAt: 61_000 });
    expect(getPasswordResetFailure(error(429, { code: 'TOO_MANY_REQUESTS' }))).toEqual({
      kind: 'rateLimited',
      retryAt: undefined,
    });
  });

  it('tells a lost connection from a server failure', () => {
    expect(getPasswordResetFailure(error(0, { transport: 'timeout' }))).toEqual({ kind: 'connection' });
    expect(getPasswordResetFailure(error(0, { transport: 'network' }))).toEqual({ kind: 'connection' });
    expect(getPasswordResetFailure(error(503))).toEqual({ kind: 'server' });
  });

  it('passes a validation message through', () => {
    expect(
      getPasswordResetFailure(
        error(400, { code: 'VALIDATION_FAILED', message: [{ field: 'password', error: 'Must contain a digit' }] }),
      ),
    ).toEqual({ kind: 'refused', message: 'Must contain a digit' });
  });

  it('shows nothing for a request dropped on purpose', () => {
    expect(getPasswordResetFailure(error(0, { transport: 'canceled' }))).toBeNull();
    expect(getPasswordResetFailure(error(0, { isStale: true }))).toBeNull();
    expect(getPasswordResetFailure({ name: 'AbortError', message: 'Aborted' })).toBeNull();
  });
});
