import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import profileReducer from './slice';
import { fetchProfile } from './thunks';

describe('profile slice', () => {
  it('returns the initial state by default', () => {
    expect(profileReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('applies a fulfilled response that matches the tracked request', () => {
    const pending = profileReducer(initialState, fetchProfile.pending('req-1', undefined));
    const state = profileReducer(
      pending,
      fetchProfile.fulfilled({ id: 1, email: 'a@b.com', name: 'Alex' }, 'req-1', undefined),
    );

    expect(state.id).toBe(1);
    expect(state.email).toBe('a@b.com');
  });

  it('ignores a profile response from a session that has since logged out', () => {
    const pending = profileReducer(initialState, fetchProfile.pending('old', undefined));
    const loggedOut = profileReducer(pending, logoutMe.fulfilled(undefined, 'logout', undefined));
    const state = profileReducer(
      loggedOut,
      fetchProfile.fulfilled({ id: 999, email: 'old@example.com', name: 'Old' }, 'old', undefined),
    );

    expect(state.id).toBeUndefined();
    expect(state).toEqual(initialState);
  });

  it('ignores a stale fulfilled response superseded by a newer fetchProfile', () => {
    const oldPending = profileReducer(initialState, fetchProfile.pending('old', undefined));
    const newPending = profileReducer(oldPending, fetchProfile.pending('new', undefined));
    const newApplied = profileReducer(
      newPending,
      fetchProfile.fulfilled({ id: 2, email: 'new@example.com', name: 'New' }, 'new', undefined),
    );

    const afterStale = profileReducer(
      newApplied,
      fetchProfile.fulfilled({ id: 1, email: 'old@example.com', name: 'Old' }, 'old', undefined),
    );

    expect(afterStale.id).toBe(2);
  });

  it('ignores a stale rejected response the same way', () => {
    const oldPending = profileReducer(initialState, fetchProfile.pending('old', undefined));
    const newPending = profileReducer(oldPending, fetchProfile.pending('new', undefined));

    const afterStaleReject = profileReducer(
      newPending,
      fetchProfile.rejected(new Error('old failed'), 'old', undefined, { statusCode: 500 } as never),
    );

    expect(afterStaleReject.isLoading).toBe(true);
    expect(afterStaleReject.error).toBeUndefined();
  });
});
