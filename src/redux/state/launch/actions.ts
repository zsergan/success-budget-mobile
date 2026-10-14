import { createAction } from '@reduxjs/toolkit';

import type { LaunchFailure, LaunchStage } from './initialState';

export const attemptStarted = createAction<{ attempt: number; startedAt: number }>('launch/attemptStarted');

export const stageReached = createAction<{ attempt: number; stage: LaunchStage }>('launch/stageReached');

export const attemptFailed = createAction<{ attempt: number; failure: LaunchFailure; retryAt?: number }>(
  'launch/attemptFailed',
);

export const attemptSettled = createAction<{ attempt: number; phase: 'welcome' | 'ready' }>('launch/attemptSettled');
