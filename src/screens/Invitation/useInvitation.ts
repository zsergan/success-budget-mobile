import { useEffect, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import type { ErrorResponse } from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import { useAppDispatch, useAppSelector, useAppStore, useSessionGuard } from '@redux/hooks';
import { selectPendingInvitationToken } from '@redux/state/invitation/selectors';
import { invitationCleared } from '@redux/state/invitation/slice';
import { switchAccountForInvitation } from '@redux/state/invitation/thunks';
import { usePreviewInviteQuery } from '@redux/state/member/api';
import { spaceApi } from '@redux/state/space/api';
import { acceptInviteAndSelect, activateSpace } from '@redux/state/space/thunks';
import { getErrorMessage } from '@shared/utils';

// What the user can do about an answer: close the flow, answer with another account, open the space they are already
// in, or ask again.
export type InvitationAction = 'close' | 'switchAccount' | 'openSpace' | 'retry';

export interface InvitationProblem {
  message: string;
  action: InvitationAction;
  spaceId?: number;
}

export const describeInvitationError = (error: unknown): InvitationProblem => {
  const { code, spaceId } = (error ?? {}) as Partial<ErrorResponse>;

  switch (code) {
    case ApiErrorCode.SPACE_INVITE_UNUSABLE:
      return { message: 'This invitation is no longer available. Ask the space owner for a new one.', action: 'close' };
    case ApiErrorCode.SPACE_INVITE_EMAIL_MISMATCH:
      return {
        message: 'This invitation is for another account. Sign in with the invited email to join.',
        action: 'switchAccount',
      };
    case ApiErrorCode.SPACE_ALREADY_MEMBER:
      return { message: 'You’re already a member of this space.', action: spaceId ? 'openSpace' : 'close', spaceId };
    case ApiErrorCode.SPACE_MEMBER_LIMIT_REACHED:
      return { message: 'This space is full. The owner has to remove someone first.', action: 'close' };
    default:
      return { message: getErrorMessage(error), action: 'retry' };
  }
};

interface UseInvitationProps {
  close: () => void;
}

const useInvitation = ({ close }: UseInvitationProps) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const captureSession = useSessionGuard();
  const pendingToken = useAppSelector(selectPendingInvitationToken);
  // The invitation on screen: a newer link replaces it, but an answer that ends it keeps it shown with that answer.
  const [token, setToken] = useState(pendingToken);
  if (pendingToken !== null && pendingToken !== token) setToken(pendingToken);

  const previewQuery = usePreviewInviteQuery(token ? { token } : skipToken);
  const [isJoining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<{ token: string; error: unknown } | null>(null);

  useEffect(() => {
    if (token === null) close();
  }, [token, close]);

  const join = async () => {
    if (!token || isJoining) return;

    const isSessionCurrent = captureSession();
    setJoining(true);
    setJoinError(null);

    try {
      await dispatch(acceptInviteAndSelect({ token }));
      // A newer link that arrived meanwhile stays open: the join cleared only its own invitation.
      if (isSessionCurrent() && selectPendingInvitationToken(store.getState()) === null) close();
    } catch (error) {
      if (isSessionCurrent()) setJoinError({ token, error });
    } finally {
      if (isSessionCurrent()) setJoining(false);
    }
  };

  const decline = () => {
    if (token) dispatch(invitationCleared({ token }));
    close();
  };

  const switchAccount = () => {
    void dispatch(switchAccountForInvitation());
  };

  const openSpace = (spaceId: number) => {
    dispatch(spaceApi.util.invalidateTags(['Spaces']));
    dispatch(activateSpace(spaceId));
    close();
  };

  const error = joinError?.token === token ? joinError.error : previewQuery.isError ? previewQuery.error : undefined;

  return {
    preview: previewQuery.currentData,
    isLoading: previewQuery.isFetching && !previewQuery.currentData,
    problem: error === undefined ? null : describeInvitationError(error),
    isJoining,
    join,
    decline,
    switchAccount,
    openSpace,
    retry: () => {
      setJoinError(null);
      void previewQuery.refetch();
    },
    // Leaving by any other way is a cancellation too; an account switch unmounts the flow without one.
    forgetOnLeave: () => {
      if (token) dispatch(invitationCleared({ token }));
    },
  };
};

export default useInvitation;
