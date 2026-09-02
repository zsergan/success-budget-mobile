import { createSlice, isPending, isRejected } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { addTransaction, fetchTransactions } from './thunks';

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

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

    builder.addMatcher(isPending(fetchTransactions, addTransaction), (state) => {
      state.error = undefined;
    });

    builder.addMatcher(isRejected(fetchTransactions, addTransaction), (state, action) => {
      state.error = action.payload;
    });
  },
});

export default transactionSlice.reducer;
