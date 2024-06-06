import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@redux/Store';

const baseSelect = (state: RootState) => state.limit;

export const selectLimit = createSelector(baseSelect, (state) => ({ ...state }));
