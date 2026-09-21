import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { leaveSpace, removeMember, revokeInvite } from '@redux/state/member/thunks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { getErrorMessage } from '@shared/utils';
import { useAlert } from '@hooks';
import type { MemberActionTarget } from '../types';

interface UseMemberActionsProps {
  onLeft: () => void;
}

/**
 * Confirming and running a removal, an invite revoke, or leaving the space
 * -- one pending flag and one target shared across all three since only
 * one destructive confirmation can be open at a time.
 */
const useMemberActions = ({ onLeft }: UseMemberActionsProps) => {
  const dispatch = useAppDispatch();
  const { addAlert } = useAlert();
  const currentSpaceId = useAppSelector(selectCurrentSpaceId);

  const [target, setTarget] = useState<MemberActionTarget | null>(null);
  const [isPending, setIsPending] = useState(false);
  // Tracks the currentSpaceId this render should have already reacted to,
  // computed during render rather than in an effect -- see the block below.
  const [seenSpaceId, setSeenSpaceId] = useState(currentSpaceId);

  // A space switch invalidates whatever this dialog was about to confirm.
  if (currentSpaceId !== seenSpaceId) {
    setSeenSpaceId(currentSpaceId);
    setTarget(null);
  }

  const requestAction = (nextTarget: MemberActionTarget) => {
    if (isPending) return;

    setTarget(nextTarget);
  };

  const cancel = () => {
    if (isPending) return;

    setTarget(null);
  };

  const confirm = async () => {
    if (!target || isPending) return;

    setIsPending(true);

    try {
      if (target.kind === 'revoke') {
        await dispatch(revokeInvite(target.inviteId)).unwrap();
        setTarget(null);
      } else if (target.kind === 'remove') {
        await dispatch(removeMember(target.userId)).unwrap();
        setTarget(null);
      } else {
        await dispatch(leaveSpace()).unwrap();
        setTarget(null);
        onLeft();
      }
    } catch (error: unknown) {
      addAlert(getErrorMessage(error));
    } finally {
      setIsPending(false);
    }
  };

  return { target, isPending, requestAction, cancel, confirm };
};

export default useMemberActions;
