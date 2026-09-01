import { createSlice } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { fetchLimits } from './thunks';

const limitSlice = createSlice({
  name: 'limit',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    builder.addCase(fetchLimits.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(fetchLimits.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(fetchLimits.fulfilled, (state, action) => {
      state.limits = action.payload.limits;
      state.overall = action.payload.overall;
      state.isLoading = false;
    });
  },
});

export default limitSlice.reducer;
