import type { RootState } from '@redux/Store';

export const selectMember = (state: RootState) => state.member;

export const selectInviteCooldownUntil = (state: RootState) => state.member.inviteCooldownUntil;
