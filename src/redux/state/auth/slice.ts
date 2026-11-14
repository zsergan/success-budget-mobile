import { createSlice } from '@reduxjs/toolkit';

import { attemptFailed, attemptStarted } from '../launch/actions';
import { registrationAbandoned, verificationAbandoned, verificationCommitStarted } from './actions';
import initialState from './initialState';
import { readStoredSession, registerMe, loginMe, logoutMe, verifyEmailMe } from './thunks';

const login = (state: typeof initialState, action: string) => {
  state.isSignedIn = true;
  // Signing in or out settles the stored session: whatever the device held no longer matters.
  state.storedSession = 'read';
  state.storedSessionRead = null;
  state.userToken = action;
  state.userEmail = null;
  state.registrationRequestId = null;
  state.verification = null;
};

const logout = (state: typeof initialState) => {
  state.isSignedIn = false;
  state.storedSession = 'read';
  state.storedSessionRead = null;
  state.userToken = null;
  state.registrationRequestId = null;
  state.verification = null;
  state.sessionKey += 1;
};

const isCurrentRead = (state: typeof initialState, requestId: string) =>
  state.storedSessionRead?.requestId === requestId;

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(registerMe.pending, (state, action) => {
      state.registrationRequestId = action.meta.requestId;
    });

    builder.addCase(registerMe.fulfilled, (state, action) => {
      if (state.registrationRequestId !== action.meta.requestId) return;

      state.registrationRequestId = null;
      state.userEmail = action.payload.email;
    });

    builder.addCase(registerMe.rejected, (state, action) => {
      if (state.registrationRequestId === action.meta.requestId) state.registrationRequestId = null;
    });

    builder.addCase(registrationAbandoned, (state) => {
      state.registrationRequestId = null;
    });

    builder.addCase(verifyEmailMe.pending, (state, action) => {
      if (state.verification?.isCommitting) return;

      state.verification = { requestId: action.meta.requestId, isCommitting: false };
    });

    builder.addCase(verificationAbandoned, (state) => {
      if (!state.verification?.isCommitting) state.verification = null;
    });

    builder.addCase(verificationCommitStarted, (state, action) => {
      if (state.verification?.requestId === action.payload) state.verification.isCommitting = true;
    });

    builder.addCase(verifyEmailMe.fulfilled, (state, action) => {
      if (state.verification?.requestId === action.meta.requestId) login(state, action.payload);
    });

    builder.addCase(verifyEmailMe.rejected, (state, action) => {
      if (state.verification?.requestId === action.meta.requestId) state.verification = null;
    });

    builder.addCase(loginMe.fulfilled, (state, action) => login(state, action.payload));

    builder.addCase(logoutMe.fulfilled, (state) => logout(state));

    builder.addCase(readStoredSession.pending, (state, action) => {
      state.storedSession = 'reading';
      state.storedSessionRead = { requestId: action.meta.requestId, attempt: action.meta.arg.attempt };
    });

    builder.addCase(readStoredSession.rejected, (state, action) => {
      if (!isCurrentRead(state, action.meta.requestId)) return;

      state.storedSession = 'failed';
      state.storedSessionRead = null;
    });

    builder.addCase(readStoredSession.fulfilled, (state, action) => {
      if (!isCurrentRead(state, action.meta.requestId)) return;

      if (action.payload) {
        login(state, action.payload);
      } else {
        logout(state);
      }
    });

    // The native read cannot be stopped: once its attempt fails or is replaced, the session counts as unread again.
    builder.addCase(attemptStarted, (state) => {
      if (state.storedSessionRead === null) return;

      state.storedSession = 'failed';
      state.storedSessionRead = null;
    });

    builder.addCase(attemptFailed, (state, action) => {
      if (state.storedSessionRead?.attempt !== action.payload.attempt) return;

      state.storedSession = 'failed';
      state.storedSessionRead = null;
    });
  },
});

export default authSlice.reducer;
