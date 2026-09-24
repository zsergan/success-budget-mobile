import type { RootState } from '@redux/Store';

export const selectInviteCooldownUntil = (state: RootState) => state.member.inviteCooldownUntil;
