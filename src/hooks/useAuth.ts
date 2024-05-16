import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectAuth } from '@redux/state/auth/selectors';
import { checkAuth } from '@redux/state/auth/thunks';

const useAuth = () => {
  const dispatch = useAppDispatch();
  const { isSignedIn, isLoading } = useAppSelector(selectAuth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return {
    isSignedIn,
    isLoading,
  };
};

export default useAuth;
