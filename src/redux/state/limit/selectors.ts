import type { RootState } from '@redux/Store';

export const selectLimit = (state: RootState) => state.limit;
