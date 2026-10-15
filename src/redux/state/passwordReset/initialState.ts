// Kept apart from auth's registration address: recovery never signs in and never touches sign-up's verification.
export interface PasswordResetState {
  // The address the latest accepted request sent a code to; the cooldown and authorization below belong to it.
  email: string | null;
  // When another code can be requested for `email`, from the server's own answer.
  resendAvailableAt: number | null;
  // In memory only, never persisted, logged or put in navigation params.
  authorization: { token: string; expiresAt: number } | null;
}

const initialState: PasswordResetState = {
  email: null,
  resendAvailableAt: null,
  authorization: null,
};

export default initialState;
