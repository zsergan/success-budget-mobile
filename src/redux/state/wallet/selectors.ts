import type { RootState } from '@redux/Store';

export const selectWallet = (state: RootState) => state.wallet;
