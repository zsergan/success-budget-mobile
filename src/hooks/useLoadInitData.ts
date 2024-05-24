import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { fetchCategories } from '@redux/state/category/thunks';
import { selectCategory } from '@redux/state/category/selectors';
import { fetchProfile } from '@redux/state/profile/thunks';
import { selectProfile } from '@redux/state/profile/selectors';
import { fetchWallets } from '@redux/state/wallet/thunks';
import { selectWallet } from '@redux/state/wallet/selectors';

interface UseLoadInitDataProps {
  isSignedIn: boolean;
}

const useLoadInitData = ({ isSignedIn }: UseLoadInitDataProps) => {
  const dispatch = useAppDispatch();
  const { isLoading: isCategoryLoading } = useAppSelector(selectCategory);
  const { isLoading: isProfileLoading } = useAppSelector(selectProfile);
  const { isLoading: isWalletLoading } = useAppSelector(selectWallet);

  useEffect(() => {
    if (isSignedIn) {
      dispatch(fetchCategories());
      dispatch(fetchProfile());
      dispatch(fetchWallets());
    }
  }, [dispatch, isSignedIn]);

  return { isLoading: !isSignedIn && (isCategoryLoading || isProfileLoading || isWalletLoading) };
};

export default useLoadInitData;
