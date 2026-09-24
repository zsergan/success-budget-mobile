import { useEffect, useRef } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { useAppDispatch, useAppSelector, useSpaceArg } from '@redux/hooks';
import { useGetCategoriesQuery } from '@redux/state/category/api';
import { useGetLimitsQuery } from '@redux/state/limit/api';
import { selectProfile } from '@redux/state/profile/selectors';
import { fetchProfile } from '@redux/state/profile/thunks';
import { selectCurrentSpaceId, selectSpace } from '@redux/state/space/selectors';
import { fetchSpaces } from '@redux/state/space/thunks';
import { useGetTransactionsQuery } from '@redux/state/transaction/api';
import { useGetWalletsQuery } from '@redux/state/wallet/api';

interface UseLoadInitDataProps {
  isSignedIn: boolean;
}

const useLoadInitData = ({ isSignedIn }: UseLoadInitDataProps) => {
  const dispatch = useAppDispatch();
  const { isLoading: isSpaceLoading } = useAppSelector(selectSpace);
  const currentSpaceId = useAppSelector(selectCurrentSpaceId);
  const { isLoading: isProfileLoading } = useAppSelector(selectProfile);
  const sessionKey = useAppSelector((state) => state.auth.sessionKey);

  // Mounted for the whole signed-in session, these subscriptions keep the
  // active space's data loaded (and refetched on every space switch).
  const spaceArg = useSpaceArg();
  const sessionSpaceArg = isSignedIn ? spaceArg : skipToken;
  const spaceQueries = [
    useGetWalletsQuery(sessionSpaceArg),
    useGetCategoriesQuery(sessionSpaceArg),
    useGetLimitsQuery(sessionSpaceArg),
    useGetTransactionsQuery(sessionSpaceArg),
  ];

  useEffect(() => {
    if (isSignedIn) {
      dispatch(fetchSpaces());
      dispatch(fetchProfile());
    }
  }, [dispatch, isSignedIn]);

  // isSpaceLoading also flips true for background refreshes unrelated to an
  // explicit navigation (addSpace/removeSpace/acceptInvite/leaving a
  // member all re-dispatch fetchSpaces) -- only the initial bootstrap,
  // before any space is selected yet, should hold the whole app on
  // LOADING_SCREEN for it.
  const isInitialSpaceLoad = isSpaceLoading && currentSpaceId === null;

  // Holds the app on LOADING_SCREEN only until the first space's data has
  // settled (loaded or failed) once per session: gating on a space switch or
  // a background refetch would remount the whole signed-in navigator.
  const areSpaceQueriesSettled = spaceQueries.every((query) => query.currentData !== undefined || query.isError);
  const settledSessionRef = useRef<number | null>(null);

  useEffect(() => {
    if (areSpaceQueriesSettled) settledSessionRef.current = sessionKey;
  }, [areSpaceQueriesSettled, sessionKey]);

  const isInitialSpaceDataLoad =
    currentSpaceId !== null && !areSpaceQueriesSettled && settledSessionRef.current !== sessionKey;

  return {
    isLoading: isSignedIn && (isInitialSpaceLoad || isInitialSpaceDataLoad || isProfileLoading),
  };
};

export default useLoadInitData;
