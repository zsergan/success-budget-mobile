import { createSlice } from '@reduxjs/toolkit';

import initialState from './initialState';
import { fetchHoldings } from './thunks';

const holdingSlice = createSlice({
  name: 'holding',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchHoldings.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(fetchHoldings.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(fetchHoldings.fulfilled, (state, action) => {
      state.holdings = action.payload;
      state.isLoading = false;
    });
  },
});

export default holdingSlice.reducer;
