import { createSlice } from '@reduxjs/toolkit';

import type { ErrorResponse } from '@api/dto';
import { INVITE_RATE_LIMIT_COOLDOWN_MS } from '@shared/constants';
import { logoutMe } from '../auth/thunks';
import { memberApi } from './api';
import initialState from './initialState';

const memberSlice = createSlice({
  name: 'member',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    // A successful send is proof the window has actually reset, even if our
    // own countdown hadn't hit zero yet.
    builder.addMatcher(memberApi.endpoints.inviteMember.matchFulfilled, (state) => {
      state.inviteCooldownUntil = null;
    });

    builder.addMatcher(memberApi.endpoints.inviteMember.matchRejected, (state, action) => {
      const error = action.payload as ErrorResponse | undefined;

      // A stale 429 outlived the session that sent it; a future session must not inherit its cooldown.
      if (error?.statusCode !== 429 || error.isStale) return;

      state.inviteCooldownUntil = Date.now() + (error.retryAfterMs ?? INVITE_RATE_LIMIT_COOLDOWN_MS);
    });
  },
});

export default memberSlice.reducer;
