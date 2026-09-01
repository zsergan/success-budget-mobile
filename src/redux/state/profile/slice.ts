import { createSlice } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { fetchProfile } from './thunks';

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    builder.addCase(fetchProfile.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(fetchProfile.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.id = action.payload.id;
      state.email = action.payload.email;
      state.name = action.payload.name;
      state.baseCurrency = action.payload.baseCurrency;
      state.isLoading = false;
    });
  },
});

export default profileSlice.reducer;
