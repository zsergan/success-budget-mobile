import { createSlice, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { acceptInvite, fetchMembers, inviteMember, removeMember, revokeInvite } from './thunks';

const memberSlice = createSlice({
  name: 'member',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    builder.addCase(fetchMembers.pending, (state, action) => {
      state.requestId = action.meta.requestId;
    });

    builder.addCase(fetchMembers.fulfilled, (state, action) => {
      if (action.meta.requestId !== state.requestId) return;

      state.members = action.payload;
      state.isLoading = false;
    });

    builder.addMatcher(isPending(fetchMembers, inviteMember, revokeInvite, removeMember, acceptInvite), (state) => {
      state.isLoading = true;
      state.error = undefined;
    });

    // fetchMembers.fulfilled already clears isLoading above; this covers the
    // other four, none of which touch it themselves.
    builder.addMatcher(isFulfilled(inviteMember, revokeInvite, removeMember, acceptInvite), (state) => {
      state.isLoading = false;
    });

    builder.addMatcher(
      isRejected(fetchMembers, inviteMember, revokeInvite, removeMember, acceptInvite),
      (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      },
    );
  },
});

export default memberSlice.reducer;
