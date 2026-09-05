import { createSlice, isPending, isRejected } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { addTransaction, fetchLatestTransaction, fetchTransactions, fetchTransactionsInRange } from './thunks';

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

    builder.addCase(fetchTransactionsInRange.pending, (state, action) => {
      state.isLoadingRange = true;
      state.rangeRequestId = action.meta.requestId;
    });

    builder.addCase(fetchTransactionsInRange.rejected, (state, action) => {
      if (action.meta.requestId !== state.rangeRequestId) return;

      state.isLoadingRange = false;
    });

    builder.addCase(fetchTransactionsInRange.fulfilled, (state, action) => {
      if (action.meta.requestId !== state.rangeRequestId) return;

      state.rangeTransactions = action.payload;
      state.isLoadingRange = false;
    });

    builder.addCase(fetchLatestTransaction.pending, (state) => {
      state.isLoadingLatest = true;
    });

    builder.addCase(fetchLatestTransaction.rejected, (state) => {
      // A failed lookup isn't proof the account has no transactions —
      // leave `latest` as-is rather than guessing.
      state.isLoadingLatest = false;
    });

    builder.addCase(fetchLatestTransaction.fulfilled, (state, action) => {
      state.latest = action.payload;
      state.isLoadingLatest = false;
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

    builder.addMatcher(
      isPending(fetchTransactions, fetchTransactionsInRange, fetchLatestTransaction, addTransaction),
      (state) => {
        state.error = undefined;
      },
    );

    builder.addMatcher(
      isRejected(fetchTransactions, fetchTransactionsInRange, fetchLatestTransaction, addTransaction),
      (state, action) => {
        state.error = action.payload;
      },
    );
  },
});

export default transactionSlice.reducer;
