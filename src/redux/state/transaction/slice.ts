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

    builder.addCase(fetchTransactions.pending, (state, action) => {
      state.isLoading = true;
      state.requestId = action.meta.requestId;
    });

    builder.addCase(fetchTransactions.rejected, (state, action) => {
      if (action.meta.requestId !== state.requestId) return;

      state.isLoading = false;
    });

    builder.addCase(fetchTransactions.fulfilled, (state, action) => {
      if (action.meta.requestId !== state.requestId) return;

      state.transactions = action.payload;
      state.isLoading = false;
      state.hasLoaded = true;
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

    builder.addCase(fetchLatestTransaction.pending, (state, action) => {
      state.isLoadingLatest = true;
      state.latestRequestId = action.meta.requestId;
      // Reset to "not fetched yet" so a stale value from the previous space
      // can't drive an empty-state decision while this fetch is in flight.
      state.latest = undefined;
    });

    builder.addCase(fetchLatestTransaction.rejected, (state, action) => {
      if (action.meta.requestId !== state.latestRequestId) return;

      // A failed lookup isn't proof the account has no transactions —
      // leave `latest` as-is rather than guessing.
      state.isLoadingLatest = false;
    });

    builder.addCase(fetchLatestTransaction.fulfilled, (state, action) => {
      if (action.meta.requestId !== state.latestRequestId) return;

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
