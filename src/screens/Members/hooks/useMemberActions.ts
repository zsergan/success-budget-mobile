import { useEffect, useRef, useState } from 'react';

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

  // A synchronous re-entrancy guard -- `isPending` state updates are
  // batched and not visible to a second confirm() call that fires before
  // the next render (a fast double tap, or Enter plus a tap).
  const isPendingRef = useRef(false);
  const currentSpaceIdRef = useRef(currentSpaceId);

  useEffect(() => {
    currentSpaceIdRef.current = currentSpaceId;
  }, [currentSpaceId]);

  // A space switch invalidates whatever this dialog was about to confirm.
  if (currentSpaceId !== seenSpaceId) {
    setSeenSpaceId(currentSpaceId);
    setTarget(null);
  }

  const requestAction = (nextTarget: MemberActionTarget) => {
    if (isPendingRef.current) return;

    setTarget(nextTarget);
  };

  const cancel = () => {
    if (isPendingRef.current) return;

    setTarget(null);
  };

  const confirm = async () => {
    if (!target || isPendingRef.current) return;

    const originSpaceId = currentSpaceId;

    isPendingRef.current = true;
    setIsPending(true);

    try {
      if (target.kind === 'revoke') {
        await dispatch(revokeInvite(target.inviteId)).unwrap();
      } else if (target.kind === 'remove') {
        await dispatch(removeMember(target.userId)).unwrap();
      } else {
        await dispatch(leaveSpace()).unwrap();
      }

      // The space changed while this was in flight -- the switch's own
      // handling above already cleared `target`; don't navigate away from
      // (or close a dialog belonging to) a space the user isn't on anymore.
      if (currentSpaceIdRef.current !== originSpaceId) return;

      setTarget(null);

      if (target.kind === 'leave') onLeft();
    } catch (error: unknown) {
      if (currentSpaceIdRef.current === originSpaceId) {
        addAlert(getErrorMessage(error));
      }
    } finally {
      isPendingRef.current = false;
      setIsPending(false);
    }
  };

  return { target, isPending, requestAction, cancel, confirm };
};

export default useMemberActions;
