import { useCallback, useEffect, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { getLoadState } from '@redux/api/loadState';
import { useAppDispatch, useAppSelector, useSpaceArg } from '@redux/hooks';
import { selectAuth } from '@redux/state/auth/selectors';
import { readStoredSession } from '@redux/state/auth/thunks';
import { useGetProfileQuery } from '@redux/state/profile/api';
import { useGetSpacesQuery } from '@redux/state/space/api';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { useGetWalletsQuery } from '@redux/state/wallet/api';
import { isApiError } from '@shared/utils/error';

import type { RequiredQuery } from './launchState';
import { getLaunchState } from './launchState';

interface QueryResult {
  currentData?: unknown;
  isError: boolean;
  isUninitialized: boolean;
}

const toRequired = (query: QueryResult): RequiredQuery => ({
  hasData: query.currentData !== undefined,
  hasError: getLoadState(query).hasError,
});

// The whole way from a cold start or a sign-in to Welcome or the app, as one state. The queries stay subscribed
// for the session, so the profile and spaces the app reads through selectors never drop out of the cache.
const useLaunch = ({ resourcesReady }: { resourcesReady: boolean }) => {
  const dispatch = useAppDispatch();
  const { storedSession, isSignedIn, sessionKey } = useAppSelector(selectAuth);
  const currentSpaceId = useAppSelector(selectCurrentSpaceId);

  useEffect(() => {
    dispatch(readStoredSession());
  }, [dispatch]);

  const sessionArg = isSignedIn ? undefined : skipToken;
  const spaceArg = useSpaceArg();

  const profileQuery = useGetProfileQuery(sessionArg);
  const spacesQuery = useGetSpacesQuery(sessionArg);
  // Required because Home's balance has no loading or error state of its own.
  const walletsQuery = useGetWalletsQuery(isSignedIn ? spaceArg : skipToken);

  const [enteredSessionKey, setEnteredSessionKey] = useState<number | null>(null);

  const state = getLaunchState({
    resourcesReady,
    storedSession,
    isSignedIn,
    hasEntered: enteredSessionKey === sessionKey,
    profile: {
      ...toRequired(profileQuery),
      isUnauthorized: profileQuery.currentData === undefined && isApiError(profileQuery.error, 401),
    },
    spaces: { ...toRequired(spacesQuery), isEmpty: spacesQuery.currentData?.length === 0 },
    hasSelectedSpace: currentSpaceId !== null,
    wallets: toRequired(walletsQuery),
  });

  if (state.status === 'ready' && isSignedIn && enteredSessionKey !== sessionKey) {
    setEnteredSessionKey(sessionKey);
  }

  const { refetch: refetchProfile } = profileQuery;
  const { refetch: refetchSpaces } = spacesQuery;
  const { refetch: refetchWallets } = walletsQuery;
  const failed = {
    storedSession: storedSession === 'failed',
    profile: getLoadState(profileQuery).hasError,
    spaces: getLoadState(spacesQuery).hasError,
    wallets: getLoadState(walletsQuery).hasError,
  };

  // Repeats only what failed; whatever already arrived is kept.
  const retry = useCallback(() => {
    if (failed.storedSession) dispatch(readStoredSession());
    if (failed.profile) refetchProfile();
    if (failed.spaces) refetchSpaces();
    if (failed.wallets) refetchWallets();
  }, [
    dispatch,
    failed.storedSession,
    failed.profile,
    failed.spaces,
    failed.wallets,
    refetchProfile,
    refetchSpaces,
    refetchWallets,
  ]);

  return { state, retry };
};

export default useLaunch;
