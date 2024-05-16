import { createSlice } from '@reduxjs/toolkit';

import initialState from './initialState';
import { addTransaction, fetchTransactions } from './thunks';

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchTransactions.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(fetchTransactions.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(fetchTransactions.fulfilled, (state, action) => {
      state.transactions = action.payload;
      state.isLoading = false;
    });

    builder.addCase(addTransaction.pending, (state) => {
      state.isCreating = true;
    });

    builder.addCase(addTransaction.rejected, (state) => {
      state.isCreating = false;
    });

    builder.addCase(addTransaction.fulfilled, (state) => {
      state.isCreating = false;
    });
  },
});

export default transactionSlice.reducer;
