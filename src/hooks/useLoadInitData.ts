import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { fetchWallets } from '@redux/state/wallet/thunks';
import { fetchLimits } from '@redux/state/limit/thunks';
import { fetchCategories } from '@redux/state/category/thunks';
import { fetchProfile } from '@redux/state/profile/thunks';
import { fetchSpaces } from '@redux/state/space/thunks';
import { selectWallet } from '@redux/state/wallet/selectors';
import { selectLimit } from '@redux/state/limit/selectors';
import { selectCategory } from '@redux/state/category/selectors';
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
  const { isLoading: isProfileLoading } = useAppSelector(selectProfile);

  useEffect(() => {
    if (isSignedIn) {
      dispatch(fetchSpaces());
      dispatch(fetchProfile());
    }
  }, [dispatch, isSignedIn]);

  // Re-fires on every space switch, not just the initial load, so wallets/
  // limits/categories always match whichever space is currently selected.
  useEffect(() => {
    if (isSignedIn && currentSpaceId !== null) {
      dispatch(fetchWallets());
      dispatch(fetchLimits());
      dispatch(fetchCategories());
    }
  }, [dispatch, isSignedIn, currentSpaceId]);

  return {
    isLoading:
      isSignedIn && (isSpaceLoading || isWalletLoading || isLimitsLoading || isCategoryLoading || isProfileLoading),
  };
};

export default useLoadInitData;
