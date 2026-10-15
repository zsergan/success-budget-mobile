import type { RootState } from '@redux/Store';

// The backend matches addresses case-insensitively.
export const isSameEmail = (a: string | null, b: string | null) =>
  a !== null && b !== null && a.trim().toLowerCase() === b.trim().toLowerCase();

export const selectPasswordReset = (state: RootState) => state.passwordReset;

export const selectResetAuthorization = (state: RootState) => state.passwordReset.authorization;

export const isAuthorizationUsable = (authorization: { expiresAt: number } | null, now = Date.now()) =>
  authorization !== null && now < authorization.expiresAt;
