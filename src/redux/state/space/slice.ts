import { createSlice } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { fetchSpaces } from './thunks';

const spaceSlice = createSlice({
  name: 'space',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    builder.addCase(fetchSpaces.pending, (state) => {
      state.isLoading = true;
      state.error = undefined;
    });

    builder.addCase(fetchSpaces.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    builder.addCase(fetchSpaces.fulfilled, (state, action) => {
      state.spaces = action.payload.spaces;
      state.currentSpaceId = action.payload.currentSpaceId;
      state.isLoading = false;
    });
  },
});

export default spaceSlice.reducer;
