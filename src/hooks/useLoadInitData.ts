import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { fetchCategories } from '@redux/state/category/thunks';
import { selectCategory } from '@redux/state/category/selectors';
import { fetchProfile } from '@redux/state/profile/thunks';
import { selectProfile } from '@redux/state/profile/selectors';
import { fetchHoldings } from '@redux/state/holding/thunks';
import { selectHolding } from '@redux/state/holding/selectors';

interface UseLoadInitDataProps {
  isSignedIn: boolean;
}

const useLoadInitData = ({ isSignedIn }: UseLoadInitDataProps) => {
  const dispatch = useAppDispatch();
  const { isLoading: isCategoryLoading } = useAppSelector(selectCategory);
  const { isLoading: isProfileLoading } = useAppSelector(selectProfile);
  const { isLoading: isHoldingLoading } = useAppSelector(selectHolding);

  useEffect(() => {
    if (isSignedIn) {
      dispatch(fetchCategories());
      dispatch(fetchProfile());
      dispatch(fetchHoldings());
    }
  }, [dispatch, isSignedIn]);

  return { isLoading: !isSignedIn && (isCategoryLoading || isProfileLoading || isHoldingLoading) };
};

export default useLoadInitData;
