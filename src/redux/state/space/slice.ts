import { createSlice } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { spaceContextChanged } from './thunks';

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
      state.selectedAt = action.payload.selectedAt;
    });
  },
});

export default spaceSlice.reducer;
