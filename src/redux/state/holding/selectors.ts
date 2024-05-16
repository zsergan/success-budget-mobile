import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@redux/Store';

const baseSelect = (state: RootState) => state.holding;

export const selectHolding = createSelector(baseSelect, (state) => ({ ...state }));
