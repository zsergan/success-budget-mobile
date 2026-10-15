// The contract's code lifetime, counted from the request that started the challenge.
export const CODE_LIFETIME_MS = 30 * 60 * 1000;
// The fifth wrong code of a challenge ends it.
export const WRONG_CODES_PER_CHALLENGE = 5;

// Why a code stopped working, as far as this device can tell: the server answers all three the same way.
export type ChallengeEnd = 'expired' | 'attempts' | 'unknown';

// What this device saw of the server's challenge for `email`.
export interface ChallengeState {
  // When this device first saw it accepted: never earlier than its real start, so +30 min is surely past expiry.
  since: number;
  wrongCodes: number;
  // Accepted, used up or expired: the next accepted request starts a new challenge.
  end: ChallengeEnd | 'accepted' | null;
}

// Kept apart from auth's registration address: recovery never signs in and never touches sign-up's verification.
export interface PasswordResetState {
  // The address the latest accepted request sent a code to; the cooldown and authorization below belong to it.
  email: string | null;
  // When another code can be requested for `email`, from the server's own answer.
  resendAvailableAt: number | null;
  challenge: ChallengeState | null;
  // In memory only, never persisted, logged or put in navigation params.
  authorization: { token: string; expiresAt: number } | null;
}

const initialState: PasswordResetState = {
  email: null,
  resendAvailableAt: null,
  challenge: null,
  authorization: null,
};

export default initialState;
