import { randomUUID } from 'expo-crypto';

import type { CreateSpaceRequest, ErrorResponse, SpaceSummary } from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import type { AppThunk } from '@redux/Store';
import { IDEMPOTENCY_KEY_LIFETIME_MS } from '@shared/constants';
import { selectProfileId } from '../profile/selectors';
import { spaceApi } from '../space/api';
import type { SpaceCreationAttempt } from './slice';
import { attemptRecorded, attemptRestored, attemptSettled } from './slice';
import { persistSpaceCreation, readSpaceCreation } from './storage';

export const SPACE_NOT_SENT_MESSAGE = 'Could not create the space. Please try again.';
export const SPACE_UNCONFIRMED_MESSAGE =
  "We couldn't confirm the space was created. Try again: it won't be made twice.";
export const SPACE_MAY_EXIST_MESSAGE =
  'Your earlier attempt may already have created this space. Check your spaces, or try again to create it anyway.';

const sameInvites = (a: string[] = [], b: string[] = []) =>
  a.length === b.length && a.every((email, index) => email === b[index]);

// A key is tied to one body: the server refuses the same key with another body.
export const isSameCreateSpaceRequest = (a: CreateSpaceRequest, b: CreateSpaceRequest) =>
  a.name === b.name && a.currency_id === b.currency_id && a.type === b.type && sameInvites(a.invites, b.invites);

const hasOutlivedKey = ({ firstSentAt }: SpaceCreationAttempt) =>
  Date.now() - firstSentAt >= IDEMPOTENCY_KEY_LIFETIME_MS;

const errorOf = (error: unknown) => (error ?? {}) as Partial<ErrorResponse>;

// No answer, or a server failure: the space may or may not have been created.
const isUncertain = (error: unknown) => {
  const { statusCode } = errorOf(error);

  return typeof statusCode !== 'number' || statusCode === 0 || statusCode === 408 || statusCode >= 500;
};

const sessionEnded = (): ErrorResponse => ({
  message: 'The session this request belonged to has ended.',
  path: '/spaces',
  statusCode: 0,
  timestamp: new Date().toISOString(),
  isStale: true,
});

// The server may have forgotten the key, so a resend could make a second space: the user decides, with a fresh list.
const expireAttempt =
  (key: string): AppThunk<Promise<void>> =>
  async (dispatch) => {
    dispatch(attemptSettled({ key, status: 'expired' }));
    dispatch(spaceApi.util.invalidateTags(['Spaces']));
    await dispatch(persistSpaceCreation());
  };

// The user's own creation left unanswered by a lost connection, a logout or a restart; never another user's.
export const restoreSpaceCreation =
  (userId: number): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    if (getState().spaceCreation.userId === userId) return;

    const stored = await readSpaceCreation(userId);
    if (selectProfileId(getState()) !== userId || getState().spaceCreation.userId === userId) return;

    const attempt = stored && { ...stored, status: stored.status === 'sending' ? 'unknown' : stored.status };

    dispatch(attemptRestored({ userId, attempt }));
    if (attempt?.status === 'unknown' && hasOutlivedKey(attempt)) await dispatch(expireAttempt(attempt.idempotencyKey));
  };

// Sends a space creation under a key stored before it goes out. The same body again reuses the key and the body as
// first sent; an unanswered attempt keeps them through a logout or a restart. Nothing is sent when it cannot be
// stored first, and an unanswered one past the key's lifetime waits for the user to send it again.
export const submitSpaceCreation =
  (request: CreateSpaceRequest): AppThunk<Promise<SpaceSummary>> =>
  async (dispatch, getState) => {
    const { sessionKey } = getState().auth;
    const userId = selectProfileId(getState());
    if (userId === undefined) throw new Error(SPACE_NOT_SENT_MESSAGE);

    const isCurrent = () => getState().auth.sessionKey === sessionKey && getState().spaceCreation.userId === userId;

    await dispatch(restoreSpaceCreation(userId));
    if (!isCurrent()) throw sessionEnded();

    const previous = getState().spaceCreation.attempt;
    const reused = previous && isSameCreateSpaceRequest(previous.request, request) ? previous : null;

    if (reused?.status === 'unknown' && hasOutlivedKey(reused)) {
      await dispatch(expireAttempt(reused.idempotencyKey));
      throw new Error(SPACE_MAY_EXIST_MESSAGE);
    }

    // An earlier attempt of this body may have applied, so a refusal now says nothing about it.
    const isRetry = reused !== null && reused.status !== 'expired';
    const attempt: SpaceCreationAttempt = reused
      ? { ...reused, status: 'sending', firstSentAt: isRetry ? reused.firstSentAt : Date.now() }
      : {
          idempotencyKey: randomUUID(),
          request: { ...request, ...(request.invites && { invites: [...request.invites] }) },
          firstSentAt: Date.now(),
          status: 'sending',
        };
    const key = attempt.idempotencyKey;

    dispatch(attemptRecorded({ userId, attempt }));
    const persisted = await dispatch(persistSpaceCreation());
    if (!isCurrent()) throw sessionEnded();
    if (!persisted && !isRetry) {
      dispatch(attemptSettled({ key, status: null }));
      throw new Error(SPACE_NOT_SENT_MESSAGE);
    }

    try {
      const space = await dispatch(
        spaceApi.endpoints.createSpace.initiate({ idempotencyKey: key, data: attempt.request }, { track: false }),
      ).unwrap();

      dispatch(attemptSettled({ key, status: null }));
      await dispatch(persistSpaceCreation());

      return space;
    } catch (error) {
      // After a logout the stored attempt waits for the same user's next session.
      if (errorOf(error).isStale || !isCurrent()) throw error;

      const uncertain = isUncertain(error);
      const keep = uncertain || (isRetry && errorOf(error).code !== ApiErrorCode.IDEMPOTENCY_KEY_REUSED);

      dispatch(attemptSettled({ key, status: keep ? 'unknown' : null }));
      await dispatch(persistSpaceCreation());

      throw uncertain ? new Error(SPACE_UNCONFIRMED_MESSAGE, { cause: error }) : error;
    }
  };
