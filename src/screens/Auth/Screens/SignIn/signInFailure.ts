import type { ErrorResponse } from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import { getErrorMessage } from '@shared/utils';

export type SignInField = 'email' | 'password';

export type SignInFailure =
  | { kind: 'credentials' }
  | { kind: 'connection' }
  | { kind: 'server' }
  | { kind: 'rateLimited'; retryAfterMs?: number }
  | { kind: 'refused'; message: string; code?: string };

// Null for a request canceled because its session ended: nothing went wrong that the user can act on.
export const getSignInFailure = (error: ErrorResponse | undefined): SignInFailure | null => {
  if (!error) return { kind: 'refused', message: getErrorMessage({}) };

  if (error.statusCode === 0) return error.transport === 'canceled' ? null : { kind: 'connection' };

  if (error.statusCode === 401) return { kind: 'credentials' };

  if (error.statusCode === 429) return { kind: 'rateLimited', retryAfterMs: error.retryAfterMs };

  if (error.statusCode >= 500) return { kind: 'server' };

  return { kind: 'refused', message: getErrorMessage(error), code: error.code };
};

// The fields whose sent values the failure is about: it stops being true once one of them changes.
export const getFailureFields = (failure: SignInFailure): SignInField[] => {
  switch (failure.kind) {
    case 'credentials':
      return ['email', 'password'];
    case 'refused':
      // The backend checks verification only after the password matched, so only another account changes it.
      return failure.code === ApiErrorCode.EMAIL_NOT_VERIFIED ? ['email'] : ['email', 'password'];
    default:
      return [];
  }
};
