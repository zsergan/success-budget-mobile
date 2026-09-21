import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectMember } from '@redux/state/member/selectors';
import { fetchMembers } from '@redux/state/member/thunks';
import { selectProfile } from '@redux/state/profile/selectors';
import { selectCurrentSpace, selectCurrentSpaceId } from '@redux/state/space/selectors';
import { SPACE_LIMITS } from '@shared/constants';
import { SpaceType } from '@shared/enums';

/**
 * Owns loading members for the active space (first load vs background
 * refresh vs error+retry) and the derived facts every other piece of the
 * screen needs: who's a member vs a pending invite, which row (if any) is
 * the caller's own, and whether inviting is currently possible at all.
 */
const useMembersData = () => {
  const dispatch = useAppDispatch();

  const currentSpace = useAppSelector(selectCurrentSpace);
  const currentSpaceId = useAppSelector(selectCurrentSpaceId);
  const { members, isLoading, hasLoaded, error } = useAppSelector(selectMember);
  const profileId = useAppSelector(selectProfile).id;

  useEffect(() => {
    if (currentSpaceId !== null) dispatch(fetchMembers());
  }, [dispatch, currentSpaceId]);

  const retry = () => {
    if (currentSpaceId !== null) dispatch(fetchMembers());
  };

  const memberRows = members.filter((member) => member.type === 'member');
  const inviteRows = members.filter((member) => member.type === 'invite');
  const ownRow = memberRows.find((member) => member.user_id === profileId);

  const isOwner = currentSpace?.role === 'owner';
  const isAtMemberCap = memberRows.length >= SPACE_LIMITS.MAX_MEMBERS_PER_SPACE;
  const isAtInviteCap = inviteRows.length >= SPACE_LIMITS.MAX_PENDING_INVITES_PER_SPACE;
  const canInvite = isOwner && currentSpace?.type === SpaceType.GROUP && hasLoaded && !isAtMemberCap && !isAtInviteCap;

  return {
    currentSpace,
    isInitialLoading: isLoading && !hasLoaded,
    isRefreshing: isLoading && hasLoaded,
    error,
    memberRows,
    inviteRows,
    ownRow,
    isOwner,
    memberCount: memberRows.length,
    pendingInviteCount: inviteRows.length,
    isAtMemberCap,
    isAtInviteCap,
    canInvite,
    retry,
  };
};

export default useMembersData;
