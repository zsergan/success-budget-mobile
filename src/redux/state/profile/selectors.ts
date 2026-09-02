import type { RootState } from '@redux/Store';

export const selectProfile = (state: RootState) => state.profile;
