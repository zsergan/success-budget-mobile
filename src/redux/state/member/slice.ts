import { createSlice } from '@reduxjs/toolkit';

import { INVITE_RATE_LIMIT_COOLDOWN_MS } from '@shared/constants';
import { logoutMe } from '../auth/thunks';
import { spaceContextChanged } from '../space/thunks';
import initialState from './initialState';
import { fetchMembers, inviteMember } from './thunks';

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

    // isLoading/error here describe reading the members list, nothing
    // else -- inviteMember/revokeInvite/removeMember/leaveSpace/acceptInvite
    // each own their own pending/error UI locally (useInviteMember,
    // useMemberActions, useFormSubmitHandler for accept), so a mutation
    // finishing must never flip this off mid-fetch, and a fetch's own
    // pending/error must never look like a mutation is in flight.
    builder.addCase(fetchMembers.pending, (state, action) => {
      state.isLoading = true;
      state.error = undefined;
      state.requestId = action.meta.requestId;
    });

    builder.addCase(fetchMembers.rejected, (state, action) => {
      if (action.meta.requestId !== state.requestId) return;

      state.isLoading = false;
      state.error = action.payload;
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
  },
});

export default memberSlice.reducer;
