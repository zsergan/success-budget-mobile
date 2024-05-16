import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@redux/Store';

const baseSelect = (state: RootState) => state.profile;

export const selectProfile = createSelector(baseSelect, (state) => ({ ...state }));
