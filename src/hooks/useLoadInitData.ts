import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { fetchWallets } from '@redux/state/wallet/thunks';
import { fetchLimits } from '@redux/state/limit/thunks';
import { fetchCategories } from '@redux/state/category/thunks';
import { fetchProfile } from '@redux/state/profile/thunks';
import { selectWallet } from '@redux/state/wallet/selectors';
import { selectLimit } from '@redux/state/limit/selectors';
import { selectCategory } from '@redux/state/category/selectors';
import { selectProfile } from '@redux/state/profile/selectors';

interface UseLoadInitDataProps {
  isSignedIn: boolean;
}

const useLoadInitData = ({ isSignedIn }: UseLoadInitDataProps) => {
  const dispatch = useAppDispatch();
  const { isLoading: isWalletLoading } = useAppSelector(selectWallet);
  const { isLoading: isLimitsLoading } = useAppSelector(selectLimit);
  const { isLoading: isCategoryLoading } = useAppSelector(selectCategory);
  const { isLoading: isProfileLoading } = useAppSelector(selectProfile);

  useEffect(() => {
    if (isSignedIn) {
      dispatch(fetchWallets());
      dispatch(fetchLimits());
      dispatch(fetchCategories());
      dispatch(fetchProfile());
    }
  }, [dispatch, isSignedIn]);

  return { isLoading: !isSignedIn && (isWalletLoading || isLimitsLoading || isCategoryLoading || isProfileLoading) };
};

export default useLoadInitData;
