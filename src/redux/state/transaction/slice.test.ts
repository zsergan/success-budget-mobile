import { spaceContextChanged } from '../space/thunks';
import { transactionsInvalidated } from './actions';
import initialState from './initialState';
import transactionReducer from './slice';
import { addTransaction, fetchLatestTransaction, fetchTransactionsInRange } from './thunks';

const jan = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };
const feb = { from: new Date('2026-02-01'), to: new Date('2026-02-28') };

describe('transaction slice', () => {
  it('returns the initial state by default, including dataRevision at 0', () => {
    expect(transactionReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('bumps dataRevision on transactionsInvalidated for the current context', () => {
    const afterFirst = transactionReducer(initialState, transactionsInvalidated({ contextKey: 0 }));

    expect(afterFirst.dataRevision).toBe(1);

    const afterSecond = transactionReducer(afterFirst, transactionsInvalidated({ contextKey: 0 }));

    expect(afterSecond.dataRevision).toBe(2);
  });

  it('ignores transactionsInvalidated for a context that is no longer current', () => {
    const state = transactionReducer(initialState, transactionsInvalidated({ contextKey: 99 }));

    expect(state.dataRevision).toBe(0);
  });

  it('does not bump dataRevision just because addTransaction settled -- only transactionsInvalidated does', () => {
    const fulfilled = transactionReducer(initialState, addTransaction.fulfilled({} as never, 'req-1', {} as never));
    const rejected = transactionReducer(
      initialState,
      addTransaction.rejected(new Error('failed'), 'req-1', {} as never, undefined),
    );

    expect(fulfilled.dataRevision).toBe(0);
    expect(rejected.dataRevision).toBe(0);
  });

  it('drops recent/range/latest and forgets in-flight requests on a space context change', () => {
    const withRangeLoaded = transactionReducer(initialState, fetchTransactionsInRange.pending('req-1', jan));
    const withRange = transactionReducer(
      withRangeLoaded,
      fetchTransactionsInRange.fulfilled([{ id: 'tx-1' } as never], 'req-1', jan),
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
    expect(reset.contextKey).toBe(1);

    // A late response for the old space's request can no longer match.
    const afterStaleResponse = transactionReducer(
      reset,
      fetchTransactionsInRange.fulfilled([{ id: 'tx-1' } as never], 'req-1', jan),
    );

    expect(afterStaleResponse.rangeTransactions).toEqual([]);
  });

  describe('range query identity', () => {
    it('clears rows immediately when a new period starts loading', () => {
      const withJan = transactionReducer(
        transactionReducer(initialState, fetchTransactionsInRange.pending('req-jan', jan)),
        fetchTransactionsInRange.fulfilled([{ id: 'january-row' } as never], 'req-jan', jan),
      );

      expect(withJan.rangeTransactions).toHaveLength(1);

      const febPending = transactionReducer(withJan, fetchTransactionsInRange.pending('req-feb', feb));

      expect(febPending.rangeTransactions).toEqual([]);
    });

    it('keeps rows visible while a background refresh of the same period is in flight', () => {
      const withJan = transactionReducer(
        transactionReducer(initialState, fetchTransactionsInRange.pending('req-jan-1', jan)),
        fetchTransactionsInRange.fulfilled([{ id: 'january-row' } as never], 'req-jan-1', jan),
      );

      const refreshing = transactionReducer(withJan, fetchTransactionsInRange.pending('req-jan-2', jan));

      expect(refreshing.rangeTransactions).toHaveLength(1);
    });

    it('does not leave stale rows visible when a new period fails to load', () => {
      const withJan = transactionReducer(
        transactionReducer(initialState, fetchTransactionsInRange.pending('req-jan', jan)),
        fetchTransactionsInRange.fulfilled([{ id: 'january-row' } as never], 'req-jan', jan),
      );

      const febPending = transactionReducer(withJan, fetchTransactionsInRange.pending('req-feb', feb));
      const febFailed = transactionReducer(
        febPending,
        fetchTransactionsInRange.rejected(new Error('failed'), 'req-feb', feb, { statusCode: 500 } as never),
      );

      expect(febFailed.rangeTransactions).toEqual([]);
      expect(febFailed.rangeError).toEqual({ statusCode: 500 });
    });
  });

  describe('separate range/latest error state', () => {
    it('does not let a latest failure clobber a range error, or vice versa', () => {
      const rangeFailed = transactionReducer(
        transactionReducer(initialState, fetchTransactionsInRange.pending('req-1', jan)),
        fetchTransactionsInRange.rejected(new Error('failed'), 'req-1', jan, { statusCode: 500 } as never),
      );
      const bothFailed = transactionReducer(
        transactionReducer(rangeFailed, fetchLatestTransaction.pending('req-2', undefined)),
        fetchLatestTransaction.rejected(new Error('failed'), 'req-2', undefined, { statusCode: 503 } as never),
      );

      expect(bothFailed.rangeError).toEqual({ statusCode: 500 });
      expect(bothFailed.latestError).toEqual({ statusCode: 503 });
    });
  });
});
