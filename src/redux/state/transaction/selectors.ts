import type { RootState } from '@redux/Store';

export const selectTransaction = (state: RootState) => state.transaction;
