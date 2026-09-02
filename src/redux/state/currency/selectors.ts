import type { RootState } from '@redux/Store';

export const selectCurrency = (state: RootState) => state.currency;
