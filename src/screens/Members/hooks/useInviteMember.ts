import { useRef, useState } from 'react';

import type { ErrorResponse, InviteResponse } from '@api/dto';
import { requireSpaceId } from '@redux/api/baseApi';
import { useAppSelector, useAppStore, useSessionGuard } from '@redux/hooks';
import { useInviteMemberMutation } from '@redux/state/member/api';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { getErrorMessage } from '@shared/utils';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UseInviteMemberProps {
  canInvite: boolean;
  cooldownRemaining: number;
}

const useInviteMember = ({ canInvite, cooldownRemaining }: UseInviteMemberProps) => {
  const [inviteMember] = useInviteMemberMutation();
  const captureSession = useSessionGuard();
  const store = useAppStore();
  const currentSpaceId = useAppSelector(selectCurrentSpaceId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealedInvite, setRevealedInvite] = useState<InviteResponse | null>(null);
  const [failedEmail, setFailedEmail] = useState<string | null>(null);
  // A new object for every failure, so the same message twice still shows again after the address was edited.
  const [inviteError, setInviteError] = useState<{ message: string } | null>(null);

  // A synchronous re-entrancy guard -- `isSubmitting` state updates are
  // batched and not visible to a second call that fires in the same tick.
  const isSubmittingRef = useRef(false);

  const submit = async (rawEmail: string) => {
    const email = rawEmail.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
      setInviteError({ message: 'Enter a valid email address' });
      return false;
    }

    // Re-checked: onSubmitEditing or a double tap can fire before the disabled button re-renders.
    if (!canInvite || cooldownRemaining > 0 || isSubmittingRef.current) {
      return false;
    }

    const originSpaceId = currentSpaceId;
    const isSessionCurrent = captureSession();
    const isSpaceCurrent = () => selectCurrentSpaceId(store.getState()) === originSpaceId;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setInviteError(null);

    try {
      const invite = await inviteMember({ spaceId: requireSpaceId(originSpaceId), email }).unwrap();

      // The space changed while this was in flight -- don't pop up an
      // invite code for a space the user isn't looking at anymore.
      if (!isSpaceCurrent()) return false;

      setRevealedInvite(invite);
      setFailedEmail(null);

      return true;
    } catch (error: unknown) {
      // A logout or a space switch while this was in flight leaves nothing to show here.
      if (!isSessionCurrent() || !isSpaceCurrent()) return false;

      const errorResponse = error as ErrorResponse | undefined;

      // A 429 is already shown by the cooldown UI.
      if (errorResponse?.statusCode !== 429) {
        setInviteError({ message: getErrorMessage(error) });
      }

      setFailedEmail(email);

      return false;
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const closeInviteCode = () => setRevealedInvite(null);

  return { submit, isSubmitting, revealedInvite, closeInviteCode, failedEmail, inviteError };
};

export default useInviteMember;
