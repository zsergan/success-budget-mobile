import { createSlice } from '@reduxjs/toolkit';

import initialState from './initialState';
import { checkAuth, loginMe, logoutMe } from './thunks';

const login = (state: typeof initialState, action: string) => {
  state.isSignedIn = true;
  state.isLoading = false;
  state.userToken = action;
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
    builder.addCase(loginMe.fulfilled, (state, action) => login(state, action.payload.accessToken));

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
