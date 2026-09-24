import { useEffect, useRef } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { useAppDispatch, useAppSelector, useSpaceArg } from '@redux/hooks';
import { fetchWallets } from '@redux/state/wallet/thunks';
import { fetchLimits } from '@redux/state/limit/thunks';
import { fetchTransactions } from '@redux/state/transaction/thunks';
import { fetchProfile } from '@redux/state/profile/thunks';
import { fetchSpaces } from '@redux/state/space/thunks';
import { selectWallet } from '@redux/state/wallet/selectors';
import { selectLimit } from '@redux/state/limit/selectors';
import { useGetCategoriesQuery } from '@redux/state/category/api';
import { selectTransaction } from '@redux/state/transaction/selectors';
import { selectProfile } from '@redux/state/profile/selectors';
import { selectCurrentSpaceId, selectSpace } from '@redux/state/space/selectors';

interface UseLoadInitDataProps {
  isSignedIn: boolean;
}

const useLoadInitData = ({ isSignedIn }: UseLoadInitDataProps) => {
  const dispatch = useAppDispatch();
  const { isLoading: isSpaceLoading } = useAppSelector(selectSpace);
  const currentSpaceId = useAppSelector(selectCurrentSpaceId);
  const { isLoading: isWalletLoading, hasLoaded: hasWalletsLoaded } = useAppSelector(selectWallet);
  const { isLoading: isLimitsLoading, hasLoaded: hasLimitsLoaded } = useAppSelector(selectLimit);
  const { isLoading: isTransactionLoading, hasLoaded: hasTransactionsLoaded } = useAppSelector(selectTransaction);
  const { isLoading: isProfileLoading } = useAppSelector(selectProfile);
  const sessionKey = useAppSelector((state) => state.auth.sessionKey);

  // Mounted for the whole signed-in session, these subscriptions keep the
  // active space's data loaded (and refetched on every space switch).
  const spaceArg = useSpaceArg();
  const sessionSpaceArg = isSignedIn ? spaceArg : skipToken;
  const spaceQueries = [useGetCategoriesQuery(sessionSpaceArg)];

  useEffect(() => {
    if (isSignedIn) {
      dispatch(fetchSpaces());
      dispatch(fetchProfile());
    }
  }, [dispatch, isSignedIn]);

  // Re-fires on every space switch, not just the initial load, so wallets/
  // limits/categories/transactions always match whichever space is
  // currently selected -- keeping Home's "Recent activity" in this same
  // gate stops it flashing the previous space's transactions on switch.
  useEffect(() => {
    if (isSignedIn && currentSpaceId !== null) {
      dispatch(fetchWallets());
      dispatch(fetchLimits());
      dispatch(fetchTransactions());
    }
  }, [dispatch, isSignedIn, currentSpaceId]);

  // isSpaceLoading also flips true for background refreshes unrelated to an
  // explicit navigation (addSpace/removeSpace/acceptInvite/leaving a
  // member all re-dispatch fetchSpaces) -- only the initial bootstrap,
  // before any space is selected yet, should hold the whole app on
  // LOADING_SCREEN for it.
  const isInitialSpaceLoad = isSpaceLoading && currentSpaceId === null;

  // Same problem as space, and the same fix, for every other domain whose
  // mutation thunks re-dispatch their own list fetch in the background
  // (addWallet/editWallet/removeWallet -> fetchWallets; addLimit/editLimit/
  // removeLimit -> fetchLimits; addCategory/editCategory/deleteCategory/
  // reorderCategories -> fetchCategories; addTransaction -> fetchTransactions).
  // Gating the whole app on any of these raw flags would tear down and
  // remount the entire signed-in navigator mid-mutation, breaking any
  // pending navigation.goBack() or dropping the user back on the Home tab.
  const isInitialWalletLoad = isWalletLoading && !hasWalletsLoaded;
  const isInitialLimitsLoad = isLimitsLoading && !hasLimitsLoaded;

  // Holds the app on LOADING_SCREEN only until the first space's data has
  // settled (loaded or failed) once per session, never again on a switch.
  const areSpaceQueriesSettled = spaceQueries.every((query) => query.currentData !== undefined || query.isError);
  const settledSessionRef = useRef<number | null>(null);

  useEffect(() => {
    if (areSpaceQueriesSettled) settledSessionRef.current = sessionKey;
  }, [areSpaceQueriesSettled, sessionKey]);

  const isInitialSpaceDataLoad =
    currentSpaceId !== null && !areSpaceQueriesSettled && settledSessionRef.current !== sessionKey;
  const isInitialTransactionLoad = isTransactionLoading && !hasTransactionsLoaded;

  return {
    isLoading:
      isSignedIn &&
      (isInitialSpaceLoad ||
        isInitialWalletLoad ||
        isInitialLimitsLoad ||
        isInitialSpaceDataLoad ||
        isInitialTransactionLoad ||
        isProfileLoading),
  };
};

export default useLoadInitData;
