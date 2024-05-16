import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@redux/Store';

const baseSelect = (state: RootState) => state.category;

export const selectCategory = createSelector(baseSelect, (state) => ({ ...state }));
