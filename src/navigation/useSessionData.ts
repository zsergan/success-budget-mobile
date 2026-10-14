import { skipToken } from '@reduxjs/toolkit/query';

import { useAppSelector, useRecentArg, useSpaceArg } from '@redux/hooks';
import { useGetCategoriesQuery } from '@redux/state/category/api';
import { useGetLimitsQuery } from '@redux/state/limit/api';
import { useGetProfileQuery } from '@redux/state/profile/api';
import { selectProfileId } from '@redux/state/profile/selectors';
import { useGetSpacesQuery } from '@redux/state/space/api';
import { selectSpacesResult } from '@redux/state/space/selectors';
import { useGetRecentTransactionsQuery } from '@redux/state/transaction/api';

// Keeps the profile and spaces the launch loaded subscribed from the moment they arrive, as parts of the app read them
// through selectors only: a launch retried after a long wait must not load the profile as if for a new user, which
// would restore and send its pending writes again. Once the app is open, asks early for what the first screens show.
const useSessionData = () => {
  const isSignedIn = useAppSelector((state) => state.auth.isSignedIn);
  const isOpen = useAppSelector((state) => state.launch.phase === 'ready');
  const hasProfile = useAppSelector((state) => selectProfileId(state) !== undefined);
  const hasSpaces = useAppSelector((state) => selectSpacesResult(state).data !== undefined);
  const spaceArg = useSpaceArg();
  const recentArg = useRecentArg();

  useGetProfileQuery(isSignedIn && hasProfile ? undefined : skipToken);
  useGetSpacesQuery(isSignedIn && hasSpaces ? undefined : skipToken);
  useGetCategoriesQuery(isOpen ? spaceArg : skipToken);
  useGetLimitsQuery(isOpen ? spaceArg : skipToken);
  useGetRecentTransactionsQuery(isOpen ? recentArg : skipToken);
};

export default useSessionData;
