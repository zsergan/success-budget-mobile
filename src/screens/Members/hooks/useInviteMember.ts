import { useEffect, useRef, useState } from 'react';

import type { ErrorResponse, InviteResponse } from '@api/dto';
import { requireSpaceId } from '@redux/api/baseApi';
import { useAppSelector, useSessionGuard } from '@redux/hooks';
import { useInviteMemberMutation } from '@redux/state/member/api';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { getErrorMessage } from '@shared/utils';
import { useAlert } from '@hooks';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UseInviteMemberProps {
  canInvite: boolean;
  cooldownRemaining: number;
}

const useInviteMember = ({ canInvite, cooldownRemaining }: UseInviteMemberProps) => {
  const [inviteMember] = useInviteMemberMutation();
  const { addAlert } = useAlert();
  const captureSession = useSessionGuard();
  const currentSpaceId = useAppSelector(selectCurrentSpaceId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealedInvite, setRevealedInvite] = useState<InviteResponse | null>(null);
  const [failedEmail, setFailedEmail] = useState<string | null>(null);

  // A synchronous re-entrancy guard -- `isSubmitting` state updates are
  // batched and not visible to a second call that fires in the same tick.
  const isSubmittingRef = useRef(false);
  const currentSpaceIdRef = useRef(currentSpaceId);

  useEffect(() => {
    currentSpaceIdRef.current = currentSpaceId;
  }, [currentSpaceId]);

  const submit = async (rawEmail: string) => {
    const email = rawEmail.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
      addAlert('Enter a valid email address');
      return false;
    }

    // Re-checked: onSubmitEditing or a double tap can fire before the disabled button re-renders.
    if (!canInvite || cooldownRemaining > 0 || isSubmittingRef.current) {
      return false;
    }

    const originSpaceId = currentSpaceId;
    const isSessionCurrent = captureSession();

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const invite = await inviteMember({ spaceId: requireSpaceId(originSpaceId), email }).unwrap();

      // The space changed while this was in flight -- don't pop up an
      // invite code for a space the user isn't looking at anymore.
      if (currentSpaceIdRef.current !== originSpaceId) return false;

      setRevealedInvite(invite);
      setFailedEmail(null);

      return true;
    } catch (error: unknown) {
      // A logout while this was in flight (a stale response or the abort) leaves nothing to show.
      if (!isSessionCurrent()) return false;

      const errorResponse = error as ErrorResponse | undefined;

      // A 429 already surfaces through the cooldown UI (and the global
      // request interceptor's own alert) -- an extra alert here would be a
      // second notification for the same rejection.
      if (errorResponse?.statusCode !== 429) {
        addAlert(getErrorMessage(error));
      }

      setFailedEmail(email);

      return false;
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const closeInviteCode = () => setRevealedInvite(null);

  return { submit, isSubmitting, revealedInvite, closeInviteCode, failedEmail };
};

export default useInviteMember;
