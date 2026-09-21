import { INVITE_RATE_LIMIT_COOLDOWN_MS } from '@shared/constants';
import { logoutMe } from '../auth/thunks';
import { spaceContextChanged } from '../space/thunks';
import initialState from './initialState';
import memberReducer from './slice';
import { inviteMember } from './thunks';

const member = {
  type: 'member' as const,
  id: 1,
  user_id: 101,
  name: 'Me',
  email: 'me@example.com',
  role: 'owner' as const,
  can_remove: false,
};

describe('member slice', () => {
  it('returns the initial state by default', () => {
    expect(memberReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('sets inviteCooldownUntil from a 429 with a Retry-After-derived retryAfterMs', () => {
    const before = Date.now();

    const state = memberReducer(
      initialState,
      inviteMember.rejected(new Error('rate limited'), 'req-1', 'a@b.com', {
        message: 'Too many requests',
        statusCode: 429,
        path: '/spaces/1/invites',
        timestamp: '2026-01-01T00:00:00.000Z',
        retryAfterMs: 30_000,
      }),
    );

    expect(state.inviteCooldownUntil).toBeGreaterThanOrEqual(before + 30_000);
    expect(state.inviteCooldownUntil).toBeLessThanOrEqual(Date.now() + 30_000);
  });

  it('falls back to the fixed cooldown window when a 429 has no retryAfterMs', () => {
    const before = Date.now();

    const state = memberReducer(
      initialState,
      inviteMember.rejected(new Error('rate limited'), 'req-1', 'a@b.com', {
        message: 'Too many requests',
        statusCode: 429,
        path: '/spaces/1/invites',
        timestamp: '2026-01-01T00:00:00.000Z',
      }),
    );

    expect(state.inviteCooldownUntil).toBeGreaterThanOrEqual(before + INVITE_RATE_LIMIT_COOLDOWN_MS);
  });

  it('does not set a cooldown for a non-429 rejection', () => {
    const state = memberReducer(
      initialState,
      inviteMember.rejected(new Error('bad request'), 'req-1', 'a@b.com', {
        message: 'Enter a valid email',
        statusCode: 400,
        path: '/spaces/1/invites',
        timestamp: '2026-01-01T00:00:00.000Z',
      }),
    );

    expect(state.inviteCooldownUntil).toBeNull();
  });

  it('clears the cooldown on a successful invite, even if the local countdown had not reached zero', () => {
    const cooling = { ...initialState, inviteCooldownUntil: Date.now() + 30_000 };

    const state = memberReducer(
      cooling,
      inviteMember.fulfilled(
        { id: 1, email: 'a@b.com', expires_at: '2026-01-08T00:00:00.000Z', code: 'ABC123' },
        'req-1',
        'a@b.com',
      ),
    );

    expect(state.inviteCooldownUntil).toBeNull();
  });

  it('preserves inviteCooldownUntil across a space switch -- the rate limit is not scoped to one space', () => {
    const cooling = { ...initialState, members: [member], hasLoaded: true, inviteCooldownUntil: Date.now() + 30_000 };

    const state = memberReducer(cooling, spaceContextChanged({ spaceId: 2, contextKey: 1 }));

    expect(state.inviteCooldownUntil).toBe(cooling.inviteCooldownUntil);
    expect(state.members).toEqual([]);
  });

  it('clears inviteCooldownUntil on logout', () => {
    const cooling = { ...initialState, inviteCooldownUntil: Date.now() + 30_000 };

    const state = memberReducer(cooling, logoutMe.fulfilled(undefined, 'req-1', undefined));

    expect(state.inviteCooldownUntil).toBeNull();
  });
});
