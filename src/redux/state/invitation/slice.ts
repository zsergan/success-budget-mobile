import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice, isAnyOf } from '@reduxjs/toolkit';

import type { ErrorResponse } from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import { logoutMe } from '../auth/thunks';
import { memberApi } from '../member/api';

// The intent to answer one invitation: its link token and when it was kept, nothing else.
export interface PendingInvitation {
  token: string;
  storedAt: number;
}

interface InvitationState {
  pending: PendingInvitation | null;
  // The invitation flow should open once the app is ready for it.
  isOpenRequested: boolean;
  // Bumped by every change of intent, a sign-out or a decline included even with nothing pending, so a storage read
  // started before it is known to be stale. Survives clearing.
  revision: number;
  // The revision at which a link last became the pending invitation, by opening or restoring it; the same link again
  // leaves it. Unlike `revision`, an answer or a decline never moves it. Survives clearing.
  linkRevision: number;
}

const initialState: InvitationState = { pending: null, isOpenRequested: false, revision: 0, linkRevision: 0 };

const cleared = (state: InvitationState): InvitationState => ({
  ...initialState,
  revision: state.revision + 1,
  linkRevision: state.linkRevision,
});

// Answers after which the token can never be used: it ended, or its space already has the user.
const TERMINAL_CODES: string[] = [ApiErrorCode.SPACE_INVITE_UNUSABLE, ApiErrorCode.SPACE_ALREADY_MEMBER];

// A join or preview by link answers for the pending invitation only when it carried that token; one by code never does.
const isForPending = (state: InvitationState, arg: unknown) => {
  const token = (arg as { token?: unknown } | undefined)?.token;
  return token !== undefined && state.pending?.token === token;
};

const invitationSlice = createSlice({
  name: 'invitation',
  initialState,
  reducers: {
    // The same link again keeps when it was first kept; another one replaces it.
    invitationLinkOpened: (state, { payload }: PayloadAction<PendingInvitation>) => {
      state.isOpenRequested = true;
      state.revision += 1;
      if (state.pending?.token === payload.token) return;

      state.pending = payload;
      state.linkRevision = state.revision;
    },
    // A link opened while storage was being read is newer than what it held.
    invitationRestored: (state, { payload }: PayloadAction<PendingInvitation>) => {
      if (state.pending) return;

      state.pending = payload;
      state.isOpenRequested = true;
      state.revision += 1;
      state.linkRevision = state.revision;
    },
    invitationOpenHandled: (state) => {
      state.isOpenRequested = false;
    },
    // Only the invitation it names: a newer link is never dropped by an answer to an older one. Either way a read still
    // under way must not bring back what the user declined.
    invitationCleared: (state, { payload }: PayloadAction<{ token: string }>) => {
      if (state.pending?.token === payload.token) return cleared(state);
      state.revision += 1;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, (state, action) => {
      if (!action.meta.arg?.reason) return cleared(state);

      if (state.pending) state.isOpenRequested = true;
    });

    builder.addMatcher(memberApi.endpoints.acceptInvite.matchFulfilled, (state, action) => {
      if (isForPending(state, action.meta.arg.originalArgs)) return cleared(state);
    });

    builder.addMatcher(
      isAnyOf(memberApi.endpoints.previewInvite.matchRejected, memberApi.endpoints.acceptInvite.matchRejected),
      (state, action) => {
        const error = action.payload as ErrorResponse | undefined;
        const isTerminal = !error?.isStale && error?.code !== undefined && TERMINAL_CODES.includes(error.code);

        if (isTerminal && isForPending(state, action.meta.arg.originalArgs)) return cleared(state);
      },
    );
  },
});

export const { invitationLinkOpened, invitationRestored, invitationOpenHandled, invitationCleared } =
  invitationSlice.actions;

export default invitationSlice.reducer;
