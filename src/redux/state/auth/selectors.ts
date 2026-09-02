import type { RootState } from '@redux/Store';

export const selectAuth = (state: RootState) => state.auth;
