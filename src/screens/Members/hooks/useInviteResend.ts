import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import type { ErrorResponse, SpaceInviteRow } from '@api/dto';
import { useToast } from '@hooks';
import { useAppSelector, useAppStore, useSessionGuard } from '@redux/hooks';
import { useResendInviteMutation } from '@redux/state/member/api';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { INVITE_RATE_LIMIT_COOLDOWN_MS } from '@shared/constants';

export interface ResendAvailability {
  isAvailable: boolean;
  // Until the server accepts another email for this invitation; 0 when it does now or never will.
  waitSeconds: number;
  isResending: boolean;
}

const UNAVAILABLE: ResendAvailability = { isAvailable: false, waitSeconds: 0, isResending: false };

// Ticks each second until `until`, read from the clock so a paused timer can't skew it.
const useNow = (until: number) => {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (until <= Date.now()) return;

    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });

    return () => {
      clearTimeout(first);
      clearInterval(timer);
      foreground.remove();
    };
  }, [until]);

  return now;
};

interface UseInviteResendProps {
  isOwner: boolean;
  inviteRows: SpaceInviteRow[];
  // When the roster was answered: its resend_after_seconds count from here.
  rosterReceivedAt: number | undefined;
  onResent: () => void;
}

// Another email for an invitation, for the owner only, once the server's cooldown and any 429's Retry-After are over.
const useInviteResend = ({ isOwner, inviteRows, rosterReceivedAt = 0, onResent }: UseInviteResendProps) => {
  const [resendInvite] = useResendInviteMutation();
  const toast = useToast();
  const store = useAppStore();
  const captureSession = useSessionGuard();
  const currentSpaceId = useAppSelector(selectCurrentSpaceId);
  const [blockedUntil, setBlockedUntil] = useState<Record<number, number>>({});
  const [resending, setResending] = useState<Record<number, boolean>>({});

  const availableAtOf = (invite: SpaceInviteRow) =>
    Math.max(rosterReceivedAt + (invite.resend_after_seconds ?? 0) * 1000, blockedUntil[invite.id] ?? 0);
  const now = useNow(Math.max(0, ...inviteRows.map(availableAtOf)));

  const availabilityOf = (invite: SpaceInviteRow): ResendAvailability => {
    // A server from before invitation emails sends no delivery state and has no resend.
    if (!isOwner || invite.email_status === undefined) return UNAVAILABLE;

    const waitSeconds = Math.max(0, Math.ceil((availableAtOf(invite) - now) / 1000));
    // The roster's can_resend is a snapshot: once its wait is over the server accepts again, unless an email is sending.
    const isAllowed = invite.can_resend === true || (invite.resend_after_seconds ?? 0) > 0;
    const isResending = resending[invite.id] === true;

    return {
      isAvailable: isAllowed && invite.email_status !== 'sending' && waitSeconds === 0 && !isResending,
      waitSeconds,
      isResending,
    };
  };

  const resend = async (invite: SpaceInviteRow) => {
    if (currentSpaceId === null || !availabilityOf(invite).isAvailable) return;

    const spaceId = currentSpaceId;
    const isSessionCurrent = captureSession();
    const isStillHere = () => isSessionCurrent() && selectCurrentSpaceId(store.getState()) === spaceId;
    const ticket = toast.begin();
    setResending((current) => ({ ...current, [invite.id]: true }));

    try {
      await resendInvite({ spaceId, inviteId: invite.id }).unwrap();
      if (isStillHere()) onResent();
    } catch (error) {
      if (!isStillHere()) return;

      const { statusCode, retryAfterMs } = (error ?? {}) as Partial<ErrorResponse>;

      // The roster comes back without it: accepted, revoked or expired meanwhile.
      if (statusCode === 404) return;
      if (statusCode === 429) {
        const until = Date.now() + (retryAfterMs ?? INVITE_RATE_LIMIT_COOLDOWN_MS);
        setBlockedUntil((current) => ({ ...current, [invite.id]: until }));
        return;
      }

      ticket.show({ tone: 'error', text: `Couldn’t resend the invitation to ${invite.email}. Try again.` });
    } finally {
      if (isSessionCurrent()) setResending(({ [invite.id]: _done, ...rest }) => rest);
    }
  };

  return { availabilityOf, resend };
};

export default useInviteResend;
