import { createSlice, isPending, isRejected } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { addSpace, fetchSpaces, removeSpace, spaceContextChanged } from './thunks';

const spaceSlice = createSlice({
  name: 'space',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // contextKey must never repeat, including across a logout/login cycle
    // (a request from the ended session must not be able to match a fresh
    // one) -- keep counting forward rather than resetting to 0.
    builder.addCase(logoutMe.fulfilled, (state) => ({ ...initialState, contextKey: state.contextKey + 1 }));

    builder.addCase(spaceContextChanged, (state, action) => {
      state.currentSpaceId = action.payload.spaceId;
      state.contextKey = action.payload.contextKey;
    });

    builder.addCase(fetchSpaces.fulfilled, (state, action) => {
      if (action.meta.requestId !== state.requestId) return;

      state.spaces = action.payload;
      state.isLoading = false;
    });

    builder.addCase(fetchSpaces.pending, (state, action) => {
      state.requestId = action.meta.requestId;
    });

    builder.addMatcher(isPending(fetchSpaces, addSpace, removeSpace), (state) => {
      state.isLoading = true;
      state.error = undefined;
    });

    builder.addMatcher(isRejected(fetchSpaces, addSpace, removeSpace), (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });
  },
});

export default spaceSlice.reducer;
