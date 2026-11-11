import type { ErrorResponse } from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import { getErrorMessage } from '@shared/utils';

// Each kind has its own way out: a new invitation, another account, the space itself, waiting, or trying again.
export type AcceptProblemKind =
  'unavailable' | 'wrongAccount' | 'alreadyMember' | 'full' | 'codeNotFound' | 'offline' | 'rateLimited' | 'failed';

export interface AcceptProblem {
  kind: AcceptProblemKind;
  message: string;
  spaceId?: number;
  retryAfterMs?: number;
}

// Fallback only: the server's limit on these calls is per minute.
const RATE_LIMIT_FALLBACK_MS = 60_000;

export const describeAcceptProblem = (error: unknown): AcceptProblem => {
  const { code, statusCode, spaceId, retryAfterMs, transport } = (error ?? {}) as Partial<ErrorResponse>;

  if (code === ApiErrorCode.SPACE_INVITE_UNUSABLE) {
    return {
      kind: 'unavailable',
      message:
        'This invitation is no longer available: it was revoked or has expired. Ask the space owner for a new one.',
    };
  }
  if (code === ApiErrorCode.SPACE_INVITE_EMAIL_MISMATCH) {
    return {
      kind: 'wrongAccount',
      message: 'This invitation was sent to a different email address. Sign in with that address to join.',
    };
  }
  if (code === ApiErrorCode.SPACE_ALREADY_MEMBER) {
    return { kind: 'alreadyMember', message: 'You’re already a member of this space.', spaceId };
  }
  if (code === ApiErrorCode.SPACE_MEMBER_LIMIT_REACHED) {
    return { kind: 'full', message: 'This space is full. The owner has to remove someone before you can join.' };
  }
  if (statusCode === 404) {
    return {
      kind: 'codeNotFound',
      message:
        'No invitation for your email has this code. Check the code in the email, or ask the owner for a new one.',
    };
  }
  if (statusCode === 429) {
    return {
      kind: 'rateLimited',
      message: 'Too many attempts. Wait a moment, then try again.',
      retryAfterMs: retryAfterMs ?? RATE_LIMIT_FALLBACK_MS,
    };
  }
  if (statusCode === 0 && transport !== 'canceled') {
    return { kind: 'offline', message: 'Couldn’t reach Success Budget. Check your connection, then try again.' };
  }

  return { kind: 'failed', message: getErrorMessage(error) };
};
