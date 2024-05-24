import { createSlice } from '@reduxjs/toolkit';

import initialState from './initialState';
import { fetchWallets } from './thunks';

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchWallets.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(fetchWallets.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(fetchWallets.fulfilled, (state, action) => {
      state.wallets = action.payload;
      state.isLoading = false;
    });
  },
});

export default walletSlice.reducer;
