import type { RootState } from '@redux/Store';

export const selectPendingInvitationToken = (state: RootState) => state.invitation.pending?.token ?? null;

export const selectIsInvitationOpenRequested = (state: RootState) => state.invitation.isOpenRequested;

export const selectInvitationLinkRevision = (state: RootState) => state.invitation.linkRevision;
