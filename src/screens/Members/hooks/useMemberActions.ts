import { useEffect, useRef, useState } from 'react';

import { requireSpaceId } from '@redux/api/baseApi';
import { useAppDispatch, useAppSelector, useSessionGuard } from '@redux/hooks';
import { useRemoveMemberMutation, useRevokeInviteMutation } from '@redux/state/member/api';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { leaveCurrentSpace } from '@redux/state/space/thunks';
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
  const captureSession = useSessionGuard();
  const currentSpaceId = useAppSelector(selectCurrentSpaceId);
  const [revokeInvite] = useRevokeInviteMutation();
  const [removeMember] = useRemoveMemberMutation();

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
    const isSessionCurrent = captureSession();

    isPendingRef.current = true;
    setIsPending(true);

    try {
      if (target.kind === 'leave') {
        // Leaving switches spaces by itself, so only its own result says whether
        // the user is still on the space they left (they may have switched away).
        const { movedOff } = await dispatch(leaveCurrentSpace());

        if (movedOff) onLeft();

        return;
      }

      if (target.kind === 'revoke') {
        await revokeInvite({ spaceId: requireSpaceId(originSpaceId), inviteId: target.inviteId }).unwrap();
      } else {
        await removeMember({ spaceId: requireSpaceId(originSpaceId), userId: target.userId }).unwrap();
      }

      // The space changed while this was in flight -- the switch's own
      // handling above already cleared `target`; don't navigate away from
      // (or close a dialog belonging to) a space the user isn't on anymore.
      if (currentSpaceIdRef.current !== originSpaceId) return;

      setTarget(null);
    } catch (error: unknown) {
      if (isSessionCurrent() && currentSpaceIdRef.current === originSpaceId) {
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
