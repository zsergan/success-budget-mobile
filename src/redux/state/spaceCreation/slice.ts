import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { CreateSpaceRequest } from '@api/dto';
import { logoutMe } from '../auth/thunks';

// `sending`: stored before it went out, so one found after a restart got no answer we know of.
// `unknown`: no answer, or a server failure; the space may exist. `expired`: unknown past the key's lifetime, so only
// the user sends it again.
export type SpaceCreationStatus = 'sending' | 'unknown' | 'expired';

// The exact body sent, with its key and when it first went out (which starts the key's lifetime on the server).
export interface SpaceCreationAttempt {
  idempotencyKey: string;
  request: CreateSpaceRequest;
  firstSentAt: number;
  status: SpaceCreationStatus;
}

interface SpaceCreationState {
  // Whose attempt this is, once read from storage; another user's stays there until they sign in.
  userId: number | null;
  attempt: SpaceCreationAttempt | null;
}

const initialState: SpaceCreationState = { userId: null, attempt: null };

const spaceCreationSlice = createSlice({
  name: 'spaceCreation',
  initialState,
  reducers: {
    // Storage is read once per session; what this session recorded since is newer.
    attemptRestored: (state, { payload }: PayloadAction<{ userId: number; attempt: SpaceCreationAttempt | null }>) => {
      if (state.userId === payload.userId) return;

      state.userId = payload.userId;
      state.attempt = payload.attempt;
    },
    attemptRecorded: (state, { payload }: PayloadAction<{ userId: number; attempt: SpaceCreationAttempt }>) => {
      state.userId = payload.userId;
      state.attempt = payload.attempt;
    },
    // Null once its outcome is known: created, or refused before it could have created anything.
    attemptSettled: (
      state,
      { payload }: PayloadAction<{ key: string; status: Exclude<SpaceCreationStatus, 'sending'> | null }>,
    ) => {
      if (state.attempt?.idempotencyKey !== payload.key) return;

      if (payload.status === null) state.attempt = null;
      else state.attempt.status = payload.status;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);
  },
});

export const { attemptRestored, attemptRecorded, attemptSettled } = spaceCreationSlice.actions;

export default spaceCreationSlice.reducer;
