import type { SpaceMember } from '@api/dto';
import type { RootState } from '@redux/Store';

export const selectInviteCooldownUntil = (state: RootState) => state.member.inviteCooldownUntil;

// Who can be assigned a transaction: members only, never a pending invitation.
export const activeMemberIds = (members: SpaceMember[] | undefined) =>
  members?.flatMap((member) => (member.type === 'member' ? [member.user_id] : []));
