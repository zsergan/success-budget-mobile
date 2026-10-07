import { createSlice } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { spaceDataRefreshed, spaceSelected } from './thunks';

const spaceSlice = createSlice({
  name: 'space',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    builder.addCase(spaceSelected, (state, action) => {
      state.currentSpaceId = action.payload.spaceId;
      state.selectedAt = action.payload.selectedAt;
      state.refreshedAt = action.payload.selectedAt;
    });

    builder.addCase(spaceDataRefreshed, (state, action) => {
      state.refreshedAt = action.payload;
    });
  },
});

export default spaceSlice.reducer;
