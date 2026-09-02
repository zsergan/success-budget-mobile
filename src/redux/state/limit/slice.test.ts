import type { Limit } from '@api/dto';
import { LimitType, TransactionType } from '@shared/enums';
import { logoutMe } from '../auth/thunks';
import limitReducer from './slice';
import initialState from './initialState';
import { addLimit, editLimit, fetchLimits } from './thunks';

const limit: Limit = {
  id: 1,
  limit_type: LimitType.CATEGORY,
  amount: 500,
  category: {
    id: 1,
    name: 'Groceries',
    transaction_type: TransactionType.EXPENSE,
    icon: 'shopping-basket',
    color: '#000',
    is_active: 1,
  },
  spent: 100,
  in_percent: 20,
};

const errorResponse = {
  message: 'Enter a valid amount',
  statusCode: 400,
  path: '/limits',
  timestamp: '2026-01-01T00:00:00.000Z',
};

describe('limit slice', () => {
  it('returns the initial state by default', () => {
    expect(limitReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('stores limits and overall totals on fetchLimits.fulfilled', () => {
    const payload = { limits: [limit], overall: { spent: 100, sum: 500, in_percent: 20 } };

    const state = limitReducer(initialState, fetchLimits.fulfilled(payload, 'req-1', undefined));

    expect(state.limits).toEqual([limit]);
    expect(state.overall).toEqual(payload.overall);
    expect(state.isLoading).toBe(false);
  });

  it('records the server error on a rejected limit thunk (fetch, add, or edit)', () => {
    const state = limitReducer(
      initialState,
      addLimit.rejected(new Error('request failed'), 'req-2', { amount: 'abc' }, errorResponse),
    );

    expect(state.error).toEqual(errorResponse);
  });

  it('clears a previous error once a new request starts', () => {
    const withError = { ...initialState, error: errorResponse };

    const state = limitReducer(withError, editLimit.pending('req-3', {} as never));

    expect(state.error).toBeUndefined();
  });

  it('resets to the initial state on logout, even with limits and an error already loaded', () => {
    const dirtyState = {
      limits: [limit],
      overall: { spent: 100, sum: 500, in_percent: 20 },
      isLoading: false,
      error: errorResponse,
    };

    const state = limitReducer(dirtyState, logoutMe.fulfilled(undefined, 'req-4', undefined));

    expect(state).toEqual(initialState);
  });
});
