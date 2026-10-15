import type { ErrorResponse } from '@api/dto';
import { getErrorMessage } from '@shared/utils';

export type SignInFailure =
  | { kind: 'credentials' }
  | { kind: 'connection' }
  | { kind: 'server' }
  | { kind: 'rateLimited'; retryAfterMs?: number }
  | { kind: 'refused'; message: string };

// Null for a request canceled because its session ended: nothing went wrong that the user can act on.
export const getSignInFailure = (error: ErrorResponse | undefined): SignInFailure | null => {
  if (!error) return { kind: 'refused', message: getErrorMessage({}) };

  if (error.statusCode === 0) return error.transport === 'canceled' ? null : { kind: 'connection' };

  if (error.statusCode === 401) return { kind: 'credentials' };

  if (error.statusCode === 429) return { kind: 'rateLimited', retryAfterMs: error.retryAfterMs };

  if (error.statusCode >= 500) return { kind: 'server' };

  return { kind: 'refused', message: getErrorMessage(error) };
};
