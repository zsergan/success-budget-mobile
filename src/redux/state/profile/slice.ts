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
      state.error = undefined;
    });

    builder.addCase(fetchProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
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
