import { createSlice, isPending, isRejected } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { addLimit, editLimit, fetchLimits, removeLimit } from './thunks';

const limitSlice = createSlice({
  name: 'limit',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    builder.addCase(fetchLimits.pending, (state, action) => {
      state.isLoading = true;
      state.requestId = action.meta.requestId;
    });

    builder.addCase(fetchLimits.rejected, (state, action) => {
      if (action.meta.requestId !== state.requestId) return;

      state.isLoading = false;
    });

    builder.addCase(fetchLimits.fulfilled, (state, action) => {
      if (action.meta.requestId !== state.requestId) return;

      state.total = action.payload.total;
      state.categoryLimits = action.payload.categoryLimits;
      state.overAllocation = action.payload.overAllocation;
      state.isLoading = false;
      state.hasLoaded = true;
    });

    builder.addCase(removeLimit.pending, (state) => {
      state.isDeleting = true;
    });

    builder.addCase(removeLimit.rejected, (state) => {
      state.isDeleting = false;
    });

    builder.addCase(removeLimit.fulfilled, (state) => {
      state.isDeleting = false;
    });

    builder.addMatcher(isPending(fetchLimits, addLimit, editLimit, removeLimit), (state) => {
      state.error = undefined;
    });

    builder.addMatcher(isRejected(fetchLimits, addLimit, editLimit, removeLimit), (state, action) => {
      state.error = action.payload;
    });
  },
});

export default limitSlice.reducer;
