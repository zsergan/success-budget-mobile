import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { useSecondsUntil } from '@hooks';
import { useAppDispatch, useAppSelector, useAppStore, useSessionGuard } from '@redux/hooks';
import { selectPendingInvitationToken } from '@redux/state/invitation/selectors';
import { invitationCleared } from '@redux/state/invitation/slice';
import { switchAccountForInvitation } from '@redux/state/invitation/thunks';
import { usePreviewInviteQuery } from '@redux/state/member/api';
import { spaceApi } from '@redux/state/space/api';
import { acceptInviteAndSelect, activateSpace } from '@redux/state/space/thunks';
import { describeAcceptProblem } from '../acceptProblem';

interface JoinFailure {
  token: string;
  error: unknown;
  failedAt: number;
}

interface UseLinkInvitationProps {
  // The user is in the space: by joining, or because they already were.
  onJoined: () => void;
}

// The invitation from an opened link: its preview, and joining it only when the user asks.
const useLinkInvitation = ({ onJoined }: UseLinkInvitationProps) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const captureSession = useSessionGuard();
  const pendingToken = useAppSelector(selectPendingInvitationToken);
  // The invitation on screen: a newer link replaces it, but an answer that ends it keeps it shown with that answer.
  const [token, setToken] = useState(pendingToken);
  if (pendingToken !== null && pendingToken !== token) setToken(pendingToken);

  const previewQuery = usePreviewInviteQuery(token ? { token } : skipToken);
  const [isJoining, setJoining] = useState(false);
  const [joinFailure, setJoinFailure] = useState<JoinFailure | null>(null);

  const failure =
    joinFailure?.token === token
      ? joinFailure
      : previewQuery.isError
        ? { error: previewQuery.error, failedAt: previewQuery.startedTimeStamp ?? 0 }
        : null;
  const problem = failure && describeAcceptProblem(failure.error);
  const retryAt = problem?.retryAfterMs !== undefined && failure ? failure.failedAt + problem.retryAfterMs : null;
  const waitSeconds = useSecondsUntil(retryAt);

  const join = async () => {
    if (!token || isJoining) return;

    const isSessionCurrent = captureSession();
    setJoining(true);
    setJoinFailure(null);

    try {
      await dispatch(acceptInviteAndSelect({ token }));
      // A newer link that arrived meanwhile stays open: the join cleared only its own invitation.
      if (isSessionCurrent() && selectPendingInvitationToken(store.getState()) === null) onJoined();
    } catch (error) {
      if (isSessionCurrent()) setJoinFailure({ token, error, failedAt: Date.now() });
    } finally {
      if (isSessionCurrent()) setJoining(false);
    }
  };

  // Tries again what failed: the join only when it was the join, so asking again never joins by itself.
  const retry = () => {
    if (joinFailure?.token === token) {
      void join();
    } else {
      void previewQuery.refetch();
    }
  };

  const openSpace = (spaceId: number) => {
    dispatch(spaceApi.util.invalidateTags(['Spaces']));
    dispatch(activateSpace(spaceId));
    onJoined();
  };

  return {
    token,
    preview: previewQuery.currentData,
    isLoading: previewQuery.isFetching && !previewQuery.currentData && !problem,
    problem,
    waitSeconds,
    isJoining,
    join,
    retry,
    openSpace,
    switchAccount: () => void dispatch(switchAccountForInvitation()),
    forget: () => {
      if (token) dispatch(invitationCleared({ token }));
    },
  };
};

export default useLinkInvitation;
