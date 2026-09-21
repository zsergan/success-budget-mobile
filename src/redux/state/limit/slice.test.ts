import type { LimitModel } from '@api/models';
import { AppColor } from '@shared/enums';
import { logoutMe } from '../auth/thunks';
import limitReducer from './slice';
import initialState from './initialState';
import { addLimit, editLimit, fetchLimits, removeLimit } from './thunks';

const groceries: LimitModel = {
  id: 1,
  name: null,
  amount: '400.00',
  spent: 100,
  inPercent: 25,
  categories: [{ id: 1, name: 'Groceries', icon: 'grocery', color: AppColor.SLATE }],
};

const total: LimitModel = {
  id: 2,
  name: null,
  amount: '2000.00',
  spent: 500,
  inPercent: 25,
  categories: [],
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

  it('stores the total, category limits, and over-allocation on fetchLimits.fulfilled', () => {
    const payload = { total, categoryLimits: [groceries], overAllocation: { categoryTotal: 2150, difference: 150 } };
    const pending = limitReducer(initialState, fetchLimits.pending('req-1', undefined));

    const state = limitReducer(pending, fetchLimits.fulfilled(payload, 'req-1', undefined));

    expect(state.total).toEqual(total);
    expect(state.categoryLimits).toEqual([groceries]);
    expect(state.overAllocation).toEqual(payload.overAllocation);
    expect(state.isLoading).toBe(false);
    expect(state.hasLoaded).toBe(true);
  });

  it('records the server error on a rejected limit thunk (fetch, add, edit, or remove)', () => {
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

  it('tracks isDeleting across a removeLimit request', () => {
    const pending = limitReducer(initialState, removeLimit.pending('req-4', 1));
    expect(pending.isDeleting).toBe(true);

    const fulfilled = limitReducer(pending, removeLimit.fulfilled(undefined, 'req-4', 1));
    expect(fulfilled.isDeleting).toBe(false);
  });

  it('resets to the initial state on logout, even with limits and an error already loaded', () => {
    const dirtyState = {
      total,
      categoryLimits: [groceries],
      overAllocation: null,
      isLoading: false,
      isDeleting: false,
      hasLoaded: true,
      error: errorResponse,
    };

    const state = limitReducer(dirtyState, logoutMe.fulfilled(undefined, 'req-5', undefined));

    expect(state).toEqual(initialState);
  });
});
