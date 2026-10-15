import type { ErrorResponse } from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import { getErrorMessage } from '@shared/utils';

export type PasswordResetFailure =
  | { kind: 'connection' }
  | { kind: 'server' }
  // When the server allows another attempt, as a timestamp, so the wait can be counted down.
  | { kind: 'rateLimited'; retryAt?: number }
  | { kind: 'codeInvalid' }
  // Expired, five wrong codes or already used: only a new code helps.
  | { kind: 'codeUnusable' }
  // Expired, used or replaced by a newer request: the code has to be confirmed again.
  | { kind: 'authorizationInvalid' }
  | { kind: 'refused'; message: string };

const isErrorResponse = (error: unknown): error is ErrorResponse =>
  typeof error === 'object' && error !== null && typeof (error as ErrorResponse).statusCode === 'number';

// Null for a request dropped on purpose (the screen was left or the session ended): there is nothing to show.
export const getPasswordResetFailure = (error: unknown, now = Date.now()): PasswordResetFailure | null => {
  if (!isErrorResponse(error)) {
    return (error as { name?: string } | undefined)?.name === 'AbortError'
      ? null
      : { kind: 'refused', message: getErrorMessage({}) };
  }

  if (error.isStale) return null;

  if (error.statusCode === 0) return error.transport === 'canceled' ? null : { kind: 'connection' };

  if (error.statusCode === 429) {
    return { kind: 'rateLimited', retryAt: error.retryAfterMs === undefined ? undefined : now + error.retryAfterMs };
  }

  if (error.statusCode >= 500) return { kind: 'server' };

  switch (error.code) {
    case ApiErrorCode.PASSWORD_RESET_CODE_INVALID:
      return { kind: 'codeInvalid' };
    case ApiErrorCode.PASSWORD_RESET_CODE_UNUSABLE:
      return { kind: 'codeUnusable' };
    case ApiErrorCode.PASSWORD_RESET_AUTHORIZATION_INVALID:
      return { kind: 'authorizationInvalid' };
    default:
      return { kind: 'refused', message: getErrorMessage(error) };
  }
};
