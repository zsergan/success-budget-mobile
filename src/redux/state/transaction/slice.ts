import { createSlice } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import { spaceContextChanged } from '../space/thunks';
import { transactionsInvalidated } from './actions';
import initialState from './initialState';
import { addTransaction, fetchLatestTransaction, fetchTransactions, fetchTransactionsInRange } from './thunks';

const rangeKeyOf = (arg: { from: Date; to: Date }) =>
  `${new Date(arg.from).toISOString()}|${new Date(arg.to).toISOString()}`;

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    // Drops recent/range/latest together and forgets every in-flight
    // request id -- a stale response from the previous space can no longer
    // match any of the three once this fires.
    builder.addCase(spaceContextChanged, (state, action) => ({
      ...initialState,
      hasLoaded: state.hasLoaded,
      isLoading: true,
      contextKey: action.payload.contextKey,
    }));

    builder.addCase(fetchTransactions.pending, (state, action) => {
      state.isLoading = true;
      state.error = undefined;
      state.requestId = action.meta.requestId;
    });

    builder.addCase(fetchTransactions.rejected, (state, action) => {
      if (action.meta.requestId !== state.requestId) return;

      state.isLoading = false;
      state.error = action.payload;
    });

    builder.addCase(fetchTransactions.fulfilled, (state, action) => {
      if (action.meta.requestId !== state.requestId) return;

      state.transactions = action.payload;
      state.isLoading = false;
      state.hasLoaded = true;
    });

    builder.addCase(fetchTransactionsInRange.pending, (state, action) => {
      const key = rangeKeyOf(action.meta.arg);

      // A genuinely new period -- don't keep showing the previous one's
      // rows/totals while this loads. A background refresh of the same
      // period (key unchanged) keeps its rows visible while it reloads.
      if (key !== state.rangeQueryKey) {
        state.rangeTransactions = [];
      }

      state.isLoadingRange = true;
      state.rangeError = undefined;
      state.rangeRequestId = action.meta.requestId;
    });

    builder.addCase(fetchTransactionsInRange.rejected, (state, action) => {
      if (action.meta.requestId !== state.rangeRequestId) return;

      state.isLoadingRange = false;
      state.rangeError = action.payload;
    });

    builder.addCase(fetchTransactionsInRange.fulfilled, (state, action) => {
      if (action.meta.requestId !== state.rangeRequestId) return;

      state.rangeTransactions = action.payload;
      state.rangeQueryKey = rangeKeyOf(action.meta.arg);
      state.isLoadingRange = false;
      state.rangeError = undefined;
    });

    builder.addCase(fetchLatestTransaction.pending, (state, action) => {
      state.isLoadingLatest = true;
      state.latestError = undefined;
      state.latestRequestId = action.meta.requestId;
      // Reset to "not fetched yet" so a stale value from the previous space
      // can't drive an empty-state decision while this fetch is in flight.
      state.latest = undefined;
    });

    builder.addCase(fetchLatestTransaction.rejected, (state, action) => {
      if (action.meta.requestId !== state.latestRequestId) return;

      // A failed lookup isn't proof the account has no transactions —
      // leave `latest` as-is rather than guessing; the error is what tells
      // the view apart from "still loading".
      state.isLoadingLatest = false;
      state.latestError = action.payload;
    });

    builder.addCase(fetchLatestTransaction.fulfilled, (state, action) => {
      if (action.meta.requestId !== state.latestRequestId) return;

      state.latest = action.payload;
      state.isLoadingLatest = false;
      state.latestError = undefined;
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

    builder.addCase(transactionsInvalidated, (state, action) => {
      if (action.payload.contextKey !== state.contextKey) return;

      state.dataRevision += 1;
    });
  },
});

export default transactionSlice.reducer;
