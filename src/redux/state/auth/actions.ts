import { createAction } from '@reduxjs/toolkit';

// Sign Up was left: a registration still on its way no longer decides which address gets verified.
export const registrationAbandoned = createAction('auth/registrationAbandoned');
