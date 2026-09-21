import { createSlice, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { INVITE_RATE_LIMIT_COOLDOWN_MS } from '@shared/constants';
import { logoutMe } from '../auth/thunks';
import { spaceContextChanged } from '../space/thunks';
import initialState from './initialState';
import { acceptInvite, fetchMembers, inviteMember, leaveSpace, removeMember, revokeInvite } from './thunks';

const memberSlice = createSlice({
  name: 'member',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    // Drop the previous space's members immediately -- before its own
    // fetchMembers has even been dispatched -- and forget any in-flight
    // request for it (clearing requestId means a late response can no
    // longer match). inviteCooldownUntil survives -- the invite rate limit
    // isn't scoped to one space.
    builder.addCase(spaceContextChanged, (state) => ({
      ...initialState,
      hasLoaded: state.hasLoaded,
      inviteCooldownUntil: state.inviteCooldownUntil,
    }));

    builder.addCase(fetchMembers.pending, (state, action) => {
      state.requestId = action.meta.requestId;
    });

    builder.addCase(fetchMembers.fulfilled, (state, action) => {
      if (action.meta.requestId !== state.requestId) return;

      state.members = action.payload;
      state.isLoading = false;
      state.hasLoaded = true;
    });

    builder.addCase(inviteMember.fulfilled, (state) => {
      // A successful send is proof the window has actually reset, even if
      // our own countdown (fallback or a previous Retry-After) hadn't hit
      // zero yet.
      state.inviteCooldownUntil = null;
    });

    builder.addCase(inviteMember.rejected, (state, action) => {
      if (action.payload?.statusCode !== 429) return;

      state.inviteCooldownUntil = Date.now() + (action.payload.retryAfterMs ?? INVITE_RATE_LIMIT_COOLDOWN_MS);
    });

    builder.addMatcher(
      isPending(fetchMembers, inviteMember, revokeInvite, removeMember, leaveSpace, acceptInvite),
      (state) => {
        state.isLoading = true;
        state.error = undefined;
      },
    );

    // fetchMembers.fulfilled already clears isLoading above; this covers the
    // other five, none of which touch it themselves.
    builder.addMatcher(isFulfilled(inviteMember, revokeInvite, removeMember, leaveSpace, acceptInvite), (state) => {
      state.isLoading = false;
    });

    builder.addMatcher(
      isRejected(fetchMembers, inviteMember, revokeInvite, removeMember, leaveSpace, acceptInvite),
      (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      },
    );
  },
});

export default memberSlice.reducer;
