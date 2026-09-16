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
import { selectSpace } from '@redux/state/space/selectors';

interface UseLoadInitDataProps {
  isSignedIn: boolean;
}

const useLoadInitData = ({ isSignedIn }: UseLoadInitDataProps) => {
  const dispatch = useAppDispatch();
  const { isLoading: isSpaceLoading } = useAppSelector(selectSpace);
  const { isLoading: isWalletLoading } = useAppSelector(selectWallet);
  const { isLoading: isLimitsLoading } = useAppSelector(selectLimit);
  const { isLoading: isCategoryLoading } = useAppSelector(selectCategory);
  const { isLoading: isProfileLoading } = useAppSelector(selectProfile);

  useEffect(() => {
    if (isSignedIn) {
      dispatch(fetchSpaces())
        .unwrap()
        .then(() => {
          dispatch(fetchWallets());
          dispatch(fetchLimits());
          dispatch(fetchCategories());
        })
        .catch(() => {});
      dispatch(fetchProfile());
    }
  }, [dispatch, isSignedIn]);

  return {
    isLoading:
      isSignedIn && (isSpaceLoading || isWalletLoading || isLimitsLoading || isCategoryLoading || isProfileLoading),
  };
};

export default useLoadInitData;
