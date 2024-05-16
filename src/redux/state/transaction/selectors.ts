import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@redux/Store';

const baseSelect = (state: RootState) => state.transaction;

export const selectTransaction = createSelector(baseSelect, (state) => ({ ...state }));
