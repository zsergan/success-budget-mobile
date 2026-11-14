import { ApiErrorCode } from '@api/dto';
import type { VerifyEmailRejection } from '@redux/state/auth/thunks';
import { getErrorMessage } from '@shared/utils';

export type VerifyEmailFailure =
  | { kind: 'connection' }
  | { kind: 'server' }
  // When the server allows another attempt, as a timestamp, so the wait can be counted down.
  | { kind: 'rateLimited'; retryAt?: number }
  | { kind: 'codeInvalid' }
  // No code waits for this address (expired or never sent), or wrong tries blocked it: only another code helps.
  | { kind: 'codeUnusable'; reason: 'missing' | 'attempts' }
  | { kind: 'alreadyVerified' }
  // The email is verified, but the session could not be saved on this device.
  | { kind: 'sessionNotSaved' }
  | { kind: 'refused'; message: string };

// Null for an attempt that was abandoned or dropped on purpose: there is nothing to show.
export const getVerifyEmailFailure = (
  rejection: VerifyEmailRejection | undefined,
  now = Date.now(),
): VerifyEmailFailure | null => {
  if (!rejection) return { kind: 'refused', message: getErrorMessage({}) };
  if (rejection.reason === 'abandoned') return null;
  if (rejection.reason === 'sessionNotSaved') return { kind: 'sessionNotSaved' };

  const { error } = rejection;

  if (error.statusCode === 0) return error.transport === 'canceled' ? null : { kind: 'connection' };

  if (error.statusCode === 429) {
    return error.code === ApiErrorCode.TOO_MANY_ATTEMPTS
      ? { kind: 'codeUnusable', reason: 'attempts' }
      : { kind: 'rateLimited', retryAt: error.retryAfterMs === undefined ? undefined : now + error.retryAfterMs };
  }

  if (error.statusCode >= 500) return { kind: 'server' };
  if (error.statusCode === 404) return { kind: 'codeUnusable', reason: 'missing' };
  if (error.statusCode === 409) return { kind: 'alreadyVerified' };

  return error.statusCode === 400 && error.code === ApiErrorCode.INVALID_CREDENTIALS
    ? { kind: 'codeInvalid' }
    : { kind: 'refused', message: getErrorMessage(error) };
};
