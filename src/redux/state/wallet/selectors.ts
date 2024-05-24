import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@redux/Store';

const baseSelect = (state: RootState) => state.wallet;

export const selectWallet = createSelector(baseSelect, (state) => ({ ...state }));
