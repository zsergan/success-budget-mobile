// Public routes under /users/password-reset; none of them returns an access token.
export interface PasswordResetRequestPayload {
  email: string;
}

// The same for every address: it never tells whether an account exists or an email was sent.
export interface PasswordResetRequestedResponse {
  message: string;
  resend_after_seconds: number;
}

export interface PasswordResetVerifyPayload {
  email: string;
  // Exactly six digits; leading zeros count.
  code: string;
}

export interface PasswordResetAuthorizationResponse {
  reset_token: string;
  expires_in_seconds: number;
}

export interface PasswordResetCompletePayload {
  reset_token: string;
  password: string;
}
