import { createSlice } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import { attemptFailed, attemptSettled, attemptStarted, stageReached } from './actions';
import type { LaunchState } from './initialState';
import initialState from './initialState';

const isCurrent = (state: LaunchState, attempt: number) => state.attempt === attempt && state.phase === 'running';

const launchSlice = createSlice({
  name: 'launch',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(attemptStarted, (_, action) => ({
      ...initialState,
      attempt: action.payload.attempt,
      startedAt: action.payload.startedAt,
    }));

    builder.addCase(stageReached, (state, action) => {
      if (isCurrent(state, action.payload.attempt)) state.stage = action.payload.stage;
    });

    builder.addCase(attemptFailed, (state, action) => {
      if (!isCurrent(state, action.payload.attempt)) return;

      state.phase = 'failed';
      state.failure = action.payload.failure;
      state.retryAt = action.payload.retryAt ?? null;
    });

    builder.addCase(attemptSettled, (state, action) => {
      if (isCurrent(state, action.payload.attempt)) state.phase = action.payload.phase;
    });

    // Ends whatever attempt is running: nothing it still reports belongs to the next user.
    builder.addCase(logoutMe.fulfilled, (state) => ({ ...initialState, attempt: state.attempt + 1, phase: 'welcome' }));
  },
});

export default launchSlice.reducer;
