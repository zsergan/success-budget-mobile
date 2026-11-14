import { createAction } from '@reduxjs/toolkit';

// Sign Up was left: a registration still on its way no longer decides which address gets verified.
export const registrationAbandoned = createAction('auth/registrationAbandoned');

// Verify Email was left: a verification still waiting for its answer no longer signs in.
export const verificationAbandoned = createAction('auth/verificationAbandoned');

// The server accepted the code and the token is about to be saved: from here the session is established whole.
export const verificationCommitStarted = createAction<string>('auth/verificationCommitStarted');
