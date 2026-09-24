import { createSlice } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { spaceSelected } from './thunks';

const spaceSlice = createSlice({
  name: 'space',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    builder.addCase(spaceSelected, (state, action) => {
      state.currentSpaceId = action.payload.spaceId;
      state.selectedAt = action.payload.selectedAt;
    });
  },
});

export default spaceSlice.reducer;
