import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@redux/Store';

const baseSelect = (state: RootState) => state.auth;

export const selectAuth = createSelector(baseSelect, (state) => ({ ...state }));
