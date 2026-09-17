import { createSlice, isPending, isRejected } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { addSpace, fetchSpaces, removeSpace, setCurrentSpaceId } from './thunks';

const spaceSlice = createSlice({
  name: 'space',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    builder.addCase(setCurrentSpaceId, (state, action) => {
      state.currentSpaceId = action.payload;
    });

    builder.addCase(fetchSpaces.fulfilled, (state, action) => {
      state.spaces = action.payload.spaces;
      state.currentSpaceId = action.payload.currentSpaceId;
      state.isLoading = false;
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
