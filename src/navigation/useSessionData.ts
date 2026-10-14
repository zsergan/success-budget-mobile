import { skipToken } from '@reduxjs/toolkit/query';

import { useAppSelector, useRecentArg, useSpaceArg } from '@redux/hooks';
import { useGetCategoriesQuery } from '@redux/state/category/api';
import { useGetLimitsQuery } from '@redux/state/limit/api';
import { useGetProfileQuery } from '@redux/state/profile/api';
import { useGetSpacesQuery } from '@redux/state/space/api';
import { useGetRecentTransactionsQuery } from '@redux/state/transaction/api';

// Once the app is open: keeps the profile and spaces the launch loaded subscribed for the session, as parts of the
// app read them through selectors only, and asks early for the space data the first screens show.
const useSessionData = () => {
  const isOpen = useAppSelector((state) => state.launch.phase === 'ready');
  const spaceArg = useSpaceArg();
  const recentArg = useRecentArg();

  useGetProfileQuery(isOpen ? undefined : skipToken);
  useGetSpacesQuery(isOpen ? undefined : skipToken);
  useGetCategoriesQuery(isOpen ? spaceArg : skipToken);
  useGetLimitsQuery(isOpen ? spaceArg : skipToken);
  useGetRecentTransactionsQuery(isOpen ? recentArg : skipToken);
};

export default useSessionData;
