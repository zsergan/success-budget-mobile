import { spaceContextChanged } from '../space/thunks';
import initialState from './initialState';
import transactionReducer from './slice';
import { addTransaction, fetchLatestTransaction, fetchTransactionsInRange } from './thunks';

describe('transaction slice', () => {
  it('returns the initial state by default, including dataRevision at 0', () => {
    expect(transactionReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('bumps dataRevision on every successful addTransaction, regardless of which screen triggered it', () => {
    const afterFirst = transactionReducer(initialState, addTransaction.fulfilled({} as never, 'req-1', {} as never));

    expect(afterFirst.dataRevision).toBe(1);

    const afterSecond = transactionReducer(afterFirst, addTransaction.fulfilled({} as never, 'req-2', {} as never));

    expect(afterSecond.dataRevision).toBe(2);
  });

  it('does not bump dataRevision on a rejected or cancelled addTransaction', () => {
    const state = transactionReducer(
      initialState,
      addTransaction.rejected(new Error('failed'), 'req-1', {} as never, undefined),
    );

    expect(state.dataRevision).toBe(0);
  });

  it('drops recent/range/latest and forgets in-flight requests on a space context change', () => {
    const withRangeLoaded = transactionReducer(initialState, fetchTransactionsInRange.pending('req-1', {} as never));
    const withRange = transactionReducer(
      withRangeLoaded,
      fetchTransactionsInRange.fulfilled([{ id: 'tx-1' } as never], 'req-1', {} as never),
    );
    const withLatest = transactionReducer(
      withRange,
      fetchLatestTransaction.fulfilled({ id: 'tx-1' } as never, 'req-2', undefined),
    );

    expect(withLatest.rangeTransactions).toHaveLength(1);
    expect(withLatest.latest).not.toBeNull();

    const reset = transactionReducer(withLatest, spaceContextChanged({ spaceId: 2, contextKey: 1 }));

    expect(reset.rangeTransactions).toEqual([]);
    expect(reset.latest).toBeUndefined();
    expect(reset.rangeRequestId).toBeUndefined();

    // A late response for the old space's request can no longer match.
    const afterStaleResponse = transactionReducer(
      reset,
      fetchTransactionsInRange.fulfilled([{ id: 'tx-1' } as never], 'req-1', {} as never),
    );

    expect(afterStaleResponse.rangeTransactions).toEqual([]);
  });
});
