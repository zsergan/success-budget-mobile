import { createSlice, isPending, isRejected } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import { spaceContextChanged } from '../space/thunks';
import initialState from './initialState';
import { addLimit, editLimit, fetchLimits, removeLimit } from './thunks';

const limitSlice = createSlice({
  name: 'limit',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    builder.addCase(spaceContextChanged, (state) => ({ ...initialState, hasLoaded: state.hasLoaded, isLoading: true }));

    builder.addCase(fetchLimits.pending, (state, action) => {
      state.isLoading = true;
      state.error = undefined;
      state.requestId = action.meta.requestId;
    });

    // Guarded like fulfilled below -- an older fetchLimits rejecting after
    // a newer one has already taken over must not overwrite `error` with a
    // stale failure.
    builder.addCase(fetchLimits.rejected, (state, action) => {
      if (action.meta.requestId !== state.requestId) return;

      state.isLoading = false;
      state.error = action.payload;
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

    builder.addMatcher(isPending(addLimit, editLimit, removeLimit), (state) => {
      state.error = undefined;
    });

    builder.addMatcher(isRejected(addLimit, editLimit, removeLimit), (state, action) => {
      state.error = action.payload;
    });
  },
});

export default limitSlice.reducer;
