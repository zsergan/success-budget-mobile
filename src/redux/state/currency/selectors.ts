import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@redux/Store';

const baseSelect = (state: RootState) => state.currency;

export const selectCurrency = createSelector(baseSelect, (state) => ({ ...state }));
