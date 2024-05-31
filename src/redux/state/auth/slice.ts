import { createSlice } from '@reduxjs/toolkit';

import type { ErrorResponse } from '@api/dto';
import initialState from './initialState';
import { checkAuth, registerMe, loginMe, logoutMe, verifyEmailMe } from './thunks';

const login = (state: typeof initialState, action: string) => {
  state.isSignedIn = true;
  state.isLoading = false;
  state.userToken = action;
  state.userEmail = null;
  state.error = undefined;
};

const logout = (state: typeof initialState) => {
  state.isSignedIn = false;
  state.isLoading = false;
  state.userToken = null;
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(registerMe.fulfilled, (state, action) => {
      state.isLoading = false;
      state.userEmail = action.payload.email;
      state.error = undefined;
    });

    builder.addCase(registerMe.rejected, (state, action) => {
      state.error = action.payload as ErrorResponse;
    });

    builder.addCase(verifyEmailMe.fulfilled, (state, action) => login(state, action.payload));

    builder.addCase(verifyEmailMe.rejected, (state, action) => {
      state.error = action.payload as ErrorResponse;
    });

    builder.addCase(loginMe.fulfilled, (state, action) => login(state, action.payload));

    builder.addCase(loginMe.rejected, (state, action) => {
      state.error = action.payload as ErrorResponse;
    });

    builder.addCase(logoutMe.fulfilled, (state) => logout(state));

    builder.addCase(checkAuth.fulfilled, (state, action) => {
      if (action.payload) {
        login(state, action.payload);
      } else {
        logout(state);
      }
    });
  },
});

export default authSlice.reducer;
