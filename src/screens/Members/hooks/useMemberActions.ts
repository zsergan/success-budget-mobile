import { useEffect, useRef, useState } from 'react';

import { requireSpaceId } from '@redux/api/baseApi';
import { useAppDispatch, useAppSelector, useSessionGuard } from '@redux/hooks';
import { useRemoveMemberMutation, useRevokeInviteMutation } from '@redux/state/member/api';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { leaveCurrentSpace } from '@redux/state/space/thunks';
import { getErrorMessage } from '@shared/utils';
import type { MemberActionTarget } from '../types';

interface UseMemberActionsProps {
  onLeft: () => void;
}

const useMemberActions = ({ onLeft }: UseMemberActionsProps) => {
  const dispatch = useAppDispatch();
  const captureSession = useSessionGuard();
  const currentSpaceId = useAppSelector(selectCurrentSpaceId);
  const sessionKey = useAppSelector((state) => state.auth.sessionKey);
  const [revokeInvite] = useRevokeInviteMutation();
  const [removeMember] = useRemoveMemberMutation();

  const [target, setTarget] = useState<MemberActionTarget | null>(null);
  const [isPending, setIsPending] = useState(false);
  // Shown in the dialog that failed, until it is retried or closed.
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState({ spaceId: currentSpaceId, sessionKey });

  // `isPending` isn't visible until the next render, so a double tap needs a synchronous guard.
  const isPendingRef = useRef(false);
  const currentSpaceIdRef = useRef(currentSpaceId);

  useEffect(() => {
    currentSpaceIdRef.current = currentSpaceId;
  }, [currentSpaceId]);

  // A space switch or another session invalidates whatever this dialog was about to confirm.
  if (currentSpaceId !== seen.spaceId || sessionKey !== seen.sessionKey) {
    setSeen({ spaceId: currentSpaceId, sessionKey });
    setTarget(null);
    setError(null);
  }

  const requestAction = (nextTarget: MemberActionTarget) => {
    if (isPendingRef.current) return;

    setTarget(nextTarget);
    setError(null);
  };

  const cancel = () => {
    if (isPendingRef.current) return;

    setTarget(null);
    setError(null);
  };

  const confirm = async () => {
    if (!target || isPendingRef.current) return;

    const originSpaceId = currentSpaceId;
    const isSessionCurrent = captureSession();

    isPendingRef.current = true;
    setIsPending(true);
    setError(null);

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

      // The space changed mid-request; the switch already cleared `target`.
      if (currentSpaceIdRef.current !== originSpaceId) return;

      setTarget(null);
    } catch (error: unknown) {
      if (isSessionCurrent() && currentSpaceIdRef.current === originSpaceId) {
        setError(getErrorMessage(error));
      }
    } finally {
      isPendingRef.current = false;
      setIsPending(false);
    }
  };

  return { target, isPending, error, requestAction, cancel, confirm };
};

export default useMemberActions;
