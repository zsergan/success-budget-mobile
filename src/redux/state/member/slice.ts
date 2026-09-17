import { createSlice, isPending, isRejected } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { acceptInvite, fetchMembers, inviteMember, removeMember, revokeInvite } from './thunks';

const memberSlice = createSlice({
  name: 'member',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    builder.addCase(fetchMembers.fulfilled, (state, action) => {
      state.members = action.payload;
      state.isLoading = false;
    });

    builder.addMatcher(isPending(fetchMembers, inviteMember, revokeInvite, removeMember, acceptInvite), (state) => {
      state.isLoading = true;
      state.error = undefined;
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
