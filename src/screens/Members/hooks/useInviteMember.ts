import { useEffect, useRef, useState } from 'react';

import type { ErrorResponse, InviteResponse } from '@api/dto';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { inviteMember } from '@redux/state/member/thunks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { getErrorMessage } from '@shared/utils';
import { useAlert } from '@hooks';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UseInviteMemberProps {
  canInvite: boolean;
  cooldownRemaining: number;
}

/**
 * A single invite submission and its result. All the checks it performs
 * are re-checked here even though the caller (InviteMemberSection) already
 * disables its button on the same conditions -- onSubmitEditing and a fast
 * double tap can both fire before a disabled prop re-renders.
 */
const useInviteMember = ({ canInvite, cooldownRemaining }: UseInviteMemberProps) => {
  const dispatch = useAppDispatch();
  const { addAlert } = useAlert();
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

    if (!canInvite || cooldownRemaining > 0 || isSubmittingRef.current) {
      return false;
    }

    const originSpaceId = currentSpaceId;

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const invite = await dispatch(inviteMember(email)).unwrap();

      // The space changed while this was in flight -- don't pop up an
      // invite code for a space the user isn't looking at anymore.
      if (currentSpaceIdRef.current !== originSpaceId) return false;

      setRevealedInvite(invite);
      setFailedEmail(null);

      return true;
    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse | undefined;

      // The thunk itself detected the session/context had already moved on
      // (e.g. a logout while this was in flight) -- nothing here is still
      // relevant to show.
      if (errorResponse?.isStale) return false;

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
