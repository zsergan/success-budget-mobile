import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { useAppSelector, useRecentArg, useSpaceArg } from '@redux/hooks';
import { useGetCategoriesQuery } from '@redux/state/category/api';
import { useGetLimitsQuery } from '@redux/state/limit/api';
import { useGetProfileQuery } from '@redux/state/profile/api';
import { useGetSpacesQuery } from '@redux/state/space/api';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { useGetRecentTransactionsQuery } from '@redux/state/transaction/api';
import { useGetWalletsQuery } from '@redux/state/wallet/api';

interface UseLoadInitDataProps {
  isSignedIn: boolean;
}

interface QueryState {
  currentData?: unknown;
  isError: boolean;
}

const isSettled = (query: QueryState) => query.currentData !== undefined || query.isError;

// Subscribes to the session's server data for as long as the user is signed
// in, and reports only the first load of each session as loading.
const useLoadInitData = ({ isSignedIn }: UseLoadInitDataProps) => {
  const currentSpaceId = useAppSelector(selectCurrentSpaceId);
  const sessionKey = useAppSelector((state) => state.auth.sessionKey);

  const sessionArg = isSignedIn ? undefined : skipToken;
  const spaceArg = useSpaceArg();
  const sessionSpaceArg = isSignedIn ? spaceArg : skipToken;
  const recentArg = useRecentArg();

  const spacesQuery = useGetSpacesQuery(sessionArg);
  const profileQuery = useGetProfileQuery(sessionArg);
  const spaceQueries = [
    useGetWalletsQuery(sessionSpaceArg),
    useGetCategoriesQuery(sessionSpaceArg),
    useGetLimitsQuery(sessionSpaceArg),
    useGetRecentTransactionsQuery(isSignedIn ? recentArg : skipToken),
  ];

  // A space is selected as soon as the spaces list arrives, so with none
  // selected there is no space data to wait for (no spaces, or loading failed).
  const areSessionQueriesSettled =
    isSettled(spacesQuery) && isSettled(profileQuery) && (currentSpaceId === null || spaceQueries.every(isSettled));

  // Latched once per session: a space switch or a background refetch must
  // never bring LOADING_SCREEN back, which would remount the navigator.
  const [settledSessionKey, setSettledSessionKey] = useState<number | null>(null);

  if (areSessionQueriesSettled && settledSessionKey !== sessionKey) {
    setSettledSessionKey(sessionKey);
  }

  return {
    isLoading: isSignedIn && settledSessionKey !== sessionKey && !areSessionQueriesSettled,
  };
};

export default useLoadInitData;
