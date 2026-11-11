import type { InviteEmailStatus, SpaceMember } from '@api/dto';
import { getLoadState } from '@redux/api/loadState';
import { useAppSelector, useSpaceArg } from '@redux/hooks';
import { useGetMembersQuery } from '@redux/state/member/api';
import { selectProfileId } from '@redux/state/profile/selectors';
import { selectCurrentSpace } from '@redux/state/space/selectors';
import { SPACE_LIMITS } from '@shared/constants';
import { SpaceType } from '@shared/enums';

const EMPTY_MEMBERS: SpaceMember[] = [];

// An email still on its way: the roster changes on its own until it is sent or has failed.
export const isDeliveryPending = (status: InviteEmailStatus | undefined) => status === 'queued' || status === 'sending';

const useMembersData = () => {
  const currentSpace = useAppSelector(selectCurrentSpace);
  const membersQuery = useGetMembersQuery(useSpaceArg());
  const { currentData, isFetching, isError, error, refetch, fulfilledTimeStamp } = membersQuery;
  const members = currentData ?? EMPTY_MEMBERS;
  const hasLoaded = currentData !== undefined;
  const profileId = useAppSelector(selectProfileId);

  const memberRows = members.filter((member) => member.type === 'member');
  const inviteRows = members.filter((member) => member.type === 'invite');
  const ownRow = memberRows.find((member) => member.user_id === profileId);

  const isOwner = currentSpace?.role === 'owner';
  const isAtMemberCap = memberRows.length >= SPACE_LIMITS.MAX_MEMBERS_PER_SPACE;
  const isAtInviteCap = inviteRows.length >= SPACE_LIMITS.MAX_PENDING_INVITES_PER_SPACE;
  const canInvite = isOwner && currentSpace?.type === SpaceType.GROUP && hasLoaded && !isAtMemberCap && !isAtInviteCap;

  return {
    currentSpace,
    // currentData belongs to the active space only, so a switch reads as a
    // first load; a failed refresh keeps the rows and reports the error.
    isInitialLoading: getLoadState(membersQuery).isLoading,
    isRefreshing: hasLoaded && isFetching,
    // A retry in flight clears the previous failure, as a fresh request would.
    error: isError ? error : undefined,
    memberRows,
    inviteRows,
    ownRow,
    isOwner,
    memberCount: memberRows.length,
    pendingInviteCount: inviteRows.length,
    isAtMemberCap,
    isAtInviteCap,
    canInvite,
    hasPendingDelivery: inviteRows.some((invite) => isDeliveryPending(invite.email_status)),
    // When the roster was answered: its resend_after_seconds count from here.
    rosterReceivedAt: fulfilledTimeStamp,
    retry: refetch,
  };
};

export default useMembersData;
