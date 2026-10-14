import { createSlice, isRejected } from '@reduxjs/toolkit';

import { isApiError } from '@shared/utils/error';

import initialState from './initialState';
import { readStoredSession, registerMe, loginMe, logoutMe, verifyEmailMe } from './thunks';

const login = (state: typeof initialState, action: string) => {
  state.isSignedIn = true;
  state.userToken = action;
  state.userEmail = null;
  state.error = undefined;
};

const logout = (state: typeof initialState) => {
  state.isSignedIn = false;
  state.userToken = null;
  state.sessionKey += 1;
};

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

    builder.addCase(readStoredSession.pending, (state) => {
      state.storedSession = 'reading';
    });

    builder.addCase(readStoredSession.rejected, (state) => {
      state.storedSession = 'failed';
    });

    builder.addCase(readStoredSession.fulfilled, (state, action) => {
      state.storedSession = 'read';

      if (action.payload) {
        login(state, action.payload);
      } else {
        logout(state);
      }
    });

    builder.addMatcher(isRejected(registerMe, verifyEmailMe, loginMe), (state, action) => {
      // The verify screen sends an already verified account to sign in instead of showing this as an error.
      const isAlreadyVerified = verifyEmailMe.rejected.match(action) && isApiError(action.payload, 409);

      state.error = isAlreadyVerified ? undefined : action.payload;
    });
  },
});

export default authSlice.reducer;
