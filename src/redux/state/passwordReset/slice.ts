import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { ApiErrorCode } from '@api/dto';
import type { ErrorResponse } from '@api/dto';
import { isApiError } from '@shared/utils/error';
import { passwordResetApi } from './api';
import type { ChallengeEnd, ChallengeState } from './initialState';
import initialState, { CODE_LIFETIME_MS, WRONG_CODES_PER_CHALLENGE } from './initialState';
import { isSameEmail } from './selectors';

const { requestPasswordReset, verifyPasswordReset, completePasswordReset } = passwordResetApi.endpoints;

const isChallengeSurelyExpired = (challenge: ChallengeState, now = Date.now()) =>
  now >= challenge.since + CODE_LIFETIME_MS;

const isChallengePending = (challenge: ChallengeState | null, now: number): challenge is ChallengeState =>
  challenge !== null && challenge.end === null && !isChallengeSurelyExpired(challenge, now);

// Expiry is the server's first check, so a challenge surely past it ended that way whatever else happened.
const endOf = (challenge: ChallengeState, now: number): ChallengeEnd => {
  if (isChallengeSurelyExpired(challenge, now)) return 'expired';

  return challenge.isKnown && challenge.wrongCodes >= WRONG_CODES_PER_CHALLENGE - 1 ? 'attempts' : 'unknown';
};

// A 400 or 429 is the server's own answer; anything else may have reached it and changed the challenge.
const isAnswered = (error: unknown) => isApiError(error, 400) || isApiError(error, 429);

const passwordResetSlice = createSlice({
  name: 'passwordReset',
  initialState,
  reducers: {
    passwordResetEnded: () => initialState,
    // A different address has no code, cooldown or authorization of its own yet.
    passwordResetEmailEdited: (state, action: PayloadAction<string>) =>
      isSameEmail(state.email, action.payload) ? state : initialState,
    resetAuthorizationDiscarded: (state) => {
      state.authorization = null;
    },
  },
  extraReducers: (builder) => {
    // A resend keeps a pending challenge's expiry and wrong codes; otherwise an accepted request starts a new one.
    // After an unanswered check either may have happened, so neither is assumed. Any request ends the authorization.
    builder.addMatcher(requestPasswordReset.matchFulfilled, (state, action) => {
      const now = Date.now();
      const { email } = action.meta.arg.originalArgs;
      const pending =
        isSameEmail(state.email, email) && isChallengePending(state.challenge, now) ? state.challenge : null;

      return {
        email,
        resendAvailableAt: now + action.payload.resend_after_seconds * 1000,
        challenge: pending?.isKnown ? pending : { since: now, wrongCodes: 0, end: null, isKnown: !pending },
        authorization: null,
      };
    });

    builder.addMatcher(requestPasswordReset.matchRejected, (state, action) => {
      const error = action.payload as ErrorResponse | undefined;

      if (error?.statusCode !== 429 || error.isStale || error.retryAfterMs === undefined) return;
      if (!isSameEmail(state.email, action.meta.arg.originalArgs.email)) return;

      state.resendAvailableAt = Date.now() + error.retryAfterMs;
    });

    builder.addMatcher(verifyPasswordReset.matchFulfilled, (state, action) => {
      if (!isSameEmail(state.email, action.meta.arg.originalArgs.email)) return;

      state.authorization = {
        token: action.payload.reset_token,
        expiresAt: Date.now() + action.payload.expires_in_seconds * 1000,
      };

      if (state.challenge) state.challenge.end = 'accepted';
    });

    builder.addMatcher(verifyPasswordReset.matchRejected, (state, action) => {
      const { challenge } = state;

      if (!challenge || !isSameEmail(state.email, action.meta.arg.originalArgs.email)) return;

      if (!isAnswered(action.payload)) challenge.isKnown = false;

      if (isApiError(action.payload, 400, ApiErrorCode.PASSWORD_RESET_CODE_INVALID)) {
        challenge.wrongCodes += 1;
      }

      // The fifth wrong code ends the challenge and the authorization issued for it.
      if (isApiError(action.payload, 400, ApiErrorCode.PASSWORD_RESET_CODE_UNUSABLE)) {
        challenge.end = endOf(challenge, Date.now());
        state.authorization = null;
      }
    });

    builder.addMatcher(completePasswordReset.matchFulfilled, (state) => {
      state.authorization = null;
    });

    builder.addMatcher(completePasswordReset.matchRejected, (state, action) => {
      if (isApiError(action.payload, 400, ApiErrorCode.PASSWORD_RESET_AUTHORIZATION_INVALID)) {
        state.authorization = null;
      }
    });
  },
});

export const { passwordResetEnded, passwordResetEmailEdited, resetAuthorizationDiscarded } = passwordResetSlice.actions;

export default passwordResetSlice.reducer;
