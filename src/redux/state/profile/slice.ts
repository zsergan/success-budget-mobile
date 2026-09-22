import { createSlice } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { fetchProfile } from './thunks';

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Resets requestId along with everything else -- a fetchProfile that
    // was in flight when logout happened can never match it once it
    // resolves, however late.
    builder.addCase(logoutMe.fulfilled, () => initialState);

    builder.addCase(fetchProfile.pending, (state, action) => {
      state.isLoading = true;
      state.error = undefined;
      state.requestId = action.meta.requestId;
    });

    builder.addCase(fetchProfile.rejected, (state, action) => {
      if (action.meta.requestId !== state.requestId) return;

      state.isLoading = false;
      state.error = action.payload;
    });

    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      if (action.meta.requestId !== state.requestId) return;

      state.id = action.payload.id;
      state.email = action.payload.email;
      state.name = action.payload.name;
      state.isLoading = false;
    });
  },
});

export default profileSlice.reducer;
