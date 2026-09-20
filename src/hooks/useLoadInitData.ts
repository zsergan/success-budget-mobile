import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { fetchWallets } from '@redux/state/wallet/thunks';
import { fetchLimits } from '@redux/state/limit/thunks';
import { fetchCategories } from '@redux/state/category/thunks';
import { fetchTransactions } from '@redux/state/transaction/thunks';
import { fetchProfile } from '@redux/state/profile/thunks';
import { fetchSpaces } from '@redux/state/space/thunks';
import { selectWallet } from '@redux/state/wallet/selectors';
import { selectLimit } from '@redux/state/limit/selectors';
import { selectCategory } from '@redux/state/category/selectors';
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
  const { isLoading: isWalletLoading } = useAppSelector(selectWallet);
  const { isLoading: isLimitsLoading } = useAppSelector(selectLimit);
  const { isLoading: isCategoryLoading } = useAppSelector(selectCategory);
  const { isLoading: isTransactionLoading } = useAppSelector(selectTransaction);
  const { isLoading: isProfileLoading } = useAppSelector(selectProfile);

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
      dispatch(fetchCategories());
      dispatch(fetchTransactions());
    }
  }, [dispatch, isSignedIn, currentSpaceId]);

  // isSpaceLoading also flips true for background refreshes unrelated to an
  // explicit navigation (addSpace/removeSpace/acceptInvite/leaving a
  // member all re-dispatch fetchSpaces) -- only the initial bootstrap,
  // before any space is selected yet, should hold the whole app on
  // LOADING_SCREEN for it.
  const isInitialSpaceLoad = isSpaceLoading && currentSpaceId === null;

  return {
    isLoading:
      isSignedIn &&
      (isInitialSpaceLoad ||
        isWalletLoading ||
        isLimitsLoading ||
        isCategoryLoading ||
        isTransactionLoading ||
        isProfileLoading),
  };
};

export default useLoadInitData;
