import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { ApiErrorCode } from '@api/dto';
import type { ErrorResponse } from '@api/dto';
import { isApiError } from '@shared/utils/error';
import { passwordResetApi } from './api';
import initialState from './initialState';
import { isSameEmail } from './selectors';

const { requestPasswordReset, verifyPasswordReset, completePasswordReset } = passwordResetApi.endpoints;

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
    // An accepted request ends the address's previous challenge, and with it any authorization.
    builder.addMatcher(requestPasswordReset.matchFulfilled, (_, action) => ({
      email: action.meta.arg.originalArgs.email,
      resendAvailableAt: Date.now() + action.payload.resend_after_seconds * 1000,
      authorization: null,
    }));

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
    });

    // The fifth wrong code ends the challenge and the authorization issued for it.
    builder.addMatcher(verifyPasswordReset.matchRejected, (state, action) => {
      if (isApiError(action.payload, 400, ApiErrorCode.PASSWORD_RESET_CODE_UNUSABLE)) state.authorization = null;
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
