import { createSlice, isPending, isRejected } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { addLimit, editLimit, fetchLimits } from './thunks';

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

    builder.addMatcher(isPending(fetchLimits, addLimit, editLimit), (state) => {
      state.error = undefined;
    });

    builder.addMatcher(isRejected(fetchLimits, addLimit, editLimit), (state, action) => {
      state.error = action.payload;
    });
  },
});

export default limitSlice.reducer;
