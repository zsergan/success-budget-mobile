import type { RootState } from '@redux/Store';

// The backend's address: trimmed and lower-cased; any other difference, an accent included, is another address.
export const isSameEmail = (a: string | null, b: string | null) =>
  a !== null && b !== null && a.trim().toLowerCase() === b.trim().toLowerCase();

export const selectPasswordReset = (state: RootState) => state.passwordReset;

export const isAuthorizationUsable = (authorization: { expiresAt: number } | null, now = Date.now()) =>
  authorization !== null && now < authorization.expiresAt;
