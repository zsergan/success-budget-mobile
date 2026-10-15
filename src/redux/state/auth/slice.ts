import { createSlice, isRejected } from '@reduxjs/toolkit';

import { isApiError } from '@shared/utils/error';

import { attemptFailed, attemptStarted } from '../launch/actions';
import initialState from './initialState';
import { readStoredSession, registerMe, loginMe, logoutMe, verifyEmailMe } from './thunks';

const login = (state: typeof initialState, action: string) => {
  state.isSignedIn = true;
  // Signing in or out settles the stored session: whatever the device held no longer matters.
  state.storedSession = 'read';
  state.storedSessionRead = null;
  state.userToken = action;
  state.userEmail = null;
  state.error = undefined;
};

const logout = (state: typeof initialState) => {
  state.isSignedIn = false;
  state.storedSession = 'read';
  state.storedSessionRead = null;
  state.userToken = null;
  state.sessionKey += 1;
};

const isCurrentRead = (state: typeof initialState, requestId: string) =>
  state.storedSessionRead?.requestId === requestId;

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(registerMe.fulfilled, (state, action) => {
      state.userEmail = action.payload.email;
      state.error = undefined;
    });

    builder.addCase(verifyEmailMe.fulfilled, (state, action) => login(state, action.payload));

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

    builder.addMatcher(isRejected(registerMe, verifyEmailMe, loginMe), (state, action) => {
      // The verify screen sends an already verified account to sign in instead of showing this as an error.
      const isAlreadyVerified = verifyEmailMe.rejected.match(action) && isApiError(action.payload, 409);

      state.error = isAlreadyVerified ? undefined : action.payload;
    });
  },
});

export default authSlice.reducer;
